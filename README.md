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

[**Explore Features**](#-core-features) • [**Interactive Map**](#-interactive-map--geospatial-engine) • [**Tech Stack**](#-technology-stack) • [**Architecture**](#-architecture--data-flow) • [**Getting Started**](#-getting-started) • [**API Reference**](#-api-endpoints) • [**HitMeUp Pay**](#-hitmeup-pay-simulated-payment-gateway)

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
