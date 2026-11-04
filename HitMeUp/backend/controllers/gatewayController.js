const paymentService = require("../services/paymentService");
const transactionService = require("../services/transactionService");
const GatewayTransaction = require("../models/GatewayTransaction");

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
    const transaction = await GatewayTransaction.findOne({
      transactionId: req.params.id
    })
      .populate("customerId", "name email phone")
      .populate("orderId");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    // Role check: customer must own it, unless seller/admin
    if (
      req.user.role !== "admin" &&
      req.user.role !== "business" &&
      req.user.role !== "seller" &&
      String(transaction.customerId?._id || transaction.customerId) !==
        String(req.user._id)
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this transaction"
      });
    }

    return res.status(200).json({
      success: true,
      data: transaction,
      transaction
    });
  } catch (error) {
    console.error("Get Transaction By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve transaction"
    });
  }
};

// POST /api/gateway/transactions/:id/resolve - Resolve pending transaction in simulation
const resolveTransaction = async (req, res) => {
  try {
    const transaction = await GatewayTransaction.findOne({
      transactionId: req.params.id
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Transaction not found"
      });
    }

    const Payment = require("../models/Payment");
    const payment = await Payment.findOne({
      gatewayTransactionId: transaction.transactionId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Associated payment record not found"
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
