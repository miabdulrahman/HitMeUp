const Deal = require("../models/Deal");

const createDeal = async (req, res) => {
  try {
    const {
      title,
      description,
      businessId,
      originalPrice,
      discountPercentage,
      discountedPrice,
      startDate,
      endDate
    } = req.body;

    const deal = new Deal({
      title,
      description,
      businessId,
      originalPrice,
      discountPercentage,
      discountedPrice,
      startDate,
      endDate
    });

    const savedDeal = await deal.save();

    res.status(201).json({
      message: "Deal created successfully",
      deal: savedDeal
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create deal",
      error: error.message
    });
  }
};

module.exports = {
  createDeal
};