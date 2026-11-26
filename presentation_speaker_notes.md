# HitMeUp — Group Presentation Speaker Notes & Technical Defense Guide
**Course:** Software Development Project / Final Year Project Presentation  
**Group:** Group E | **Format:** Recorded Video Presentation (20–25 Minutes)  
**Target Audience:** Academic Lecturer & Assessment Panel  

---

## Presentation Structure & Timing Overview

| Section | Speaker | Registration No. | Topic Focus | Target Time |
| :--- | :--- | :--- | :--- | :--- |
| **Intro & Overview** | Group Spokesperson | Group E | Problem Statement, Value Proposition & Core Objectives | 3–4 mins |
| **Presenter 1** | **N M Anshaf** | SEU/IS/22/ICT/084 | Modern Frontend Architecture, UI/UX Design System & iOS PWA | 4–5 mins |
| **Presenter 2** | **M I Abdul Rahman** | SEU/IS/22/ICT/023 | System Architecture, Database Modeling (Mongoose) & Security/RBAC | 4–5 mins |
| **Presenter 3** | **Nazmi Ahamed** | SEU/IS/22/ICT/090 | Deal Lifecycle Management & MongoDB Geospatial Discovery Engine | 4–5 mins |
| **Presenter 4** | **M.S.M Rushdhy** | SEU/IS/22/ICT/086 | Order Workflow, Payment State Machine & QR Voucher POS Lifecycle | 4–5 mins |
| **Presenter 5** | **Prabhath Nishantha** | SEU/IS/22/ICT/041 | NVIDIA NIM AI Services, Administrative Governance & Cloud CI/CD | 4–5 mins |

---

## Common Overview (Opening & Problem Statement)
**Suggested Duration:** 3–4 Minutes  
**Speaker:** Initial Presenter / Group Representative  

### Spoken Script:
> "Respected lecturer and members of the evaluation panel, good day.
> 
> We are **Group E**, and today we are proud to present our comprehensive software development project: **HitMeUp**.
> 
> In Sri Lanka’s retail and SME ecosystem, local merchants face a critical visibility hurdle: traditional billboard advertising is prohibitively expensive, and social media promotions suffer from fragmented algorithmic reach. Simultaneously, consumers constantly seek real-time discounts, dining markdowns, and flash deals within their immediate walking or driving radius, but lack a single, centralized discovery hub.
> 
> This is the market imbalance that **HitMeUp** solves. Our project tagline is **'Discover. Save. Enjoy.'**
> 
> Technically, HitMeUp is an **AI-augmented, location-aware flash-deals and digital voucher marketplace**. It bridges the gap between brick-and-mortar merchants and hyper-local shoppers through four pillars:
> 1. **Hyper-Local Geospatial Discovery:** Consumers discover deals mapped in real-time according to their live GPS coordinates.
> 2. **Frictionless Digital Voucher Lifecycle:** Online reservation or purchase with cryptographic, scannable QR counter passes for instantaneous in-store redemption.
> 3. **AI Deal Copilot:** Generative AI powered by NVIDIA NIM that automates promotional copywriting and marketing strategy for non-technical small business owners.
> 4. **Enterprise Multi-Tenant Governance:** Role-based dashboards for Shoppers, Merchants, and Super Administrators.
> 
> Today, our five group members will break down the end-to-end engineering behind HitMeUp—covering our modern frontend architecture, database modeling, geospatial algorithms, transaction state machines, and microservice AI integrations."

---

## Presenter 1: Modern Frontend Architecture, UI/UX Design System & PWA
**Presenter:** N M Anshaf  
**Registration No:** SEU/IS/22/ICT/084  
**Suggested Duration:** 4–5 Minutes  
**Module Ownership:** Frontend Architecture, Component Design, Responsive Layouts & Progressive Web App (PWA)  

