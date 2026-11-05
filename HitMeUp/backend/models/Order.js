const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      required: true,
      index: true
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      index: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
      min: 1
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    fees: {
      type: Number,
      default: 0,
      min: 0
    },
    // totalAmount is the official field; amount is retained for backward compatibility
    totalAmount: {
      type: Number,
      required: true,
      min: 0
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
    // status is retained for backward compatibility with existing controllers
    status: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED", "EXPIRED", "COMPLETED"],
      default: "PENDING",
      index: true
    },
    orderStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "CANCELLED", "EXPIRED", "COMPLETED"],
      default: "PENDING",
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"],
      default: "PENDING"
    },
    // Snapshot of deal details at order creation time
    dealSnapshot: {
      title: { type: String, default: "" },
      imageUrl: { type: String, default: "" },
      merchantName: { type: String, default: "" },
      category: { type: String, default: "" }
    },
    expiresAt: {
      type: Date,
      index: true
    },
    inventoryReserved: {
      type: Boolean,
      default: true
    },
    inventoryReleased: {
      type: Boolean,
      default: false
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Synchronize status and orderStatus, totalAmount and amount before save
orderSchema.pre("validate", function () {
  if (this.totalAmount !== undefined && this.amount === undefined) {
    this.amount = this.totalAmount;
  } else if (this.amount !== undefined && this.totalAmount === undefined) {
    this.totalAmount = this.amount;
  }
  if (this.orderStatus && !this.status) {
    this.status = this.orderStatus;
  } else if (this.status && !this.orderStatus) {
    this.orderStatus = this.status;
  }
});

orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ businessId: 1, createdAt: -1 });

module.exports = mongoose.models.Order || mongoose.model("Order", orderSchema);
