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
  try {
    const customerId = req.user._id;

    const {
      paymentId,
      transactionId,
      success
    } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required"
      });
    }

    const payment = await Payment.findOne({
      _id: paymentId,
      customerId
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    const order = await Order.findOne({
      _id: payment.orderId,
      customerId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // DEMO SUCCESS/FAILURE
    const paymentSuccessful = success === true;

    if (!paymentSuccessful) {
      payment.status = "FAILED";

      if (transactionId) {
        payment.transactionId = transactionId;
      }

      await payment.save();

      order.status = "FAILED";
      await order.save();

      return res.status(200).json({
        success: false,
        message: "Payment failed",
        data: payment
      });
    }

    payment.status = "SUCCESS";
    payment.transactionId =
      transactionId || generateTransactionId();
    payment.paidAt = new Date();

    await payment.save();

    // Update order
    order.status = "PAID";
    order.paymentId = payment._id;

    await order.save();

    // Generate voucher
    let voucher = await Voucher.findOne({
      orderId: order._id
    });

    if (!voucher) {
      const voucherCode = generateVoucherCode();

      const qrData = await QRCode.toDataURL(
        `HITMEUP:${voucherCode}`
      );

      voucher = await Voucher.create({
        orderId: order._id,
        customerId,
        dealId: order.dealId,
        code: voucherCode,
        qrData,
        status: "ACTIVE",
        expiresAt: order.expiresAt
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment successful and voucher generated",
      data: {
        payment,
        order,
        voucher
      }
    });
  } catch (error) {
    console.error("Verify Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to verify payment"
    });
  }
};

// PAYMENT WEBHOOK
const paymentWebhook = async (req, res) => {
  try {
    const {
      paymentId,
      transactionId,
      status
    } = req.body;

    if (!paymentId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID is required"
      });
    }

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found"
      });
    }

    if (status === "SUCCESS") {
      payment.status = "SUCCESS";
      payment.transactionId =
        transactionId || generateTransactionId();
      payment.paidAt = new Date();

      await payment.save();

      const order = await Order.findById(payment.orderId);

      if (order) {
        order.status = "PAID";
        order.paymentId = payment._id;

        await order.save();

        const existingVoucher = await Voucher.findOne({
          orderId: order._id
        });

        if (!existingVoucher) {
          const voucherCode = generateVoucherCode();

          const qrData = await QRCode.toDataURL(
            `HITMEUP:${voucherCode}`
          );

          await Voucher.create({
            orderId: order._id,
            customerId: payment.customerId,
            dealId: order.dealId,
            code: voucherCode,
            qrData,
            status: "ACTIVE",
            expiresAt: order.expiresAt
          });
        }
      }
    }

    if (status === "FAILED") {
      payment.status = "FAILED";
      await payment.save();

      await Order.findByIdAndUpdate(
        payment.orderId,
        {
          status: "FAILED"
        }
      );
    }

    return res.status(200).json({
      success: true,
      message: "Webhook processed"
    });
  } catch (error) {
    console.error("Payment Webhook Error:", error);

    return res.status(500).json({
      success: false,
      message: "Webhook processing failed"
    });
  }
};

// GET PAYMENT BY ID
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      _id: req.params.id,
      customerId: req.user._id
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
