const mongoose = require("mongoose");

/**
 * Favorite Model - Member 3 (Deal Discovery & Location)
 * Stores user bookmarks for flash deals and businesses.
 */
const favoriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"]
    },
    dealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Deal",
      default: null
    },
    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Business",
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate bookmarks per user
favoriteSchema.index({ userId: 1, dealId: 1 }, { unique: true, sparse: true });
favoriteSchema.index({ userId: 1, businessId: 1 }, { unique: true, sparse: true });
favoriteSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.models.Favorite || mongoose.model("Favorite", favoriteSchema);
