require("dotenv").config();
const dns = require("dns");

if (!process.env.VERCEL) {
  try {
    dns.setServers(["8.8.8.8"]);
  } catch {
    // ignore DNS override notice
  }
}

const mongoose = require("mongoose");
const User = require("../models/user");

const seedAdmin = async () => {
  if (!process.env.MONGO_URI) {
    console.error("MONGO_URI is required in backend/.env to seed an admin account.");
    process.exit(1);
  }

  const email = (process.env.ADMIN_EMAIL || "admin@hitmeup.com").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME || "Platform Administrator";

  if (!password || password.length < 12) {
    throw new Error("ADMIN_PASSWORD must be provided and contain at least 12 characters.");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000
  });

  let admin = await User.findOne({ email });
  if (admin) {
    if (admin.role !== "admin" || !admin.isActive) {
      admin.role = "admin";
      admin.isActive = true;
      await admin.save();
      console.log(`Updated existing account (${email}) to active admin role.`);
    } else {
      console.log(`Admin account already exists and is active: ${email}`);
    }
  } else {
    admin = await User.create({
      name,
      email,
      password,
      role: "admin",
      phone: "+94 11 234 5678",
      isActive: true
    });
    console.log(`Created Platform Admin account: ${email}`);
  }

  await mongoose.disconnect();
};

seedAdmin().catch((err) => {
  console.error("Admin seed error:", err.message);
  process.exit(1);
});

