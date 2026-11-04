const { test, describe, before } = require("node:test");
const assert = require("node:assert");

describe("Frontend Scenario Mapping & PCI Data Shield Tests", () => {
  let paymentUtils;

  before(async () => {
    paymentUtils = await import("../../frontend/src/utils/paymentUtils.js");
  });

  test("detects card brands correctly (Visa, Mastercard, Amex)", () => {
    const { detectCardBrand } = paymentUtils;
    assert.strictEqual(detectCardBrand("4242 4242 4242 4242"), "visa");
    assert.strictEqual(detectCardBrand("5555 5555 5555 5555"), "mastercard");
    assert.strictEqual(detectCardBrand("3782 822463 10005"), "amex");
  });

  test("maps demo card numbers accurately to backend simulation scenarios", () => {
    const { mapCardToScenario } = paymentUtils;
    assert.strictEqual(mapCardToScenario("4242 4242 4242 4242"), "SUCCESS");
    assert.strictEqual(mapCardToScenario("4000 0000 0000 0002"), "FAILED");
    assert.strictEqual(mapCardToScenario("4000 0000 0000 9995"), "INSUFFICIENT_FUNDS");
    assert.strictEqual(mapCardToScenario("4000 0000 0000 0259"), "PENDING");
    assert.strictEqual(mapCardToScenario("4000 0000 0000 0119"), "NETWORK_ERROR");
    // Unmapped generic card defaults safely to SUCCESS
    assert.strictEqual(mapCardToScenario("4111 1111 1111 1111"), "SUCCESS");
  });

  test("sanitizePaymentPayload removes full card number, CVV, and expiry from request payload", () => {
    const { sanitizePaymentPayload } = paymentUtils;
    const rawFormState = {
      orderId: "67cb1a2b3c4d5e6f7a8b9c0d",
      cardNumber: "4000 0000 0000 0002",
      expiry: "12/28",
      cvv: "999",
      cardHolder: "JOHN DOE"
    };

    const sanitized = sanitizePaymentPayload(rawFormState);

    // Assert sensitive fields are ABSENT
    assert.strictEqual(sanitized.cardNumber, undefined);
    assert.strictEqual(sanitized.cvv, undefined);
    assert.strictEqual(sanitized.expiry, undefined);
    assert.strictEqual(sanitized.cardHolder, undefined);

    // Assert safe metadata is present
    assert.strictEqual(sanitized.orderId, "67cb1a2b3c4d5e6f7a8b9c0d");
    assert.strictEqual(sanitized.brand, "visa");
    assert.strictEqual(sanitized.last4, "0002");
    assert.strictEqual(sanitized.requestedScenario, "FAILED");
    assert.strictEqual(sanitized.paymentMethod, "CARD");
  });
});
