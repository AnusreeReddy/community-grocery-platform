# 🛒 Smart Community Grocery Pooling Platform

A full-stack community-driven grocery pooling platform that enables users within a locality to collectively place grocery orders for scheduled deliveries. The platform aggregates community orders, evaluates delivery thresholds, manages inventory, and coordinates delivery workflows for efficient planned grocery fulfillment.

Unlike traditional instant grocery delivery platforms, this system focuses on **planned community ordering, threshold-based delivery scheduling, order aggregation, and inventory coordination** while supporting customers, community administrators, shopkeepers, and super administrators.

---

## ✨ Features

- 👥 Community-based grocery pooling
- 📅 Configurable scheduled delivery days
- 🚚 Threshold-based delivery proposal generation
- 🔄 Nearby community merge suggestions
- 🛒 Persistent cart and order management
- 🔐 JWT authentication and role-based access control
- 📦 Shopkeeper product and inventory management
- 📊 Community analytics and order metrics
- 📈 Historical order-based delivery-day recommendations
- 🔔 Event-based in-app notifications
- 🚛 Delivery proposal approval and inventory confirmation
- 📍 Delivery status and truck/driver tracking
- 🔎 Product search and category filtering
- 🛡️ Input validation and protected operations

---

## 🏗️ Tech Stack

### Frontend

- React 19
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend

- Node.js
- Express.js
- MongoDB Atlas
- Mongoose
- JWT Authentication
- bcryptjs

### Architecture

- RESTful APIs
- Modular backend architecture
- Controller-Service-Model separation
- Authentication and authorization middleware
- Input validation
- Centralized error handling

---

## 👤 User Roles

| Role | Capabilities |
|------|--------------|
| **Customer** | Browse products, join communities, manage cart, place orders, and track deliveries |
| **Community Admin** | Manage communities, monitor orders, thresholds, schedules, and analytics |
| **Shopkeeper** | Manage products and inventory and confirm delivery inventory |
| **Super Admin** | Manage users, roles, communities, and delivery operations |

---

## 🧩 Core Modules

### 🔐 Authentication & Authorization

- JWT-based authentication
- Secure password hashing using bcryptjs
- Role-based access control
- Protected API routes
- Role-specific permissions
- User registration and login

### 👥 Community Management

- Community creation and management
- Community membership management
- Configurable delivery schedules
- Delivery threshold configuration
- Threshold evaluation
- Nearby community merge suggestions
- Community analytics
- Historical delivery-day recommendations

### 📦 Product & Inventory Management

- Product creation and management
- Product search and category filtering
- Stock availability tracking
- Inventory validation
- Price and stock updates
- Shopkeeper-specific inventory operations

### 🛒 Cart & Order Management

- Persistent shopping carts
- Add, update, and remove cart items
- Automatic order total calculation
- Stock validation during checkout
- Scheduled delivery-day selection
- Order status tracking
- Order cancellation with validation
- Community-level order aggregation

### 🚚 Delivery Management

- Threshold-based delivery proposal generation
- Delivery proposal approval and rejection
- Shopkeeper inventory confirmation
- Delivery status management
- Truck and driver information tracking
- Delivery tracking
- Idempotent delivery creation

### 🔔 Notifications

- Event-based in-app notifications
- Delivery-related notifications
- Persistent notification records
- Read/unread notification tracking

---

## 💡 Core Workflow

```text
Customer
    │
    ▼
Join Community
    │
    ▼
Browse Products
    │
    ▼
Add Products to Cart
    │
    ▼
Select Delivery Day
    │
    ▼
Place Order
    │
    ▼
Community Order Aggregation
    │
    ▼
Threshold Evaluation
    │
    ├──────────── Threshold Met ────────────┐
    │                                        │
    │                                        ▼
    │                              Delivery Proposal
    │                                        │
    │                                        ▼
    │                                 Admin Approval
    │                                        │
    │                                        ▼
    │                            Inventory Confirmation
    │                                        │
    │                                        ▼
    │                              Delivery Processing
    │                                        │
    │                                        ▼
    │                                    Delivered
    │
    └──────────── Threshold Not Met
                     │
                     ▼
             Nearby Community
             Merge Suggestions
                     │
                     ▼
              Optional Order Merge
                     │
                     ▼
              Delivery Processing
```

---

## 🔄 Threshold-Based Order Aggregation

The platform uses a threshold-based approach to determine whether a community has sufficient aggregated demand for a scheduled delivery.

```text
Individual Orders
       │
       ▼
Community Order Pool
       │
       ▼
Calculate Aggregated Demand
       │
       ▼
Threshold Evaluation
       │
       ├── Threshold Reached
       │        │
       │        ▼
       │   Delivery Proposal
       │
       └── Threshold Not Reached
                │
                ▼
       Check Nearby Communities
                │
                ▼
       Suggest Possible Merge
```

