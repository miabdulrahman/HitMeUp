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

const router = express.Router();

router.post("/generate-deal", generateDealController);
router.post("/recommend-deals", recommendDealsController);
router.post("/detect-fraud", detectFraudController);
router.post("/food-safety", detectFoodSafetyController);
router.post("/targeting", generateTargetingController);
router.post("/insights",generateInsightsController);
router.get("/analytics", getAnalyticsController);

module.exports = router;