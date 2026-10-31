const mongoose = require("mongoose");
const crypto = require("crypto");
const QRCode = require("qrcode");

const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Voucher = require("../models/Voucher");

function generateTransactionId() {
  return `TXN-${Date.now()}-${crypto
    .randomBytes(4)
    .toString("hex")
    .toUpperCase()}`;
}

function generateVoucherCode() {
  return `HMU-${crypto
    .randomBytes(5)
    .toString("hex")
    .toUpperCase()}`;
}

// CREATE PAYMENT
const createPayment = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID"
      });
    }

    const order = await Order.findOne({
      _id: orderId,
      customerId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Order is already ${order.status}`
      });
    }

    const existingPayment = await Payment.findOne({
      orderId,
      customerId,
      status: "PENDING"
    });

    if (existingPayment) {
      return res.status(200).json({
        success: true,
        message: "Existing payment found",
        data: existingPayment
      });
    }

    const payment = await Payment.create({
      orderId: order._id,
      customerId,
      amount: order.amount,
      currency: order.currency,
      provider: "DEMO",
      status: "PENDING"
    });

    order.paymentId = payment._id;
    await order.save();

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: {
        payment,
        checkout: {
          provider: "DEMO",
          message:
            "Replace this section with your selected payment gateway checkout."
        }
      }
    });
  } catch (error) {
    console.error("Create Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment"
    });
  }
};

// VERIFY PAYMENT
const verifyPayment = async (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "Direct payment confirmation is disabled. Verified gateway payment is required."
  });
};

// PAYMENT WEBHOOK
const paymentWebhook = async (req, res) => {
  return res.status(403).json({
    success: false,
    message:
      "Payment webhook is disabled until secure gateway verification is configured."
  });
};

// GET PAYMENT BY ID
const getPaymentById = async (req, res) => {
  try {
    const customerId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Payment ID format"
      });
    }

    const payment = await Payment.findOne({
      _id: req.params.id,
      customerId
    }).populate("orderId");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: payment
    });
  } catch (error) {
    console.error("Get Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get payment"
    });
  }
};

module.exports = {
  createPayment,
  verifyPayment,
  paymentWebhook,
  getPaymentById
};
