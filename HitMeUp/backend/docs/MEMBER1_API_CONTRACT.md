# Member 1 (Abdul-Rahman) – User & Business Module API Contract

**Owner:** Member 1 (Abdul-Rahman)  
**Primary Modules:** User & Business Management, Authentication, Authorization Middleware  
**Consumer Modules:** Member 2 (Deals), Member 3 (Discovery), Member 4 (Orders & Payments), Member 5 (AI)

---

## 1. Authentication Middleware Usage for Teammates

All teammates must protect routes using the shared middleware located at:
```javascript
const { protect, authorizeRoles, optionalAuth } = require("../middleware/authMiddleware");
```

### 1.1 Protect Route (Require Authenticated User)
Use `protect` when an endpoint requires the caller to be logged in (Customer, Business, or Admin).
```javascript
router.post("/create-order", protect, orderController.createOrder);
```
Inside the controller, `req.user` is guaranteed to exist:
```javascript
// Access authenticated identity
const userId = req.user._id;     // or req.user.id
const userRole = req.user.role;   // "customer" | "business" | "admin"
const userEmail = req.user.email;
const businessId = req.user.businessId; // Populated if role === "business"
```

### 1.2 Restrict by Role (RBAC)
Use `authorizeRoles` after `protect` to restrict endpoints to specific roles:
```javascript
// Only business owners can create or edit deals
router.post("/deals", protect, authorizeRoles("business", "admin"), dealController.createDeal);
```

### 1.3 Optional Authentication
Use `optionalAuth` when authentication is optional (e.g., public deal views or AI logging):
```javascript
router.post("/generate-deal", optionalAuth, aiController.generateDealController);
// Inside controller:
const userId = req.user?.id || null;
```

---

## 2. Token Format & Header Specification

All API calls to protected endpoints must pass the JWT token in standard Bearer format:
```http
Authorization: Bearer <jwt_token>
```

### Token Payload
The issued JWT payload contains:
```json
{
  "id": "673f8a...",
  "role": "customer" | "business" | "admin",
  "email": "user@example.com",
  "businessId": "673f8b..." // present if business user has registered a profile
}
```

---

## 3. Database Models Reference

### 3.1 User Model (`models/User.js`)
| Field | Type | Description |
|---|---|---|
| `name` | String | Full name |
| `email` | String | Unique, lowercase email |
| `role` | String | `"customer"` \| `"business"` \| `"admin"` (default `"customer"`) |
| `phone` | String | Phone number |
| `avatar` | String | Profile picture URL |
| `businessId` | ObjectId | Reference to `Business` model |
| `isActive` | Boolean | Account status flag (default `true`) |

### 3.2 Business Model (`models/Business.js`)
| Field | Type | Description |
|---|---|---|
| `name` | String | Business trading name |
| `category` | String | `"Restaurant"` \| `"Cafe"` \| `"Retail"` \| `"Fashion"` \| `"Electronics"` \| `"Salon"` \| `"Fitness"` \| `"Entertainment"` \| `"Groceries"` \| `"Other"` |
| `description` | String | Overview of business |
| `ownerId` | ObjectId | Reference to `User` (unique) |
| `phone` | String | Contact phone |
| `email` | String | Business email |
| `address` | Object | `{ street, city, state, postalCode, country }` |
| `location` | GeoJSON Point | `{ type: "Point", coordinates: [longitude, latitude] }` (2dsphere index) |
| `openingHours`| String | e.g. `"09:00 AM - 09:00 PM"` |
| `status` | String | `"active"` \| `"inactive"` \| `"pending"` |

---

## 4. Endpoints Reference

### Authentication Endpoints (`/api/auth`)

#### 1. Register User
`POST /api/auth/register` (Public)
```json
// Request
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "Password123!",
  "role": "customer", // or "business"
  "phone": "+94771234567"
}

// Response 201 Created
{
  "success": true,
  "message": "User registered successfully",
  "token": "eyJhbGciOi...",
  "user": {
    "_id": "673...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "customer",
    "phone": "+94771234567"
  }
}
```

#### 2. Login User
`POST /api/auth/login` (Public)
```json
// Request
{
  "email": "jane@example.com",
  "password": "Password123!"
}

// Response 200 OK
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOi...",
  "user": {
    "_id": "673...",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "role": "customer",
    "businessId": null
  }
}
```

#### 3. Get Current User Profile
`GET /api/auth/me` (Protected: `protect`)
Returns current authenticated user and populates `businessId` details if business account.

#### 4. Update Profile
`PUT /api/auth/profile` (Protected: `protect`)
Body: `{ "name": "...", "phone": "...", "avatar": "..." }`

#### 5. Change Password
`PUT /api/auth/change-password` (Protected: `protect`)
Body: `{ "currentPassword": "...", "newPassword": "..." }`

---

### Business Profile Endpoints (`/api/businesses`)

#### 1. Create Business Profile
`POST /api/businesses` (Protected: `protect`, `authorizeRoles("business", "admin")`)
```json
// Request
{
  "name": "Artisan Coffee",
  "category": "Cafe",
  "description": "Specialty espresso and brunch",
  "phone": "+94112345678",
  "email": "contact@artisancoffee.lk",
  "address": {
    "street": "12 Galle Road",
    "city": "Colombo",
    "postalCode": "00300"
  },
  "location": {
    "type": "Point",
    "coordinates": [79.8529, 6.9034]
  },
  "openingHours": "07:00 AM - 08:00 PM"
}

// Response 201 Created
{
  "success": true,
  "message": "Business profile created successfully",
  "business": { ... }
}
```

#### 2. Get My Business
`GET /api/businesses/my-business` (Protected: `protect`, `authorizeRoles("business", "admin")`)
Returns current logged-in business owner's business profile.

#### 3. Update My Business
`PUT /api/businesses/my-business` (Protected: `protect`, `authorizeRoles("business", "admin")`)
Updates business settings, opening hours, address, location.

#### 4. Get Business By ID
`GET /api/businesses/:id` (Public)
Used by Member 2 (Deals), Member 3 (Discovery), and Member 4 (Orders) to display business info on deals and receipts.

#### 5. List & Filter Businesses
`GET /api/businesses?category=Cafe&city=Colombo&search=Artisan` (Public)
Used by Member 3 (Discovery) for business category filtering and keyword search.
