const mongoose = require("mongoose");

const fraudFlagSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: false,
        },

        activityType: {
            type: String,
            required: true,
        },

        input: {
            type: mongoose.Schema.Types.Mixed,
            required: true,
        },

        isSuspicious: {
            type: Boolean,
            required: true,
        },

        riskLevel: {
            type: String,
            enum: ["low", "medium", "high"],
            required: true,
        },

        reason: {
            type: String,
            required: true,
        },

        status: {
            type: String,
            enum: ["pending", "reviewed", "dismissed"],
            default: "pending",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("FraudFlag", fraudFlagSchema);