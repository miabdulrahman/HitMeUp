const dns = require("dns");

// Force Node.js to use Google DNS
dns.setServers(["8.8.8.8"]);

console.log("DNS servers:", dns.getServers());

require("dotenv").config();

console.log(
  "NVIDIA API KEY EXISTS:",
  !!process.env.NVIDIA_API_KEY
);

const airoutes = require("./routes/aiRoutes")
//deal added
const dealRoutes = require("./routes/dealRoutes");
// Member 1: User & Business Management
const authRoutes = require("./routes/authRoutes");
const businessRoutes = require("./routes/businessRoutes");
// Member 4: Orders, Payments & Vouchers
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const voucherRoutes = require("./routes/voucherRoutes");

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const app = express();


app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to HitMeUp API"
  });
});

// Member 1: Auth & Business Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);

app.use("/api/ai", airoutes)
//deal added
app.use("/api/deals", dealRoutes);
// Member 4: Orders, Payments & Vouchers
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/vouchers", voucherRoutes);

const PORT = process.env.PORT || 5000;

// Reusable MongoDB connection for serverless (Vercel) & traditional servers
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  try {
    if (!process.env.VERCEL) {
      // In local node environment, test DNS
      try {
        await new Promise((resolve, reject) => {
          dns.resolveSrv(
            "_mongodb._tcp.hitmeup.qymkj5q.mongodb.net",
            (error, records) => {
              if (error) reject(error);
              else resolve(records);
            }
          );
        });
      } catch (dnsErr) {
        console.warn("MongoDB DNS check notice:", dnsErr.message);
      }
    }

    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};

// Database connection middleware for serverless requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message
    });
  }
});

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`HitMeUp running on port : ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error);
    process.exit(1);
  }
};

// Only listen directly when not running in a Vercel serverless environment
if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;