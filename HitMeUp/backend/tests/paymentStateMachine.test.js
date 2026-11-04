const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  PaymentStatus,
  canTransition,
  validateTransition
} = require("../services/paymentStateMachine");

describe("Payment State Machine Tests", () => {
  test("allows valid transitions through payment lifecycle", () => {
    // PENDING -> PROCESSING
    assert.strictEqual(canTransition(PaymentStatus.PENDING, PaymentStatus.PROCESSING), true);
    // PROCESSING -> SUCCESS
    assert.strictEqual(canTransition(PaymentStatus.PROCESSING, PaymentStatus.SUCCESS), true);
    // SUCCESS -> REFUNDED
    assert.strictEqual(canTransition(PaymentStatus.SUCCESS, PaymentStatus.REFUNDED), true);
    // PENDING -> CANCELLED
    assert.strictEqual(canTransition(PaymentStatus.PENDING, PaymentStatus.CANCELLED), true);
    // PROCESSING -> FAILED
    assert.strictEqual(canTransition(PaymentStatus.PROCESSING, PaymentStatus.FAILED), true);
    // PROCESSING -> PENDING (external delay)
    assert.strictEqual(canTransition(PaymentStatus.PROCESSING, PaymentStatus.PENDING), true);
  });

  test("allows idempotent no-op transitions", () => {
    assert.strictEqual(canTransition(PaymentStatus.SUCCESS, PaymentStatus.SUCCESS), true);
    assert.strictEqual(canTransition(PaymentStatus.PENDING, PaymentStatus.PENDING), true);
    assert.strictEqual(canTransition(PaymentStatus.FAILED, PaymentStatus.FAILED), true);
  });

  test("rejects invalid transitions and throws descriptive 409 error", () => {
    // Cannot transition from SUCCESS directly to FAILED
    assert.strictEqual(canTransition(PaymentStatus.SUCCESS, PaymentStatus.FAILED), false);
    assert.throws(
      () => validateTransition(PaymentStatus.SUCCESS, PaymentStatus.FAILED),
      (err) => err.statusCode === 409 && err.message.includes("Illegal payment status transition")
    );

    // Terminal states cannot transition to other states
    assert.strictEqual(canTransition(PaymentStatus.FAILED, PaymentStatus.SUCCESS), false);
    assert.strictEqual(canTransition(PaymentStatus.CANCELLED, PaymentStatus.PROCESSING), false);
    assert.strictEqual(canTransition(PaymentStatus.REFUNDED, PaymentStatus.SUCCESS), false);

    assert.throws(
      () => validateTransition(PaymentStatus.REFUNDED, PaymentStatus.SUCCESS),
      (err) => err.statusCode === 409
    );
  });
});
