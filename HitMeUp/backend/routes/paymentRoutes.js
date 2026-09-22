const express = require("express");

const {
  createPayment,
  verifyPayment,
  paymentWebhook,
  getPaymentById
} = require("../controllers/paymentController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Create payment
// POST /api/payments/create
router.post("/create", protect, createPayment);

// Verify payment
// POST /api/payments/verify
router.post("/verify", protect, verifyPayment);

// Payment gateway callback/webhook
// POST /api/payments/webhook
//
// This normally should NOT use normal user authentication.
// The real gateway should authenticate its own webhook.
router.post("/webhook", paymentWebhook);

// Get payment
// GET /api/payments/:id
router.get("/:id", protect, getPaymentById);

module.exports = router;