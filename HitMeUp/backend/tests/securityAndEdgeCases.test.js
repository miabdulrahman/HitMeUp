require("dotenv").config();

const dns = require("dns");
try {
  dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (e) {
  // ignore
}

process.env.NODE_ENV = "test";
process.env.SIMULATED_PROCESSING_DELAY_MS = "0";

const { test, describe, before, after } = require("node:test");
const assert = require("node:assert");
const mongoose = require("mongoose");

const User = require("../models/user");
const Business = require("../models/Business");
const Deal = require("../models/Deal");
const Order = require("../models/Order");
const Payment = require("../models/Payment");
const Voucher = require("../models/Voucher");

const paymentService = require("../services/paymentService");
const mockGatewayService = require("../services/mockGatewayService");

describe("Payment Security, Edge Cases & Cashier POS Redemption", () => {
  let customerA;
  let customerB;
  let merchant;
  let business;
  let deal;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000
      });
    }

    const testId = `edge_${Date.now().toString(36)}`;

    customerA = await User.create({
      name: `Customer Alpha ${testId}`,
      email: `alpha_${testId}@hitmeup.lk`,
      password: "password123",
      role: "customer"
    });

    customerB = await User.create({
      name: `Customer Beta ${testId}`,
      email: `beta_${testId}@hitmeup.lk`,
      password: "password123",
      role: "customer"
    });

    merchant = await User.create({
      name: `Merchant Owner ${testId}`,
      email: `owner_${testId}@hitmeup.lk`,
      password: "password123",
      role: "business"
    });

    business = await Business.create({
      name: `Edge Cafe ${testId}`,
      ownerId: merchant._id,
      category: "Cafe",
      address: "456 Duplication Road, Colombo",
      phone: "+94771112222"
    });

    merchant.businessId = business._id;
    await merchant.save();

    deal = await Deal.create({
      title: `Edge Test Deal ${testId}`,
      description: "Edge test deal for security verification",
      businessId: business._id,
      category: "Cafe",
      originalPrice: 3000,
      discountPercentage: 20,
      discountedPrice: 2400,
      availableQuantity: 5,
      claimedQuantity: 0,
      status: "active",
      startDate: new Date(),
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    });
  });

  after(async () => {
    if (customerA) await User.deleteOne({ _id: customerA._id });
    if (customerB) await User.deleteOne({ _id: customerB._id });
    if (merchant) await User.deleteOne({ _id: merchant._id });
    if (business) await Business.deleteOne({ _id: business._id });
    if (deal) {
      await Order.deleteMany({ dealId: deal._id });
      await Deal.deleteOne({ _id: deal._id });
    }
    await mongoose.connection.close();
  });

  test("1. Unauthorized user cannot access or pay another customer's order", async () => {
    const order = await Order.create({
      orderNumber: `HMU-SEC-ORD-${Date.now()}`,
      customerId: customerA._id,
      dealId: deal._id,
      businessId: business._id,
      quantity: 1,
      unitPrice: 2400,
      subtotal: 2400,
      fees: 0,
      totalAmount: 2400,
      currency: "LKR",
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    // Customer B attempts to initiate checkout session for Customer A's order
    await assert.rejects(
      async () => {
        await paymentService.createCheckoutSession({
          orderId: order._id,
          user: customerB
        });
      },
      (err) => err.statusCode === 403 && err.message.includes("Unauthorized")
    );

    // Customer B attempts to process payment for Customer A's order
    await assert.rejects(
      async () => {
        await paymentService.processPayment({
          orderId: order._id,
          user: customerB,
          requestedScenario: "SUCCESS"
        });
      },
      (err) => err.statusCode === 403 && err.message.includes("Unauthorized")
    );
  });

  test("2. Rejects forged or tampered HMAC gateway signature", () => {
    const payload = {
      transactionId: "HMP-20261105-FAKE1234",
      orderId: "67cb1a2b3c4d5e6f7a8b9c0d",
      amount: 2400,
      currency: "LKR",
      responseCode: "00",
      status: "SUCCESS",
      timestamp: new Date().toISOString()
    };

    const forgedSignature = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    const isValid = mockGatewayService.verifyPayloadSignature(payload, forgedSignature);
    assert.strictEqual(isValid, false);
  });

  test("3. Expired checkout window is rejected with 410 and releases stock", async () => {
    // Deal availableQuantity before
    const dealBefore = await Deal.findById(deal._id);
    const stockBefore = dealBefore.availableQuantity;

    // Simulate order created with expired time
    const expiredOrder = await Order.create({
      orderNumber: `HMU-EXP-ORD-${Date.now()}`,
      customerId: customerA._id,
      dealId: deal._id,
      businessId: business._id,
      quantity: 1,
      unitPrice: 2400,
      subtotal: 2400,
      fees: 0,
      totalAmount: 2400,
      currency: "LKR",
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      expiresAt: new Date(Date.now() - 5000), // 5s in past
      inventoryReserved: true,
      inventoryReleased: false
    });

    await assert.rejects(
      async () => {
        await paymentService.processPayment({
          orderId: expiredOrder._id,
          user: customerA,
          requestedScenario: "SUCCESS"
        });
      },
      (err) => err.statusCode === 410 && err.message.includes("expired")
    );

    // Verify inventory was restored
    const dealAfter = await Deal.findById(deal._id);
    assert.strictEqual(dealAfter.availableQuantity, stockBefore + 1);
  });

  test("4. Duplicate submission with same Idempotency-Key returns cached transaction safely", async () => {
    const order = await Order.create({
      orderNumber: `HMU-IDEM-ORD-${Date.now()}`,
      customerId: customerA._id,
      dealId: deal._id,
      businessId: business._id,
      quantity: 1,
      unitPrice: 2400,
      subtotal: 2400,
      fees: 0,
      totalAmount: 2400,
      currency: "LKR",
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    const idempotencyKey = `KEY-CONCURRENT-${Date.now()}`;

    // First process
    const res1 = await paymentService.processPayment({
      orderId: order._id,
      user: customerA,
      requestedScenario: "SUCCESS",
      idempotencyKey
    });

    assert.strictEqual(res1.success, true);
    assert.strictEqual(res1.transaction.transactionStatus, "SUCCESS");

    // Second process with identical key
    const res2 = await paymentService.processPayment({
      orderId: order._id,
      user: customerA,
      requestedScenario: "SUCCESS",
      idempotencyKey
    });

    assert.strictEqual(res2.success, true);
    assert.strictEqual(res2.idempotentReplay, true);
    assert.strictEqual(res2.transaction.transactionId, res1.transaction.transactionId);
  });

  test("5. Redeemed voucher cannot be refunded (strict 422 Unprocessable Entity)", async () => {
    const order = await Order.create({
      orderNumber: `HMU-REDEEM-ORD-${Date.now()}`,
      customerId: customerA._id,
      dealId: deal._id,
      businessId: business._id,
      quantity: 1,
      unitPrice: 2400,
      subtotal: 2400,
      fees: 0,
      totalAmount: 2400,
      currency: "LKR",
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    const payResult = await paymentService.processPayment({
      orderId: order._id,
      user: customerA,
      requestedScenario: "SUCCESS"
    });

    const paymentId = payResult.payment._id;

    // Simulate cashier scanning and redeeming the voucher at POS
    const voucher = await Voucher.findOne({ orderId: order._id });
    voucher.status = "REDEEMED";
    voucher.redeemedAt = new Date();
    await voucher.save();

    // Now merchant or admin tries to refund
    await assert.rejects(
      async () => {
        await paymentService.refundPayment({
          paymentId,
          user: merchant,
          reason: "Customer dispute"
        });
      },
      (err) => err.statusCode === 422 && err.message.includes("already redeemed")
    );
  });
});
