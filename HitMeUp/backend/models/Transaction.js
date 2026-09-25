const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true,
    },

    dealId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Deal",
        required:true,
    },

    amount:{
        type:Number,
        required:true,
    },
    status:{
        type:String,
        enum:["Pending", "Completed", "Failed", "Cancelled"],
        default:"pending",
    }
},
    {
        timestamps:true,
    }
);

module.exports = mongoose.model("Transaction", transactionSchema);