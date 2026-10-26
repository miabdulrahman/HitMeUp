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

// Public routes
router.get("/", getAllBusinesses);

// Protected routes for business owners (MUST come before /:id to avoid shadowing)
router.post("/", protect, authorizeRoles("seller", "admin"), createBusinessProfile);
router.get("/my-business", protect, authorizeRoles("seller", "admin"), getMyBusiness);
router.put("/my-business", protect, authorizeRoles("seller", "admin"), updateMyBusiness);

// Public wildcard param route (after named routes)
router.get("/:id", getBusinessById);

module.exports = router;
