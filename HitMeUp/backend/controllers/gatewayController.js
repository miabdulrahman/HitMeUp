const mongoose = require("mongoose");
const paymentService = require("../services/paymentService");
const transactionService = require("../services/transactionService");
const GatewayTransaction = require("../models/GatewayTransaction");
const Voucher = require("../models/Voucher");
const Business = require("../models/Business");
const Order = require("../models/Order");
require("../models/user");

// POST /api/gateway/checkout - Initialize or retrieve active payment session
const checkoutSession = async (req, res) => {
  try {
    const { orderId } = req.body;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    const session = await paymentService.createCheckoutSession({
      orderId,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      message: session.alreadyPaid
        ? "Order has already been paid"
        : "Checkout session ready",
      data: session,
      ...session
    });
  } catch (error) {
    console.error("Gateway Checkout Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to initialize checkout session"
    });
  }
};

// POST /api/gateway/process - Idempotent simulated payment execution
const processPayment = async (req, res) => {
  try {
    const idempotencyKey =
      req.headers["idempotency-key"] ||
      req.body.idempotencyKey ||
      null;

    const {
      orderId,
      paymentMethod = "CARD",
      requestedScenario = "SUCCESS",
      brand = null,
      last4 = null
    } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    // Safety: ensure client didn't send full card PAN or CVV
    if (req.body.cardNumber || req.body.pan || req.body.cvv) {
      console.warn("Security Alert: Sensitive card data was submitted and blocked.");
      return res.status(400).json({
        success: false,
        message:
          "Full card numbers and CVVs must never be transmitted. Only simulation metadata (brand, last4) is accepted."
      });
    }

    const result = await paymentService.processPayment({
      orderId,
      user: req.user,
      paymentMethod,
      requestedScenario,
      brand,
      last4,
      idempotencyKey
    });

    const statusCode = result.success ? 200 : result.isPending ? 202 : 400;

    return res.status(statusCode).json({
      success: result.success,
      ...result
    });
  } catch (error) {
    console.error("Gateway Process Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Payment processing failed"
    });
  }
};

// GET /api/gateway/transactions - Role-scoped transaction records
const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      method,
      search,
      startDate,
      endDate
    } = req.query;

    const result = await transactionService.getTransactions({
      user: req.user,
      page,
      limit,
      status,
      method,
      search,
      startDate,
      endDate
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Get Transactions Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve transactions"
    });
  }
};

// GET /api/gateway/transactions/:id - Get transaction details
const getTransactionById = async (req, res) => {
  try {
    const rawId = decodeURIComponent(req.params.id || "").trim();
    if (!rawId) {
      return res.status(400).json({
        success: false,
        message: "Transaction identifier is required"
      });
    }

    const normalizedHyphenId = rawId.replace(/\s+/g, "-");
    const queries = [
      { transactionId: rawId },
      { transactionId: normalizedHyphenId },
      { paymentReference: rawId },
      { paymentReference: normalizedHyphenId }
    ];

    if (mongoose.Types.ObjectId.isValid(rawId)) {
      queries.push({ _id: rawId });
    }

    const transaction = await GatewayTransaction.findOne({ $or: queries })
      .populate("customerId", "name email phone role")
      .populate({
        path: "orderId",
        populate: [
          {
            path: "dealId",
            select: "title description price originalPrice images category"
          },
          {
            path: "businessId",
            select: "businessName name email phone address"
          }
        ]
      });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    // Role check:
    // 1. Admin can view all transactions
    // 2. Customer owner can view their own transaction
    // 3. Merchant / Seller who owns the deal / business can view
    const requesterId = String(req.user._id || req.user.id || "");
    const customerOwnerId = String(
      transaction.customerId?._id || transaction.customerId || ""
    );
    const isAdmin = req.user.role === "admin";
    const isCustomerOwner = requesterId === customerOwnerId;

    let isMerchantOwner = false;
    if (req.user.role === "business" || req.user.role === "seller") {
      const orderBusinessId = String(
        transaction.orderId?.businessId?._id ||
        transaction.orderId?.businessId ||
        ""
      );
      const userBusinessId = String(
        req.user.businessId?._id ||
        req.user.businessId ||
        req.user._id ||
        ""
      );
      if (
        orderBusinessId &&
        userBusinessId &&
        orderBusinessId === userBusinessId
      ) {
        isMerchantOwner = true;
      }
    }

    if (!isAdmin && !isCustomerOwner && !isMerchantOwner) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this transaction"
      });
    }

    // Fetch linked voucher if one exists for this order
    let voucher = null;
    try {
      voucher = await Voucher.findOne({
        orderId: transaction.orderId?._id || transaction.orderId
      }).lean();
    } catch (e) {
      // non-fatal
    }

    return res.status(200).json({
      success: true,
      transaction,
      data: transaction,
      voucher: voucher || null
    });
  } catch (error) {
    console.error("Get Transaction By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve transaction"
    });
  }
};

// POST /api/gateway/transactions/:id/resolve - Resolve pending transaction in simulation
const resolveTransaction = async (req, res) => {
  try {
    const rawId = decodeURIComponent(req.params.id || "").trim();
    const normalizedHyphenId = rawId.replace(/\s+/g, "-");
    const queries = [
      { transactionId: rawId },
      { transactionId: normalizedHyphenId }
    ];
    if (mongoose.Types.ObjectId.isValid(rawId)) {
      queries.push({ _id: rawId });
    }

    const transaction = await GatewayTransaction.findOne({ $or: queries });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    const Payment = require("../models/Payment");
    const payment = await Payment.findOne({
      $or: [
        { gatewayTransactionId: transaction.transactionId },
        { orderId: transaction.orderId }
      ]
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Associated payment record not found"
      });
    }

    const requesterId = String(req.user._id || req.user.id || "");
    const customerId = String(payment.customerId || transaction.customerId || "");
    let authorized = req.user.role === "admin" || requesterId === customerId;

    if (!authorized && (req.user.role === "business" || req.user.role === "seller")) {
      let businessId = req.user.businessId;
      if (!businessId) {
        const business = await Business.findOne({ ownerId: requesterId }).select("_id");
        businessId = business?._id;
      }

      const order = await Order.findById(transaction.orderId)
        .select("businessId dealId")
        .populate("dealId", "businessId");
      const orderBusinessId = order?.businessId || order?.dealId?.businessId;
      authorized = Boolean(
        businessId &&
        orderBusinessId &&
        String(businessId) === String(orderBusinessId)
      );
    }

    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to resolve this transaction"
      });
    }

    const result = await paymentService.resolvePendingPayment({
      paymentId: payment._id,
      user: req.user
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Resolve Transaction Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to resolve transaction"
    });
  }
};

module.exports = {
  checkoutSession,
  processPayment,
  getTransactions,
  getTransactionById,
  resolveTransaction
};

