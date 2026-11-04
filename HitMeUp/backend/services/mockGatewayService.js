const crypto = require("crypto");

const GATEWAY_SIGNING_SECRET =
  process.env.GATEWAY_SIGNING_SECRET || "hitmeup_pay_signing_secret_academic_2026";

const ResponseCodes = Object.freeze({
  SUCCESS: "00",
  DECLINED: "05",
  INSUFFICIENT_FUNDS: "51",
  TIMEOUT: "91",
  PENDING: "09",
  DUPLICATE: "94",
  EXPIRED: "54"
});

function generateTransactionId() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(now.getUTCDate()).padStart(2, "0");
  const randomSuffix = crypto.randomBytes(4).toString("hex").toUpperCase();
  return `HMP-${yyyy}${mm}${dd}-${randomSuffix}`;
}

/**
 * Generate HMAC-SHA256 signature for a gateway result payload
 */
function signPayload(payload, secret = GATEWAY_SIGNING_SECRET) {
  const canonicalString = [
    payload.transactionId,
    payload.orderId,
    Number(payload.amount).toFixed(2),
    payload.currency,
    payload.responseCode,
    payload.status,
    payload.timestamp
  ].join(":");

  return crypto
    .createHmac("sha256", secret)
    .update(canonicalString)
    .digest("hex");
}

/**
 * Verify HMAC signature against payload
 */
function verifyPayloadSignature(payload, signature, secret = GATEWAY_SIGNING_SECRET) {
  if (!signature || !payload) return false;
  const expected = signPayload(payload, secret);
  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature, "hex"),
      Buffer.from(expected, "hex")
    );
  } catch {
    return false;
  }
}

/**
 * Simulated gateway processing engine
 * Accepts a decoupled request object and returns a signed transaction object
 */
async function processSimulatedPayment({
  orderId,
  amount,
  currency = "LKR",
  paymentMethod = "CARD",
  requestedScenario = "SUCCESS",
  metadata = {}
}) {
  const transactionId = generateTransactionId();
  const timestamp = new Date().toISOString();

  // Allow configurable simulation delay for realistic UX (0 in test environment)
  const isTest = process.env.NODE_ENV === "test";
  const delayMs = isTest
    ? 0
    : Number(process.env.SIMULATED_PROCESSING_DELAY_MS || 1000);

  if (delayMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }

  const scenario = (requestedScenario || "SUCCESS").toUpperCase();

  let status = "SUCCESS";
  let responseCode = ResponseCodes.SUCCESS;
  let responseMessage = "Payment completed successfully";

  switch (scenario) {
    case "SUCCESS":
      status = "SUCCESS";
      responseCode = ResponseCodes.SUCCESS;
      responseMessage = "Payment completed successfully via HitMeUp Pay";
      break;

    case "FAILED":
    case "DECLINED":
      status = "FAILED";
      responseCode = ResponseCodes.DECLINED;
      responseMessage = "Transaction declined by issuing authority (Simulated)";
      break;

    case "INSUFFICIENT_FUNDS":
      status = "FAILED";
      responseCode = ResponseCodes.INSUFFICIENT_FUNDS;
      responseMessage = "Insufficient funds in the selected account (Simulated)";
      break;

    case "PENDING":
      status = "PENDING";
      responseCode = ResponseCodes.PENDING;
      responseMessage =
        "Payment authorization is pending settlement with bank network (Simulated)";
      break;

    case "NETWORK_ERROR":
    case "TIMEOUT":
      status = "FAILED";
      responseCode = ResponseCodes.TIMEOUT;
      responseMessage =
        "Simulated network timeout communicating with upstream processing node";
      break;

    case "CANCELLED":
      status = "CANCELLED";
      responseCode = ResponseCodes.DECLINED;
      responseMessage = "Payment session was cancelled by customer";
      break;

    default:
      // Unknown scenario defaults safely to generic decline in production
      status = "FAILED";
      responseCode = ResponseCodes.DECLINED;
      responseMessage = "Transaction could not be processed";
      break;
  }

  const payloadToSign = {
    transactionId,
    orderId: String(orderId),
    amount: Number(amount),
    currency,
    responseCode,
    status,
    timestamp
  };

  const signature = signPayload(payloadToSign);

  return {
    success: status === "SUCCESS",
    transaction: {
      transactionId,
      status,
      responseCode,
      message: responseMessage,
      amount: Number(amount),
      currency,
      paymentMethod,
      timestamp,
      signature,
      simulatedResponseType: scenario,
      metadata
    }
  };
}

module.exports = {
  ResponseCodes,
  generateTransactionId,
  signPayload,
  verifyPayloadSignature,
  processSimulatedPayment
};
