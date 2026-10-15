const express = require("express");
const router = express.Router();
const {
  createDeal,
  getDeals,
  getDealById,
  getMyDeals,
  getDealsByBusiness,
  updateDeal,
  updateDealStatus,
  deleteDeal
} = require("../controllers/dealController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

// ----------------------------------------------------------------------
// Public Routes
// ----------------------------------------------------------------------
router.get("/", getDeals);
router.get("/business/:businessId", getDealsByBusiness);

// ----------------------------------------------------------------------
// Protected Business Deals Management (Member 2)
// (Placed before /:id to prevent route shadowing)
// ----------------------------------------------------------------------
router.get(
  "/business/my-deals",
  protect,
  authorizeRoles("business", "seller", "admin"),
  getMyDeals
);

// ----------------------------------------------------------------------
// Single Deal & Mutation Routes
// ----------------------------------------------------------------------
router.get("/:id", getDealById);

router.post(
  "/",
  protect,
  authorizeRoles("business", "seller", "admin"),
  createDeal
);

router.put(
  "/:id",
  protect,
  authorizeRoles("business", "seller", "admin"),
  updateDeal
);

router.patch(
  "/:id/status",
  protect,
  authorizeRoles("business", "seller", "admin"),
  updateDealStatus
);

router.delete(
  "/:id",
  protect,
  authorizeRoles("business", "seller", "admin"),
  deleteDeal
);

module.exports = router;
