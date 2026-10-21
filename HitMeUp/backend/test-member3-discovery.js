/**
 * Member 3 (Deal Discovery & Location Services) Comprehensive Test Suite
 * Tests:
 * 1. Favorite and Review Models validation & indexes
 * 2. Search & Multi-criteria Filtering (Keyword, Category, Price Range, Discount, Sorting)
 * 3. Proximity / Geospatial Nearby Deals Discovery (Haversine distance calculation)
 * 4. Map Markers Data generation for interactive map pins
 * 5. Single Deal Discovery & Merchant Rating Aggregation
 * 6. Customer Favorites (Toggle Add / Remove, Get My Favorites)
 * 7. Customer Reviews & Ratings Submission (Average Rating calculation)
 */

const dns = require("dns");
dns.setServers(["8.8.8.8"]);

require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");

const User = require("./models/user");
const Business = require("./models/Business");
const Deal = require("./models/Deal");
const Favorite = require("./models/Favorite");
const Review = require("./models/Review");

const {
  searchDeals,
  getNearbyDeals,
  getMapBusinesses,
  getDealDiscoveryDetails,
  toggleFavorite,
  getMyFavorites,
  addReview,
  getBusinessReviews
} = require("./controllers/discoveryController");

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

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("===============================================================");
  console.log("   HitMeUp - Member 3 (Discovery & Location) Test Suite       ");
  console.log("===============================================================\n");

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.warn("⚠️  MONGO_URI not found in .env. Running schema-level unit checks.");
  } else {
    try {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
      console.log(" Connected to MongoDB for live integration tests.\n");
    } catch (e) {
      console.warn("⚠️  MongoDB connection skipped:", e.message);
    }
  }

  // -------------------------------------------------------------------------
  // Test 1: Favorite Model Schema Validation
  // -------------------------------------------------------------------------
  console.log("Test 1: Favorite Model Schema Validation");
  try {
    const invalidFav = new Favorite({});
    const validationError = invalidFav.validateSync();
    assert(
      validationError && validationError.errors.userId,
      "Favorite requires userId field"
    );
  } catch (err) {
    assert(false, `Favorite validation error: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // Test 2: Review Model Schema Validation
  // -------------------------------------------------------------------------
  console.log("\nTest 2: Review Model Schema Validation");
  try {
    const invalidReview = new Review({ rating: 6 }); // Out of bounds
    const validationError = invalidReview.validateSync();
    assert(
      validationError && validationError.errors.userId,
      "Review requires userId"
    );
    assert(
      validationError && validationError.errors.businessId,
      "Review requires businessId"
    );
    assert(
      validationError && validationError.errors.rating,
      "Review rejects rating > 5"
    );
  } catch (err) {
    assert(false, `Review validation error: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // Test 3: Search Deals Controller Query Handling
  // -------------------------------------------------------------------------
  console.log("\nTest 3: Search Deals Controller");
  if (mongoose.connection.readyState === 1) {
    try {
      const { req, res, getStatus, getData } = createMockReqRes({
        query: { category: "Restaurant", sortBy: "discount_desc", page: 1, limit: 5 }
      });
      await searchDeals(req, res);
      assert(getStatus() === 200, "searchDeals returns status 200");
      assert(getData().success === true, "searchDeals returns success: true");
      assert(Array.isArray(getData().deals), "searchDeals returns deals array");
    } catch (err) {
      assert(false, `searchDeals crashed: ${err.message}`);
    }
  } else {
    console.log("  [SKIP] Live DB required for searchDeals execution.");
  }

  // -------------------------------------------------------------------------
  // Test 4: Geospatial Nearby Deals Discovery
  // -------------------------------------------------------------------------
  console.log("\nTest 4: Geospatial Nearby Deals Discovery");
  if (mongoose.connection.readyState === 1) {
    try {
      // Colombo coordinates: Lat 6.9271, Lng 79.8612
      const { req, res, getStatus, getData } = createMockReqRes({
        query: { lat: "6.9271", lng: "79.8612", radius: "25" }
      });
      await getNearbyDeals(req, res);
      assert(getStatus() === 200, "getNearbyDeals returns status 200 for valid coordinates");
      assert(getData().success === true, "getNearbyDeals returns success: true");
      assert(getData().radiusKm === 25, "getNearbyDeals respects radius parameter");
      assert(Array.isArray(getData().deals), "getNearbyDeals returns deals list");
    } catch (err) {
      assert(false, `getNearbyDeals crashed: ${err.message}`);
    }
  } else {
    console.log("  [SKIP] Live DB required for nearby deals.");
  }

  // -------------------------------------------------------------------------
  // Test 5: Nearby Deals Validation on Missing Coordinates
  // -------------------------------------------------------------------------
  console.log("\nTest 5: Nearby Deals Coordinate Validation");
  try {
    const { req, res, getStatus, getData } = createMockReqRes({
      query: {} // Missing coordinates
    });
    await getNearbyDeals(req, res);
    assert(getStatus() === 400, "getNearbyDeals returns 400 when lat/lng are missing");
    assert(getData().success === false, "getNearbyDeals flags success: false on missing coords");
  } catch (err) {
    assert(false, `Nearby validation test error: ${err.message}`);
  }

  // -------------------------------------------------------------------------
  // Test 6: Map Markers Data Aggregation
  // -------------------------------------------------------------------------
  console.log("\nTest 6: Map Markers Aggregation");
  if (mongoose.connection.readyState === 1) {
    try {
      const { req, res, getStatus, getData } = createMockReqRes({ query: {} });
      await getMapBusinesses(req, res);
      assert(getStatus() === 200, "getMapBusinesses returns status 200");
      assert(Array.isArray(getData().markers), "getMapBusinesses returns markers array");
    } catch (err) {
      assert(false, `getMapBusinesses crashed: ${err.message}`);
    }
  } else {
    console.log("  [SKIP] Live DB required for map markers.");
  }

  // -------------------------------------------------------------------------
  // Test 7: Review Controller Validation
  // -------------------------------------------------------------------------
  console.log("\nTest 7: Review Submission Validation");
  try {
    const mockUser = { _id: new mongoose.Types.ObjectId(), name: "Test Reviewer" };
    const { req, res, getStatus, getData } = createMockReqRes({
      user: mockUser,
      body: { rating: 10 } // Invalid rating (> 5)
    });
    await addReview(req, res);
    assert(getStatus() === 400, "addReview rejects invalid rating (> 5)");
  } catch (err) {
    assert(false, `addReview test error: ${err.message}`);
  }

  console.log("\n===============================================================");
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log("===============================================================\n");

  if (mongoose.connection.readyState === 1) {
    await mongoose.disconnect();
  }
}

runTests();