This approach allows multiple customers within the same locality to combine their grocery demand before a delivery is scheduled.

---

## 📊 Analytics & Business Logic

The platform provides community-level insights and operational decision support, including:

- Community member metrics
- Order metrics
- Revenue tracking
- Historical order analysis
- Threshold evaluation
- Delivery-day recommendations
- Nearby community merge suggestions
- Aggregated community demand analysis

The delivery-day recommendation feature uses historical ordering patterns to identify suitable delivery days for a community.

---

## 🔌 REST API

The backend provides **52 REST API endpoints** covering authentication, users, communities, products, cart, orders, deliveries, threshold evaluation, and notifications.

### API Modules

```text
/api/v1/auth
/api/v1/users
/api/v1/communities
/api/v1/products
/api/v1/cart
/api/v1/orders
/api/v1/deliveries
/api/v1/threshold
/api/v1/notifications
```

For the detailed endpoint documentation, refer to:

**`API_REFERENCE.md`**

---

## 🔐 Security & Reliability

- JWT token-based authentication
- Password hashing using bcryptjs
- Role-based authorization
- Protected API endpoints
- Input validation
- Centralized error handling
- Consistent API response handling
- CORS configuration
- Authorization checks for protected operations
- Soft-delete support
- Idempotent delivery operations
- Database indexes for frequently accessed data

---

## 🗄️ Database

MongoDB Atlas with Mongoose is used as the primary database.

### Main Collections

```text
User
Community
Product
Cart
Order
Delivery
Notification
```

The database layer includes:

- Schema validation
- Required-field validation
- Unique constraints
- Document references
- Timestamps
- Indexes
- Soft-delete support
- Aggregation pipelines for analytics

---

## 📂 Project Structure

```text
community-grocery-platform/

├── client/
│
├── server/
│   ├── database/
│   ├── middleware/
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── communities/
│   │   ├── products/
│   │   ├── cart/
│   │   ├── orders/
│   │   ├── deliveries/
│   │   └── notifications/
│   │
│   ├── app.js
│   └── server.js
│
├── ai-service/
│
├── API_REFERENCE.md
├── SETUP_GUIDE.md
├── IMPLEMENTATION_SUMMARY.md
└── README.md
```

---

## 🧪 Demo & Seed Data

The project includes seed data to support testing of the major workflows.

The demo environment includes:

- Multiple users across different roles
- Community data with delivery schedules and thresholds
- Products across multiple categories
- Sample orders
- Threshold evaluation scenarios
- Customer, community admin, and shopkeeper workflows

### Example Testing Flow

```text
Register / Login
       ↓
Join Community
       ↓
Browse Products
       ↓
Add to Cart
       ↓
Place Order
       ↓
Community Order Aggregation
       ↓
Threshold Evaluation
       ↓
Delivery Proposal
       ↓
Admin Approval
       ↓
Inventory Confirmation
       ↓
Delivery Status Updates
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 16+
- npm
- MongoDB / MongoDB Atlas

### 1. Clone the Repository

```bash
git clone https://github.com/AnusreeReddy/community-grocery-platform.git
cd community-grocery-platform
```

### 2. Configure Environment Variables

Configure the required environment variables for the backend and frontend according to the project setup instructions.

Refer to:

**`SETUP_GUIDE.md`**

### 3. Start the Backend

```bash
cd server
npm install
npm run dev
```

### 4. Start the Frontend

Open a new terminal:

```bash
cd client
npm install
npm run dev
```

The frontend development server runs on:

```text
http://localhost:5173
```

The backend runs on:

```text
http://localhost:5000
```

---

## 📌 Project Status

**Version:** 1.0.0

**Status:** Production Ready

The implemented system includes:

- Authentication and authorization
- Four role-based user workflows
- Community management
- Product and inventory management
- Persistent cart management
- Order processing
- Threshold-based order aggregation
- Delivery proposal generation
- Admin approval workflows
- Shopkeeper inventory confirmation
- Delivery tracking
- Notifications
- Community analytics
- Historical delivery-day recommendations
- Input validation
- Error handling
- Frontend-backend integration

---

## 🔮 Future Enhancements

The following capabilities are planned as future enhancements:

- 🤖 AI-powered demand forecasting
- 🎯 Personalized product recommendations
- 🗺️ Delivery route optimization
- ⚡ Real-time WebSocket updates
- 💳 Payment gateway integration
- ☁️ Cloud deployment
- 📍 Map-based community discovery
- 📱 Mobile application
- 📧 Email/SMS notifications


---

## 👩‍💻 Author

**Anusree Reddy**

Information Technology  
Chaitanya Bharathi Institute of Technology, Hyderabad

---

⭐ If you found this project interesting, consider giving it a star.
