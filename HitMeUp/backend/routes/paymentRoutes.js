const express = require("express");
const {
  getMyPayments,
  getAllPayments,
  getPaymentById,
  refundPayment,
  getDashboardSummary,
  getReceipt,
  createPayment,
  verifyPayment,
  paymentWebhook
} = require("../controllers/paymentController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// GET /api/payments/dashboard/summary - MongoDB analytics metrics
router.get("/dashboard/summary", protect, getDashboardSummary);

// GET /api/payments/my-payments - Authenticated customer's payments
router.get("/my-payments", protect, getMyPayments);

// GET /api/payments - Role-scoped payments list (Seller/Admin)
router.get("/", protect, authorizeRoles("business", "seller", "admin"), getAllPayments);

// Backward-compatible create / verify / webhook
router.post("/create", protect, createPayment);
router.post("/verify", protect, verifyPayment);
router.post("/webhook", paymentWebhook);

// GET /api/payments/:id/receipt - Formatted receipt
router.get("/:id/receipt", protect, getReceipt);

// POST /api/payments/:id/refund - Simulated refund endpoint
router.post(
  "/:id/refund",
  protect,
  authorizeRoles("business", "seller", "admin"),
  refundPayment
);

// GET /api/payments/:id - Single payment record
router.get("/:id", protect, getPaymentById);

module.exports = router;
