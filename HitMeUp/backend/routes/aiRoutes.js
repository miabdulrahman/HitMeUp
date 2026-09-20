const express = require("express");

const {
    generateDealController,
    recommendDealsController,
    detectFraudController,
    detectFoodSafetyController,
    generateTarget,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/generate-deal", generateDealController);
router.post("/recommend-deals", recommendDealsController);
router.post("/detect-fraud", detectFraudController);
router.post("/food-safety", detectFoodSafetyController);
router.post("/targeting", generateTarget);

module.exports = router;