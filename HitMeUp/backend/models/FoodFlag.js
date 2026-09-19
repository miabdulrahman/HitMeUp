const mongoose = require("mongoose");

const foodFlagSchema = new mongoose.Schema({
    dealId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Deal",
        required: false,
    },

    productName: {
        type: String,
        required: true,
    },

    isFood: {
        type: Boolean,
        required: true,
    },

    isPotentiallyUnsafe: {
        type: Boolean,
        required: true,
    },

    riskLevel: {
        type: String,
        enum: ["low", "medium", "large"],
        required: true,
    },

    reason: {
        type: String,
        required: true,
    },

    recommendations: {
        type: [String],
        default: [],
    },
},
    {
        timestamps:true,
    }
)

module.exports = mongoose.model("FoodFlag", foodFlagSchema);