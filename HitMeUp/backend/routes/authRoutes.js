const express = require("express");
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

const {googleLogin} = require("../controllers/googleAuthController")

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/google", googleLogin);

// Protected routes (any authenticated user: customer, business, admin)
router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

module.exports = router;
