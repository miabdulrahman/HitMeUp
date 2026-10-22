const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      default: "LKR"
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "PAID",
        "FAILED",
        "CANCELLED",
        "COMPLETED"
      ],
      default: "PENDING"
    },
    expiresAt: {
      type: Date
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