### 1. Spoken Script:
> "Thank you. Hello respected lecturer. I am **N M Anshaf (SEU/IS/22/ICT/084)**. In this section, I will walk you through the frontend architecture, our design token system, component hierarchy, and mobile Progressive Web App engineering.
> 
> ### Modern Frontend Technology Stack
> Our client application is engineered with **React 19** paired with **Vite 8** as the next-generation build engine, delivering lightning-fast Hot Module Replacement and production chunk optimization. Styling is handled via **Tailwind CSS v4** utilizing modern `@theme` directive tokens.
> 
> Client-side navigation is orchestrated through **React Router v7**, with distinct routing domains: public storefront pages, dedicated customer dashboards, merchant POS workspaces, and protected admin routes backed by an automated role-aware navigation redirector (`DashboardRedirect`).
> 
> ### State Architecture & Context Providers
> To maintain clean unidirectional data flow and avoid prop drilling, we built a modular context layer:
> 1. `AuthContext`: Manages user sessions, JWT token persistence in browser storage, login state hydration, and role dispatching.
> 2. `LocationContext`: Wraps the HTML5 Geolocation API, tracking live latitude, longitude, and active search radius (5km to 25km), while offering transparent fallback mechanisms if GPS permission is withheld.
> 3. `ThemeContext`: Provides a system-wide warm graphite and dark mode toggle, dynamically swapping CSS custom properties across all pages.
> 
> ### UI/UX Design System & High-Conversion Principles
> For HitMeUp’s visual identity, we avoided generic UI templates and built a dedicated, tokenized design system:
> - **Primary Brand Tone:** Terracotta Orange (`#D94832`) for active calls-to-action, stamp accents, and deal highlights.
> - **Ink & Surfaces:** Deep ink (`#1F1B16`) typography set against warm ivory surfaces (`#FDFBF7`) and neutral cards, creating an authentic, trustworthy retail atmosphere.
> - **Typography:** We paired *Newsreader* for editorial serif accents with *Instrument Sans* for high-legibility interface copy, and *IBM Plex Mono* for tabular numerical prices and countdown timers.
> 
> ### Mobile-First & iOS Progressive Web App (PWA)
> Understanding that shoppers redeem flash vouchers physically in stores, we treated mobile as a first-class citizen:
> - We engineered a fixed bottom navigation dock with touch-optimized targets and safe-area inset compensation for modern smartphones.
> - We configured full **PWA capabilities**: an automated Service Worker (`sw.js`) implementing a stale-while-revalidate strategy for instant offline shell loading, a complete Web App Manifest, high-resolution Apple Touch Icons, and `viewport-fit=cover` tags.
> - Because iOS Safari does not natively support automated install prompts, we engineered a custom `IosInstallPrompt` component that detects iOS devices and displays a 3-step visual guide instructing users to 'Add to Home Screen', giving them an app-like, full-screen native experience without browser toolbars.
> 
> ### Dynamic Modal Hierarchy
> When browsing deals, shoppers interact with layered modals. To prevent stacking context collisions, we established strict z-index budgeting: base popups render at `z-50`, while our interactive `DealDetailModal` renders at `z-[60]` with background blur, countdown timers, and synchronized seller profile transitions."

### 2. Demonstration Guide (Visual Cue):
1. **Show Landing Page (`/`):** Demonstrate the responsive hero section, category filters, and live countdown timer on flash deals.
2. **Toggle Theme:** Click the floating theme toggle in the bottom corner to show instant dark/light token adaptation.
3. **Show PWA & Mobile View:** Toggle browser DevTools to iPhone view; show the bottom dock navigation and open the mobile drawer menu showing the *"Install HitMeUp App"* option.
4. **Show Deal Modal:** Click on a deal card to show the `DealDetailModal` with stock status, countdown timer, and merchant info.

### 3. Lecturer Viva Defense / Q&A Preparation:
* **Q: Why did you choose React 19 and Vite instead of traditional Create React App or Next.js?**  
  * **Answer:** *"Create React App is officially deprecated. Vite provides native ES module bundling, near-instant HMR, and tree-shaking that yields a sub-second production build (~600ms). While Next.js is SSR-focused, HitMeUp is an interactive, authenticated SPA dashboard and geospatial discovery platform where client-side rendering with Service Worker caching provides the lowest latency for dynamic in-store interactions."*
* **Q: How does your application ensure offline reliability for claimed passes?**  
  * **Answer:** *"Our Service Worker (`sw.js`) intercepts navigation and static asset requests, serving cached shell assets even if the customer enters an indoor shopping mall with poor cellular reception, ensuring customer voucher codes remain accessible."*

---

