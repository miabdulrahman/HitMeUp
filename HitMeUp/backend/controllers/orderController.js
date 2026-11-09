const mongoose = require("mongoose");
const crypto = require("crypto");
const Order = require("../models/Order");
const Deal = require("../models/Deal");
const Business = require("../models/Business");

function generateOrderNumber() {
  const random = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `HMU-ORD-${Date.now().toString(36).toUpperCase()}-${random}`;
}

const ORDER_TTL_MINUTES = Number(process.env.ORDER_TTL_MINUTES || 15);
const PAYMENT_FEE_PERCENT = Number(process.env.PAYMENT_FEE_PERCENT || 0);

// CREATE ORDER (With Atomic Stock Reservation & Deal Snapshot)
const createOrder = async (req, res) => {
  try {
    const customerId = req.user._id || req.user.id;
    const { dealId, quantity: requestedQty } = req.body;
    const quantity = Math.max(1, Number(requestedQty) || 1);

    if (!dealId) {
      return res.status(400).json({
        success: false,
        message: "Deal ID is required"
      });
    }

    if (!mongoose.Types.ObjectId.isValid(dealId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Deal ID format"
      });
    }

    const deal = await Deal.findById(dealId).populate("businessId", "name");
    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found"
      });
    }

    const now = new Date();

    // Check deal status and dates
    if (
      deal.status !== "active" ||
      (deal.startDate && deal.startDate > now) ||
      (deal.endDate && deal.endDate <= now)
    ) {
      return res.status(400).json({
        success: false,
        message: "This deal is no longer active or has expired"
      });
    }

    // Server-computed pricing from trusted DB Deal
    const unitPrice = Number(deal.discountedPrice ?? deal.originalPrice ?? 0);
    if (!Number.isFinite(unitPrice) || unitPrice < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid deal pricing in database"
      });
    }

    const subtotal = Number((unitPrice * quantity).toFixed(2));
    const fees = Number(((subtotal * PAYMENT_FEE_PERCENT) / 100).toFixed(2));
    const totalAmount = Number((subtotal + fees).toFixed(2));

    // Atomically reserve inventory
    const updatedDeal = await Deal.findOneAndUpdate(
      {
        _id: dealId,
        status: "active",
        availableQuantity: { $gte: quantity }
      },
      {
        $inc: { availableQuantity: -quantity }
      },
      { new: true }
    ).populate("businessId", "name");

    if (!updatedDeal) {
      return res.status(409).json({
        success: false,
        message: "Deal is unavailable or insufficient stock remaining"
      });
    }

    // Determine 15-minute checkout expiration window (bounded by deal endDate)
    const orderTtlDate = new Date(Date.now() + ORDER_TTL_MINUTES * 60 * 1000);
    const dealEndDate = updatedDeal.endDate ? new Date(updatedDeal.endDate) : null;
    const expiresAt = dealEndDate && dealEndDate < orderTtlDate ? dealEndDate : orderTtlDate;

    // Snapshot merchant name
    const merchantName =
      updatedDeal.businessId?.name || "HitMeUp Merchant Partner";

    const order = await Order.create({
      orderNumber: generateOrderNumber(),
      customerId,
      dealId: updatedDeal._id,
      businessId: updatedDeal.businessId?._id || updatedDeal.businessId,
      quantity,
      unitPrice,
      subtotal,
      fees,
      totalAmount,
      amount: totalAmount,
      currency: "LKR",
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      dealSnapshot: {
        title: updatedDeal.title,
        imageUrl: updatedDeal.imageUrl,
        merchantName,
        category: updatedDeal.category || "General"
      },
      expiresAt,
      inventoryReserved: true,
      inventoryReleased: false
    });

    return res.status(201).json({
      success: true,
      message: "Order created successfully. Stock reserved for checkout.",
      data: order,
      order
    });
  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
};

// GET CUSTOMER ORDERS
const getMyOrders = async (req, res) => {
  try {
    const customerId = req.user._id || req.user.id;

    const orders = await Order.find({ customerId })
      .populate("dealId")
      .populate("paymentId")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
      orders
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

    const order = await Order.findById(req.params.id)
      .populate("dealId")
      .populate("paymentId");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    // Role check: customer must own the order unless business/admin
    if (
      req.user.role !== "admin" &&
      String(order.customerId) !== String(customerId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to view this order"
      });
    }

    // Check expiry
    if (
      (order.status === "PENDING" || order.orderStatus === "PENDING") &&
      order.expiresAt &&
      new Date() > order.expiresAt
    ) {
      order.status = "EXPIRED";
      order.orderStatus = "EXPIRED";
      if (order.inventoryReserved && !order.inventoryReleased) {
        await Deal.updateOne(
          { _id: order.dealId },
          { $inc: { availableQuantity: order.quantity || 1 } }
        );
        order.inventoryReleased = true;
      }
      await order.save();
    }

    return res.status(200).json({
      success: true,
      data: order,
      order
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

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    if (
      req.user.role !== "admin" &&
      String(order.customerId) !== String(customerId)
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to cancel this order"
      });
    }

    if (order.status !== "PENDING" && order.orderStatus !== "PENDING") {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order with status: ${order.status}`
      });
    }

    order.status = "CANCELLED";
    order.orderStatus = "CANCELLED";

    // Atomically release reserved inventory
    if (order.inventoryReserved && !order.inventoryReleased) {
      await Deal.updateOne(
        { _id: order.dealId },
        { $inc: { availableQuantity: order.quantity || 1 } }
      );
      order.inventoryReleased = true;
    }

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order cancelled successfully and reserved stock released",
      data: order,
      order
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
    let businessId = req.user.businessId;

    if (!businessId) {
      const business = await Business.findOne({ ownerId: req.user._id });
      if (business) {
        businessId = business._id;
      }
    }

    if (!businessId) {
      return res.status(200).json({
        success: true,
        count: 0,
        totalRevenue: 0,
        data: []
      });
    }

    const businessDeals = await Deal.find({ businessId }, "_id title discountedPrice");
    const dealIds = businessDeals.map((d) => d._id);

    const orders = await Order.find({ dealId: { $in: dealIds } })
      .populate("customerId", "name email phone")
      .populate("dealId", "title discountedPrice")
      .sort({ createdAt: -1 });

    const totalRevenue = orders
      .filter((o) => o.status === "PAID" || o.orderStatus === "PAID" || o.status === "COMPLETED")
      .reduce((sum, o) => sum + (o.totalAmount || o.amount || 0), 0);

    return res.status(200).json({
      success: true,
      count: orders.length,
      totalRevenue,
      data: orders,
      orders
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
