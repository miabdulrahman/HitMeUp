const mongoose = require("mongoose");
const crypto = require("crypto");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Deal = require("../models/Deal");
const Voucher = require("../models/Voucher");
const Business = require("../models/Business");
const GatewayTransaction = require("../models/GatewayTransaction");
const mockGatewayService = require("./mockGatewayService");
const voucherIntegrationService = require("./voucherIntegrationService");
const receiptService = require("./receiptService");
const transactionService = require("./transactionService");
const {
  PaymentStatus,
  validateTransition
} = require("./paymentStateMachine");

function generatePaymentReference() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `PAY-${yyyy}${mm}${dd}-${rand}`;
}

function generateRefundReference() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const rand = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `REF-${yyyy}${mm}${dd}-${rand}`;
}

/**
 * Creates or retrieves an active payment checkout session for an order
 */
async function createCheckoutSession({ orderId, user }) {
  const customerId = user._id || user.id;

  const order = await Order.findById(orderId).populate("dealId");
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  // Ownership verification (unless admin)
  if (user.role !== "admin" && String(order.customerId) !== String(customerId)) {
    const error = new Error("Unauthorized to access this order");
    error.statusCode = 403;
    throw error;
  }

  // Check if order has already been paid
  if (order.status === "PAID" || order.orderStatus === "PAID") {
    const existingPayment = await Payment.findOne({
      orderId: order._id,
      status: PaymentStatus.SUCCESS
    });
    return {
      order,
      payment: existingPayment,
      alreadyPaid: true,
      message: "Order has already been paid"
    };
  }

  // Check expiration
  if (order.expiresAt && new Date() > order.expiresAt) {
    order.status = "EXPIRED";
    order.orderStatus = "EXPIRED";
    // Release inventory reservation if still reserved
    if (order.inventoryReserved && !order.inventoryReleased) {
      await Deal.updateOne(
        { _id: order.dealId },
        { $inc: { availableQuantity: order.quantity || 1 } }
      );
      order.inventoryReleased = true;
    }
    await order.save();

    const error = new Error("This order checkout session has expired");
    error.statusCode = 410; // Gone / Expired
    throw error;
  }

  // Check if active pending payment already exists for this order
  let payment = await Payment.findOne({
    orderId: order._id,
    status: { $in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] }
  });

  if (!payment) {
    // Determine attempt number based on existing payments
    const previousAttempts = await Payment.countDocuments({ orderId: order._id });

    payment = await Payment.create({
      paymentReference: generatePaymentReference(),
      orderId: order._id,
      customerId,
      amount: order.totalAmount || order.amount,
      currency: order.currency || "LKR",
      paymentMethod: "CARD",
      provider: "HitMeUp Pay",
      status: PaymentStatus.PENDING,
      attempt: previousAttempts + 1
    });

    order.paymentId = payment._id;
    await order.save();
  }

  return {
    order,
    payment,
    alreadyPaid: false
  };
}

/**
 * Idempotently process payment via HitMeUp Pay simulation engine
 */
