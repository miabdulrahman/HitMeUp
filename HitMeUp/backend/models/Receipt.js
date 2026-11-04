const mongoose = require("mongoose");

const receiptSchema = new mongoose.Schema(
  {
    receiptNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    transactionId: {
      type: String,
      required: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
      index: true
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    merchantName: {
      type: String,
      default: "HitMeUp Merchant"
    },
    dealTitle: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      default: 1
    },
    subtotal: {
      type: Number,
      required: true
    },
    fees: {
      type: Number,
      default: 0
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "LKR"
    },
    paymentMethod: {
      type: String,
      default: "CARD"
    },
    cardBrand: {
      type: String,
      default: null
    },
    cardLast4: {
      type: String,
      default: null
    },
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentStatus: {
      type: String,
      default: "SUCCESS"
    },
    verificationReference: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

receiptSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.models.Receipt || mongoose.model("Receipt", receiptSchema);

