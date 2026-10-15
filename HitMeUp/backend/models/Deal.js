const mongoose = require("mongoose");

/**
 * Deal Model - Member 2 (Flash Deal Management)
 * Handles deal CRUD, pricing, lifecycle status, and business association.
 */
const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Deal title is required"],
      trim: true,
      maxlength: [150, "Deal title cannot exceed 150 characters"]
    },

    description: {
      type: String,
      required: [true, "Deal description is required"],
      trim: true
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required"]
    },

    category: {
      type: String,
      trim: true,
      default: "General"
    },

    originalPrice: {
      type: Number,
      required: [true, "Original price is required"],
      min: [0, "Original price cannot be negative"]
    },

    discountPercentage: {
      type: Number,
      required: [true, "Discount percentage is required"],
      min: [0, "Discount cannot be less than 0%"],
      max: [100, "Discount cannot exceed 100%"]
    },

    discountedPrice: {
      type: Number,
      required: [true, "Discounted price is required"],
      min: [0, "Discounted price cannot be negative"]
    },

    startDate: {
      type: Date,
      required: [true, "Start date is required"],
      default: Date.now
    },

    endDate: {
      type: Date,
      required: [true, "End date is required"]
    },

    status: {
      type: String,
      enum: {
        values: ["draft", "active", "expired", "cancelled"],
        message: "{VALUE} is not a valid deal status"
      },
      default: "draft"
    },

    imageUrl: {
      type: String,
      default: ""
    },

    availableQuantity: {
      type: Number,
      default: 50,
      min: [0, "Available quantity cannot be negative"]
    },

    claimedQuantity: {
      type: Number,
      default: 0,
      min: [0, "Claimed quantity cannot be negative"]
    },

    terms: {
      type: String,
      default: "Valid during store operating hours. One voucher per customer."
    }
  },
  {
    timestamps: true
  }
);

// Indexes for high-performance querying
dealSchema.index({ businessId: 1, status: 1 });
dealSchema.index({ status: 1, endDate: 1 });
dealSchema.index({ category: 1, status: 1 });
dealSchema.index({ title: "text", description: "text" });

// Helper to determine if deal is expired
dealSchema.methods.isExpired = function () {
  return new Date() > this.endDate;
};

module.exports = mongoose.model("Deal", dealSchema);