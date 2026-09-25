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

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    console.log("Testing MongoDB DNS...");

    const records = await new Promise((resolve, reject) => {
      dns.resolveSrv(
        "_mongodb._tcp.hitmeup.qymkj5q.mongodb.net",
        (error, records) => {
          if (error) {
            reject(error);
          } else {
            resolve(records);
          }
        }
      );
    });

    console.log("DNS test successful:", records);

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    app.listen(PORT, () => {
      console.log(`HitMeUp running on port : ${PORT}`);
    });

  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

startServer();