async function processPayment({
  orderId,
  user,
  paymentMethod = "CARD",
  requestedScenario = "SUCCESS",
  brand = null,
  last4 = null,
  idempotencyKey = null
}) {
  const customerId = user._id || user.id;

  // 1. Check idempotency: if same idempotencyKey was used, return previous result
  if (idempotencyKey) {
    const cachedTransaction = await GatewayTransaction.findOne({
      idempotencyKey
    }).populate("orderId");

    if (cachedTransaction) {
      const cachedPayment = await Payment.findOne({
        gatewayTransactionId: cachedTransaction.transactionId
      });
      return {
        success: cachedTransaction.transactionStatus === "SUCCESS",
        idempotentReplay: true,
        transaction: cachedTransaction,
        payment: cachedPayment
      };
    }
  }

  // 2. Load order and verify existence
  const order = await Order.findById(orderId).populate("dealId");
  if (!order) {
    const error = new Error("Order not found");
    error.statusCode = 404;
    throw error;
  }

  // Ownership verification
  if (user.role !== "admin" && String(order.customerId) !== String(customerId)) {
    const error = new Error("Unauthorized to process payment for this order");
    error.statusCode = 403;
    throw error;
  }

  // Check order status
  if (order.status === "PAID" || order.orderStatus === "PAID") {
    const error = new Error("This order has already been paid");
    error.statusCode = 409;
    throw error;
  }

  if (order.status === "CANCELLED" || order.orderStatus === "CANCELLED") {
    const error = new Error("Cannot pay for a cancelled order");
    error.statusCode = 400;
    throw error;
  }

  // Check expiry
  if (order.expiresAt && new Date() > order.expiresAt) {
    order.status = "EXPIRED";
    order.orderStatus = "EXPIRED";
    if (order.inventoryReserved && !order.inventoryReleased) {
      await Deal.updateOne(
        { _id: order.dealId },
        { $inc: { availableQuantity: order.quantity || 1 } }
      );
      order.inventoryReleased = true;
    }
    await order.save();

    const error = new Error("Order checkout window has expired");
    error.statusCode = 410;
    throw error;
  }

  // 3. Find or initialize active payment document
  let payment = await Payment.findOne({
    orderId: order._id,
    status: { $in: [PaymentStatus.PENDING, PaymentStatus.PROCESSING] }
  });

  if (!payment) {
    const previousAttempts = await Payment.countDocuments({ orderId: order._id });
    payment = await Payment.create({
      paymentReference: generatePaymentReference(),
      orderId: order._id,
      customerId,
      amount: order.totalAmount || order.amount,
      currency: order.currency || "LKR",
      paymentMethod,
      provider: "HitMeUp Pay",
      status: PaymentStatus.PENDING,
      attempt: previousAttempts + 1,
      idempotencyKey
    });
  } else {
    payment.paymentMethod = paymentMethod;
    if (idempotencyKey) payment.idempotencyKey = idempotencyKey;
  }

  // Validate state transition to PROCESSING
  validateTransition(payment.status, PaymentStatus.PROCESSING);
  payment.status = PaymentStatus.PROCESSING;
  await payment.save();

  // 4. Send decoupled request to Mock Gateway Engine
  const gatewayResponse = await mockGatewayService.processSimulatedPayment({
    orderId: String(order._id),
    amount: payment.amount,
    currency: payment.currency,
    paymentMethod,
    requestedScenario,
    metadata: {
      cardBrand: brand,
      cardLast4: last4,
      customerId: String(customerId)
    }
  });

  const { transaction } = gatewayResponse;

  // 5. Verify gateway HMAC signature
  const isSignatureValid = mockGatewayService.verifyPayloadSignature(
    {
      transactionId: transaction.transactionId,
      orderId: String(order._id),
      amount: payment.amount,
      currency: payment.currency,
      responseCode: transaction.responseCode,
      status: transaction.status,
      timestamp: transaction.timestamp
    },
    transaction.signature
  );

  if (!isSignatureValid) {
    payment.status = PaymentStatus.FAILED;
    payment.failureReason = "Gateway response signature verification failed";
    await payment.save();

    const error = new Error("Tampered or invalid payment gateway signature");
    error.statusCode = 403;
    throw error;
  }

  // 6. Record immutable GatewayTransaction
  const merchantName =
    order.dealSnapshot?.merchantName || "HitMeUp Merchant Partner";

  const recordedTransaction = await transactionService.recordTransaction({
    transactionId: transaction.transactionId,
    paymentReference: payment.paymentReference,
    orderId: order._id,
    customerId,
    merchantName,
    amount: payment.amount,
    currency: payment.currency,
    paymentMethod,
    transactionStatus: transaction.status,
    responseCode: transaction.responseCode,
    responseMessage: transaction.message,
    processingTimeMs: transaction.processingTimeMs || 0,
    simulatedResponseType: requestedScenario,
    signature: transaction.signature,
    cardBrand: brand,
    cardLast4: last4,
    idempotencyKey
  });

  // 7. Apply outcome transitions
  payment.gatewayTransactionId = transaction.transactionId;
  payment.transactionId = transaction.transactionId;
  payment.cardBrand = brand;
  payment.cardLast4 = last4;
  payment.gatewayResponse = transaction;

  if (transaction.status === "SUCCESS") {
    validateTransition(payment.status, PaymentStatus.SUCCESS);
    payment.status = PaymentStatus.SUCCESS;
    payment.paidAt = new Date();
    await payment.save();

    // Mark Order as PAID
    order.status = "PAID";
    order.orderStatus = "PAID";
    order.paymentStatus = "SUCCESS";
    order.paymentId = payment._id;
    await order.save();

    // Commit inventory: increment claimedQuantity atomically
    await Deal.updateOne(
      { _id: order.dealId },
      { $inc: { claimedQuantity: order.quantity || 1 } }
    );

    // Generate Voucher with QR code (idempotent)
    const voucher = await voucherIntegrationService.createVoucherForOrder({
      order,
      paymentId: payment._id
    });

    // Generate immutable Receipt
    const receipt = await receiptService.createReceiptForPayment({
      order,
      payment,
      gatewayTransaction: recordedTransaction
    });

    return {
      success: true,
      transaction: recordedTransaction,
      payment,
      order,
      voucher,
      receipt
    };
  }

  if (transaction.status === "PENDING") {
    validateTransition(payment.status, PaymentStatus.PENDING);
    payment.status = PaymentStatus.PENDING;
    await payment.save();

    order.paymentStatus = "PENDING";
    await order.save();

    return {
      success: false,
      isPending: true,
      transaction: recordedTransaction,
      payment,
      order,
      message: transaction.message
    };
  }

  // FAILED / DECLINED
  validateTransition(payment.status, PaymentStatus.FAILED);
  payment.status = PaymentStatus.FAILED;
  payment.failureReason = transaction.message;
  await payment.save();

  order.paymentStatus = "FAILED";
  await order.save();

  return {
    success: false,
    isFailed: true,
    transaction: recordedTransaction,
    payment,
    order,
    message: transaction.message
  };
}

