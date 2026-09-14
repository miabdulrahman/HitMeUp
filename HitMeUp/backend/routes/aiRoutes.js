const express = require("express");

const {
    generateDealController,
} = require("../controllers/aiController");

const router = express.Router();

router.post("/generate-deal", generateDealController);

module.exports = router;