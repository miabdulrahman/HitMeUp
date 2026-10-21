const mongoose = require("mongoose");

/**
 * Review Model - Member 3 (Deal Discovery & Location)
 * Stores customer ratings (1 to 5 stars) and review feedback for businesses and deals.
 */
const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"]
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      required: [true, "Business ID is required"]
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: [1, "Rating cannot be less than 1"],
      max: [5, "Rating cannot exceed 5"]
    },
    comment: {
      type: String,
      trim: true,
      maxlength: [1000, "Review comment cannot exceed 1000 characters"],
      default: ""
    }
  },
  {
    timestamps: true
  }
);

reviewSchema.index({ businessId: 1, createdAt: -1 });
reviewSchema.index({ dealId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, businessId: 1 });

module.exports = mongoose.models.Review || mongoose.model("Review", reviewSchema);
