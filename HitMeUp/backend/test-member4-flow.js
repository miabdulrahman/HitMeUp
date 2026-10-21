/**
 * Member 4 (Rushdhi) Comprehensive Automated Test Suite
 * Tests End-to-End Flow:
 * 1. Order Creation
 * 2. Order Cancellation (Customer self-cancel)
 * 3. Payment Session Creation
 * 4. Payment Verification (Voucher & Base64 QR Generation)
 * 5. Customer Voucher Retrieval
 * 6. Cashier Voucher Preview by Code (with QR Prefix Stripping)
 * 7. Security: Unauthorized Customer Redemption Rejected
 * 8. Authorized Business Owner Voucher Redemption
 * 9. Security: Double-Redemption Protection
 * 10. Business Orders & Revenue Analytics
 */

const dns = require("dns");
dns.setServers(["8.8.8.8"]);

require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Business = require("./models/Business");
const Deal = require("./models/Deal");
const Order = require("./models/Order");
const Payment = require("./models/Payment");
const Voucher = require("./models/Voucher");
const Redemption = require("./models/Redemption");

const { createOrder, getMyOrders, getOrderById, cancelOrder, getBusinessOrders } = require("./controllers/orderController");
const { createPayment, verifyPayment, getPaymentById } = require("./controllers/paymentController");
const { getMyVouchers, getVoucherById, previewVoucherByCode, redeemVoucher } = require("./controllers/voucherController");

const JWT_SECRET = process.env.JWT_SECRET || "hitmeup_jwt_secret_dev_2026";

// Express req, res mock helper
const createMockReqRes = (options = {}) => {
  const req = {
    body: options.body || {},
    params: options.params || {},
    query: options.query || {},
    headers: options.headers || {},
    user: options.user || null
  };

  let statusCode = 200;
  let responseData = null;

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };

  return {
    req,
    res,
    getStatus: () => statusCode,
    getData: () => responseData
  };
};

