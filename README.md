<div align="center">

# ⚡ HitMeUp

### *Discover More. Spend Less. Deal Smarter.*

**A modern, AI-powered real-time flash deals marketplace connecting local merchants with shoppers.**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas_2dsphere-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Leaflet](https://img.shields.io/badge/Leaflet-1.9.4_Maps-199900?style=for-the-badge&logo=leaflet&logoColor=white)](https://leafletjs.com/)
[![NVIDIA AI](https://img.shields.io/badge/NVIDIA-NIM_AI-76B900?style=for-the-badge&logo=nvidia&logoColor=white)](https://build.nvidia.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg?style=for-the-badge)](LICENSE)

[**Explore Features**](#-core-features) • [**Interactive Map**](#-interactive-map--geospatial-engine) • [**Tech Stack**](#-technology-stack) • [**Getting Started**](#-getting-started) • [**API Reference**](#-api-endpoints) • [**HitMeUp Pay**](#-hitmeup-pay-simulated-payment-gateway)

---

</div>

## 🌟 Overview

**HitMeUp** is a full-stack MERN marketplace designed to solve the friction of discovering and redeeming limited-time **flash promotions** from local retail stores, cafes, salons, and restaurants.

Shoppers can explore deals on an **interactive multi-store map**, filter by categories and proximity, purchase or claim instant vouchers, and redeem them in-store via secure QR/passcodes. Businesses manage promotions with an **NVIDIA AI Copilot**, set precise store coordinates, and redeem customer passes directly through a built-in POS dashboard.

---

## ✨ Core Features

### 🛍️ Shopper Experience
* **🗺️ Interactive Deals Map**: Flag every merchant offering live deals simultaneously. Center on user GPS, switch between street & satellite layers, and get instant turn-by-turn Google Maps directions.
* **⚡ Live Flash Promotions**: Browse curated discounts across Restaurants, Fashion, Electronics, Health & Beauty, and Services with real-time countdown clocks and quantity caps.
* **📍 Proximity-Aware Filtering**: MongoDB `2dsphere` geospatial indexing finds offers closest to the customer's coordinates.
* **🎟️ Digital Voucher Passes**: One-click claim or purchase of vouchers with live database inventory deduction and unique alphanumeric codes (`HMU-XXXX-XXXXXX`).
* **📱 Customer Dashboard**: Manage claimed vouchers, inspect expiration countdowns, view store details, and toggle QR passes for seamless merchant check-in.

### 🏪 Merchant & Seller Center
* **🤖 NVIDIA AI Deal Copilot**: Auto-draft viral titles, persuasive descriptions, recommended discount percentages, and target customer profiles using the NVIDIA AI NIM integration.
* **📌 Drag-and-Drop Storefront Pinning**: Interactively click or drag on the map inside the Seller Dashboard to pinpoint exact storefront coordinates.
* **⚡ In-Store POS Quick-Redeem**: Verify and redeem customer voucher codes with immediate database validation to prevent reuse.
* **📊 Real-Time Metrics Overview**: Monitor total deals, live promotions, draft statuses, inventory pools, and average store discounts.
* **🇱🇰 Sri Lanka Locations Dataset**: Integrated district and city database for fast registration and localized promotion targeting.

### 🛡️ Administration & Quality
* **👥 Account & Role Governance**: Role-based access control (`customer`, `seller`, `business`, `admin`) with protected API routes.

---

## 🗺️ Interactive Map & Geospatial Engine

The discovery map uses Leaflet on the frontend and MongoDB geospatial queries on the backend. Users can view businesses and active deals, search by location, filter nearby offers, and open directions for a selected business.

The map discovery endpoints are available under `/api/discovery`:

| Endpoint | Purpose | Authentication |
| :--- | :--- | :--- |
| `GET /map` | Load businesses for the map | Public |
| `GET /nearby` | Find deals near latitude and longitude coordinates | Optional |
| `GET /deals` | Search and filter available deals | Optional |
| `GET /deal/:id` | View deal discovery details | Optional |
| `GET /reviews/recent` | Read recent platform reviews | Public |
| `GET /reviews/business/:businessId` | Read reviews for a business | Public |

---

## 🚀 Getting Started

### Prerequisites

Install the following before starting the application:

- **Node.js 20 or newer**, which includes npm
- A **MongoDB Atlas** database or a local MongoDB server
- Git, if you are cloning the repository
- Optional: NVIDIA NIM, Google OAuth, Cloudinary, and email-provider credentials for the related features

Check your installed versions:

```bash
node --version
npm --version
```

### 1. Get the project

Clone the repository and enter its folder:

```bash
git clone <repository-url>
cd HitMeUp-Project/HitMeUp
```

If the project is already on your computer, open a terminal in the `HitMeUp` directory instead.

### 2. Configure the backend

Open a terminal in `HitMeUp/backend` and install the backend dependencies.

PowerShell:

```powershell
cd HitMeUp/backend
npm install
Copy-Item .env.example .env
```

macOS/Linux:

```bash
cd HitMeUp/backend
npm install
cp .env.example .env
```

Open `backend/.env` and set at least these values:

```env
PORT=5000
MONGO_URI="your-mongodb-connection-string"
JWT_SECRET="replace-with-a-long-random-secret"
```

The simulated payment gateway is enabled by default for local development. Add `NVIDIA_API_KEY`, `GOOGLE_CLIENT_ID`, Cloudinary, or email-provider values only when you need those features. Never commit `.env` or paste real credentials into an issue or pull request.

### OTP email deliverability

Use a sender address from a domain verified with your email provider. For Brevo or Resend, configure the provider's SPF and DKIM DNS records, then publish a DMARC policy for the same domain. Set `BREVO_SENDER_EMAIL` or `RESEND_FROM` to that verified sender; do not send through Brevo or Resend while claiming an unrelated Gmail address. Avoid Resend's `onboarding@resend.dev` sandbox sender for real users. Test the message headers after deployment to confirm SPF, DKIM, and DMARC pass.

### 3. Install frontend dependencies

Open a second terminal in `HitMeUp/frontend`:

```bash
npm install
```

The local Vite proxy sends frontend `/api` requests to `http://localhost:5000`. To use a different backend URL, create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:5000/api
```

Google sign-in also requires this optional frontend variable:

```env
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

### 4. Start the application

Keep both terminals running.

In the backend terminal:

```bash
npm run dev
```

In the frontend terminal:

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a browser. The backend health check is available at [http://localhost:5000/health](http://localhost:5000/health).

To run the backend without automatic restart, use `npm start` instead of `npm run dev`. To create a production frontend build, run `npm run build` in `HitMeUp/frontend`, then preview it with `npm run preview`.

### Troubleshooting local startup

- **`MONGO_URI environment variable is missing`**: create `HitMeUp/backend/.env` from `.env.example` and set `MONGO_URI`.
- **Port already in use**: set another backend `PORT`, then set the matching `VITE_API_URL` in `frontend/.env`. The Vite proxy in `frontend/vite.config.js` must also be updated for a non-default backend port.
- **Frontend cannot reach the API**: start both servers and verify that `/health` returns JSON from port `5000`.
- **MongoDB connection fails**: confirm the Atlas IP allowlist, database user, password, and connection string.

---

## 🔌 API Endpoints

The backend runs at `http://localhost:5000` by default. Routes that require authentication expect a JWT in the `Authorization: Bearer <token>` header.

| Route group | Important endpoints | Purpose |
| :--- | :--- | :--- |
| Health | `GET /health`, `GET /api/health` | Check API availability and database status |
| Authentication | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | Register, sign in, and read the current user |
| Businesses | `GET /api/businesses`, `GET /api/businesses/:id` | Browse business profiles |
| Deals | `GET /api/deals`, `GET /api/deals/:id`, `POST /api/deals` | Browse and manage flash deals |
| Discovery | `GET /api/discovery/map`, `GET /api/discovery/nearby` | Map and location-based discovery |
| Orders | `POST /api/orders`, `GET /api/orders/my-orders` | Create and view customer orders |
| Payments | `POST /api/payments/create`, `GET /api/payments/my-payments` | Create and view simulated payments |
| Vouchers | `POST /api/vouchers/claim`, `GET /api/vouchers` | Claim and view vouchers |
| AI | `/api/ai/*` | Generate and manage AI-assisted deal content |
| Uploads | `/api/upload/*` | Upload deal and business images |
| Administration | `/api/admin/*` | Admin-only platform management |

For complete payment states, request examples, and gateway details, see [`docs/HITMEUP_PAY.md`](docs/HITMEUP_PAY.md). Postman collections are available in `HitMeUp/backend/postman`.

---

## 💳 HitMeUp Pay: Simulated Payment Gateway

HitMeUp includes **HitMeUp Pay**, a fully integrated educational simulated payment processing platform (*Fast. Secure. Seamless.*) designed for purchasing digital vouchers and flash deals.

> ⚠️ **Educational Simulation:** HitMeUp Pay processes **no real money** and accepts no real card or banking credentials. It demonstrates production-grade fintech patterns: HMAC-SHA256 signature verification, idempotent execution, atomic reserve-then-commit inventory control, simulated refunds with voucher invalidation, role-scoped MongoDB analytics, and printable receipts.

- **Architecture & Technical Reference**: See [`docs/HITMEUP_PAY.md`](docs/HITMEUP_PAY.md) for data models, state machines, API references, scenario triggers, and provider swap guides.
- **Interactive Checkout**: `/pay/checkout/:orderId`
- **Dynamic Result Pages**: `/pay/result/:transactionId`
- **Transactions & Revenue Analytics Dashboard**: `/dashboard/payments`
- **Printable Receipts**: `/pay/receipt/:paymentId`

---

## 🛠️ Technology Stack

| Domain | Technology / Library | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19.2 + Vite 8.3 | High-performance reactive component framework |
| **Styling** | Tailwind CSS v4.3 | Utility-first responsive design system |
| **Icons** | Lucide React | Fintech, payment, and UI iconography |
| **Backend Framework** | Node.js (v20+) + Express 5.2 | RESTful service layer & route controllers |
| **Database & ODM** | MongoDB Atlas + Mongoose 9.9 | Replica-set transactions, geospatial indices, aggregations |
| **Payment Simulation** | HMAC-SHA256 Crypto Engine | Signature verification & state machine enforcement |
| **QR Code Engine** | qrcode | High-error-correction offline counter scanning |
| **Authentication** | JSON Web Tokens (JWT) + bcrypt | Stateless auth & password hashing |

---

## 🎨 Design System & Visual Identity

HitMeUp features an energetic, high-contrast visual identity optimized for fast-paced flash commerce:

| Token | Color | Hex Code | Purpose |
| :--- | :---: | :--- | :--- |
| **Flame Red (Primary)** | <div style="background:#E8503A;width:24px;height:24px;border-radius:4px;"></div> | `#E8503A` | Primary CTAs, active discount pills, countdown timers |
| **Accent Orange** | <div style="background:#FF4A2F;width:24px;height:24px;border-radius:4px;"></div> | `#FF4A2F` | Hero gradient highlights and flash deal badges |
| **Marketplace Amber** | <div style="background:#FFB703;width:24px;height:24px;border-radius:4px;"></div> | `#FFB703` | Star ratings, AI sparkle accents, and warnings |
| **Emerald Success** | <div style="background:#1FA061;width:24px;height:24px;border-radius:4px;"></div> | `#1FA061` | Voucher redeemed, verified badge, in-stock pills |
| **Charcoal Ink** | <div style="background:#111827;width:24px;height:24px;border-radius:4px;"></div> | `#111827` | Primary headings, dark buttons, store card headers |
| **Warm Canvas** | <div style="background:#FAF8F5;width:24px;height:24px;border-radius:4px;"></div> | `#FAF8F5` | Background canvas surface for comfortable contrast |

---

## 🤝 Contributing

We welcome community feedback and contributions!

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📄 License

Distributed under the **ISC License**. See [`LICENSE`](LICENSE) for details.

<div align="center">

**Built with ❤️ for shoppers and local businesses.**

⭐ *If you find HitMeUp helpful, please consider starring the repository!*

</div>