## Presenter 2: System Architecture, Database Modeling & Security/RBAC
**Presenter:** M I Abdul Rahman  
**Registration No:** SEU/IS/22/ICT/023  
**Suggested Duration:** 4–5 Minutes  
**Module Ownership:** Full-Stack Architecture, MongoDB Schemas, Geospatial Indexing, JWT Authentication & API Security  

### 1. Spoken Script:
> "Thank you, Anshaf. Hello respected lecturer and panel. I am **M I Abdul Rahman (SEU/IS/22/ICT/023)**. In this section, I will detail our backend system architecture, Mongoose data modeling, and our multi-layered security and access control implementation.
> 
> ### Client-Server Decoupled Architecture
> HitMeUp follows a robust **RESTful Model-View-Controller (MVC) and Service-Layer architecture**:
> - The client React application communicates strictly over HTTPS via an Axios API client with standardized response interceptors.
> - The backend is powered by **Node.js (v20)** and **Express.js**, deployed in a containerized environment on **Render**.
> - The request lifecycle travels through an organized pipeline: **Route Handlers** receive the request -> **Authentication & Validation Middleware** verify credentials and sanitize inputs -> **Controllers** execute domain logic -> **Services** handle third-party APIs and state machines -> and **Mongoose Models** interact with **MongoDB Atlas**.
> 
> ### Relational Data Modeling in a Document Database
> In MongoDB, we designed specialized Mongoose schemas balancing normalization with read-heavy performance:
> 1. `User.js`: Implements user identity, encrypted passwords using `bcryptjs` with 10 salt rounds, role definitions (`customer`, `seller`, `admin`), phone numbers, and email verification status.
> 2. `Business.js`: Represents physical merchants. It stores store branding, operational hours, verified badges (`isVerified`), and most crucially, a **GeoJSON Point schema** storing `[longitude, latitude]` with a compound **`2dsphere` spatial index**. This enables ultra-fast geospatial calculations.
> 3. `Deal.js`: Houses the promotion data—original price, discount percentage, calculated sale price, inventory quotas (`availableQuantity`, `claimedQuantity`), terms, and start/end dates.
> 4. `Voucher.js`: The central entitlement document connecting a customer, a deal, and a merchant with unique alphanumeric pass codes and status states (`active`, `used`, `expired`).
> 5. Supporting models: `Order.js`, `Payment.js`, `GatewayTransaction.js`, `Review.js`, and `AdminActivityLog.js`.
> 
> ### Authentication & Role-Based Access Control (RBAC)
> Platform security is implemented through stateless **JSON Web Tokens (JWT)**:
> - Upon login, the server signs a JWT containing the user’s ID and role with a 7-day expiration.
> - Our `authMiddleware` intercepts incoming requests, verifies the `Bearer` token in the `Authorization` header, and attaches the authenticated user record to Express's `req.user`.
> - For role-restricted endpoints, we use a higher-order middleware `authorizeRoles('admin', 'seller')` that verifies permissions before controller execution, ensuring that customers cannot access merchant dashboards, and merchants cannot modify other businesses' promotions.
> 
> ### Hardened API Security & Defensive Coding
> To prevent common web vulnerabilities:
> - **ReDoS & Query Injection Protection:** We implemented strict sanitization utilities (`escapeRegex`) and parameter guards to neutralize malicious regex denial-of-service attempts and NoSQL injection in search queries.
> - **ID Normalization:** Controllers validate whether incoming identifiers are valid 24-character MongoDB `ObjectId` types using `mongoose.Types.ObjectId.isValid()`, preventing server crashes on malformed inputs.
> - **CORS & Environment Isolation:** Production credentials (MongoDB connection strings, JWT secrets, NVIDIA API keys) are strictly managed via environment variables and never exposed to the client bundle."

### 2. Demonstration Guide (Visual Cue):
1. **Show Backend Project Directory Structure:** Briefly show the clean folder separation: `controllers/`, `models/`, `routes/`, `middleware/`, `services/`.
2. **Highlight Mongoose Model (`Business.js`):** Point to the GeoJSON `location: { type: 'Point', coordinates: [...] }` and `businessSchema.index({ location: '2dsphere' })`.
3. **Demonstrate Route Protection:** Attempt or explain how an unauthenticated request to `/api/admin/overview` receives a strict `401 Unauthorized` or `403 Forbidden` response.

