const mongoose = require("mongoose");

/**
 * AdminActivityLog Model
 * Persists verifiable administrative actions performed by authorized platform admins.
 */
const adminActivityLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    actorName: {
      type: String,
      required: true,
      trim: true
    },
    actorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        "APPLICATION_UNDER_REVIEW",
        "SELLER_APPROVED",
        "SELLER_REJECTED",
        "SELLER_SUSPENDED",
        "SELLER_REACTIVATED",
        "CUSTOMER_SUSPENDED",
        "CUSTOMER_REACTIVATED",
        "DEAL_STATUS_UPDATED",
        "SETTINGS_UPDATED"
      ]
    },
    targetType: {
      type: String,
      required: true,
      enum: ["business", "user", "deal", "settings"]
    },
    targetId: {
      type: String,
      default: ""
    },
    targetName: {
      type: String,
      default: ""
    },
    summary: {
      type: String,
      required: true,
      trim: true
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

adminActivityLogSchema.index({ createdAt: -1 });
adminActivityLogSchema.index({ action: 1, createdAt: -1 });
adminActivityLogSchema.index({ targetType: 1, targetId: 1 });

module.exports =
  mongoose.models.AdminActivityLog ||
  mongoose.model("AdminActivityLog", adminActivityLogSchema);

