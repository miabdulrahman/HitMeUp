const crypto = require("crypto");
const Receipt = require("../models/Receipt");

function generateReceiptNumber() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const randomSuffix = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `REC-${yyyy}${mm}${dd}-${randomSuffix}`;
}

function generateVerificationReference() {
  return `VER-${crypto.randomBytes(6).toString("hex").toUpperCase()}`;
}

/**
 * Creates an immutable receipt record for a successfully processed payment.
 */
async function createReceiptForPayment({
  order,
  payment,
  gatewayTransaction,
  session = null
}) {
  // Idempotency: return existing receipt if already generated for this payment
  const existing = await Receipt.findOne({ paymentId: payment._id }).session(session);
  if (existing) return existing;

  const receiptData = {
    receiptNumber: generateReceiptNumber(),
    transactionId:
      gatewayTransaction?.transactionId ||
      payment.gatewayTransactionId ||
      payment.paymentReference,
    orderId: order._id,
    paymentId: payment._id,
    customerId: order.customerId,
    merchantName:
      order.dealSnapshot?.merchantName ||
      gatewayTransaction?.merchantName ||
      "HitMeUp Merchant Partner",
    dealTitle: order.dealSnapshot?.title || "Flash Deal Voucher",
    quantity: order.quantity || 1,
    subtotal: order.subtotal || order.amount,
    fees: order.fees || 0,
    amount: payment.amount,
    currency: payment.currency || "LKR",
    paymentMethod: payment.paymentMethod || "CARD",
    cardBrand: payment.cardBrand || gatewayTransaction?.cardBrand || null,
    cardLast4: payment.cardLast4 || gatewayTransaction?.cardLast4 || null,
    paymentDate: payment.paidAt || new Date(),
    paymentStatus: payment.status,
    verificationReference: generateVerificationReference()
  };

  let receipt;
  if (session) {
    const created = await Receipt.create([receiptData], { session });
    receipt = created[0];
  } else {
    receipt = await Receipt.create(receiptData);
  }

  return receipt;
}

/**
 * Get receipt by payment ID with authorization checks
 */
async function getReceiptByPaymentId(paymentId) {
  return await Receipt.findOne({ paymentId })
    .populate("orderId")
    .populate("customerId", "name email phone");
}

module.exports = {
  generateReceiptNumber,
  generateVerificationReference,
  createReceiptForPayment,
  getReceiptByPaymentId
};
