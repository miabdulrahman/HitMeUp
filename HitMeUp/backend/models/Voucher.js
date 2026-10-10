const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
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

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },

    qrData: {
      type: String,
      required: true
    },

    status: {
      type: String,
      enum: [
        "ACTIVE",
        "REDEEMED",
        "EXPIRED",
        "CANCELLED"
      ],
      default: "ACTIVE"
    },

    expiresAt: {
      type: Date,
      default: null
    },

    redeemedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Voucher", voucherSchema);