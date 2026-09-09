const mongoose = require("mongoose")
const connectDB = async () => {
    try{
        await mongoose.connect(process.env.MONGO_URI)
        console.log("mongoDb connected");
    }catch(error){
        console.log("MongoDb connection faild", error.message);
        process.exit(1)
    }
}

module.exports = connectDB;