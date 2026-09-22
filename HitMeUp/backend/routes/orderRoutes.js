const express = require("express");

const {
  createOrder,
  getMyOrders,
  getOrderById
} = require("../controllers/orderController");

// CHANGE THIS PATH IF YOUR TEAM'S AUTH MIDDLEWARE
// HAS A DIFFERENT FILE NAME.
const protect = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/orders
router.post("/", protect, createOrder);

// GET /api/orders
router.get("/", protect, getMyOrders);

// GET /api/orders/:id
router.get("/:id", protect, getOrderById);

module.exports = router;