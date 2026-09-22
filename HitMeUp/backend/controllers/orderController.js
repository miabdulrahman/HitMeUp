const axios = require("axios");
const crypto = require("crypto");

const Order = require("../models/Order");

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
      `${DEAL_SERVICE_URL}/${dealId}`
    );

    return response.data.data || response.data.deal || response.data;
  } catch (error) {
    throw new Error("Unable to retrieve deal information");
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
    const customerId = req.user._id;

    const order = await Order.findOne({
      _id: req.params.id,
      customerId
    }).populate("dealId");

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

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById
};