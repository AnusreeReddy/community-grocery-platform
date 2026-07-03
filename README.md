# 🛒 Smart Community Grocery Pooling Platform

A full-stack community-driven grocery pooling platform that enables users within a locality to collectively place grocery orders for scheduled deliveries, reducing delivery costs through optimized truck utilization and demand aggregation.

Unlike traditional instant grocery delivery platforms, this system focuses on planned community ordering, threshold-based delivery scheduling, and AI-assisted demand forecasting to improve logistics efficiency while supporting local shopkeepers.

---

## ✨ Features

- 👥 Community-based grocery pooling
- 📅 Scheduled multi-day deliveries
- 🚚 Threshold-based delivery confirmation
- 🔄 Nearby community order merging
- 🛒 Personalized cart and order management
- 🔐 JWT Authentication & Role-Based Access
- 📦 Shopkeeper inventory management
- 🤖 AI-powered demand forecasting *(Upcoming)*
- 🎯 Personalized grocery recommendations *(Upcoming)*

---

## 🏗️ Tech Stack

### Frontend
- React.js
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
- bcrypt

### AI Service
- FastAPI
- Python
- Scikit-learn

---

## 👤 User Roles

- Customer
- Community Admin
- Shopkeeper
- Super Admin

---

## 📂 Project Structure

```
community-grocery-platform/

├── client/
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
│   ├── app.js
│   └── server.js
│
├── ai-service/
└── README.md
```

---

## 🚀 Current Progress

- ✅ Project Architecture
- ✅ MongoDB Integration
- ✅ JWT Authentication
- ✅ User Registration & Login
- ✅ Protected Routes
- 🔄 Community Module (In Progress)
- ⏳ Products
- ⏳ Cart
- ⏳ Orders
- ⏳ Threshold Engine
- ⏳ Delivery Scheduling
- ⏳ AI Module

---

## 💡 Core Workflow

```text
User Login
      │
      ▼
Join Community
      │
      ▼
Place Grocery Order
      │
      ▼
Community Order Aggregation
      │
      ▼
Threshold Check
      │
      ├── Threshold Met
      │         │
      │         ▼
      │   Delivery Confirmed
      │
      └── Threshold Not Met
                │
                ▼
 Nearby Community Suggestion
                │
                ▼
       Merge Order (Optional)
                │
                ▼
     Optimized Truck Delivery
```

---

## 🎯 Future Enhancements

- AI Demand Forecasting
- Product Recommendation Engine
- Delivery Route Optimization
- Real-time Notifications
- Analytics Dashboard
- Cloud Deployment

---

## 👩‍💻 Author

**Anusree Reddy**

---

⭐ If you found this project interesting, consider giving it a star.
