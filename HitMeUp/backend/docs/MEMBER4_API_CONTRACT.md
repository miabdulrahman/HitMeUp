# Member 4 (Rushdhi) – Orders, Payments & Vouchers API Contract

**Owner:** Member 4 (Rushdhi)  
**Primary Modules:** Orders, Payment Processing, Digital Vouchers, QR Code & Redemption  
**Consumer Modules:** Member 1 (Auth identity), Member 2 / 3 (Deal pricing & discovery UI), Member 5 (AI purchase logs & fraud detection)

---

## 1. Module Overview & Transaction Lifecycle

Member 4 manages the transactional lifecycle of flash deals:
```text
Customer selects Deal
       │
       ▼
1. POST /api/orders (Creates PENDING order)
       │
       ├── PUT /api/orders/:id/cancel (Customer can cancel if unpaid)
       ▼
2. POST /api/payments/create (Creates PENDING payment session)
       │
       ▼
3. POST /api/payments/verify OR Webhook (Verifies payment)
       │
       ├── Payment status -> SUCCESS
       ├── Order status -> PAID
       └── Voucher generated (status: ACTIVE + QR DataURL)
       │
       ▼
4. GET /api/vouchers/code/:code (Cashier scans QR to preview voucher details)
       │
       ▼
5. POST /api/vouchers/redeem (Business owner marks redeemed)
       │
       ├── Voucher status -> REDEEMED
       ├── Redemption audit record created
       └── Order status -> COMPLETED
```

---

## 2. Database Models Reference

### 2.1 Order Model (`models/Order.js`)
| Field | Type | Description |
|---|---|---|
| `orderNumber` | String | Unique tracking code (e.g., `HMU-1740...`) |
| `customerId` | ObjectId | Reference to `User` (Customer) |
| `dealId` | ObjectId | Reference to `Deal` |
| `amount` | Number | Final selling/discounted amount charged (LKR) |
| `currency` | String | Currency code (Default: `"LKR"`) |
| `status` | String | `"PENDING"` \| `"PAID"` \| `"FAILED"` \| `"CANCELLED"` \| `"COMPLETED"` |
| `paymentId` | ObjectId | Reference to `Payment` |
| `expiresAt` | Date | Deal expiration timestamp |

### 2.2 Payment Model (`models/Payment.js`)
| Field | Type | Description |
|---|---|---|
| `orderId` | ObjectId | Reference to `Order` |
| `customerId` | ObjectId | Reference to `User` |
| `amount` | Number | Charged amount |
| `currency` | String | `"LKR"` |
| `provider` | String | Gateway identifier (`"DEMO"`, `"PAYHERE"`, `"STRIPE"`) |
| `transactionId` | String | Unique gateway transaction reference |
| `status` | String | `"PENDING"` \| `"SUCCESS"` \| `"FAILED"` \| `"REFUNDED"` |
| `paidAt` | Date | Timestamp of successful payment |

### 2.3 Voucher Model (`models/Voucher.js`)
| Field | Type | Description |
|---|---|---|
| `orderId` | ObjectId | Reference to `Order` (unique) |
| `customerId` | ObjectId | Reference to `User` |
| `dealId` | ObjectId | Reference to `Deal` |
| `code` | String | Unique voucher code (e.g., `HMU-9F3B1A2C`) |
| `qrData` | String | Base64 PNG DataURL representing `HITMEUP:<CODE>` |
| `status` | String | `"ACTIVE"` \| `"REDEEMED"` \| `"EXPIRED"` \| `"CANCELLED"` |
| `expiresAt` | Date | Voucher expiry date matching deal |
| `redeemedAt`| Date | Timestamp when redeemed |

### 2.4 Redemption Model (`models/Redemption.js`)
| Field | Type | Description |
|---|---|---|
| `voucherId` | ObjectId | Reference to `Voucher` |
| `orderId` | ObjectId | Reference to `Order` |
| `businessId`| ObjectId | Reference to `Business` that honored the voucher |
| `redeemedBy`| ObjectId | Reference to `User` (Business owner / cashier) |
| `redeemedAt`| Date | Timestamp of redemption |

---

## 3. Endpoints Reference