### 3. Lecturer Viva Defense / Q&A Preparation:
* **Q: Why did you choose MongoDB over a traditional Relational DBMS like PostgreSQL or MySQL?**  
  * **Answer:** *"Retail promotions and merchant profiles vary significantly by category—a restaurant deal requires food safety flags, whereas a spa deal requires appointment terms. MongoDB’s polymorphic document model accommodates flexible deal schemas while its native `2dsphere` indexing offers native, highly optimized geospatial queries without the overhead of spatial extensions."*
* **Q: How does HitMeUp prevent Horizontal Privilege Escalation where Seller A tries to edit Seller B's deals?**  
  * **Answer:** *"In our `dealController.js`, we do not rely solely on the deal ID. When an update or delete request arrives, we verify that `deal.businessId` matches the `business._id` owned by the authenticated `req.user.id`. If they do not match, the controller throws a 403 Forbidden error."*

---

## Presenter 3: Deal Management & Location-Based Discovery Engine
**Presenter:** Nazmi Ahamed  
**Registration No:** SEU/IS/22/ICT/090  
**Suggested Duration:** 4–5 Minutes  
**Module Ownership:** Deal Creation Pipeline, Auto-Expiration Engine, Leaflet Map Integration & Geospatial Search  

### 1. Spoken Script:
> "Thank you, Abdul Rahman. Hello respected lecturer. I am **Nazmi Ahamed (SEU/IS/22/ICT/090)**. My focus in this project is the core engine of HitMeUp: our **Deal Lifecycle Management** and **Location-Based Discovery System**.
> 
> ### The Deal Management Lifecycle
> For merchants, publishing a flash deal must be simple yet strictly validated. In `dealController.js`:
> - When a seller creates a deal, the backend enforces mathematical and temporal invariants: the discounted price cannot exceed the original price, the start date must precede the end date, and stock quotas must be positive integers.
> - **Dynamic Deal Auto-Expiration:** Unlike static listing sites where expired deals clutter search results, our system runs an active query-level expiration sweep: whenever deals are requested, the database auto-updates any deals where `endDate <= new Date()` to status `expired`.
> 
> ### Location-Based Geospatial Discovery Pipeline
> The defining feature of HitMeUp is connecting shoppers with deals they can physically reach today. We engineered this through a dual client-server geospatial pipeline:
> 1. **MongoDB Geospatial Querying:** In `discoveryController.js`, when a shopper searches with location enabled, we execute a `$near` geospatial query against MongoDB's `2dsphere` index:
>    ```javascript
>    $near: {
>      $geometry: { type: "Point", coordinates: [lng, lat] },
>      $maxDistance: radiusInKm * 1000
>    }
>    ```
>    This retrieves active merchants within a precise boundary (e.g., 5km, 15km, or 25km).
> 2. **Client-Side Leaflet & OpenStreetMap Integration:** On the frontend, `MapDiscoveryView.jsx` renders an interactive map using Leaflet. Stores are displayed with custom HTML map markers colored by category.
> 3. **Distance Calculation:** Using the Haversine mathematical formula on the coordinates, we display clear distance badges on every deal card (e.g., '1.4 km away'), helping shoppers make instant decisions.
> 
> ### Multi-Faceted Search & Category Taxonomy
> Deals can be discovered through multiple dimensions:
> - **Category Taxonomy:** We built a normalized category mapping (`CATEGORY_MAP`) spanning Food & Dining, Fashion, Electronics, Home, Health & Beauty, Sports, and Services.
> - **Sorting Matrix:** Users can dynamically sort by Highest Discount (`discount_desc`), Lowest Price (`price_asc`), Nearest Distance (`distance`), or Expiring Soonest (`expiring_soon`).
> 
> ### Intelligent Fallback & Resilience
> In real-world mobile usage, GPS permissions can fail or users might be located in rural regions where no merchant is currently within 25km. In `FeaturedDeals.jsx`, rather than leaving the user with an empty white screen, our discovery engine automatically detects zero-result spatial queries and seamlessly falls back to trending platform-wide deals, guaranteeing zero dead ends for shoppers."

