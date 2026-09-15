# 🚀 HitMeUp

### Real-Time Location-Based Flash Deal Marketplace with AI

HitMeUp is a real-time, location-based flash deal marketplace designed to connect **businesses with customers** through limited-time offers.

The platform helps businesses promote products and services during slow-sales periods by creating attractive flash deals, while customers can discover nearby offers, purchase deals, receive digital vouchers, and redeem them using QR codes.

HitMeUp also includes an **AI Agent Automation Layer** that supports deal creation, personalized recommendations, customer targeting, business insights, and suspicious activity detection.

---

## 📌 Project Overview

Businesses often have unused capacity, slow-selling products, or periods of low customer traffic. HitMeUp provides a platform where businesses can turn these opportunities into **limited-time flash deals**.

Customers can:

* Discover nearby flash deals
* Search and filter available deals
* View deal details
* Purchase deals
* Receive digital vouchers
* Redeem vouchers using QR codes
* Receive personalized deal recommendations

Businesses can:

* Create and manage flash deals
* Monitor deal performance
* Reach targeted customers
* View business insights
* Use AI-assisted deal generation

The system also provides administrative and security-related features such as suspicious activity detection and review management.

---

## 🎯 Main Objectives

The main objectives of HitMeUp are to:

* Provide businesses with an easy flash-deal management platform
* Help customers discover relevant deals nearby
* Enable secure deal purchases
* Provide digital vouchers and QR-based redemption
* Use AI to assist businesses in creating attractive deals
* Provide personalized deal recommendations
* Support smart customer targeting
* Generate business insights
* Detect potentially suspicious activities
* Reduce manual work through AI-assisted automation

---

## ✨ Key Features

### 👤 User & Business Management

* User registration and login
* JWT-based authentication
* Role-based access
* Customer profiles
* Business profiles
* Secure password handling

### 🔥 Flash Deal Management

* Create flash deals
* Edit and manage deals
* Set original and discounted prices
* Define target customers
* Publish and expire deals
* Manage active deals

### 📍 Deal Discovery

* Browse available deals
* Search deals
* Filter deals
* Discover nearby deals
* Location-based deal discovery
* Map-based deal presentation
* Favorites
* Reviews

### 🛒 Orders & Payments

* Create orders
* Manage order status
* Payment gateway integration
* Payment verification
* Transaction management

### 🎟️ Digital Vouchers

* Generate digital vouchers after successful purchases
* Unique voucher codes
* QR-based voucher redemption
* Voucher status tracking
* Redemption management

### 🤖 AI Agent Automation

HitMeUp includes an AI layer designed to assist both customers and businesses.

AI features include:

* AI-powered flash deal creation
* Personalized deal recommendations
* Smart customer targeting
* Business insights
* Opportunity suggestions
* Suspicious activity detection
* AI activity logging
* AI-assisted customer support

> AI-generated suggestions are intended to support users and businesses. Important business decisions remain under human control.

---

# 🧠 AI Module

The AI module is developed as an independent layer so that it can consume data from other modules without directly modifying their core business logic.

### Current AI Deal Creation

The AI Deal Creation service accepts:

```text
Business Name
Business Type
Product / Service
Original Price
Target Customers
```

and generates:

```text
Deal Title
Deal Description
Suggested Discount
Marketing Message
Target Customer
```

### Example

**Input**

```json
{
  "businessName": "ABC Restaurant",
  "businessType": "Restaurant",
  "productOrService": "Chicken Burger",
  "originalPrice": 1200,
  "targetCustomers": "Students"
}
```

**Generated Output**

```json
{
  "title": "Student Special: Crispy Chicken Burger",
  "description": "Enjoy a juicy chicken burger with fresh lettuce and secret sauce at a student-only price.",
  "suggestedDiscount": "30%",
  "marketingMessage": "Fuel your study sessions with a tasty bite – grab yours before it's gone!",
  "targetCustomer": "Students"
}
```

---

# 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      React App       │
                    │      Frontend        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Node.js / Express  │
                    │      Backend API      │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
          ▼                    ▼                    ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │   MongoDB   │      │   Payment   │      │  AI Agent   │
   │   Database  │      │   Gateway   │      │    Layer    │
   └─────────────┘      └─────────────┘      └──────┬──────┘
                                                    │
                                                    ▼
                                             ┌─────────────┐
                                             │  NVIDIA AI  │
                                             └─────────────┘
```

---

# 🛠️ Technology Stack

## Frontend

* React
* JavaScript
* HTML
* CSS

## Backend

* Node.js
* Express.js
* REST APIs

## Database

* MongoDB
* MongoDB Atlas
* Mongoose

## Authentication

* JWT
* Password hashing

## AI

* NVIDIA AI
* OpenAI-compatible Node.js SDK

## Development Tools

* Git
* GitHub
* Postman
* Visual Studio Code

---

# 📂 Project Structure

```text
HitMeUp/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── services/
│   │   └── ai/
│   ├── middleware/
│   ├── config/
│   ├── server.js
│   ├── package.json
│   └── .env
│
├── README.md
└── .gitignore
```

---

# 🤖 AI Service Structure

```text
backend/
└── services/
    └── ai/
        ├── dealCreationService.js
        ├── recommendationService.js
        ├── targetingService.js
        ├── insightService.js
        ├── fraudDetectionService.js
        └── supportService.js
