const express = require("express");

const {
    generateDealController,
    recommendDealController,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/generate-deal", generateDealController);
router.post("/recommend-deals", recommendDealController);

module.exports = router;