### 2. Demonstration Guide (Visual Cue):
1. **Show Discovery Page (`/deals`):** Demonstrate category pill filtering (e.g., clicking 'Food & dining').
2. **Switch to Map View (`/deals?view=map`):** Show the interactive Leaflet map, pan around Colombo, and click on a store marker to show the store popup with its active deals.
3. **Show Distance Indicator:** Highlight how deal cards display live distance (e.g., 'Within 5km') and the *"Show nearby"* toggle.

### 3. Lecturer Viva Defense / Q&A Preparation:
* **Q: What is the difference between MongoDB `$near` and `$geoWithin`? Why did you use `$near`?**  
  * **Answer:** *"`$geoWithin` checks whether points exist inside a defined polygon or circle, but does not sort them. We used `$near` because it both filters within the `$maxDistance` sphere and automatically returns the results sorted in ascending order of physical distance from the customer's coordinates."*
* **Q: How do you prevent stale deals from showing up on the map if the server hasn't run a cron job?**  
  * **Answer:** *"We use proactive query-time invalidation. Every discovery query includes `{ status: 'active', endDate: { $gt: new Date() } }`. Even if a background cron job has not run, expired deals are filtered out at the query level."*

---

## Presenter 4: Order Workflow, Payment State Machine & QR Voucher POS Lifecycle
**Presenter:** M.S.M Rushdhy  
**Registration No:** SEU/IS/22/ICT/086  
**Suggested Duration:** 4–5 Minutes  
**Module Ownership:** Order Processing, HitMeUp Pay Gateway, Finite State Machine & POS QR Scanner  

### 1. Spoken Script:
> "Thank you, Nazmi. Hello respected lecturer and members of the panel. I am **M.S.M Rushdhy (SEU/IS/22/ICT/086)**. In this section, I will walk you through the transaction architecture of HitMeUp: our **Order Workflow**, **Payment State Machine**, and **Digital Voucher QR Lifecycle**.
> 
> ### Order Creation & Concurrency Guard
> When a customer chooses to claim or purchase a deal:
> 1. In `orderController.js`, the system verifies deal validity and checks available inventory (`availableQuantity`).
> 2. To prevent inventory overselling during flash deal rushes, stock allocation is processed atomically, and an order record is created with status `pending`.
> 
> ### HitMeUp Pay & Finite Payment State Machine
> For paid vouchers, we developed a comprehensive payment gateway service and UI:
> - In `paymentStateMachine.js`, transactions transition through strict, predictable states:
>   `INITIATED` -> `PROCESSING` -> `COMPLETED` (or `FAILED` / `REFUNDED`).
> - We engineered a simulated payment gateway (`mockGatewayService.js`) and realistic sandbox checkout flow (`CheckoutPage.jsx`).
> - It simulates full card verification (Luhn algorithm validation, expiry checks, CVV verification), simulated OTP / 3DS challenge screens, and idempotent webhook callbacks.
> - Upon successful settlement, the payment service generates an immutable transaction log (`GatewayTransaction.js`) and a customer receipt (`receiptService.js`) displaying total savings and tax breakdowns.
> 
> ### Cryptographic Voucher Pass & QR Code Generation
> Following payment confirmation or flash claim, the system generates a digital voucher (`Voucher.js`):
> - Each voucher is assigned a cryptographically unique 10-character alphanumeric serial code (e.g., `HMU-7F89-21BC`) and a scannable QR payload containing signed redemption data.
> - This voucher is instantly dispatched to the customer's dashboard under **'Active QR counter passes'**.
> 
> ### Point-of-Sale (POS) Merchant Redemption & QR Camera Scanner
> The transaction loop closes at the physical merchant counter:
> - On the merchant dashboard, we developed a dedicated Point-of-Sale interface (`QrCameraScannerModal.jsx`).
> - Cashiers can turn on their phone or tablet camera to scan the customer’s QR pass directly off their phone screen using a real-time video stream canvas decoder.
> - A manual code entry option is provided as a backup.
> - **Replay Attack & Fraud Prevention:** In `voucherController.js` (`redeemVoucher`), the redemption operation is strictly atomic:
>   1. It verifies the voucher exists and is in status `active`.
>   2. It verifies that `voucher.businessId` matches the logged-in merchant.
>   3. It immediately transitions the voucher to status `used`, logs the cashier's user ID, records the redemption timestamp, and adds the savings to the customer’s lifetime statistics.
>   If a customer attempts to present a screenshot of an already redeemed pass, the POS scanner immediately flags it as *'Already Redeemed'* with the exact previous redemption timestamp."

