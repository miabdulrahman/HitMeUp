const mongoose = require("mongoose");

const refundSchema = new mongoose.Schema(
  {
    refundReference: {
      type: String,
      required: true
    },
    refundedAt: {
      type: Date,
      default: Date.now
    },
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reason: {
      type: String,
      default: "Customer request / simulated refund"
    },
    amount: {
      type: Number
    },
    simulated: {
      type: Boolean,
      default: true
    }
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    paymentReference: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
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
    provider: {
      type: String,
      default: "HitMeUp Pay"
    },
    gatewayTransactionId: {
      type: String,
      sparse: true,
      index: true
    },
    transactionId: {
      type: String,
      sparse: true
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PROCESSING",
        "SUCCESS",
        "FAILED",
        "CANCELLED",
        "REFUNDED"
      ],
      default: "PENDING",
      index: true
    },
    attempt: {
      type: Number,
      default: 1
    },
    idempotencyKey: {
      type: String,
      sparse: true,
      index: true
    },
    paidAt: {
      type: Date,
      default: null
    },
    failureReason: {
      type: String,
      default: null
    },
    cardBrand: {
      type: String,
      default: null
    },
    cardLast4: {
      type: String,
      default: null
    },
    refund: {
      type: refundSchema,
      default: null
    },
    gatewayResponse: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Enforce at most one SUCCESS payment per order
paymentSchema.index(
  { orderId: 1 },
  { unique: true, partialFilterExpression: { status: "SUCCESS" } }
);

paymentSchema.index({ customerId: 1, createdAt: -1 });

module.exports = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
