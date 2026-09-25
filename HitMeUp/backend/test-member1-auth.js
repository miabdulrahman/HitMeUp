/**
 * Member 1 (Abdul-Rahman) Comprehensive Test Suite
 * Tests Authentication, JWT, RBAC Middleware, User & Business Management
 */

const dns = require("dns");
dns.setServers(["8.8.8.8"]);

require("dotenv").config({ path: __dirname + "/.env" });
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const User = require("./models/User");
const Business = require("./models/Business");
const {
  register,
  login,
  getMe,
  updateProfile,
  changePassword
} = require("./controllers/authController");
const {
  createBusinessProfile,
  getMyBusiness,
  updateMyBusiness,
  getBusinessById,
  getAllBusinesses
} = require("./controllers/businessController");
const {
  protect,
  authorizeRoles,
  optionalAuth,
  JWT_SECRET
} = require("./middleware/authMiddleware");

// Helper to simulate Express req, res, next
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
  let nextCalled = false;
  let nextError = null;

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

  const next = (err) => {
    nextCalled = true;
    nextError = err || null;
  };

  return {
    req,
    res,
    next,
    getStatus: () => statusCode,
    getData: () => responseData,
    wasNextCalled: () => nextCalled,
    getNextError: () => nextError
  };
};

const TEST_EMAIL_CUSTOMER = `test.customer.${Date.now()}@hitmeup.com`;
const TEST_EMAIL_BUSINESS = `test.business.${Date.now()}@hitmeup.com`;
const TEST_PASSWORD = "Password123!";
const NEW_PASSWORD = "NewPassword456!";

let customerToken;
let customerUser;
let businessToken;
let businessUser;
let createdBusinessId;

