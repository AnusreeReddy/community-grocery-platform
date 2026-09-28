# 🛒 GroceryPool — Community Grocery Pooling Platform

**GroceryPool** is a community-first grocery pooling platform that helps households in the same neighborhood combine their grocery demand into scheduled delivery batches.

Instead of treating every grocery order as an individual delivery, the platform groups nearby household demand, tracks a community delivery threshold, and schedules a shared delivery when the required demand is reached.

### 🌐 Live Demo

[https://community-grocery.onrender.com](https://community-grocery.onrender.com)

---

## 💡 Problem

Individual grocery deliveries can be inefficient when many nearby households place small orders independently.

This can lead to:

- Repeated delivery trips to the same neighborhood
- Poor utilization of delivery vehicles
- Higher delivery costs for small orders
- Difficulty for local shopkeepers to understand neighborhood-level demand
- Fragmented grocery demand across households

GroceryPool addresses this by turning individual grocery demand into **community-level pooled demand**.

---

## 🎯 Solution

GroceryPool allows customers to:

1. Join a local community.
2. Browse products available to that community.
3. Add groceries to their community pool.
4. Select an available delivery batch at checkout.
5. Track how the pooled demand is progressing toward the delivery threshold.
6. Place an order when the selected batch is available.
7. Receive the groceries through a scheduled community delivery.

The core idea is:

```text
Individual Household Demand
            ↓
     Community Pool
            ↓
    Pooled Grocery Demand
            ↓
    Threshold Evaluation
            ↓
    Scheduled Delivery
            ↓
   Delivery Fulfillment
```

This creates a community-first grocery experience while providing operational support for shopkeepers and administrators.

---

## ✨ Key Features

### 👥 Community Pooling

- Customers can join local residential communities.
- Each community can have scheduled delivery batches.
- Grocery demand is pooled at the community and delivery-batch level.
- Customers can see pooled progress toward the batch threshold.
- The platform displays the remaining amount required to unlock the batch.
- Participating household counts can be displayed without exposing private customer information.

### 📦 Community-Scoped Products

- Customers see products available to their community.
- Products can be managed by approved shopkeepers.
- Product inventory is tracked.
- Stock availability is validated before adding items to the pool.
- Products can display community demand and pooling context.

### 🛒 Pool Cart

- Customers can add products to their community pool.
- Cart quantities can be updated or removed.
- Stock limits are enforced.
- The cart remains independent from the delivery-batch selection.
- Delivery batch selection happens during checkout rather than when adding an item.

### 🚚 Scheduled Delivery Batches

Each delivery batch can contain:

- Community
- Delivery day
- Delivery date
- Pooling threshold
- Current pooled value
- Remaining amount
- Capacity limit
- Cutoff information
- Participating orders

This allows the platform to evaluate demand batch by batch instead of treating an entire community as one permanent order.

### 📊 Threshold Evaluation

The platform evaluates whether a delivery batch has reached its required threshold.

Example:

```text
Batch Threshold:      ₹5,000
Current Pool:         ₹4,200
Remaining:            ₹800
Progress:             84%
```

When the threshold is reached, the batch can move toward scheduled delivery.

### 🏪 Shopkeeper Support

Approved shopkeepers can:

- Manage their grocery products.
- Manage inventory.
- Control which nearby communities can access products.
- View aggregated demand by community and delivery batch.
- Understand what products are being requested in different communities.

The system is designed so that shopkeepers can respond to neighborhood demand instead of relying only on individual orders.

### 🧑‍💼 Administration

Administrators can manage:

- Communities
- Shopkeeper approvals
- Products
- Delivery batches
- Trucks
- Delivery status
- Threshold evaluation
- Delivery proposals
- Community-level operations

### 🗺️ Delivery Route Planning

The platform supports delivery route planning for scheduled community deliveries.

The route can use:

- Community locations
- Delivery stops
- Addresses
- Pincodes
- Scheduled delivery information

The route planning logic is deterministic and operational rather than being presented as an AI feature.

A simplified flow is:

```text
Delivery Batch
      ↓
Identify Delivery Stops
      ↓
Calculate Stop Sequence
      ↓
Optimize Route
      ↓
Assign Truck
      ↓
Fulfill Delivery
```

### 💳 Checkout and Payment Method

At checkout, customers can:

- Select a delivery batch/date.
- Review their contribution to the pool.
- View threshold progress.
- Select the available payment method.
- Place the order.

The current platform supports payment-method selection without pretending to provide a production payment gateway.

---

## 🔄 Complete Customer Flow

```text
Register / Login
       ↓
Join a Community
       ↓
View Community Dashboard
       ↓
View Active Delivery Batch
       ↓
Browse Community Products
       ↓
Add Products to Pool Cart
       ↓
Review Pool Contribution
       ↓
Select Delivery Batch
       ↓
Select Payment Method
       ↓
Place Order
       ↓
Order Added to Community Pool
       ↓
Threshold Evaluation
       ↓
Threshold Reached
       ↓
Delivery Scheduled
       ↓
Route Planned
       ↓
Community Delivery
```

---

## 🏗️ System Architecture

```text
                    ┌──────────────────────┐
                    │      React Client    │
                    │   Vite + Frontend    │
                    └──────────┬───────────┘
                               │
                               │ REST API
                               ▼
                    ┌──────────────────────┐
                    │   Node.js + Express  │
                    │       Backend        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        Authentication    Pooling Logic    Delivery Logic
              │                │                │
              ▼                ▼                ▼
          JWT/Auth       Thresholds       Route Planning
                         Batch Logic       Truck Assignment
              │                │                │
              └────────────────┼────────────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      MongoDB Atlas   │
                    │       Database       │
                    └──────────────────────┘
```

---

## 🧩 Main Backend Modules

The backend is organized around the main business domains of the platform.

```text
server/
│
├── modules/
│   ├── auth/
│   ├── users/
│   ├── communities/
│   ├── products/
│   ├── cart/
│   ├── orders/
│   ├── threshold/
│   ├── delivery/
│   └── ...
│
├── middleware/
├── utils/
├── server.js
└── package.json
```

### Authentication

Handles:

- Registration
- Login
- JWT authentication
- Current-user information
- Role-based access

### Communities

Handles:

- Community creation
- Community discovery
- Community membership
- Community delivery schedules
- Community-level product access

### Products

Handles:

- Product creation
- Product listing
- Community-scoped availability
- Inventory
- Product search/filtering

### Cart

Handles:

- Add to pool
- Update quantity
- Remove item
- Clear cart
- Cart totals

### Orders

Handles:

- Checkout
- Delivery-batch selection
- Delivery date
- Payment method
- Order creation
- Order status
- Order cancellation

### Threshold

Handles:

- Pooled batch value
- Threshold calculation
- Remaining amount
- Threshold status
- Batch-level pooling evaluation
- Delivery recommendations

### Delivery

Handles:

- Delivery batches
- Truck assignment
- Delivery status
- Delivery stops
- Route planning
- Delivery fulfillment

---

## 🔐 Roles

The platform supports role-based access.

### 👤 Customer

Customers can:

- Join communities
- Browse products
- Add products to the pool
- Manage their cart
- Select delivery batches
- Place orders
- View their orders
- Track community pooling progress

### 🏪 Shopkeeper

Shopkeepers can:

- Manage products
- Manage inventory
- Manage community access
- View aggregated demand
- Work with community-level grocery requirements

Shopkeeper access is controlled through an approval workflow.

### 🧑‍💼 Community / System Administrator

Administrators can:

- Manage communities
- Manage shopkeepers
- Manage products
- Manage delivery batches
- Assign trucks
- Review delivery operations
- Monitor threshold and delivery activity

---

## 🗃️ Core Data Model

The main entities are:

```text
User
 │
 ├── belongs to → Community
 │
 └── creates → Cart
                │
                └── contains → Products

Community
 │
 ├── has → Delivery Batches
 │
 ├── has → Products / Product Access
 │
 └── receives → Pooled Orders

Delivery Batch
 │
 ├── belongs to → Community
 ├── has → Threshold
 ├── has → Delivery Date
 └── contains → Orders

Order
 │
 ├── belongs to → User
 ├── belongs to → Community
 ├── belongs to → Delivery Batch
 └── contains → Products

Product
 │
 ├── has → Inventory
 └── can be available to → Communities
```

---

## 🛡️ Important Business Rules

The platform enforces several business rules on the backend.

### Community Membership

Customers must belong to a community before placing community grocery orders.

### Product Availability

Products must be available to the customer's community before they can be ordered.

### Inventory Protection

The backend validates available stock before accepting quantities.

Stock reservation is handled during order placement so that multiple orders do not incorrectly consume the same inventory.

### Delivery Cutoff

Delivery batches have cutoff rules.

Orders cannot be placed into a batch after its applicable cutoff.

### Batch Capacity

Delivery batches can have capacity limits.

The backend checks existing pending orders before accepting additional orders when capacity is reached.

### Threshold Evaluation

Threshold calculations are performed per delivery batch.

This prevents unrelated delivery dates from being combined into one pooled total.

### Role-Based Access

Administrative and shopkeeper operations are protected according to the user's role and approval status.

---

## 📈 Example Community Pool

Imagine a community has a delivery threshold of ₹5,000.

Several households place grocery orders:

```text
Household A      ₹1,200
Household B      ₹900
Household C      ₹1,450
Household D      ₹800
Household E      ₹750
────────────────────────
Total            ₹5,100
```

The batch has crossed the threshold:

```text
Threshold:       ₹5,000
Pooled Demand:   ₹5,100
Status:          Threshold Reached
```

The system can then move the batch toward scheduled delivery.

The important idea is that the delivery decision is based on **combined community demand**, not only on one household's order.

---

## 🧺 Aggregated Community Demand

The platform can display anonymized demand such as:

```text
Community Demand

Milk       18 units
Rice       11 units
Eggs       24 units
Bread       9 units
Vegetables 16 units
```

This helps communicate the pooling concept while avoiding exposure of individual customers' private shopping details.

---

## 🛠️ Technology Stack

### Frontend

- React
- Vite
- JavaScript
- Axios
- CSS / existing frontend styling system

### Backend

- Node.js
- Express.js
- REST APIs
- JWT authentication

### Database

- MongoDB
- MongoDB Atlas
- Mongoose

### Deployment

- Render

### Development Tools

- Git
- GitHub
- VS Code

---

## 🌐 Deployment

The application is deployed as two connected services:

```text
React Frontend
      │
      │ HTTPS REST API
      ▼
Node.js / Express Backend
      │
      ▼
MongoDB Atlas
```

### Frontend

The public frontend is deployed on Render:

[https://community-grocery.onrender.com](https://community-grocery.onrender.com)

### Backend

The backend is deployed separately as a Render Web Service and is consumed by the frontend through the configured API URL.

The backend is not intended to be the main user-facing website.

---

## 🔌 API Design

The frontend communicates with the backend through REST endpoints.

Representative API areas include:

```text
/api/v1/auth
/api/v1/communities
/api/v1/products
/api/v1/cart
/api/v1/orders
/api/v1/deliveries
/api/v1/threshold
```

Authentication uses JWT bearer tokens.

Example:

```text
Authorization: Bearer <token>
```

---

## 📱 User Experience

The interface is designed around the idea of **community-first grocery shopping** rather than conventional individual ecommerce.

The main experience emphasizes:

- Active community
- Active delivery batch
- Pooled amount
- Threshold progress
- Amount remaining
- Participating households
- Delivery cutoff
- Scheduled delivery
- Community demand
- Add to Pool
- Shared delivery

The primary product story is:

```text
Community Demand
       ↓
Pooled Orders
       ↓
Threshold
       ↓
Scheduled Delivery
       ↓
Shared Community Fulfillment
```

---

## 🚀 Future Enhancements

The current platform establishes the core pooling and delivery workflow. Potential future improvements include:

### 📊 Demand Forecasting

Use historical community-level demand to estimate future grocery requirements.

### 🤝 Cross-Community Pooling

If one community is unable to reach its threshold, nearby communities could potentially participate in an eligible delivery batch subject to access and approval rules.

### 🧠 Smarter Delivery-Day Recommendations

Recommend delivery days based on historical demand, expected pool growth, and delivery capacity.

### 🛍️ Community Wishlist

Allow residents to indicate products they want their local shopkeeper to make available.

### 💰 Community Savings Analytics

Show aggregate savings or delivery-efficiency improvements generated through pooling.

### 🚚 Improved Route Optimization

Use richer location and routing data to improve delivery stop sequencing.

### 📱 Mobile Application

A dedicated mobile experience can be introduced after validating the web platform.

### 🔔 Notifications

Future versions can support notifications for:

- Threshold progress
- Batch cutoff
- Threshold reached
- Delivery scheduled
- Delivery status

---

## 🔭 Product Vision

GroceryPool is built around a simple idea:

> **Nearby households already have shared grocery demand. The platform coordinates that demand so it can be fulfilled together.**

The long-term goal is to create a neighborhood-level grocery network where:

```text
Households
    ↓
Communities
    ↓
Pooled Demand
    ↓
Scheduled Deliveries
    ↓
More Efficient Local Fulfillment
```

This model can potentially benefit multiple participants:

**Customers**
- Coordinated community deliveries
- Visibility into pooled demand
- Access to community-level grocery purchasing

**Shopkeepers**
- Better visibility into neighborhood demand
- Community-level demand aggregation
- More predictable batch requirements

**Delivery Operations**
- Fewer fragmented delivery trips
- Scheduled community stops
- Better opportunity for route planning

---

## 👨‍💻 Project

**GroceryPool — Community Grocery Pooling Platform**

Built as a full-stack software engineering project focused on:

- Community-based demand aggregation
- Grocery pooling
- Threshold-based delivery
- Inventory management
- Scheduled delivery batches
- Route planning
- Role-based operations

### 🌐 Live Application

[https://community-grocery.onrender.com](https://community-grocery.onrender.com)
