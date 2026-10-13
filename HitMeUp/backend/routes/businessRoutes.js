const express = require("express");
const {
  createBusinessProfile,
  getMyBusiness,
  updateMyBusiness,
  getBusinessById,
  getAllBusinesses
} = require("../controllers/businessController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// Public routes for all users and downstream modules
router.get("/", getAllBusinesses);
router.get("/:id", getBusinessById);

// Protected routes for business owners and administrators
router.post("/", protect, authorizeRoles("seller", "admin"), createBusinessProfile);
router.get("/my-business", protect, authorizeRoles("seller", "admin"), getMyBusiness);
router.put("/my-business", protect, authorizeRoles("seller", "admin"), updateMyBusiness);

module.exports = router;