const runTests = async () => {
  console.log("\n=================================================================");
  console.log("   MEMBER 1 (Abdul-Rahman) - AUTH & BUSINESS TEST SUITE");
  console.log("=================================================================\n");

  let passedCount = 0;

  try {
    console.log("Connecting to MongoDB Atlas...");
    const directUri = "mongodb://prabhathnishantha882_db_user:Lyt30Z53bk1qhBUM@ac-czubofq-shard-00-00.qymkj5q.mongodb.net:27017,ac-czubofq-shard-00-01.qymkj5q.mongodb.net:27017,ac-czubofq-shard-00-02.qymkj5q.mongodb.net:27017/?ssl=true&authSource=admin&appName=HitMeUp";
    const uri = (process.env.MONGO_URI && process.env.MONGO_URI.includes("mongodb+srv")) ? directUri : process.env.MONGO_URI;
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log("MongoDB Atlas Connected successfully.\n");

    // TEST 1: Register Customer
    console.log("Test 1: Customer Registration (POST /api/auth/register)");
    {
      const mock = createMockReqRes({
        body: {
          name: "Test Customer",
          email: TEST_EMAIL_CUSTOMER,
          password: TEST_PASSWORD,
          phone: "+94771234567"
        }
      });
      await register(mock.req, mock.res);

      if (mock.getStatus() !== 201 || !mock.getData()?.token) {
        throw new Error(`Test 1 Failed: status=${mock.getStatus()}, data=${JSON.stringify(mock.getData())}`);
      }
      customerToken = mock.getData().token;
      customerUser = mock.getData().user;
      if (customerUser.password) {
        throw new Error("Test 1 Failed: Password hash was leaked in registration response!");
      }
      if (customerUser.role !== "customer") {
        throw new Error(`Test 1 Failed: Expected role 'customer', got '${customerUser.role}'`);
      }
      passedCount++;
      console.log("   PASSED: Customer registered with JWT token, password excluded.\n");
    }

    // TEST 2: Duplicate Registration Rejection
    console.log("Test 2: Duplicate Email Prevention");
    {
      const mock = createMockReqRes({
        body: {
          name: "Duplicate User",
          email: TEST_EMAIL_CUSTOMER,
          password: TEST_PASSWORD
        }
      });
      await register(mock.req, mock.res);

      if (mock.getStatus() !== 400 || mock.getData()?.success !== false) {
        throw new Error(`Test 2 Failed: Expected 400 Bad Request, got ${mock.getStatus()}`);
      }
      passedCount++;
      console.log("   PASSED: Duplicate registration correctly rejected with 400.\n");
    }

    // TEST 3: Login with valid credentials
    console.log("Test 3: Customer Login with Valid Credentials (POST /api/auth/login)");
    {
      const mock = createMockReqRes({
        body: {
          email: TEST_EMAIL_CUSTOMER,
          password: TEST_PASSWORD
        }
      });
      await login(mock.req, mock.res);

      if (mock.getStatus() !== 200 || !mock.getData()?.token) {
        throw new Error(`Test 3 Failed: status=${mock.getStatus()}, data=${JSON.stringify(mock.getData())}`);
      }
      passedCount++;
      console.log("   PASSED: Login returned 200 OK with valid JWT.\n");
    }

    // TEST 4: Login with incorrect password
    console.log("Test 4: Customer Login with Wrong Password");
    {
      const mock = createMockReqRes({
        body: {
          email: TEST_EMAIL_CUSTOMER,
          password: "WrongPassword999!"
        }
      });
      await login(mock.req, mock.res);

      if (mock.getStatus() !== 401 || mock.getData()?.success !== false) {
        throw new Error(`Test 4 Failed: Expected 401 Unauthorized, got ${mock.getStatus()}`);
      }
      passedCount++;
      console.log("   PASSED: Wrong password rejected with 401 Unauthorized.\n");
    }

    // TEST 5: Protect Middleware with valid token
    console.log("Test 5: Auth Middleware - protect() with Valid Token");
    {
      const mock = createMockReqRes({
        headers: {
          authorization: `Bearer ${customerToken}`
        }
      });
      await protect(mock.req, mock.res, mock.next);

      if (!mock.wasNextCalled() || !mock.req.user) {
        throw new Error("Test 5 Failed: protect middleware did not attach user or call next()");
      }
      if (mock.req.user.email !== TEST_EMAIL_CUSTOMER) {
        throw new Error("Test 5 Failed: attached user email does not match token subject");
      }
      passedCount++;
      console.log("   PASSED: Valid JWT decoded, user attached to req.user, next() called.\n");
    }

    // TEST 6: Protect Middleware without token
    console.log("Test 6: Auth Middleware - protect() without Token (Access Denied)");
    {
      const mock = createMockReqRes({ headers: {} });
      await protect(mock.req, mock.res, mock.next);

      if (mock.getStatus() !== 401 || mock.wasNextCalled()) {
        throw new Error(`Test 6 Failed: Expected 401 without token, got status=${mock.getStatus()}`);
      }
      passedCount++;
      console.log("   PASSED: Missing token rejected with 401 Unauthorized.\n");
    }

    // TEST 7: Get Current User Profile (GET /api/auth/me)
    console.log("Test 7: Get Current User Profile (GET /api/auth/me)");
    {
      const mock = createMockReqRes({
        user: { _id: customerUser._id }
      });
      await getMe(mock.req, mock.res);

      if (mock.getStatus() !== 200 || mock.getData()?.user?.email !== TEST_EMAIL_CUSTOMER) {
        throw new Error(`Test 7 Failed: Expected 200 with user, got ${mock.getStatus()}`);
      }
      passedCount++;
      console.log("   PASSED: Retrieved authenticated user profile.\n");
    }

    // TEST 8: Update Profile (PUT /api/auth/profile)
    console.log("Test 8: Update Profile (PUT /api/auth/profile)");
    {
      const mock = createMockReqRes({
        user: { _id: customerUser._id },
        body: {
          name: "Updated Customer Name",
          phone: "+94779998877"
        }
      });
      await updateProfile(mock.req, mock.res);

      if (mock.getStatus() !== 200 || mock.getData()?.user?.name !== "Updated Customer Name") {
        throw new Error(`Test 8 Failed: Expected 200 with updated name, got ${mock.getStatus()}`);
      }
      passedCount++;
      console.log("   PASSED: User profile updated successfully.\n");
    }

    // TEST 9: Change Password & Re-verify Login (PUT /api/auth/change-password)
    console.log("Test 9: Change Password & Verify Login");
    {
      const mockChange = createMockReqRes({
        user: { _id: customerUser._id },
        body: {
          currentPassword: TEST_PASSWORD,
          newPassword: NEW_PASSWORD
        }
      });
      await changePassword(mockChange.req, mockChange.res);

      if (mockChange.getStatus() !== 200) {
        throw new Error(`Test 9 Failed: Change password returned status ${mockChange.getStatus()}`);
      }

      // Re-login with new password
      const mockLogin = createMockReqRes({
        body: {
          email: TEST_EMAIL_CUSTOMER,
          password: NEW_PASSWORD
        }
      });
      await login(mockLogin.req, mockLogin.res);
      if (mockLogin.getStatus() !== 200) {
        throw new Error("Test 9 Failed: Could not login with new password");
      }
      passedCount++;
      console.log("   PASSED: Password changed and verified via re-login.\n");
    }

    // TEST 10: Register Business User
    console.log("Test 10: Business User Registration (POST /api/auth/register role=business)");
    {
      const mock = createMockReqRes({
        body: {
          name: "Test Business Owner",
          email: TEST_EMAIL_BUSINESS,
          password: TEST_PASSWORD,
          role: "business",
          phone: "+94711122334"
        }
      });
      await register(mock.req, mock.res);

      if (mock.getStatus() !== 201 || mock.getData()?.user?.role !== "business") {
        throw new Error(`Test 10 Failed: Expected 201 with role 'business', got ${mock.getStatus()}`);
      }
      businessToken = mock.getData().token;
      businessUser = mock.getData().user;
      passedCount++;
      console.log("   PASSED: Business user registered with role 'business'.\n");
    }

    // TEST 11: RBAC - Customer Forbidden from Business Route
    console.log("Test 11: RBAC Middleware - authorizeRoles('business', 'admin') blocks customer");
    {
      const mock = createMockReqRes({
        user: { role: "customer" }
      });
      const rbacMiddleware = authorizeRoles("business", "admin");
      rbacMiddleware(mock.req, mock.res, mock.next);

      if (mock.getStatus() !== 403 || mock.wasNextCalled()) {
        throw new Error(`Test 11 Failed: Expected 403 Forbidden for customer, got status=${mock.getStatus()}`);
      }
      passedCount++;
      console.log("   PASSED: Customer blocked with 403 Forbidden on business role check.\n");
    }

    // TEST 12: Business Profile Creation
    console.log("Test 12: Business Profile Creation (POST /api/businesses)");
    {
      const mock = createMockReqRes({
        user: { _id: businessUser._id, email: businessUser.email, role: "business" },
        body: {
          name: "Colombo Artisan Bakery",
          category: "Cafe",
          description: "Fresh sourdough and gourmet pastries in central Colombo",
          phone: "+94112345678",
          email: "contact@artisanbakery.test",
          address: {
            street: "123 Galle Road",
            city: "Colombo",
            state: "Western Province",
            postalCode: "00300"
          },
          location: {
            type: "Point",
            coordinates: [79.8529, 6.9034]
          },
          openingHours: "07:00 AM - 08:00 PM"
        }
      });
      await createBusinessProfile(mock.req, mock.res);

      if (mock.getStatus() !== 201 || !mock.getData()?.business?._id) {
        throw new Error(`Test 12 Failed: Expected 201, got ${mock.getStatus()}, data=${JSON.stringify(mock.getData())}`);
      }
      createdBusinessId = mock.getData().business._id;
      passedCount++;
      console.log(`   PASSED: Business profile created with ID: ${createdBusinessId}.\n`);
    }

    // TEST 13: Verify User-Business Linkage
    console.log("Test 13: Verify User Model Link to Business Profile");
    {
      const updatedUser = await User.findById(businessUser._id);
      if (!updatedUser.businessId || String(updatedUser.businessId) !== String(createdBusinessId)) {
        throw new Error("Test 13 Failed: User businessId was not updated with created Business ID");
      }
      passedCount++;
      console.log("   PASSED: User record automatically linked to business profile.\n");
    }

    // TEST 14: Get My Business Profile
    console.log("Test 14: Get My Business Profile (GET /api/businesses/my-business)");
    {
      const mock = createMockReqRes({
        user: { _id: businessUser._id }
      });
      await getMyBusiness(mock.req, mock.res);

      if (mock.getStatus() !== 200 || mock.getData()?.business?.name !== "Colombo Artisan Bakery") {
        throw new Error(`Test 14 Failed: Expected 200, got ${mock.getStatus()}`);
      }
      passedCount++;
      console.log("   PASSED: Fetched business profile belonging to current owner.\n");
    }

    // TEST 15: Update My Business Profile
    console.log("Test 15: Update Business Profile (PUT /api/businesses/my-business)");
    {
      const mock = createMockReqRes({
        user: { _id: businessUser._id },
        body: {
          openingHours: "06:30 AM - 09:30 PM",
          description: "Updated description: Premier artisan baked goods."
        }
      });
      await updateMyBusiness(mock.req, mock.res);

      if (mock.getStatus() !== 200 || mock.getData()?.business?.openingHours !== "06:30 AM - 09:30 PM") {
        throw new Error(`Test 15 Failed: Expected 200 with updated opening hours, got ${mock.getStatus()}`);
      }
      passedCount++;
      console.log("   PASSED: Business profile updated successfully.\n");
    }

    // TEST 16: Public Get Business by ID (API Contract for Members 2, 3, 4)
    console.log("Test 16: Public Get Business By ID (GET /api/businesses/:id)");
    {
      const mock = createMockReqRes({
        params: { id: String(createdBusinessId) }
      });
      await getBusinessById(mock.req, mock.res);

      if (mock.getStatus() !== 200 || mock.getData()?.business?.name !== "Colombo Artisan Bakery") {
        throw new Error(`Test 16 Failed: Expected 200, got ${mock.getStatus()}`);
      }
      passedCount++;
      console.log("   PASSED: Public business retrieval contract verified.\n");
    }

    // TEST 17: Public Search & Filter Businesses
    console.log("Test 17: Public List & Filter Businesses (GET /api/businesses?category=Cafe)");
    {
      const mock = createMockReqRes({
        query: { category: "Cafe", city: "Colombo" }
      });
      await getAllBusinesses(mock.req, mock.res);

      if (mock.getStatus() !== 200 || !Array.isArray(mock.getData()?.businesses)) {
        throw new Error(`Test 17 Failed: Expected 200 array, got ${mock.getStatus()}`);
      }
      passedCount++;
      console.log(`   PASSED: Listed businesses matching filter (count: ${mock.getData()?.count}).\n`);
    }

    // TEST 18: Optional Auth Middleware
    console.log("Test 18: optionalAuth Middleware (For Member 5 AI Logs & Public Views)");
    {
      // Case A: with token
      const mockWithToken = createMockReqRes({
        headers: { authorization: `Bearer ${customerToken}` }
      });
      await optionalAuth(mockWithToken.req, mockWithToken.res, mockWithToken.next);
      if (!mockWithToken.wasNextCalled() || !mockWithToken.req.user) {
        throw new Error("Test 18A Failed: optionalAuth did not populate req.user with valid token");
      }

      // Case B: without token
      const mockNoToken = createMockReqRes({ headers: {} });
      await optionalAuth(mockNoToken.req, mockNoToken.res, mockNoToken.next);
      if (!mockNoToken.wasNextCalled() || mockNoToken.req.user !== null) {
        throw new Error("Test 18B Failed: optionalAuth did not set req.user to null when no token provided");
      }
      passedCount++;
      console.log("   PASSED: optionalAuth correctly sets req.user with or without token.\n");
    }

    console.log("-----------------------------------------------------------------");
    console.log("Cleaning up test records from MongoDB...");
    await User.deleteMany({ email: { $in: [TEST_EMAIL_CUSTOMER, TEST_EMAIL_BUSINESS] } });
    if (createdBusinessId) {
      await Business.findByIdAndDelete(createdBusinessId);
    }
    console.log("Test records cleaned up successfully.");
    console.log("-----------------------------------------------------------------\n");

    console.log("=================================================================");
    console.log(` ALL ${passedCount} TESTS PASSED SUCCESSFULLY! (100% COMPLETE)`);
    console.log(" Member 1 (Abdul-Rahman) module is fully verified and ready!");
    console.log("=================================================================\n");

  } catch (err) {
    console.error("\nTEST SUITE FAILED with error:\n", err);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    process.exit(process.exitCode || 0);
  }
};

runTests();