/**
 * Resolve a pending payment (background check or manual status poll)
 */
async function resolvePendingPayment({ paymentId, user }) {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const error = new Error("Payment record not found");
    error.statusCode = 404;
    throw error;
  }

  const order = await Order.findById(payment.orderId).populate("dealId", "businessId");
  if (!order) {
    const error = new Error("Linked order not found");
    error.statusCode = 404;
    throw error;
  }

  const requesterId = String(user?._id || user?.id || "");
  const customerId = String(payment.customerId || order.customerId || "");
  let hasAccess = user?.role === "admin" || requesterId === customerId;

  if (!hasAccess && (user?.role === "business" || user?.role === "seller")) {
    let businessId = user.businessId;
    if (!businessId) {
      const business = await Business.findOne({ ownerId: requesterId }).select("_id");
      businessId = business?._id;
    }

    const orderBusinessId = order.businessId || order.dealId?.businessId;
    hasAccess = Boolean(
      businessId &&
      orderBusinessId &&
      String(businessId) === String(orderBusinessId)
    );
  }

  if (!hasAccess) {
    const error = new Error("Unauthorized to resolve this payment");
    error.statusCode = 403;
    throw error;
  }

  // If already resolved, return current state after authorization.
  if (payment.status !== PaymentStatus.PENDING && payment.status !== PaymentStatus.PROCESSING) {
    return { payment, resolved: true, status: payment.status };
  }

  // In demo simulation, polling a pending payment after creation marks it resolved
  const timeSinceCreationMs = Date.now() - new Date(payment.createdAt).getTime();
  const shouldResolve = timeSinceCreationMs > 2000 || process.env.NODE_ENV === "test";

  if (shouldResolve) {
    payment.status = PaymentStatus.SUCCESS;
    payment.paidAt = new Date();
    await payment.save();

    // Synchronize GatewayTransaction record to SUCCESS as well
    if (payment.gatewayTransactionId) {
      await GatewayTransaction.updateOne(
        { transactionId: payment.gatewayTransactionId },
        {
          $set: {
            transactionStatus: "SUCCESS",
            responseCode: "00",
            responseMessage: "Approved (Pending settled successfully)"
          }
        }
      );
    }

    order.status = "PAID";
    order.orderStatus = "PAID";
    order.paymentStatus = "SUCCESS";
    await order.save();

    await Deal.updateOne(
      { _id: order.dealId },
      { $inc: { claimedQuantity: order.quantity || 1 } }
    );

    const voucher = await voucherIntegrationService.createVoucherForOrder({
      order,
      paymentId: payment._id
    });

    const receipt = await receiptService.createReceiptForPayment({
      order,
      payment
    });

    return {
      payment,
      order,
      voucher,
      receipt,
      resolved: true,
      status: "SUCCESS"
    };
  }

  return {
    payment,
    order,
    resolved: false,
    status: "PENDING"
  };
}

