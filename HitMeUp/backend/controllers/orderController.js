const mongoose = require("mongoose");
const axios = require("axios");
const crypto = require("crypto");

const Order = require("../models/Order");
const Deal = require("../models/Deal");

const DEAL_SERVICE_URL =
  process.env.DEAL_SERVICE_URL ||
  "http://localhost:5000/api/deals";

function generateOrderNumber() {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();

  return `HMU-${Date.now()}-${random}`;
}

async function getDeal(dealId) {
  try {
    const response = await axios.get(
      `${DEAL_SERVICE_URL}/${dealId}`,
      { timeout: 1500 }
    );

    return (
      response.data.deal ||
      response.data.data ||
      response.data
    );

  } catch (error) {
    // Fallback: If Deal API route is not yet deployed by Member 2,
    // read directly from Deal database model to allow independent testing
    try {
      const dealFromDb = await Deal.findById(dealId);
      if (dealFromDb) {
        return dealFromDb;
      }
    } catch (err) {
      // Ignore format errors
    }

    if (error.response?.status === 404) {
      return null;
    }

    return null;
  }
}


// CREATE ORDER
const createOrder = async (req, res) => {
  try {
    const customerId = req.user._id;
    const { dealId } = req.body;

    if (!dealId) {
      return res.status(400).json({
        success: false,
        message: "Deal ID is required"
      });
    }

    const deal = await getDeal(dealId);

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found"
      });
    }

    // Check deal status
    if (
      deal.status &&
      deal.status.toUpperCase() !== "ACTIVE"
    ) {
      return res.status(400).json({
        success: false,
        message: "This deal is not currently active"
      });
    }

    // Find the selling price
    const amount =
      deal.discountedPrice ??
      deal.salePrice ??
      deal.price;

    if (amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: "Deal price is not available"
      });
    }

    let expiresAt = null;

    if (deal.expiresAt) {
      expiresAt = new Date(deal.expiresAt);
    } else if (deal.endDate) {
      expiresAt = new Date(deal.endDate);
    }

    // Check expiry
    if (expiresAt && expiresAt <= new Date()) {
      return res.status(400).json({
        success: false,
        message: "This deal has expired"
      });
    }

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customerId,
      dealId,
      amount,
      currency: "LKR",
      status: "PENDING",
      expiresAt
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully",
      data: order
    });
  } catch (error) {
    console.error("Create Order Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order"
    });
  }
};

// GET CUSTOMER ORDERS
const getMyOrders = async (req, res) => {
  try {
    const customerId = req.user._id;

    const orders = await Order.find({ customerId })
      .populate("dealId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error("Get Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get orders"
    });
  }
};

// GET SINGLE ORDER
const getOrderById = async (req, res) => {
  try {
    const customerId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID format"
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      customerId
    })
      .populate("dealId")
      .populate("paymentId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    console.error("Get Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get order"
    });
  }
};

// CANCEL PENDING ORDER
const cancelOrder = async (req, res) => {
  try {
    const customerId = req.user._id || req.user.id;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID format"
      });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      customerId
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (order.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status: ${order.status}`
      });
    }

    order.status = "CANCELLED";
    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      data: order
    });
  } catch (error) {
    console.error("Cancel Order Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to cancel order"
    });
  }
};

// GET ORDERS FOR BUSINESS (Business Owner View)
const getBusinessOrders = async (req, res) => {
  try {
    const businessId = req.user.businessId;

    if (!businessId) {
      return res.status(403).json({
        success: false,
        message: "No business profile associated with this account"
      });
    }

    // Find all deals belonging to this business
    const businessDeals = await Deal.find({ businessId }, "_id title discountedPrice");
    const dealIds = businessDeals.map(d => d._id);

    const orders = await Order.find({ dealId: { $in: dealIds } })
      .populate("customerId", "name email phone")
      .populate("dealId", "title discountedPrice")
      .sort({ createdAt: -1 });

    const totalRevenue = orders
      .filter(o => o.status === "PAID" || o.status === "COMPLETED")
      .reduce((sum, o) => sum + (o.amount || 0), 0);

    return res.status(200).json({
      success: true,
      count: orders.length,
      totalRevenue,
      data: orders
    });
  } catch (error) {
    console.error("Get Business Orders Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve business orders"
    });
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getBusinessOrders
};