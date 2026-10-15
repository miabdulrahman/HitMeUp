const express = require("express");
const router = express.Router();
const {
  createDeal,
  getDeals,
  getDealById
} = require("../controllers/dealController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// Public deal routes
router.get("/", getDeals);
router.get("/:id", getDealById);

// Protected deal creation for business owners and admins
router.post("/", protect, authorizeRoles("business", "admin"), createDeal);

module.exports = router;

