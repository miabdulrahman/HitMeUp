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

const getDeals = async (req, res) => {
  try {
    const { category, search, status } = req.query;
    const query = {};
    if (status) {
      query.status = status;
    }
    const deals = await Deal.find(query).sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: deals.length,
      deals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch deals",
      error: error.message
    });
  }
};

const getDealById = async (req, res) => {
  try {
    const deal = await Deal.findById(req.params.id);
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found"
      });
    }
    res.status(200).json({
      success: true,
      deal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch deal",
      error: error.message
    });
  }
};

module.exports = {
  createDeal,
  getDeals,
  getDealById
};