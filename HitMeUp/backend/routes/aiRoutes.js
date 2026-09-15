const express = require("express");

const {
    generateDealController,
    recommendDealsController,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/generate-deal", generateDealController);
router.post("/recommend-deals", recommendDealsController);

module.exports = router;