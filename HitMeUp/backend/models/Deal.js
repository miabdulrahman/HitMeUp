const mongoose = require("mongoose");

const dealSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true,
      trim: true
    },

    businessId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },

    originalPrice: {
      type: Number,
      required: true,
      min: 0
    },

    discountPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },

    discountedPrice: {
      type: Number,
      required: true,
      min: 0
    },

    startDate: {
      type: Date,
      required: true
    },

    endDate: {
      type: Date,
      required: true
    },

    status: {
      type: String,
      enum: ["draft", "active", "expired", "cancelled"],
      default: "draft"
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("Deal", dealSchema);