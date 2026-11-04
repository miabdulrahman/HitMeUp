const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  generateVoucherCode,
  generateQrData
} = require("../services/voucherIntegrationService");

describe("Voucher Integration Service Tests", () => {
  test("generates unique voucher codes in HMU-XXXX-XXXXXX format", () => {
    const code1 = generateVoucherCode();
    const code2 = generateVoucherCode();

    assert.match(code1, /^HMU-[A-Z0-9]{4}-[A-Z0-9]{6}$/);
    assert.match(code2, /^HMU-[A-Z0-9]{4}-[A-Z0-9]{6}$/);
    assert.notStrictEqual(code1, code2);
  });

  test("generates QR code base64 data URL with prefix HITMEUP:", async () => {
    const code = "HMU-TEST-123456";
    const qrData = await generateQrData(code);

    assert.ok(typeof qrData === "string");
    assert.ok(qrData.startsWith("data:image/png;base64,"));
  });
});