```

AI controllers and routes are maintained separately from the core business modules.

---

# 🔌 API Example

### Generate AI Deal

**Endpoint**

```http
POST /api/ai/generate-deal
```

### Request

```json
{
  "businessName": "ABC Restaurant",
  "businessType": "Restaurant",
  "productOrService": "Chicken Burger",
  "originalPrice": 1200,
  "targetCustomers": "Students"
}
```

### Response

```json
{
  "success": true,
  "message": "Deal generated successfully",
  "deal": {
    "title": "Student Special: Crispy Chicken Burger",
    "description": "Enjoy a juicy chicken burger with fresh lettuce and secret sauce at a student-only price.",
    "suggestedDiscount": "30%",
    "marketingMessage": "Fuel your study sessions with a tasty bite – grab yours before it's gone!",
    "targetCustomer": "Students"
  }
}
```

---

# 👥 Team Responsibilities

The project is divided into five major ownership areas to reduce conflicts during development.

| Member       | Responsibility              |
| ------------ | --------------------------- |
| **Member 1** | User & Business Management  |
| **Member 2** | Flash Deal Management       |
| **Member 3** | Deal Discovery & Location   |
| **Member 4** | Orders, Payments & Vouchers |
| **Member 5** | AI Agent & Intelligence     |

### Module Ownership

```text
Member 1
└── Authentication
└── Users
└── Businesses

Member 2
└── Flash Deals
└── Deal Lifecycle

Member 3
└── Search
└── Filters
└── Location
└── Favorites
└── Reviews

Member 4
└── Orders
└── Payments
└── Vouchers
└── QR Redemption

Member 5
└── AI Deal Creation
└── Recommendations
└── Customer Targeting
└── Business Insights
└── Fraud Detection
└── AI Activity Logs
```

---

# 🔐 Conflict-Free Development Strategy

Each member owns specific modules and database models.

### Core Rules

1. One feature should have one primary owner.
2. One database model should have one primary owner.
3. Members should not directly modify another member's core module.
4. Modules communicate through APIs and agreed data contracts.
5. AI consumes approved data from other modules rather than directly modifying their data.
6. Payment logic remains under Member 4.
7. Authentication remains under Member 1.
8. Deal CRUD remains under Member 2.
9. AI services remain under Member 5.

---

# 🌿 Git Branch Strategy

Each member works on a separate branch.

```text
main
│
├── member1-auth-business
├── member2-deals
├── member3-discovery
├── member4-orders-payment
└── member5-ai
```

### Development Workflow

```text
Create Branch
     ↓
Develop Feature
     ↓
Test Feature
     ↓
Commit Changes
     ↓
Push Branch
     ↓
Create Pull Request
     ↓
Code Review
     ↓
Merge into main
```

The `main` branch should always contain a stable version of the project.

---

# ⚙️ Installation

## 1. Clone the Repository

```bash
git clone <repository-url>
```

## 2. Open the Project

```bash
cd HitMeUp
```

## 3. Install Backend Dependencies

```bash
cd backend
npm install
```

## 4. Configure Environment Variables

Create a `.env` file inside the backend directory.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

NVIDIA_API_KEY=your_nvidia_api_key
```

> Never commit `.env` or API keys to GitHub.

## 5. Start Backend

```bash
npm run dev
```

The backend should run on:

```text
http://localhost:5000
```

## 6. Start Frontend

From the frontend directory:

```bash
npm install
npm run dev
```

---

# 🧪 Testing

API testing can be performed using **Postman**.

Recommended testing order:

```text
Authentication
      ↓
Business / User
      ↓
Deals
      ↓
Discovery
      ↓
Orders
      ↓
Payment
      ↓
Voucher
      ↓
QR Redemption
      ↓
AI Features
```

Each module should be tested independently before full-system integration.

---

# 🔒 Security

The project follows basic security practices including:

* JWT authentication
* Password hashing
* Environment variables for secrets
* Protected API routes
* Payment verification
* Input validation
* Suspicious activity detection
* Restricted database access

API keys and secrets must never be committed to the repository.

---

# 📈 Future Development

Planned improvements include:

* More advanced personalized recommendations
* Improved AI customer targeting
* Real-time deal notifications
* Advanced business analytics
* Improved fraud detection
* AI-assisted customer support
* Better location-based recommendations
* Performance optimization
* Production deployment

---

# 🎓 Academic Project

**Project:** HitMeUp
**Group:** Group E
**Program:** BICT
**Faculty:** Faculty of Technology
**University:** Southeastern University of Sri Lanka

This project is developed as part of the undergraduate software development project.

---

# 👨‍💻 Development Team

HitMeUp is developed collaboratively by a five-member development team.

Each member is responsible for an independent module while following shared API contracts and Git development practices to ensure smooth integration.

---

## 📄 License

This project is developed for academic purposes.
