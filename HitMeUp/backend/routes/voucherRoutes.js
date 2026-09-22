const express = require("express");

const {
  getMyVouchers,
  getVoucherById,
  redeemVoucher
} = require("../controllers/voucherController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Get logged-in customer's vouchers
// GET /api/vouchers
router.get("/", protect, getMyVouchers);

// Redeem voucher
// POST /api/vouchers/redeem
router.post("/redeem", protect, redeemVoucher);

// Get single voucher
// GET /api/vouchers/:id
router.get("/:id", protect, getVoucherById);

module.exports = router;