### 2. Demonstration Guide (Visual Cue):
1. **Show Customer Claim / Checkout (`/pay/checkout/:id`):** Demonstrate claiming a voucher or entering sandbox test card numbers.
2. **Show Customer Dashboard Passes:** Navigate to `/customer/dashboard` showing the generated scannable QR code pass and barcode.
3. **Show Merchant POS Scanner:** In `/seller/dashboard`, click *"Redeem Voucher"* to open `QrCameraScannerModal`, demonstrating webcam access and manual code entry.

### 3. Lecturer Viva Defense / Q&A Preparation:
* **Q: How does your system handle double-redemption if two cashiers scan the same voucher simultaneously?**  
  * **Answer:** *"In `voucherController.js`, we use MongoDB's atomic document update: `Voucher.findOneAndUpdate({ _id: voucherId, status: 'active' }, { $set: { status: 'used', redeemedAt: new Date() } })`. Because MongoDB operations on a single document are atomic, only the first request successfully matches `status: 'active'`. The second concurrent request finds 0 matching documents and is rejected."*
* **Q: Why implement a simulated payment gateway rather than linking directly to Stripe or PayHere in development?**  
  * **Answer:** *"Using a dedicated internal service abstraction (`mockGatewayService.js`) allowed us to simulate edge-case failure modes—such as network dropouts, declined cards, and OTP timeouts—while building a complete finite state machine that can swap to a live PayHere or Stripe SDK by simply replacing the gateway adapter without changing our core business logic."*

---

## Presenter 5: AI Capabilities (NVIDIA NIM), Admin Governance & Cloud CI/CD
**Presenter:** Prabhath Nishantha  
**Registration No:** SEU/IS/22/ICT/041  
**Suggested Duration:** 4–5 Minutes  
**Module Ownership:** NVIDIA NIM Microservice, AI Deal Copilot, Super Admin Governance & Production Deployment  

### 1. Spoken Script:
> "Thank you, Rushdhy. Hello respected lecturer and panel members. I am **Prabhath Nishantha (SEU/IS/22/ICT/041)**. In this final technical section, I will present our **NVIDIA NIM AI Microservice Integration**, our **Administrative Governance System**, and our **Production Cloud Deployment Architecture**.
> 
> ### NVIDIA NIM Microservice Architecture
> To give small businesses an enterprise-grade competitive edge, we integrated cutting-edge Generative AI using **NVIDIA NIM (Inference Microservice)**:
> - **Secure Backend Proxy Architecture:** AI calls are strictly orchestrated through `aiController.js` and `nvidiaClient.js` on our Express backend. API keys and model parameters are kept completely hidden from the browser client, preventing credential theft or token exhaustion attacks.
> - **AI Deal Copilot (`dealCreationService.js`):** Small business owners often struggle to write persuasive promotional copy. Through our Copilot, a merchant simply enters:
>   - Business name & category (e.g., 'Auren Fashion, Colombo')
>   - Product item (e.g., 'Premium Slim-Fit Jeans')
>   - Original price and target customer segment.
>   The backend prompts the Llama-3 LLM on NVIDIA NIM with structured system constraints, automatically generating high-converting deal titles, compelling promotional descriptions, recommended discount percentages, and marketing callouts. The seller reviews and edits the suggestion with one click before publishing.
> - **AI Insights & Safety (`foodSafetyService.js` & `insightService.js`):** We also implemented automated inspection routines that scan deal descriptions for consumer protection, compliance terms, and market category alignment.
> 
> ### Super Administrator Portal & Platform Governance
> To maintain platform trust, we built an exhaustive administrative suite (`/admin`):
> 1. **Seller KYC & Application Moderation (`SellerApplicationsPage.jsx`):** Before a business can publish deals, administrators review their legal registration, address, and contact details, approving or rejecting applications with audit notes.
> 2. **Real-Time Analytics Dashboard (`AdminOverviewPage.jsx`):** Aggregates Gross Merchandise Value (GMV), total claimed vouchers, customer savings metrics, and active merchant counts.
> 3. **Immutable Security Activity Logs (`ActivityLogsPage.jsx`):** Backed by our `AdminActivityLog` Mongoose model, every critical action—such as seller approvals, role modifications, and deal removals—is logged with timestamps, admin ID, IP address, and user-agent.
> 
> ### Production Cloud Architecture & CI/CD Pipeline
> HitMeUp is fully deployed and accessible live in production:
> - **Frontend Hosting on Vercel:** Continuous Deployment tracking our GitHub repository, compiled with Vite, distributed across global edge CDN locations, with customized rewrite rules and PWA cache control headers.
> - **Backend Hosting on Render:** Containerized Node.js runtime operating with zero-downtime health probes, environment secret protection, and auto-restart capabilities.
> - **Database on MongoDB Atlas:** Multi-region cloud cluster featuring automated daily backups, IP access whitelisting, and query profiling.
> - **Collaborative Git Workflow:** Our team utilized structured Git feature branches (`Abdul-Rahman`, `Security`, etc.) with peer code reviews and PR merges into `main`.
> 
> ### Conclusion & Key Learning
> In conclusion, HitMeUp successfully demonstrates how modern web technologies—React 19, Node.js, geospatial indexing, secure QR state machines, and NVIDIA AI—can unite into a single, cohesive, production-ready ecosystem.
> 
> On behalf of Group E, we thank you, respected lecturer, for your mentorship and guidance throughout this semester."

