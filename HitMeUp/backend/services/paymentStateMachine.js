/**
 * Payment State Machine
 * Centralizes all valid payment and order status transitions.
 * Prevents invalid state mutations across all services.
 */

const PaymentStatus = Object.freeze({
  PENDING: "PENDING",
  PROCESSING: "PROCESSING",
  SUCCESS: "SUCCESS",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
  REFUNDED: "REFUNDED"
});

const AllowedTransitions = Object.freeze({
  [PaymentStatus.PENDING]: [
    PaymentStatus.PROCESSING,
    PaymentStatus.CANCELLED,
    PaymentStatus.FAILED
  ],
  [PaymentStatus.PROCESSING]: [
    PaymentStatus.SUCCESS,
    PaymentStatus.FAILED,
    PaymentStatus.PENDING,
    PaymentStatus.CANCELLED
  ],
  [PaymentStatus.SUCCESS]: [PaymentStatus.REFUNDED],
  [PaymentStatus.FAILED]: [], // Terminal; retry creates a new payment attempt
  [PaymentStatus.CANCELLED]: [], // Terminal
  [PaymentStatus.REFUNDED]: [] // Terminal
});

/**
 * Check whether transitioning from currentStatus to nextStatus is permissible
 */
function canTransition(currentStatus, nextStatus) {
  if (!currentStatus || !nextStatus) return false;
  if (currentStatus === nextStatus) return true; // idempotent no-op
  const allowed = AllowedTransitions[currentStatus];
  return Array.isArray(allowed) && allowed.includes(nextStatus);
}

/**
 * Validate status transition and throw descriptive error if illegal
 */
function validateTransition(currentStatus, nextStatus) {
  if (!canTransition(currentStatus, nextStatus)) {
    const error = new Error(
      `Illegal payment status transition from '${currentStatus}' to '${nextStatus}'.`
    );
    error.statusCode = 409;
    throw error;
  }
}

module.exports = {
  PaymentStatus,
  AllowedTransitions,
  canTransition,
  validateTransition
};
