const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    // Order associated with this payment
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },

    // Customer who made the payment
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    // Amount to be paid
    amount: {
      type: Number,
      required: true,
      min: 0
    },

    // Payment currency
    currency: {
      type: String,
      default: "LKR"
    },

    // Payment provider
    provider: {
      type: String,
      default: "DEMO"
    },

    // Transaction reference from the payment provider
    transactionId: {
      type: String,
      unique: true,
      sparse: true
    },

    // Payment status
    status: {
      type: String,
      enum: [
        "PENDING",
        "SUCCESS",
        "FAILED",
        "REFUNDED"
      ],
      default: "PENDING"
    },

    // Date and time when payment succeeded
    paidAt: {
      type: Date,
      default: null
    },

    // Relevant information returned by the provider
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Payment", paymentSchema);