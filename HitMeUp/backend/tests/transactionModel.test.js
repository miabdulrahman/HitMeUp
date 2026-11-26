const assert = require("node:assert/strict");
const { test } = require("node:test");
const Transaction = require("../models/Transaction");

test("a transaction's default status satisfies the status enum", async () => {
  const transaction = new Transaction({
    userId: "507f1f77bcf86cd799439011",
    dealId: "507f1f77bcf86cd799439012",
    amount: 100
  });

  assert.equal(transaction.status, "Pending");
  await assert.doesNotReject(() => transaction.validate());
});
