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

// POST /api/orders - Create new order with inventory reservation
router.post("/", protect, createOrder);

// GET /api/orders and GET /api/orders/my-orders - Get customer orders
router.get("/", protect, getMyOrders);
router.get("/my-orders", protect, getMyOrders);

// GET /api/orders/business - Get business owner's orders & revenue analytics
router.get("/business", protect, authorizeRoles("business", "admin"), getBusinessOrders);

// GET /api/orders/:id - Get single order details
router.get("/:id", protect, getOrderById);

// Cancel pending order (both POST and PUT supported)
router.post("/:id/cancel", protect, cancelOrder);
router.put("/:id/cancel", protect, cancelOrder);

module.exports = router;
