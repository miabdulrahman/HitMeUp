const express = require("express");

const {
  claimVoucher,
  getMyVouchers,
  getVoucherById,
  previewVoucherByCode,
  redeemVoucher
} = require("../controllers/voucherController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Claim a flash deal voucher (decrements stock & generates QR voucher)
// POST /api/vouchers/claim
router.post("/claim", protect, claimVoucher);

// Get logged-in customer's vouchers
// GET /api/vouchers
router.get("/", protect, getMyVouchers);

// Preview/verify voucher by code (cashier scanning view)
// GET /api/vouchers/code/:code
router.get("/code/:code", protect, authorizeRoles("business", "admin", "seller"), previewVoucherByCode);

// Redeem voucher (restricted to business owners, sellers and admins)
// POST /api/vouchers/redeem
router.post("/redeem", protect, authorizeRoles("business", "admin", "seller"), redeemVoucher);

// Get single voucher by ID (customer view)
// GET /api/vouchers/:id
router.get("/:id", protect, getVoucherById);

module.exports = router;