const express = require("express");
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  sendOtp,
  verifyOtp,
  resetPassword
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const {
  loginRateLimit,
  registerRateLimit,
  otpSendRateLimit,
  otpVerifyRateLimit,
  passwordResetRateLimit
} = require("../middleware/authRateLimit");

const { googleLogin } = require("../controllers/googleAuthController");

const router = express.Router();

// Public Authentication & OTP Endpoints
router.post("/register", registerRateLimit, register);
router.post("/login", loginRateLimit, login);
router.post("/google", loginRateLimit, googleLogin);
router.post("/send-otp", otpSendRateLimit, sendOtp);
router.post("/verify-otp", otpVerifyRateLimit, verifyOtp);
router.post("/reset-password", passwordResetRateLimit, resetPassword);

// Protected routes (any authenticated user: customer, business, admin)
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;
