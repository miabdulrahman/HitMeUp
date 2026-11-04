const express = require("express");
const {
  checkoutSession,
  processPayment,
  getTransactions,
  getTransactionById,
  resolveTransaction
} = require("../controllers/gatewayController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/gateway/checkout - Initialize / refresh checkout session
router.post("/checkout", protect, checkoutSession);

// POST /api/gateway/process - Idempotent simulated payment processing
router.post("/process", protect, processPayment);

// GET /api/gateway/transactions - Role-scoped transaction history
router.get("/transactions", protect, getTransactions);

// GET /api/gateway/transactions/:id - Transaction details
router.get("/transactions/:id", protect, getTransactionById);

// POST /api/gateway/transactions/:id/resolve - Resolve pending transaction
router.post("/transactions/:id/resolve", protect, resolveTransaction);

module.exports = router;
