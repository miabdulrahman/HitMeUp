const mongoose = require("mongoose");

const gatewayTransactionSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    paymentReference: {
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
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    currency: {
      type: String,
      default: "LKR"
    },
    paymentMethod: {
      type: String,
      enum: ["CARD", "BANK_TRANSFER", "WALLET"],
      default: "CARD"
    },
    transactionStatus: {
      type: String,
      enum: ["SUCCESS", "FAILED", "PENDING", "CANCELLED"],
      required: true,
      index: true
    },
    responseCode: {
      type: String,
      required: true
    },
    responseMessage: {
      type: String,
      required: true
    },
    processingTimeMs: {
      type: Number,
      default: 0
    },
    simulatedResponseType: {
      type: String,
      default: "SUCCESS"
    },
    signature: {
      type: String,
      required: true
    },
    cardBrand: {
      type: String,
      default: null
    },
    cardLast4: {
      type: String,
      default: null
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

gatewayTransactionSchema.index({ customerId: 1, createdAt: -1 });
gatewayTransactionSchema.index({ transactionStatus: 1, createdAt: -1 });

module.exports =
  mongoose.models.GatewayTransaction ||
  mongoose.model("GatewayTransaction", gatewayTransactionSchema);

