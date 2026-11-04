/**
 * HitMeUp Pay: Card Scenario Mapping & Sanitization Utilities
 */

export const DEMO_CARD_TRIGGERS = Object.freeze({
  "4242424242424242": "SUCCESS",
  "4000000000000002": "FAILED",
  "4000000000009995": "INSUFFICIENT_FUNDS",
  "4000000000000259": "PENDING",
  "4000000000000119": "NETWORK_ERROR",
});

export function detectCardBrand(cardNumber = "") {
  const clean = String(cardNumber).replace(/\D/g, "");
  if (/^4/.test(clean)) return "visa";
  if (/^5[1-5]/.test(clean)) return "mastercard";
  if (/^3[47]/.test(clean)) return "amex";
  return "visa";
}

export function mapCardToScenario(cardNumber = "") {
  const clean = String(cardNumber).replace(/\D/g, "");
  return DEMO_CARD_TRIGGERS[clean] || "SUCCESS";
}

/**
 * Sanitizes form data before API submission.
 * Enforces Non-negotiable Rule: PAN, CVV, and expiration dates are NEVER sent.
 */
export function sanitizePaymentPayload({
  orderId,
  cardNumber,
  paymentMethod = "CARD",
  requestedScenario,
  idempotencyKey = null,
}) {
  const cleanNumber = String(cardNumber || "").replace(/\D/g, "");
  const last4 = cleanNumber.slice(-4) || "4242";
  const brand = detectCardBrand(cleanNumber);
  const scenario = requestedScenario || mapCardToScenario(cleanNumber);

  return {
    orderId,
    paymentMethod,
    requestedScenario: scenario,
    brand,
    last4,
    idempotencyKey,
  };
}
