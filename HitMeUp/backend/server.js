require("dotenv").config();

const dns = require("dns");
// Only configure DNS in local development; avoid overriding in cloud/Vercel serverless environments
if (!process.env.VERCEL) {
  try {
    dns.setServers(["8.8.8.8"]);
    console.log("DNS servers:", dns.getServers());
  } catch (e) {
    console.warn("DNS setServers notice:", e.message);
  }
}

console.log(
  "NVIDIA API KEY EXISTS:",
  !!process.env.NVIDIA_API_KEY
);

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

const airoutes = require("./routes/aiRoutes");
const dealRoutes = require("./routes/dealRoutes");
const authRoutes = require("./routes/authRoutes");
const businessRoutes = require("./routes/businessRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const voucherRoutes = require("./routes/voucherRoutes");

const app = express();

app.use(cors());
app.use(express.json());

// Reusable MongoDB connection for serverless (Vercel) & traditional servers
const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("MONGO_URI environment variable is missing or undefined");
  }

  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    throw error;
  }
};

// Database connection middleware for every request (MUST be before routes for Vercel)
app.use(async (req, res, next) => {
  // Allow simple root health check without forcing db connection wait
  if (req.path === "/") {
    return next();
  }

  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    message: "Welcome to HitMeUp API"
  });
});

// Member 1: Auth & Business Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);

app.use("/api/ai", airoutes);
// Deal routes
app.use("/api/deals", dealRoutes);
// Member 4: Orders, Payments & Vouchers
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/vouchers", voucherRoutes);

const PORT = process.env.PORT || 5000;

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