const runMember4TestSuite = async () => {
  console.log("\n=================================================================");
  console.log("   MEMBER 4 (Rushdhi) - ORDERS, PAYMENTS & VOUCHERS TEST SUITE");
  console.log("=================================================================\n");

  let passedCount = 0;

  try {
    console.log("1. Connecting to MongoDB Atlas...");
    const directUri = "mongodb://prabhathnishantha882_db_user:Lyt30Z53bk1qhBUM@ac-czubofq-shard-00-00.qymkj5q.mongodb.net:27017,ac-czubofq-shard-00-01.qymkj5q.mongodb.net:27017,ac-czubofq-shard-00-02.qymkj5q.mongodb.net:27017/?ssl=true&authSource=admin&appName=HitMeUp";
    const uri = (process.env.MONGO_URI && process.env.MONGO_URI.includes("mongodb+srv")) ? directUri : process.env.MONGO_URI;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("   Connected to database successfully.\n");

    // Setup Test Business User & Profile
    console.log("2. Setting up Test Business and Deal...");
    let testBusinessUser = await User.findOne({ role: "business" });
    if (!testBusinessUser) {
      testBusinessUser = await User.create({
        name: "Test Business Owner",
        email: `biz.member4.${Date.now()}@hitmeup.com`,
        password: "Password123!",
        role: "business",
        phone: "+94770000001"
      });
    }

    let testBusiness = await Business.findOne({ ownerId: testBusinessUser._id });
    if (!testBusiness) {
      testBusiness = await Business.create({
        name: "Member 4 Test Restaurant",
        category: "Restaurant",
        description: "Specialty flash deal test restaurant",
        ownerId: testBusinessUser._id,
        phone: "+94770000001",
        email: testBusinessUser.email,
        address: { street: "10 Main St", city: "Colombo", country: "Sri Lanka" },
        location: { type: "Point", coordinates: [79.8612, 6.9271] },
        status: "active"
      });
      testBusinessUser.businessId = testBusiness._id;
      await testBusinessUser.save();
    } else if (!testBusinessUser.businessId) {
      testBusinessUser.businessId = testBusiness._id;
      await testBusinessUser.save();
    }

    // Setup Test Deal
    let testDeal = await Deal.create({
      title: "Member 4 Test Burger Deluxe",
      description: "Automated test deal for order, payment and voucher redemption",
      businessId: testBusiness._id,
      originalPrice: 2000,
      discountPercentage: 25,
      discountedPrice: 1500,
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: "active"
    });

    // Setup Test Customer User
    let testCustomerUser = await User.findOne({ email: "abdul@gmail.com" });
    if (!testCustomerUser) {
      testCustomerUser = await User.create({
        name: "Rushdhi Customer",
        email: `cust.member4.${Date.now()}@hitmeup.com`,
        password: "Password123!",
        role: "customer",
        phone: "+94770000002"
      });
    }

    console.log(`   Business ID: ${testBusiness._id}`);
    console.log(`   Customer ID: ${testCustomerUser._id}`);
    console.log(`   Deal ID:     ${testDeal._id} (LKR ${testDeal.discountedPrice})\n`);

    // =========================================================================
    // TEST 1: Create Order (POST /api/orders)
    // =========================================================================
    console.log("Test 1: Customer creates Order with active Deal");
    const mockOrderReq = createMockReqRes({
      user: testCustomerUser,
      body: { dealId: testDeal._id.toString() }
    });
    await createOrder(mockOrderReq.req, mockOrderReq.res);

    if (mockOrderReq.getStatus() !== 201 || !mockOrderReq.getData()?.data?._id) {
      throw new Error(`Test 1 Failed: Status ${mockOrderReq.getStatus()}, Message: ${mockOrderReq.getData()?.message}`);
    }

    const createdOrder = mockOrderReq.getData().data;
    if (createdOrder.status !== "PENDING" || createdOrder.amount !== 1500) {
      throw new Error(`Test 1 Failed: Expected status PENDING and amount 1500, got ${createdOrder.status} / ${createdOrder.amount}`);
    }
    console.log(`   PASSED: Order created (${createdOrder.orderNumber}) with status PENDING, amount LKR ${createdOrder.amount}.\n`);
    passedCount++;

    // =========================================================================
    // TEST 2: Cancel Order (PUT /api/orders/:id/cancel)
    // =========================================================================
    console.log("Test 2: Customer cancels a pending order");
    const mockCancelReq = createMockReqRes({
      user: testCustomerUser,
      params: { id: createdOrder._id.toString() }
    });
    await cancelOrder(mockCancelReq.req, mockCancelReq.res);

    if (mockCancelReq.getStatus() !== 200 || mockCancelReq.getData()?.data?.status !== "CANCELLED") {
      throw new Error(`Test 2 Failed: Status ${mockCancelReq.getStatus()}, Message: ${mockCancelReq.getData()?.message}`);
    }
    console.log(`   PASSED: Order successfully marked CANCELLED by customer.\n`);
    passedCount++;

    // =========================================================================
    // TEST 3: Create Second Order & Payment Session
    // =========================================================================
    console.log("Test 3: Customer creates new Order & initiates Payment Session");
    const mockOrder2Req = createMockReqRes({
      user: testCustomerUser,
      body: { dealId: testDeal._id.toString() }
    });
    await createOrder(mockOrder2Req.req, mockOrder2Req.res);
    const orderToPay = mockOrder2Req.getData().data;

    const mockPayReq = createMockReqRes({
      user: testCustomerUser,
      body: { orderId: orderToPay._id.toString() }
    });
    await createPayment(mockPayReq.req, mockPayReq.res);

    if (mockPayReq.getStatus() !== 201 || !mockPayReq.getData()?.data?.payment?._id) {
      throw new Error(`Test 3 Failed: Status ${mockPayReq.getStatus()}, Message: ${mockPayReq.getData()?.message}`);
    }

    const createdPayment = mockPayReq.getData().data.payment;
    console.log(`   PASSED: Payment session initiated with ID ${createdPayment._id}, status PENDING.\n`);
    passedCount++;

    // =========================================================================
    // TEST 4: Verify Payment (POST /api/payments/verify -> Generates Voucher)
    // =========================================================================
    console.log("Test 4: Customer verifies payment -> Generates digital voucher with QR");
    const mockVerifyReq = createMockReqRes({
      user: testCustomerUser,
      body: {
        paymentId: createdPayment._id.toString(),
        transactionId: `TXN-TEST-${Date.now()}`,
        success: true
      }
    });
    await verifyPayment(mockVerifyReq.req, mockVerifyReq.res);

    if (mockVerifyReq.getStatus() !== 200 || !mockVerifyReq.getData()?.data?.voucher) {
      throw new Error(`Test 4 Failed: Status ${mockVerifyReq.getStatus()}, Message: ${mockVerifyReq.getData()?.message}`);
    }

    const { payment: verifiedPayment, order: updatedOrder, voucher: createdVoucher } = mockVerifyReq.getData().data;
    if (verifiedPayment.status !== "SUCCESS" || updatedOrder.status !== "PAID") {
      throw new Error(`Test 4 Failed: Payment or Order status incorrect`);
    }
    if (createdVoucher.status !== "ACTIVE" || !createdVoucher.qrData.startsWith("data:image/png;base64")) {
      throw new Error(`Test 4 Failed: Voucher not ACTIVE or invalid QR code data`);
    }

    console.log(`   PASSED: Payment verified (SUCCESS), Order marked PAID.`);
    console.log(`   Voucher generated: Code = ${createdVoucher.code}, QR Base64 verified.\n`);
    passedCount++;

    // =========================================================================
    // TEST 5: Customer checks My Vouchers (GET /api/vouchers)
    // =========================================================================
    console.log("Test 5: Customer retrieves personal vouchers list");
    const mockGetVouchersReq = createMockReqRes({ user: testCustomerUser });
    await getMyVouchers(mockGetVouchersReq.req, mockGetVouchersReq.res);

    if (mockGetVouchersReq.getStatus() !== 200) {
      throw new Error(`Test 5 Failed: Status ${mockGetVouchersReq.getStatus()}`);
    }

    const customerVouchers = mockGetVouchersReq.getData().data;
    const foundVoucher = customerVouchers.find(v => v._id.toString() === createdVoucher._id.toString());
    if (!foundVoucher) {
      throw new Error("Test 5 Failed: Newly generated voucher not found in customer list");
    }
    console.log(`   PASSED: Retrieved ${customerVouchers.length} customer voucher(s), newly generated voucher confirmed.\n`);
    passedCount++;

    // =========================================================================
    // TEST 6: Cashier scans & previews voucher by code (GET /api/vouchers/code/:code)
    // =========================================================================
    console.log("Test 6: Cashier scans QR code to preview voucher (with 'HITMEUP:' prefix)");
    const qrScannedString = `HITMEUP:${createdVoucher.code}`;
    const mockPreviewReq = createMockReqRes({
      user: testBusinessUser,
      params: { code: qrScannedString }
    });
    await previewVoucherByCode(mockPreviewReq.req, mockPreviewReq.res);

    if (mockPreviewReq.getStatus() !== 200 || !mockPreviewReq.getData()?.data?.voucher) {
      throw new Error(`Test 6 Failed: Status ${mockPreviewReq.getStatus()}, Message: ${mockPreviewReq.getData()?.message}`);
    }

    const previewData = mockPreviewReq.getData().data;
    if (previewData.belongsToCurrentBusiness !== true || previewData.voucher.status !== "ACTIVE") {
      throw new Error(`Test 6 Failed: Preview data verification mismatch`);
    }
    console.log(`   PASSED: QR code prefix stripped successfully. Preview details confirmed for Deal: "${previewData.voucher.dealId.title}".\n`);
    passedCount++;

    // =========================================================================
    // TEST 7: Unauthorized customer attempts to redeem voucher
    // =========================================================================
    console.log("Test 7: Unauthorized customer attempts to redeem voucher (Security check)");
    const mockCustRedeemReq = createMockReqRes({
      user: testCustomerUser,
      body: { code: createdVoucher.code }
    });
    await redeemVoucher(mockCustRedeemReq.req, mockCustRedeemReq.res);

    if (mockCustRedeemReq.getStatus() !== 403) {
      throw new Error(`Test 7 Failed: Expected status 403 Forbidden, got ${mockCustRedeemReq.getStatus()}`);
    }
    console.log(`   PASSED: Unauthorized customer redemption properly rejected with 403 Forbidden.\n`);
    passedCount++;

    // =========================================================================
    // TEST 8: Legitimate Business Owner redeems voucher (POST /api/vouchers/redeem)
    // =========================================================================
    console.log("Test 8: Authorized business owner redeems voucher by code");
    const mockBizRedeemReq = createMockReqRes({
      user: testBusinessUser,
      body: { code: `HITMEUP:${createdVoucher.code}` } // Test scanner string submission
    });
    await redeemVoucher(mockBizRedeemReq.req, mockBizRedeemReq.res);

    if (mockBizRedeemReq.getStatus() !== 200 || !mockBizRedeemReq.getData()?.data?.redemption) {
      throw new Error(`Test 8 Failed: Status ${mockBizRedeemReq.getStatus()}, Message: ${mockBizRedeemReq.getData()?.message}`);
    }

    const { voucher: redeemedVoucher, redemption: redemptionRecord } = mockBizRedeemReq.getData().data;
    if (redeemedVoucher.status !== "REDEEMED") {
      throw new Error(`Test 8 Failed: Voucher status should be REDEEMED, got ${redeemedVoucher.status}`);
    }

    const finalOrder = await Order.findById(orderToPay._id);
    if (finalOrder.status !== "COMPLETED") {
      throw new Error(`Test 8 Failed: Order should be marked COMPLETED, got ${finalOrder.status}`);
    }

    console.log(`   PASSED: Voucher redeemed successfully, marked REDEEMED.`);
    console.log(`   Audit record created: Redemption ID = ${redemptionRecord._id}`);
    console.log(`   Order marked COMPLETED.\n`);
    passedCount++;

    // =========================================================================
    // TEST 9: Double-Redemption Protection
    // =========================================================================
    console.log("Test 9: Attempting to redeem already-redeemed voucher (Double-spend check)");
    const mockDoubleRedeemReq = createMockReqRes({
      user: testBusinessUser,
      body: { code: createdVoucher.code }
    });
    await redeemVoucher(mockDoubleRedeemReq.req, mockDoubleRedeemReq.res);

    if (mockDoubleRedeemReq.getStatus() !== 400 && mockDoubleRedeemReq.getStatus() !== 409) {
      throw new Error(`Test 9 Failed: Expected 400 or 409 for duplicate redemption, got ${mockDoubleRedeemReq.getStatus()}`);
    }
    console.log(`   PASSED: Double-redemption prevented with status ${mockDoubleRedeemReq.getStatus()}: "${mockDoubleRedeemReq.getData()?.message}".\n`);
    passedCount++;

    // =========================================================================
    // TEST 10: Business Orders & Revenue Analytics (GET /api/orders/business)
    // =========================================================================
    console.log("Test 10: Business owner views orders & revenue analytics");
    const mockBizOrdersReq = createMockReqRes({ user: testBusinessUser });
    await getBusinessOrders(mockBizOrdersReq.req, mockBizOrdersReq.res);

    if (mockBizOrdersReq.getStatus() !== 200 || mockBizOrdersReq.getData()?.totalRevenue === undefined) {
      throw new Error(`Test 10 Failed: Status ${mockBizOrdersReq.getStatus()}`);
    }

    const analytics = mockBizOrdersReq.getData();
    console.log(`   PASSED: Retrieved business orders. Total revenue tracked: LKR ${analytics.totalRevenue}.\n`);
    passedCount++;

    // Clean up temporary test deal
    await Deal.findByIdAndDelete(testDeal._id);

    console.log("=================================================================");
    console.log(`🎉 ALL ${passedCount} MEMBER 4 (Rushdhi) TESTS PASSED WITH ZERO WARNINGS!`);
    console.log("   Full Lifecycle: Order -> Cancel -> Pay -> Verify -> Scan -> Redeem -> Analytics");
    console.log("=================================================================\n");

  } catch (error) {
    console.error("\n❌ TEST SUITE FAILED:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("Database connection closed.");
  }
};

runMember4TestSuite();