### 2. Demonstration Guide (Visual Cue):
1. **Show AI Deal Copilot in Action:** In `/seller/dashboard`, open the *Deal Assistant / AI Copilot*, type in a mock product (e.g., 'Seafood Kottu Dinner'), click *"Generate Deal"*, and show how the AI auto-populates title, description, and discount.
2. **Show Admin Portal (`/admin`):** Log in as administrator, show the KPI overview cards, seller applications review table, and live Activity Logs table.
3. **Show Live Production URLs:** Point out that the site is live at `https://hit-me-up.vercel.app` and backend API is healthy on Render.

### 3. Lecturer Viva Defense / Q&A Preparation:
* **Q: Why use NVIDIA NIM instead of standard OpenAI ChatGPT APIs?**  
  * **Answer:** *"NVIDIA NIM provides enterprise-grade, low-latency inference microservices optimized for accelerated compute architectures. It offers competitive token latency and allows organizations to deploy standardized model containers (such as Llama-3 or Mistral) in hybrid or private cloud environments with strict data privacy guarantees."*
* **Q: How does the admin portal handle high volumes of activity logs without slowing down?**  
  * **Answer:** *"In `adminController.js`, the activity logs endpoint implements cursor-based and paginated queries (`limit` and `skip`) combined with indexed timestamp queries, preventing full collection scans and maintaining sub-50ms response times even with tens of thousands of log records."*

---

## Complete Group Rehearsal & Recording Checklist

- [ ] **Dress Code & Environment:** Professional attire, well-lit webcam, quiet room with clear microphone audio.
- [ ] **Video Recording Setup:** Use OBS Studio or Zoom (1080p resolution). Presenter webcam visible in top-right corner with screen sharing centered.
- [ ] **Screen Resolution:** Set browser zoom to 100% or 110% on a standard 1920x1080 display so lecturer can read text and code effortlessly.
- [ ] **Pre-Loaded Browser Tabs:**
  - Tab 1: Live Storefront (`https://hit-me-up.vercel.app`)
  - Tab 2: Map Discovery (`https://hit-me-up.vercel.app/deals?view=map`)
  - Tab 3: Customer Dashboard (`/customer/dashboard`) with active QR passes
  - Tab 4: Seller Dashboard (`/seller/dashboard`) with POS Scanner & AI Copilot
  - Tab 5: Admin Portal (`/admin`) with Overview & Activity Logs
  - Tab 6: VS Code showing clean architecture (`models/`, `controllers/`, `services/`)
- [ ] **Timing Strictness:** Each speaker stays strictly within 4 to 5 minutes to keep total video length between 20 to 25 minutes.
