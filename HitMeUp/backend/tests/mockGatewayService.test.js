process.env.NODE_ENV = "test";
process.env.SIMULATED_PROCESSING_DELAY_MS = "0";

const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  ResponseCodes,
  generateTransactionId,
  signPayload,
  verifyPayloadSignature,
  processSimulatedPayment
} = require("../services/mockGatewayService");

describe("Mock Gateway Service & Signature Tests", () => {
  test("generates properly formatted transaction IDs", () => {
    const txnId = generateTransactionId();
    assert.match(txnId, /^HMP-\d{8}-[A-F0-9]{8}$/);
  });

  test("generates and verifies HMAC-SHA256 signature", () => {
    const payload = {
      transactionId: "HMP-20261105-ABCD1234",
      orderId: "67cb1a2b3c4d5e6f7a8b9c0d",
      amount: 2500,
      currency: "LKR",
      responseCode: "00",
      status: "SUCCESS",
      timestamp: "2026-11-05T00:00:00.000Z"
    };

    const signature = signPayload(payload);
    assert.ok(signature && signature.length === 64);

    // Verify valid signature
    const isValid = verifyPayloadSignature(payload, signature);
    assert.strictEqual(isValid, true);

    // Reject tampered amount
    const tamperedPayload = { ...payload, amount: 999999 };
    assert.strictEqual(verifyPayloadSignature(tamperedPayload, signature), false);

    // Reject invalid signature
    assert.strictEqual(verifyPayloadSignature(payload, "invalid_sig_1234567890"), false);
  });

  test("simulates SUCCESS outcome with valid signature and code 00", async () => {
    const result = await processSimulatedPayment({
      orderId: "67cb1a2b3c4d5e6f7a8b9c0d",
      amount: 1500,
      currency: "LKR",
      paymentMethod: "CARD",
      requestedScenario: "SUCCESS"
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.transaction.status, "SUCCESS");
    assert.strictEqual(result.transaction.responseCode, ResponseCodes.SUCCESS);
    assert.ok(result.transaction.signature);

    const isValid = verifyPayloadSignature(
      {
        transactionId: result.transaction.transactionId,
        orderId: "67cb1a2b3c4d5e6f7a8b9c0d",
        amount: 1500,
        currency: "LKR",
        responseCode: result.transaction.responseCode,
        status: result.transaction.status,
        timestamp: result.transaction.timestamp
      },
      result.transaction.signature
    );
    assert.strictEqual(isValid, true);
  });

  test("simulates FAILED/DECLINED outcome with code 05", async () => {
    const result = await processSimulatedPayment({
      orderId: "67cb1a2b3c4d5e6f7a8b9c0d",
      amount: 1500,
      currency: "LKR",
      requestedScenario: "DECLINED"
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.transaction.status, "FAILED");
    assert.strictEqual(result.transaction.responseCode, ResponseCodes.DECLINED);
  });

  test("simulates INSUFFICIENT_FUNDS with code 51", async () => {
    const result = await processSimulatedPayment({
      orderId: "67cb1a2b3c4d5e6f7a8b9c0d",
      amount: 5000,
      currency: "LKR",
      requestedScenario: "INSUFFICIENT_FUNDS"
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.transaction.status, "FAILED");
    assert.strictEqual(result.transaction.responseCode, ResponseCodes.INSUFFICIENT_FUNDS);
  });

  test("simulates PENDING outcome with code 09", async () => {
    const result = await processSimulatedPayment({
      orderId: "67cb1a2b3c4d5e6f7a8b9c0d",
      amount: 1500,
      currency: "LKR",
      requestedScenario: "PENDING"
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.transaction.status, "PENDING");
    assert.strictEqual(result.transaction.responseCode, ResponseCodes.PENDING);
  });

  test("simulates NETWORK_ERROR/TIMEOUT with code 91", async () => {
    const result = await processSimulatedPayment({
      orderId: "67cb1a2b3c4d5e6f7a8b9c0d",
      amount: 1500,
      currency: "LKR",
      requestedScenario: "NETWORK_ERROR"
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.transaction.status, "FAILED");
    assert.strictEqual(result.transaction.responseCode, ResponseCodes.TIMEOUT);
  });
});
