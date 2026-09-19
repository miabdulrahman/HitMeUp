const express = require("express");

const {
    generateDealController,
    recommendDealsController,
    detectFraudController,
    detectFraudController,
    detectFoodSafetyController,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/generate-deal", generateDealController);
router.post("/recommend-deals", recommendDealsController);
router.post("/detect-fraud", detectFraudController);
router.post("/detect-foodsafety", detectFoodSafetyController)

module.exports = router;