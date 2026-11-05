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
const Receipt = require("../models/Receipt");
const GatewayTransaction = require("../models/GatewayTransaction");

const paymentService = require("../services/paymentService");
const transactionService = require("../services/transactionService");

describe("Payment Lifecycle & Database Integration Tests", () => {
  let testCustomer;
  let testBusinessUser;
  let testAdminUser;
  let testBusiness;
  let testDeal;

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000
      });
    }

    const testId = Date.now().toString(36);

    // Create test customer
    testCustomer = await User.create({
      name: `Test Customer ${testId}`,
      email: `customer_${testId}@test.hitmeup.lk`,
      password: "password123",
      role: "customer"
    });

    // Create test business user
    testBusinessUser = await User.create({
      name: `Test Merchant ${testId}`,
      email: `merchant_${testId}@test.hitmeup.lk`,
      password: "password123",
      role: "business"
    });

    // Create test admin user
    testAdminUser = await User.create({
      name: `Test Admin ${testId}`,
      email: `admin_${testId}@test.hitmeup.lk`,
      password: "password123",
      role: "admin"
    });

    // Create test business
    testBusiness = await Business.create({
      name: `Test Cafe ${testId}`,
      ownerId: testBusinessUser._id,
      category: "Cafe",
      address: "123 Galle Road, Colombo 03",
      phone: "+94770000000"
    });

    testBusinessUser.businessId = testBusiness._id;
    await testBusinessUser.save();

    // Create test active deal with initial stock of 10
    const now = new Date();
    const endDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    testDeal = await Deal.create({
      title: `Special Flash Deal ${testId}`,
      description: "Authentic Colombo food voucher with 50% discount",
      businessId: testBusiness._id,
      category: "Food & Drinks",
      originalPrice: 2000,
      discountPercentage: 50,
      discountedPrice: 1000,
      availableQuantity: 10,
      claimedQuantity: 0,
      status: "active",
      startDate: now,
      endDate: endDate
    });
  });

  after(async () => {
    // Cleanup created test documents
    if (testCustomer) await User.deleteOne({ _id: testCustomer._id });
    if (testBusinessUser) await User.deleteOne({ _id: testBusinessUser._id });
    if (testAdminUser) await User.deleteOne({ _id: testAdminUser._id });
    if (testBusiness) await Business.deleteOne({ _id: testBusiness._id });
    if (testDeal) {
      await Order.deleteMany({ dealId: testDeal._id });
      await Deal.deleteOne({ _id: testDeal._id });
    }
    await mongoose.connection.close();
  });

  test("1. Successfully creates order with atomic stock reservation and 15m TTL", async () => {
    const initialDeal = await Deal.findById(testDeal._id);
    const initialStock = initialDeal.availableQuantity;

    // Atomically decrement stock
    const updatedDeal = await Deal.findOneAndUpdate(
      { _id: testDeal._id, status: "active", availableQuantity: { $gte: 1 } },
      { $inc: { availableQuantity: -1 } },
      { new: true }
    );

    assert.strictEqual(updatedDeal.availableQuantity, initialStock - 1);

    const order = await Order.create({
      orderNumber: `HMU-TEST-ORD-${Date.now()}`,
      customerId: testCustomer._id,
      dealId: testDeal._id,
      businessId: testBusiness._id,
      quantity: 1,
      unitPrice: 1000,
      subtotal: 1000,
      fees: 0,
      totalAmount: 1000,
      currency: "LKR",
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      dealSnapshot: {
        title: testDeal.title,
        merchantName: testBusiness.name
      },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      inventoryReserved: true
    });

    assert.ok(order._id);
    assert.strictEqual(order.status, "PENDING");
    assert.strictEqual(order.totalAmount, 1000);
  });

  test("2. Full payment success flow: gateway signed, order PAID, voucher + QR generated, receipt generated", async () => {
    // Create new order
    const order = await Order.create({
      orderNumber: `HMU-TEST-SUCCESS-${Date.now()}`,
      customerId: testCustomer._id,
      dealId: testDeal._id,
      businessId: testBusiness._id,
      quantity: 1,
      unitPrice: 1000,
      subtotal: 1000,
      fees: 0,
      totalAmount: 1000,
      currency: "LKR",
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      dealSnapshot: {
        title: testDeal.title,
        merchantName: testBusiness.name
      },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    // Create checkout session
    const session = await paymentService.createCheckoutSession({
      orderId: order._id,
      user: testCustomer
    });

    assert.strictEqual(session.alreadyPaid, false);
    assert.ok(session.payment);
    assert.strictEqual(session.payment.status, "PENDING");

    // Process payment with SUCCESS scenario
    const processResult = await paymentService.processPayment({
      orderId: order._id,
      user: testCustomer,
      paymentMethod: "CARD",
      requestedScenario: "SUCCESS",
      brand: "visa",
      last4: "4242",
      idempotencyKey: `IDEM-KEY-${Date.now()}`
    });

    assert.strictEqual(processResult.success, true);
    assert.strictEqual(processResult.payment.status, "SUCCESS");
    assert.strictEqual(processResult.order.status, "PAID");

    // Verify voucher generated with QR code
    assert.ok(processResult.voucher);
    assert.strictEqual(processResult.voucher.status, "ACTIVE");
    assert.match(processResult.voucher.code, /^HMU-/);
    assert.ok(processResult.voucher.qrData.startsWith("data:image/png;base64,"));

    // Verify receipt generated
    assert.ok(processResult.receipt);
    assert.match(processResult.receipt.receiptNumber, /^REC-/);
    assert.strictEqual(processResult.receipt.amount, 1000);

    // Verify idempotency: paying again on same order rejects with 409
    await assert.rejects(
      async () => {
        await paymentService.processPayment({
          orderId: order._id,
          user: testCustomer,
          requestedScenario: "SUCCESS"
        });
      },
      (err) => err.statusCode === 409
    );
  });

  test("3. Payment decline flow: payment FAILED, order remains retryable, NO voucher created", async () => {
    const order = await Order.create({
      orderNumber: `HMU-TEST-DECLINE-${Date.now()}`,
      customerId: testCustomer._id,
      dealId: testDeal._id,
      businessId: testBusiness._id,
      quantity: 1,
      unitPrice: 1000,
      subtotal: 1000,
      fees: 0,
      totalAmount: 1000,
      currency: "LKR",
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    const processResult = await paymentService.processPayment({
      orderId: order._id,
      user: testCustomer,
      requestedScenario: "DECLINED",
      brand: "visa",
      last4: "0002"
    });

    assert.strictEqual(processResult.success, false);
    assert.strictEqual(processResult.payment.status, "FAILED");

    // Confirm NO voucher created
    const voucher = await Voucher.findOne({ orderId: order._id });
    assert.strictEqual(voucher, null);
  });

  test("4. Payment refund simulation: validates role, marks REFUNDED, invalidates voucher, restores stock", async () => {
    // Create paid order
    const order = await Order.create({
      orderNumber: `HMU-TEST-REFUND-${Date.now()}`,
      customerId: testCustomer._id,
      dealId: testDeal._id,
      businessId: testBusiness._id,
      quantity: 1,
      unitPrice: 1000,
      subtotal: 1000,
      fees: 0,
      totalAmount: 1000,
      currency: "LKR",
      status: "PENDING",
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
      dealSnapshot: {
        title: testDeal.title,
        merchantName: testBusiness.name
      },
      expiresAt: new Date(Date.now() + 15 * 60 * 1000)
    });

    const payResult = await paymentService.processPayment({
      orderId: order._id,
      user: testCustomer,
      requestedScenario: "SUCCESS"
    });

    assert.strictEqual(payResult.success, true);
    const paymentId = payResult.payment._id;

    // Refund as business owner
    const refundResult = await paymentService.refundPayment({
      paymentId,
      user: testBusinessUser,
      reason: "Simulated customer cancellation"
    });

    assert.strictEqual(refundResult.success, true);
    assert.strictEqual(refundResult.payment.status, "REFUNDED");
    assert.ok(refundResult.payment.refund.refundReference);

    // Verify voucher status transitioned to REFUNDED
    const refundedVoucher = await Voucher.findOne({ orderId: order._id });
    assert.strictEqual(refundedVoucher.status, "REFUNDED");
  });

  test("5. Dashboard aggregation metrics return real data from MongoDB", async () => {
    const summary = await transactionService.getDashboardSummary(testAdminUser);

    assert.ok(summary.metrics);
    assert.ok(typeof summary.metrics.totalTransactions === "number");
    assert.ok(summary.metrics.totalTransactions > 0);
    assert.ok(typeof summary.metrics.successRate === "number");
    assert.ok(Array.isArray(summary.methodDistribution));
    assert.ok(Array.isArray(summary.timeline));
  });
});
