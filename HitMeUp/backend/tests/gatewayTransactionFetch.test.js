const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const dns = require("dns");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const http = require("http");
const express = require("express");

dns.setServers(["8.8.8.8", "1.1.1.1"]);
dotenv.config();

require("../models/user");
if (!mongoose.models.User) {
  mongoose.model("User", mongoose.model("user").schema);
}
require("../models/Business");
require("../models/Deal");
require("../models/Order");
require("../models/Payment");
require("../models/GatewayTransaction");
require("../models/Voucher");

const gatewayRoutes = require("../routes/gatewayRoutes");
const User = mongoose.model("User");
const Business = mongoose.model("Business");
const Deal = mongoose.model("Deal");
const Order = mongoose.model("Order");
const GatewayTransaction = mongoose.model("GatewayTransaction");
const Voucher = mongoose.model("Voucher");
const paymentService = require("../services/paymentService");

const JWT_SECRET = process.env.JWT_SECRET || "hitmeup_jwt_development_secret_2026";

function createTestServer() {
  const app = express();
  app.use(express.json());
  app.use("/api/gateway", gatewayRoutes);
  return app;
}

function makeRequest(server, path, token, method = "GET", body = null) {
  return new Promise((resolve, reject) => {
    const port = server.address().port;
    const options = {
      hostname: "localhost",
      port,
      path,
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    };
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

test("Gateway Transaction Persistence & Retrieval Tests", async (t) => {
  await mongoose.connect(process.env.MONGO_URI);
  const app = createTestServer();
  let server;
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });

  const timestamp = Date.now();
  let customerUser, otherCustomer, merchantUser, businessDoc, dealDoc, orderDoc;
  let successTxnId, failedTxnId, pendingTxnId;

  try {
    // 1. Setup entities
    customerUser = await User.create({
      name: `Customer Test ${timestamp}`,
      email: `customer_${timestamp}@test.com`,
      password: "REPLACE_WITH_TEST_PASSWORD",
      role: "customer"
    });

    otherCustomer = await User.create({
      name: `Other Customer ${timestamp}`,
      email: `other_${timestamp}@test.com`,
      password: "REPLACE_WITH_TEST_PASSWORD",
      role: "customer"
    });

    merchantUser = await User.create({
      name: `Merchant Test ${timestamp}`,
      email: `merchant_${timestamp}@test.com`,
      password: "REPLACE_WITH_TEST_PASSWORD",
      role: "business"
    });

    businessDoc = await Business.create({
      ownerId: merchantUser._id,
      userId: merchantUser._id,
      name: "Gateway Retrieval Cafe",
      businessName: "Gateway Retrieval Cafe",
      category: "Cafe",
      address: "123 Galle Road, Colombo",
      phone: "+94771234567"
    });

    merchantUser.businessId = businessDoc._id;
    await merchantUser.save();

    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    dealDoc = await Deal.create({
      title: "Test Artisan Coffee",
      description: "Delightful brew for testing",
      price: 650,
      originalPrice: 1300,
      discountPercentage: 50,
      discountedPrice: 650,
      businessId: businessDoc._id,
      category: "Food & Drinks",
      status: "active",
      totalQuantity: 50,
      availableQuantity: 50,
      claimedQuantity: 0,
      startDate: now,
      endDate: endDate
    });

    const customerToken = jwt.sign({ id: customerUser._id }, JWT_SECRET, {
      expiresIn: "1h"
    });
    const otherToken = jwt.sign({ id: otherCustomer._id }, JWT_SECRET, {
      expiresIn: "1h"
    });
    const merchantToken = jwt.sign({ id: merchantUser._id }, JWT_SECRET, {
      expiresIn: "1h"
    });

    // 2. Process SUCCESS payment
    const order1 = await Order.create({
      orderNumber: `HMU-TEST-SUCC-${timestamp}`,
      customerId: customerUser._id,
      dealId: dealDoc._id,
      businessId: businessDoc._id,
      quantity: 1,
      unitPrice: 650,
      subtotal: 650,
      totalAmount: 650,
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING"
    });

    const successRes = await paymentService.processPayment({
      orderId: order1._id,
      user: customerUser,
      paymentMethod: "CARD",
      requestedScenario: "SUCCESS",
      brand: "visa",
      last4: "4242",
      idempotencyKey: `IDEM-SUCC-${timestamp}`
    });
    successTxnId = successRes.transaction.transactionId;

    // 3. Process FAILED payment
    const order2 = await Order.create({
      orderNumber: `HMU-TEST-FAIL-${timestamp}`,
      customerId: customerUser._id,
      dealId: dealDoc._id,
      businessId: businessDoc._id,
      quantity: 1,
      unitPrice: 650,
      subtotal: 650,
      totalAmount: 650,
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING"
    });

    const failRes = await paymentService.processPayment({
      orderId: order2._id,
      user: customerUser,
      paymentMethod: "CARD",
      requestedScenario: "DECLINED",
      brand: "mastercard",
      last4: "0002",
      idempotencyKey: `IDEM-FAIL-${timestamp}`
    });
    failedTxnId = failRes.transaction.transactionId;

    // 4. Process PENDING payment
    const order3 = await Order.create({
      orderNumber: `HMU-TEST-PEND-${timestamp}`,
      customerId: customerUser._id,
      dealId: dealDoc._id,
      businessId: businessDoc._id,
      quantity: 1,
      unitPrice: 650,
      subtotal: 650,
      totalAmount: 650,
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING"
    });

    const pendRes = await paymentService.processPayment({
      orderId: order3._id,
      user: customerUser,
      paymentMethod: "CARD",
      requestedScenario: "PENDING",
      brand: "visa",
      last4: "0259",
      idempotencyKey: `IDEM-PEND-${timestamp}`
    });
    pendingTxnId = pendRes.transaction.transactionId;

    // --- Subtests ---

    await t.test(
      "1. Owner retrieves SUCCESS transaction with 200, populated deal & voucher",
      async () => {
        const res = await makeRequest(
          server,
          `/api/gateway/transactions/${successTxnId}`,
          customerToken
        );
        assert.equal(res.status, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.transaction.transactionId, successTxnId);
        assert.equal(res.body.transaction.transactionStatus, "SUCCESS");
        assert.equal(res.body.transaction.customerId.name, customerUser.name);
        assert.equal(
          res.body.transaction.orderId.dealId.title,
          "Test Artisan Coffee"
        );
        assert.ok(res.body.voucher, "Voucher must be attached");
        assert.ok(res.body.voucher.code.startsWith("HMU-"));
        assert.ok(res.body.voucher.qrData.startsWith("data:image/png;base64,"));
      }
    );

    await t.test(
      "2. Handles transaction ID with spaces / URL decoding gracefully",
      async () => {
        const spacedId = successTxnId.replace(/-/g, "%20");
        const res = await makeRequest(
          server,
          `/api/gateway/transactions/${spacedId}`,
          customerToken
        );
        assert.equal(res.status, 200);
        assert.equal(res.body.transaction.transactionId, successTxnId);
      }
    );

    await t.test(
      "3. Owner retrieves FAILED transaction with 200",
      async () => {
        const res = await makeRequest(
          server,
          `/api/gateway/transactions/${failedTxnId}`,
          customerToken
        );
        assert.equal(res.status, 200);
        assert.equal(res.body.transaction.transactionStatus, "FAILED");
        assert.equal(res.body.voucher, null, "Failed transaction has no voucher");
      }
    );

    await t.test(
      "4. Owner retrieves PENDING transaction with 200 and resolves it",
      async () => {
        const res = await makeRequest(
          server,
          `/api/gateway/transactions/${pendingTxnId}`,
          customerToken
        );
        assert.equal(res.status, 200);
        assert.equal(res.body.transaction.transactionStatus, "PENDING");

        // Resolve pending transaction
        const resolveRes = await makeRequest(
          server,
          `/api/gateway/transactions/${pendingTxnId}/resolve`,
          customerToken,
          "POST"
        );
        assert.equal(resolveRes.status, 200);

        // Fetch again - should now be SUCCESS
        const afterRes = await makeRequest(
          server,
          `/api/gateway/transactions/${pendingTxnId}`,
          customerToken
        );
        assert.equal(afterRes.status, 200);
        assert.equal(afterRes.body.transaction.transactionStatus, "SUCCESS");
        assert.ok(afterRes.body.voucher, "Resolved transaction now has voucher");
      }
    );

    await t.test(
      "5. Another customer gets 403 Forbidden",
      async () => {
        const res = await makeRequest(
          server,
          `/api/gateway/transactions/${successTxnId}`,
          otherToken
        );
        assert.equal(res.status, 403);
        assert.equal(res.body.success, false);
      }
    );

    await t.test(
      "6. Unknown transaction ID returns 404 Not Found",
      async () => {
        const res = await makeRequest(
          server,
          "/api/gateway/transactions/HMP-NONEXISTENT-9999",
          customerToken
        );
        assert.equal(res.status, 404);
        assert.equal(res.body.success, false);
      }
    );

    await t.test(
      "7. Merchant owning the deal can also view the transaction",
      async () => {
        const res = await makeRequest(
          server,
          `/api/gateway/transactions/${successTxnId}`,
          merchantToken
        );
        assert.equal(res.status, 200);
        assert.equal(res.body.transaction.transactionId, successTxnId);
      }
    );
  } finally {
    // Cleanup
    if (server) server.close();
    if (customerUser) await User.deleteOne({ _id: customerUser._id });
    if (otherCustomer) await User.deleteOne({ _id: otherCustomer._id });
    if (merchantUser) await User.deleteOne({ _id: merchantUser._id });
    if (businessDoc) await Business.deleteOne({ _id: businessDoc._id });
    if (dealDoc) await Deal.deleteOne({ _id: dealDoc._id });
    await Order.deleteMany({
      orderNumber: { $regex: `HMU-TEST-.*-${timestamp}` }
    });
    await GatewayTransaction.deleteMany({
      transactionId: { $in: [successTxnId, failedTxnId, pendingTxnId] }
    });
    await Voucher.deleteMany({
      customerId: { $in: [customerUser?._id, otherCustomer?._id] }
    });
    await mongoose.disconnect();
  }
});
