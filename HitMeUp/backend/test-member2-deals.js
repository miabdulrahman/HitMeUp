/**
 * Member 2 (Flash Deal Management) Comprehensive Test Suite
 * Tests Deal Model, CRUD, Pricing & Discount Calculations, Lifecycle Transitions, Business Scoping
 */

const dns = require("dns");
dns.setServers(["8.8.8.8"]);

require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");

const User = require("./models/user");
const Business = require("./models/Business");
const Deal = require("./models/Deal");
const {
  createDeal,
  getDeals,
  getDealById,
  getMyDeals,
  getDealsByBusiness,
  updateDeal,
  updateDealStatus,
  deleteDeal
} = require("./controllers/dealController");

// Helper to simulate Express req, res
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

const runMember2Tests = async () => {
  console.log("================================================================================");
  console.log("   HITMEUP - MEMBER 2 (FLASH DEAL MANAGEMENT) AUTOMATED TEST SUITE              ");
  console.log("================================================================================\n");

  let passedCount = 0;
  let failedCount = 0;

  let testUser;
  let testBusiness;
  let otherUser;
  let otherBusiness;
  let createdDealId;

  try {
    // Connect to Database
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error("MONGO_URI is missing in .env");
    }
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log("✓ Connected to MongoDB for Member 2 Test Suite\n");

    // SETUP: Create test business users
    const timestamp = Date.now();
    testUser = await User.create({
      name: "Member 2 Test Merchant",
      email: `merchant.${timestamp}@test.com`,
      password: "Password123!",
      role: "business",
      phone: "+94770001111"
    });

    testBusiness = await Business.create({
      name: "Colombo Artisan Roasters",
      category: "Cafe",
      ownerId: testUser._id,
      phone: "+94770001111",
      email: testUser.email,
      address: { city: "Colombo", country: "Sri Lanka" }
    });

    // Update user businessId
    testUser.businessId = testBusiness._id;
    await testUser.save();

    otherUser = await User.create({
      name: "Other Business Owner",
      email: `other.${timestamp}@test.com`,
      password: "Password123!",
      role: "business",
      phone: "+94770002222"
    });

    otherBusiness = await Business.create({
      name: "Other Store",
      category: "Retail",
      ownerId: otherUser._id,
      phone: "+94770002222",
      email: otherUser.email
    });
    otherUser.businessId = otherBusiness._id;
    await otherUser.save();

    // --------------------------------------------------------------------------
    // TEST 1: Create Deal with Auto-Calculated Discount Price
    // --------------------------------------------------------------------------
    console.log("Test 1: Create Deal & Automatic Discounted Price Calculation");
    {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 6 * 60 * 60 * 1000); // 6 hours

      const mock = createMockReqRes({
        user: testUser,
        body: {
          title: "Cold Brew & Almond Croissant Combo",
          description: "Freshly roasted single-origin cold brew with daily baked pastry",
          category: "Cafe",
          originalPrice: 1500,
          discountPercentage: 40,
          startDate,
          endDate,
          availableQuantity: 25
        }
      });

      await createDeal(mock.req, mock.res);

      if (mock.getStatus() !== 201 || !mock.getData()?.deal) {
        throw new Error(`Test 1 Failed: Status=${mock.getStatus()}, data=${JSON.stringify(mock.getData())}`);
      }

      const deal = mock.getData().deal;
      if (deal.discountedPrice !== 900) {
        throw new Error(`Test 1 Failed: Expected discountedPrice=900 (40% off 1500), got ${deal.discountedPrice}`);
      }

      createdDealId = deal._id;
      passedCount++;
      console.log(`   PASSED: Deal created with auto-calculated discountedPrice (Rs. 900, 40% OFF).\n`);
    }

    // --------------------------------------------------------------------------
    // TEST 2: Validate Edge Cases (Reject negative prices & invalid dates)
    // --------------------------------------------------------------------------
    console.log("Test 2: Validation of Invalid Pricing and Dates");
    {
      // Case A: Negative Price
      const mockNegative = createMockReqRes({
        user: testUser,
        body: {
          title: "Invalid Price Deal",
          description: "Test description",
          originalPrice: -50,
          discountPercentage: 20
        }
      });
      await createDeal(mockNegative.req, mockNegative.res);
      if (mockNegative.getStatus() !== 400) {
        throw new Error("Test 2A Failed: Negative price was not rejected with 400!");
      }

      // Case B: End date before start date
      const mockDates = createMockReqRes({
        user: testUser,
        body: {
          title: "Invalid Date Deal",
          description: "Test description",
          originalPrice: 1000,
          discountPercentage: 20,
          startDate: new Date(),
          endDate: new Date(Date.now() - 3600000) // 1 hour in the past
        }
      });
      await createDeal(mockDates.req, mockDates.res);
      if (mockDates.getStatus() !== 400) {
        throw new Error("Test 2B Failed: End date before start date was not rejected with 400!");
      }

      passedCount++;
      console.log("   PASSED: Input validations correctly rejected invalid price and inverted dates.\n");
    }

    // --------------------------------------------------------------------------
    // TEST 3: Public Deal Discovery (GET /api/deals) with filters
    // --------------------------------------------------------------------------
    console.log("Test 3: Public Deal Discovery & Filtering");
    {
      const mock = createMockReqRes({
        query: {
          category: "Cafe",
          status: "active"
        }
      });

      await getDeals(mock.req, mock.res);

      if (mock.getStatus() !== 200 || !Array.isArray(mock.getData()?.deals)) {
        throw new Error(`Test 3 Failed: Status=${mock.getStatus()}, data=${JSON.stringify(mock.getData())}`);
      }

      const deals = mock.getData().deals;
      const found = deals.find((d) => d._id.toString() === createdDealId.toString());
      if (!found) {
        throw new Error("Test 3 Failed: Created active deal was not returned in public search!");
      }

      passedCount++;
      console.log(`   PASSED: Discovery API returned active deals matching category 'Cafe'.\n`);
    }

    // --------------------------------------------------------------------------
    // TEST 4: Single Deal Details (GET /api/deals/:id)
    // --------------------------------------------------------------------------
    console.log("Test 4: Single Deal Retrieval by ID");
    {
      const mock = createMockReqRes({
        params: { id: createdDealId }
      });

      await getDealById(mock.req, mock.res);

      if (mock.getStatus() !== 200 || !mock.getData()?.deal) {
        throw new Error(`Test 4 Failed: Expected 200, got ${mock.getStatus()}`);
      }

      const deal = mock.getData().deal;
      if (deal.title !== "Cold Brew & Almond Croissant Combo") {
        throw new Error(`Test 4 Failed: Title mismatch, got '${deal.title}'`);
      }

      passedCount++;
      console.log(`   PASSED: Single deal retrieved with populated business details.\n`);
    }

    // --------------------------------------------------------------------------
    // TEST 5: Business Deals Management (GET /api/deals/business/my-deals)
    // --------------------------------------------------------------------------
    console.log("Test 5: Business Portal - Get My Deals & Metrics");
    {
      const mock = createMockReqRes({
        user: testUser
      });

      await getMyDeals(mock.req, mock.res);

      if (mock.getStatus() !== 200) {
        throw new Error(`Test 5 Failed: Expected 200, got ${mock.getStatus()}`);
      }

      const data = mock.getData();
      if (!data.metrics || data.metrics.total < 1 || data.metrics.active < 1) {
        throw new Error(`Test 5 Failed: Metrics incorrect: ${JSON.stringify(data.metrics)}`);
      }

      passedCount++;
      console.log(`   PASSED: Merchant deals retrieved with real-time metrics (Total: ${data.metrics.total}, Active: ${data.metrics.active}).\n`);
    }

    // --------------------------------------------------------------------------
    // TEST 6: Deal Update & Repricing (PUT /api/deals/:id)
    // --------------------------------------------------------------------------
    console.log("Test 6: Update Deal & Price Recalculation");
    {
      const mock = createMockReqRes({
        user: testUser,
        params: { id: createdDealId },
        body: {
          title: "Cold Brew & Gourmet Croissant Combo (Updated)",
          originalPrice: 2000,
          discountPercentage: 50 // New discount: 50% of 2000 = 1000
        }
      });

      await updateDeal(mock.req, mock.res);

      if (mock.getStatus() !== 200 || !mock.getData()?.deal) {
        throw new Error(`Test 6 Failed: Expected 200, got ${mock.getStatus()}`);
      }

      const updated = mock.getData().deal;
      if (updated.discountedPrice !== 1000) {
        throw new Error(`Test 6 Failed: Expected updated discountedPrice=1000, got ${updated.discountedPrice}`);
      }

      passedCount++;
      console.log("   PASSED: Deal updated with recalculated discountedPrice (Rs. 1000, 50% OFF).\n");
    }

    // --------------------------------------------------------------------------
    // TEST 7: Deal Lifecycle Transitions (PATCH /api/deals/:id/status)
    // --------------------------------------------------------------------------
    console.log("Test 7: Deal Lifecycle Transitions (active -> draft -> cancelled)");
    {
      // Transition to draft (pause deal)
      const mockDraft = createMockReqRes({
        user: testUser,
        params: { id: createdDealId },
        body: { status: "draft" }
      });
      await updateDealStatus(mockDraft.req, mockDraft.res);
      if (mockDraft.getStatus() !== 200 || mockDraft.getData()?.deal?.status !== "draft") {
        throw new Error("Test 7 Failed: Transition to 'draft' failed!");
      }

      // Transition to cancelled
      const mockCancel = createMockReqRes({
        user: testUser,
        params: { id: createdDealId },
        body: { status: "cancelled" }
      });
      await updateDealStatus(mockCancel.req, mockCancel.res);
      if (mockCancel.getStatus() !== 200 || mockCancel.getData()?.deal?.status !== "cancelled") {
        throw new Error("Test 7 Failed: Transition to 'cancelled' failed!");
      }

      passedCount++;
      console.log("   PASSED: Lifecycle state transitions executed successfully.\n");
    }

    // --------------------------------------------------------------------------
    // TEST 8: Ownership Isolation Security (Unauthorized edit rejected)
    // --------------------------------------------------------------------------
    console.log("Test 8: Cross-Business Ownership Protection");
    {
      const mockUnauthorized = createMockReqRes({
        user: otherUser, // Different merchant
        params: { id: createdDealId },
        body: { title: "Hijacked Deal" }
      });

      await updateDeal(mockUnauthorized.req, mockUnauthorized.res);

      if (mockUnauthorized.getStatus() !== 403) {
        throw new Error(`Test 8 Failed: Expected 403 Forbidden, got ${mockUnauthorized.getStatus()}`);
      }

      passedCount++;
      console.log("   PASSED: Cross-business update correctly blocked with 403 Forbidden.\n");
    }

    // --------------------------------------------------------------------------
    // TEST 9: Delete Deal (DELETE /api/deals/:id)
    // --------------------------------------------------------------------------
    console.log("Test 9: Delete Deal");
    {
      const mock = createMockReqRes({
        user: testUser,
        params: { id: createdDealId }
      });

      await deleteDeal(mock.req, mock.res);

      if (mock.getStatus() !== 200) {
        throw new Error(`Test 9 Failed: Expected 200, got ${mock.getStatus()}`);
      }

      const check = await Deal.findById(createdDealId);
      if (check) {
        throw new Error("Test 9 Failed: Deal still exists in database after delete!");
      }

      passedCount++;
      console.log("   PASSED: Deal deleted successfully from database.\n");
    }

  } catch (err) {
    failedCount++;
    console.error("❌ Test Suite Error:", err.message);
  } finally {
    // Cleanup test users and businesses
    try {
      if (testUser) await User.findByIdAndDelete(testUser._id);
      if (testBusiness) await Business.findByIdAndDelete(testBusiness._id);
      if (otherUser) await User.findByIdAndDelete(otherUser._id);
      if (otherBusiness) await Business.findByIdAndDelete(otherBusiness._id);
      if (createdDealId) await Deal.findByIdAndDelete(createdDealId);
    } catch (e) {
      // Ignore cleanup error
    }

    await mongoose.disconnect();
    console.log("================================================================================");
    console.log(`   TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
    console.log("================================================================================\n");

    if (failedCount > 0) {
      process.exit(1);
    }
  }
};

runMember2Tests();
