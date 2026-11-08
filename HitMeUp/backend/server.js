const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });
require("dotenv").config();

const dns = require("dns");
// In local development, Windows/ISP DNS servers often fail to resolve MongoDB Atlas replica set shard hosts.
// Route through Google (8.8.8.8) and Cloudflare (1.1.1.1) with fallback for dns.lookup.
if (process.env.NODE_ENV !== "production" && !process.env.RENDER && !process.env.VERCEL) {
  try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
    const originalLookup = dns.lookup;
    dns.lookup = (hostname, options, callback) => {
      let cb = callback;
      let opts = options;
      if (typeof options === "function") {
        cb = options;
        opts = {};
      }
      originalLookup(hostname, opts, (err, address, family) => {
        if (err && (err.code === "ENOTFOUND" || err.code === "EAI_AGAIN")) {
          dns.resolve4(hostname, (resErr, addresses) => {
            if (!resErr && addresses && addresses.length > 0) {
              if (opts && opts.all) {
                return cb(null, addresses.map((a) => ({ address: a, family: 4 })));
              }
              return cb(null, addresses[0], 4);
            }
            return cb(err, address, family);
          });
        } else {
          return cb(err, address, family);
        }
      });
    };
    console.log("Local development DNS servers set to 8.8.8.8 / 1.1.1.1 with lookup fallback");
  } catch (e) {
    console.warn("DNS configuration notice:", e.message);
  }
}

console.log(
  "NVIDIA API KEY EXISTS:",
  !!process.env.NVIDIA_API_KEY
);

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { rateLimit } = require("express-rate-limit");
const mongoose = require("mongoose");

const airoutes = require("./routes/aiRoutes");
const dealRoutes = require("./routes/dealRoutes");
const authRoutes = require("./routes/authRoutes");
const businessRoutes = require("./routes/businessRoutes");
const orderRoutes = require("./routes/orderRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const gatewayRoutes = require("./routes/gatewayRoutes");
const voucherRoutes = require("./routes/voucherRoutes");
const discoveryRoutes = require("./routes/discoveryRoutes");
const uploadRoutes = require("./routes/uploadRoutes");
const adminRoutes = require("./routes/adminRoutes");

const app = express();

app.set("trust proxy", 1);
app.use(helmet());

const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  optionsSuccessStatus: 204
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: (req) => ["/", "/health", "/api/health"].includes(req.path),
  message: {
    success: false,
    message: "Too many requests. Please try again later."
  }
}));

// Keep normal API payloads small; the upload route adds its own 15 MB JSON parser.
const isUploadRequest = (req) =>
  req.path === "/api/upload" || req.path.startsWith("/api/upload/");

app.use((req, res, next) => {
  if (isUploadRequest(req)) return next();
  return express.json({ limit: "2mb" })(req, res, next);
});
app.use((req, res, next) => {
  if (isUploadRequest(req)) return next();
  return express.urlencoded({ extended: true, limit: "2mb" })(req, res, next);
});

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
    message: "Welcome to HitMeUp API",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    timestamp: new Date().toISOString()
  });
});

// Member 1: Auth & Business Endpoints
app.use("/api/auth", authRoutes);
app.use("/api/businesses", businessRoutes);

// Image Upload Endpoint (Cloudinary with WebP conversion)
app.use("/api/upload", uploadRoutes);

// AI routes
app.use("/api/ai", airoutes);

// Deal routes
app.use("/api/deals", dealRoutes);

// Member 4: Orders, Payments & Vouchers
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/gateway", gatewayRoutes);
app.use("/api/vouchers", voucherRoutes);

// Member 3: Deal Discovery, Location, Favorites & Reviews
app.use("/api/discovery", discoveryRoutes);

// Platform Administration Console (Admin RBAC enforced)
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Bind port first so cloud platforms (Render, Railway, etc.) detect health and don't drop traffic
  app.listen(PORT, () => {
    console.log(`HitMeUp running on port : ${PORT}`);
  });

  try {
    await connectDB();
  } catch (error) {
    console.error("Warning: Initial MongoDB connection failed. Will retry on incoming requests:", error.message);
  }
};

// Only listen directly when not running in a Vercel serverless environment
if (!process.env.VERCEL) {
  startServer();
}

module.exports = app;
