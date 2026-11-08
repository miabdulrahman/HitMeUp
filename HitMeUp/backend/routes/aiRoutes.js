const express = require("express");

const {
    generateDealController,
    recommendDealsController,
    detectFraudController,
    detectFoodSafetyController,
    generateTargetingController,
    generateInsightsController,
} = require("../controllers/aiController");

const {
    getAnalyticsController,
} = require("../controllers/analyticsController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { aiRateLimit, validateAIRequest } = require("../middleware/aiSecurity");

const router = express.Router();

router.use(protect, aiRateLimit);

router.post(
    "/generate-deal",
    authorizeRoles("business", "seller", "admin"),
    validateAIRequest("generate-deal"),
    generateDealController
);
router.post(
    "/recommend-deals",
    authorizeRoles("customer", "buyer", "business", "seller", "admin"),
    validateAIRequest("recommend-deals"),
    recommendDealsController
);
router.post(
    "/detect-fraud",
    authorizeRoles("business", "seller", "admin"),
    validateAIRequest("detect-fraud"),
    detectFraudController
);
router.post(
    "/food-safety",
    authorizeRoles("business", "seller", "admin"),
    validateAIRequest("food-safety"),
    detectFoodSafetyController
);
router.post(
    "/targeting",
    authorizeRoles("business", "seller", "admin"),
    validateAIRequest("targeting"),
    generateTargetingController
);
router.post(
    "/insights",
    authorizeRoles("business", "seller", "admin"),
    validateAIRequest("insights"),
    generateInsightsController
);
router.get(
    "/analytics",
    authorizeRoles("business", "seller", "admin"),
    getAnalyticsController
);

module.exports = router;
