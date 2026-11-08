const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const Deal = require("../models/Deal");
const Business = require("../models/Business");
const paymentService = require("../services/paymentService");
const transactionService = require("../services/transactionService");
const receiptService = require("../services/receiptService");

// GET /api/payments/my-payments - Authenticated customer's payments
const getMyPayments = async (req, res) => {
  try {
    const customerId = req.user._id || req.user.id;

    const payments = await Payment.find({ customerId })
      .populate({
        path: "orderId",
        select: "orderNumber dealSnapshot totalAmount amount currency status orderStatus"
      })
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: payments.length,
      data: payments,
      payments
    });
  } catch (error) {
    console.error("Get My Payments Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payments"
    });
  }
};

// GET /api/payments - Role-scoped payments list (Admin or Seller)
const getAllPayments = async (req, res) => {
  try {
    const roleFilter = await transactionService.getRoleFilter(req.user);
    const { status, page = 1, limit = 10 } = req.query;

    const filter = { ...roleFilter };
    if (status && status !== "ALL") {
      filter.status = status.toUpperCase();
    }

    const skip = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
    const parsedLimit = Math.min(100, Math.max(1, Number(limit)));

    const [payments, totalCount] = await Promise.all([
      Payment.find(filter)
        .populate("customerId", "name email phone")
        .populate("orderId", "orderNumber dealSnapshot totalAmount")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit),
      Payment.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      payments,
      totalCount,
      totalPages: Math.ceil(totalCount / parsedLimit),
      currentPage: Number(page)
    });
  } catch (error) {
    console.error("Get All Payments Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payments list"
    });
  }
};

// GET /api/payments/:id - Single payment record
const getPaymentById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Payment ID format"
      });
    }

    const roleFilter = await transactionService.getRoleFilter(req.user);
    const payment = await Payment.findOne({
      _id: req.params.id,
      ...roleFilter
    })
      .populate("orderId")
      .populate("customerId", "name email phone");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
      payment
    });
  } catch (error) {
    console.error("Get Payment By ID Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve payment details"
    });
  }
};

// POST /api/payments/:id/refund - Simulated Refund Processing
const refundPayment = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Payment ID format"
      });
    }

    const { reason } = req.body;

    const result = await paymentService.refundPayment({
      paymentId: req.params.id,
      user: req.user,
      reason
    });

    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Refund Payment Error:", error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to process refund"
    });
  }
};

// GET /api/payments/dashboard/summary - MongoDB aggregation metrics
const getDashboardSummary = async (req, res) => {
  try {
    const summary = await transactionService.getDashboardSummary(req.user);

    return res.status(200).json({
      success: true,
      data: summary,
      ...summary
    });
  } catch (error) {
    console.error("Dashboard Summary Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load dashboard metrics"
    });
  }
};

// GET /api/payments/:id/receipt - Formatted Receipt Data
const getReceipt = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Payment ID format"
      });
    }

    const roleFilter = await transactionService.getRoleFilter(req.user);
    const payment = await Payment.findOne({
      _id: req.params.id,
      ...roleFilter
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Receipt not found for this payment"
      });
    }

    const receipt = await receiptService.getReceiptByPaymentId(req.params.id);

    if (!receipt) {
      // If payment was success but receipt not yet generated, attempt to generate it
      if (payment && payment.status === "SUCCESS") {
        const order = await Order.findById(payment.orderId);
        if (order) {
          const newReceipt = await receiptService.createReceiptForPayment({
            order,
            payment
          });
          return res.status(200).json({
            success: true,
            receipt: newReceipt,
            data: newReceipt
          });
        }
      }

      return res.status(404).json({
        success: false,
        message: "Receipt not found for this payment"
      });
    }

    return res.status(200).json({
      success: true,
      receipt,
      data: receipt
    });
  } catch (error) {
    console.error("Get Receipt Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load receipt"
    });
  }
};

// Backward-compatibility: create payment
const createPayment = async (req, res) => {
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

    return res.status(201).json({
      success: true,
      message: "Payment session created",
      data: session
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create payment"
    });
  }
};

const verifyPayment = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Direct client confirmation is disabled. Use /api/gateway/process."
  });
};

const paymentWebhook = async (req, res) => {
  return res.status(403).json({
    success: false,
    message: "Direct webhook is disabled. Use HitMeUp Pay simulation gateway."
  });
};

module.exports = {
  getMyPayments,
  getAllPayments,
  getPaymentById,
  refundPayment,
  getDashboardSummary,
  getReceipt,
  createPayment,
  verifyPayment,
  paymentWebhook
};
