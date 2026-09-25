const mongoose = require("mongoose");

const businessSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Business name is required"],
      trim: true,
      maxlength: [150, "Business name cannot exceed 150 characters"]
    },
    category: {
      type: String,
      required: [true, "Business category is required"],
      trim: true,
      enum: {
        values: [
          "Restaurant",
          "Cafe",
          "Retail",
          "Fashion",
          "Electronics",
          "Health & Beauty",
          "Salon",
          "Fitness",
          "Entertainment",
          "Groceries",
          "Other"
        ],
        message: "{VALUE} is not a supported business category"
      }
    },
    description: {
      type: String,
      trim: true,
      default: ""
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Business must belong to a user"],
      unique: true // One business profile per business account
    },
    phone: {
      type: String,
      required: [true, "Contact phone number is required"],
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      postalCode: { type: String, default: "" },
      country: { type: String, default: "Sri Lanka" }
    },
    // GeoJSON Point representation for location-based search and nearby deals (Member 3)
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point"
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [79.8612, 6.9271] // Default Colombo, Sri Lanka
      }
    },
    openingHours: {
      type: String,
      default: "09:00 AM - 09:00 PM"
    },
    logoUrl: {
      type: String,
      default: ""
    },
    coverImageUrl: {
      type: String,
      default: ""
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active"
    }
  },
  {
    timestamps: true
  }
);

// Index location field for geospatial queries
businessSchema.index({ location: "2dsphere" });
// Index name and category for text searching
businessSchema.index({ name: "text", category: "text" });

module.exports = mongoose.model("Business", businessSchema);
