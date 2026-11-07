const mongoose = require("mongoose");

/**
 * PlatformSettings Model
 * Singleton configuration document for platform-level operational controls.
 */
const platformSettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "global",
      unique: true
    },
    marketplaceName: {
      type: String,
      default: "HitMeUp",
      trim: true
    },
    supportEmail: {
      type: String,
      default: "support@hitmeup.lk",
      trim: true,
      lowercase: true
    },
    defaultDiscoveryRadiusKm: {
      type: Number,
      default: 25,
      min: 1,
      max: 150
    },
    requireSellerVerification: {
      type: Boolean,
      default: true
    },
    autoExpireDeals: {
      type: Boolean,
      default: true
    },
    maxDealDurationHours: {
      type: Number,
      default: 72,
      min: 1,
      max: 720
    },
    maxDiscountPercentage: {
      type: Number,
      default: 90,
      min: 5,
      max: 99
    },
    notifyOnNewApplication: {
      type: Boolean,
      default: true
    },
    notifyOnSellerSuspension: {
      type: Boolean,
      default: true
    },
    notifyOnDealCancellation: {
      type: Boolean,
      default: false
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    }
  },
  {
    timestamps: true
  }
);

module.exports =
  mongoose.models.PlatformSettings ||
  mongoose.model("PlatformSettings", platformSettingsSchema);