### 3.1 Order Endpoints (`/api/orders`)

#### 1. Create Order
* **Method & Path:** `POST /api/orders`
* **Access:** Protected (`protect`, Customer)
* **Request Body:** `{ "dealId": "673f8a9b1c2d3e4f5a6b7c8d" }`
* **Response (201 Created):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "6740a1b2c3d4e5f6a7b8c9d0",
    "orderNumber": "HMU-1740001234567-A1B2C3D4",
    "customerId": "673f8a1...",
    "dealId": "673f8a9b1c2d3e4f5a6b7c8d",
    "amount": 840,
    "status": "PENDING"
  }
}
```

#### 2. Get Customer Orders
* **Method & Path:** `GET /api/orders`
* **Access:** Protected (`protect`)
* **Response (200 OK):** Returns array of customer orders with populated deal info.

#### 3. Cancel Pending Order
* **Method & Path:** `PUT /api/orders/:id/cancel`
* **Access:** Protected (`protect`, Customer)
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": { "_id": "...", "status": "CANCELLED" }
}
```

#### 4. Get Business Orders & Revenue Analytics
* **Method & Path:** `GET /api/orders/business`
* **Access:** Protected (`protect`, Roles: `business`, `admin`)
* **Response (200 OK):**
```json
{
  "success": true,
  "count": 12,
  "totalRevenue": 24000,
  "data": [ ... ]
}
```

---

### 3.2 Payment Endpoints (`/api/payments`)

#### 1. Create Payment Session
* **Method & Path:** `POST /api/payments/create`
* **Access:** Protected (`protect`)
* **Request Body:** `{ "orderId": "6740a1b2c3d4e5f6a7b8c9d0" }`
* **Response (201 Created):** Returns payment session with status `PENDING`.

#### 2. Verify Payment
* **Method & Path:** `POST /api/payments/verify`
* **Access:** Protected (`protect`)
* **Request Body:**
```json
{
  "paymentId": "6740a2b3c4d5e6f7a8b9c0d1",
  "transactionId": "TXN-DEMO-998877",
  "success": true
}
```
* **Response (200 OK):** Updates order to `PAID`, payment to `SUCCESS`, and generates active digital voucher with base64 QR DataURL.

#### 3. Payment Webhook Callback
* **Method & Path:** `POST /api/payments/webhook`
* **Access:** Public (Gateway webhook signature / server-to-server)
* **Request Body:** `{ "paymentId": "...", "transactionId": "...", "status": "SUCCESS" }`

---

### 3.3 Voucher Endpoints (`/api/vouchers`)

#### 1. Get Customer Vouchers
* **Method & Path:** `GET /api/vouchers`
* **Access:** Protected (`protect`)
* **Response (200 OK):** Returns customer's active and redeemed vouchers.

#### 2. Preview Voucher by Code (Cashier Scan View)
* **Method & Path:** `GET /api/vouchers/code/:code`
* **Access:** Protected (`protect`, Roles: `business`, `admin`)
* **Note:** Supports either raw code (`HMU-9F3B1A2C`) or full QR scanned text (`HITMEUP:HMU-9F3B1A2C`).
* **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "voucher": {
      "code": "HMU-9F3B1A2C",
      "status": "ACTIVE",
      "dealId": { "title": "Crispy Chicken Burger", "discountedPrice": 840 },
      "customerId": { "name": "John Doe", "email": "john@example.com" }
    },
    "belongsToCurrentBusiness": true
  }
}
```

#### 3. Redeem Voucher
* **Method & Path:** `POST /api/vouchers/redeem`
* **Access:** Protected (`protect`, Roles: `business`, `admin`)
* **Request Body:** `{ "code": "HMU-9F3B1A2C" }` *(or `"HITMEUP:HMU-9F3B1A2C"`)*
* **Response (200 OK):**
```json
{
  "success": true,
  "message": "Voucher redeemed successfully",
  "data": {
    "voucher": { "status": "REDEEMED", "redeemedAt": "2026-10-22T00:15:00.000Z" },
    "redemption": { "_id": "...", "businessId": "...", "redeemedBy": "..." }
  }
}
```
