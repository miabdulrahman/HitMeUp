const express = require("express");
const router = express.Router();
const {
  searchDeals,
  getNearbyDeals,
  getMapBusinesses,
  getDealDiscoveryDetails,
  toggleFavorite,
  getMyFavorites,
  addReview,
  getBusinessReviews
} = require("../controllers/discoveryController");
const { protect, optionalAuth } = require("../middleware/authMiddleware");

/**
 * Deal Discovery & Location Routes - Member 3
 */

// Public / Optionally Authenticated Discovery Routes
router.get("/deals", optionalAuth, searchDeals);
router.get("/nearby", optionalAuth, getNearbyDeals);
router.get("/map", getMapBusinesses);
router.get("/deal/:id", optionalAuth, getDealDiscoveryDetails);

// Reviews (Public Reading)
router.get("/reviews/business/:businessId", getBusinessReviews);

// Protected Customer Features (Requires Login)
router.get("/favorites", protect, getMyFavorites);
router.post("/favorites/:dealId", protect, toggleFavorite);
router.delete("/favorites/:dealId", protect, toggleFavorite);
router.post("/reviews", protect, addReview);

module.exports = router;
