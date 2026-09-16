const mongoose = require("mongoose");

const aiActivityLogSchema = new mongoose.Schema({
    feature: {
        type: String,
        required: true,
    },

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: false,
    },

    input: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },
    output: {
        type: mongoose.Schema.Types.Mixed,
        required: true,
    },

    status: {
        type: String,
        enum: ["success", "Failed"],
        default: "success",
    },

    errorMessage: {
        type: String,
        default: null,
    },
},
    {
        timestamps: true,
    });

module.exports = mongoose.model(
    "AIActivityLog",
    aiActivityLogSchema
)