/**
 * Process simulated refund with voucher invalidation and inventory restoration
 */
async function refundPayment({ paymentId, user, reason }) {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    const error = new Error("Payment record not found");
    error.statusCode = 404;
    throw error;
  }

  // Idempotency: if already refunded, return existing refund details
  if (payment.status === PaymentStatus.REFUNDED) {
    return {
      success: true,
      alreadyRefunded: true,
      payment,
      message: "Payment has already been refunded"
    };
  }

  // Only SUCCESS payments can be refunded
  if (payment.status !== PaymentStatus.SUCCESS) {
    const error = new Error(
      `Only successful payments can be refunded. Current status is ${payment.status}.`
    );
    error.statusCode = 400;
    throw error;
  }

  const order = await Order.findById(payment.orderId);
  if (!order) {
    const error = new Error("Linked order not found");
    error.statusCode = 404;
    throw error;
  }

  // Authorization check: Admin always; Seller only for deals they own
  if (user.role !== "admin") {
    let businessId = user.businessId;
    if (!businessId) {
      const biz = await Business.findOne({ ownerId: user._id });
      if (biz) businessId = biz._id;
    }

    if (
      !businessId ||
      !order.businessId ||
      String(order.businessId) !== String(businessId)
    ) {
      const error = new Error(
        "Unauthorized. Only marketplace admins or the deal owner can issue refunds."
      );
      error.statusCode = 403;
      throw error;
    }
  }

  // Check voucher status: redeemed vouchers cannot be refunded
  const voucher = await Voucher.findOne({ orderId: order._id });
  if (voucher && voucher.status === "REDEEMED") {
    const error = new Error(
      "Cannot refund payment: The customer has already redeemed this voucher."
    );
    error.statusCode = 422; // Unprocessable Entity
    throw error;
  }

  // Validate state transition
  validateTransition(payment.status, PaymentStatus.REFUNDED);

  // Invalidate voucher
  if (voucher) {
    voucher.status = "REFUNDED";
    await voucher.save();
  }

  // Restore deal inventory
  await Deal.updateOne(
    { _id: order.dealId },
    {
      $inc: {
        availableQuantity: order.quantity || 1,
        claimedQuantity: -(order.quantity || 1)
      }
    }
  );

  // Apply refund record to Payment
  const refundReference = generateRefundReference();
  payment.status = PaymentStatus.REFUNDED;
  payment.refund = {
    refundReference,
    refundedAt: new Date(),
    refundedBy: user._id,
    reason: reason || "Customer request / simulated refund",
    amount: payment.amount,
    simulated: true
  };
  await payment.save();

  // Update order status
  order.paymentStatus = "REFUNDED";
  await order.save();

  return {
    success: true,
    payment,
    refundReference,
    message: "Payment refunded successfully (Simulated)"
  };
}

module.exports = {
  generatePaymentReference,
  generateRefundReference,
  createCheckoutSession,
  processPayment,
  resolvePendingPayment,
  refundPayment
};

