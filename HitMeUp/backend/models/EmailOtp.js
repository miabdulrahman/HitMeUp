const mongoose = require("mongoose");

const emailOtpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true
    },
    otp: {
      type: String,
      required: true
    },
    purpose: {
      type: String,
      required: true,
      enum: ["register", "forgot_password"]
    },
    verified: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 900 // MongoDB TTL index: automatically deletes document after 15 minutes
    }
  },
  {
    timestamps: false
  }
);

module.exports =
  mongoose.models.EmailOtp || mongoose.model("EmailOtp", emailOtpSchema);

