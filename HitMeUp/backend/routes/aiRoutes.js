const express = require("express");

const {
    generateDealController,
    recommendDealsController,
    detectFraudController,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/generate-deal", generateDealController);
router.post("/recommend-deals", recommendDealsController);
router.post("/detect-fraud", detectFraudController);

module.exports = router;