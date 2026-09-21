const express = require("express");

const {
    generateDealController,
    recommendDealsController,
    detectFraudController,
    detectFoodSafetyController,
    generateTargetingController,
    generateInsightsController,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/generate-deal", generateDealController);
router.post("/recommend-deals", recommendDealsController);
router.post("/detect-fraud", detectFraudController);
router.post("/food-safety", detectFoodSafetyController);
router.post("/targeting", generateTargetingController);
router.post("/insights",generateInsightsController);

module.exports = router;