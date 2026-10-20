const express = require("express");

const {
  claimVoucher,
  getMyVouchers,
  getVoucherById,
  redeemVoucher
} = require("../controllers/voucherController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

// Claim a flash deal voucher (decrements stock & generates QR voucher)
// POST /api/vouchers/claim
router.post("/claim", protect, claimVoucher);

// Get logged-in customer's vouchers
// GET /api/vouchers
router.get("/", protect, getMyVouchers);

// Redeem voucher (POS merchant check)
// POST /api/vouchers/redeem
router.post("/redeem", protect, redeemVoucher);

// Get single voucher
// GET /api/vouchers/:id
router.get("/:id", protect, getVoucherById);

module.exports = router;