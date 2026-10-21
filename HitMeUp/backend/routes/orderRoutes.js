const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getBusinessOrders
} = require("../controllers/orderController");

const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/orders - Create new order
router.post("/", protect, createOrder);

// GET /api/orders - Get customer orders
router.get("/", protect, getMyOrders);

// GET /api/orders/business - Get business owner's orders & revenue analytics
router.get("/business", protect, authorizeRoles("business", "admin"), getBusinessOrders);

// GET /api/orders/:id - Get single order details
router.get("/:id", protect, getOrderById);

// PUT /api/orders/:id/cancel - Cancel pending order
router.put("/:id/cancel", protect, cancelOrder);

module.exports = router;