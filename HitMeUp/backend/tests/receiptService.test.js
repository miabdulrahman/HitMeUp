const { test, describe } = require("node:test");
const assert = require("node:assert");
const {
  generateReceiptNumber,
  generateVerificationReference
} = require("../services/receiptService");

describe("Receipt Service Tests", () => {
  test("generates unique receipt numbers in REC-YYYYMMDD-XXXX format", () => {
    const num1 = generateReceiptNumber();
    const num2 = generateReceiptNumber();

    assert.match(num1, /^REC-\d{8}-[A-F0-9]{6}$/);
    assert.match(num2, /^REC-\d{8}-[A-F0-9]{6}$/);
    assert.notStrictEqual(num1, num2);
  });

  test("generates unique verification references in VER-XXXXXXXXXXXX format", () => {
    const ref1 = generateVerificationReference();
    const ref2 = generateVerificationReference();

    assert.match(ref1, /^VER-[A-F0-9]{12}$/);
    assert.match(ref2, /^VER-[A-F0-9]{12}$/);
    assert.notStrictEqual(ref1, ref2);
  });
});

