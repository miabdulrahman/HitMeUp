const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  getOverview,
  getSellerApplications,
  getSellerApplicationById,
  markApplicationUnderReview,
  approveSellerApplication,
  rejectSellerApplication,
  getSellers,
  getSellerById,
  suspendSeller,
  reactivateSeller,
  getCustomers,
  getCustomerById,
  updateCustomerStatus,
  getAdminDeals,
  getAdminDealById,
  updateAdminDealStatus,
  getAdminOrders,
  getAdminAnalytics,
  getActivityLogs,
  getPlatformSettings,
  updatePlatformSettings
} = require("../controllers/adminController");

const router = express.Router();

// Enforce authenticated platform administrator access across all /api/admin endpoints
router.use(protect, authorizeRoles("admin"));

// Overview
router.get("/overview", getOverview);

// Seller Applications
router.get("/applications", getSellerApplications);
router.get("/applications/:id", getSellerApplicationById);
router.patch("/applications/:id/review", markApplicationUnderReview);
router.patch("/applications/:id/approve", approveSellerApplication);
router.patch("/applications/:id/reject", rejectSellerApplication);

// Sellers
router.get("/sellers", getSellers);
router.get("/sellers/:id", getSellerById);
router.patch("/sellers/:id/suspend", suspendSeller);
router.patch("/sellers/:id/reactivate", reactivateSeller);

// Customers
router.get("/customers", getCustomers);
router.get("/customers/:id", getCustomerById);
router.patch("/customers/:id/status", updateCustomerStatus);

// Deals
router.get("/deals", getAdminDeals);
router.get("/deals/:id", getAdminDealById);
router.patch("/deals/:id/status", updateAdminDealStatus);

// Orders & Transactions
router.get("/orders", getAdminOrders);

// Analytics
router.get("/analytics", getAdminAnalytics);

// Activity Logs
router.get("/activity-logs", getActivityLogs);

// Settings
router.get("/settings", getPlatformSettings);
router.put("/settings", updatePlatformSettings);

module.exports = router;

