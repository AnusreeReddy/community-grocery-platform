# Community Grocery Pooling Platform - API Reference

## Base URL
```
http://localhost:5000/api/v1
```

## Authentication
All endpoints (except Auth and public endpoints) require:
```
Authorization: Bearer <JWT_TOKEN>
```

Get token via `/auth/login` endpoint.

---

## Authentication Endpoints

### Register User
**POST** `/auth/register`
```json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```
**Response:**
```json
{
  "success": true,
  "message": "User registered successfully.",
  "user": {
    "_id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "customer"
  }
}
```

### Login
**POST** `/auth/login`
```json
{
  "email": "john@example.com",
  "password": "SecurePassword123!"
}
```
**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "...",
    "fullName": "John Doe",
    "email": "john@example.com",
    "role": "customer",
    "community": null
  }
}
```

### Get Current User
**GET** `/auth/me`
**Headers:** `Authorization: Bearer <TOKEN>`
**Response:**
```json
{
  "success": true,
  "user": { ... }
}
```

---

## User Endpoints

### Get All Users (Super Admin Only)
**GET** `/users`
**Headers:** `Authorization: Bearer <TOKEN>`
**Response:** Array of user objects

### Get User Profile
**GET** `/users/me`
**Response:** Current user object

### Get User by ID (Super Admin Only)
**GET** `/users/:id`

### Update User Profile
**PUT** `/users/me`
```json
{
  "fullName": "Jane Doe",
  "email": "jane@example.com"
}
```

### Change User Role (Super Admin Only)
**PATCH** `/users/:id/role`
```json
{
  "role": "shopkeeper"
}
```
Valid roles: `customer`, `shopkeeper`, `communityAdmin`, `superAdmin`

### Delete User (Super Admin Only)
**DELETE** `/users/:id`

---

## Community Endpoints

### Create Community
**POST** `/communities`
**Headers:** `Authorization: Bearer <TOKEN>`
```json
{
  "name": "Green Ridge Community",
  "description": "Neighborhood grocery pool",
  "address": "123 Main St",
  "city": "Bangalore",
  "state": "Karnataka",
  "pincode": "560001",
  "deliverySchedule": [
    { "day": "Monday", "cutOffTime": "18:00" },
    { "day": "Thursday", "cutOffTime": "20:00" }
  ],
  "thresholdAmount": 1000
}
```

### Get All Communities
**GET** `/communities`
No auth required

### Get Community Details
**GET** `/communities/:id`
**Response:**
```json
{
  "success": true,
  "community": {
    "_id": "...",
    "name": "Green Ridge Community",
    "description": "...",
    "thresholdAmount": 1000,
    "currentOrderValue": 650,
    "deliverySchedule": [...],
    "memberCount": 15,
    "createdBy": { "_id": "...", "fullName": "..." }
  }
}
```

### Get Community Dashboard
**GET** `/communities/:id/dashboard`
**Headers:** `Authorization: Bearer <TOKEN>`
**Response:**
```json
{
  "success": true,
  "dashboard": {
    "community": { ... },
    "memberCount": 15,
    "totalOrders": 45,
    "pendingOrders": 12,
    "confirmedOrders": 33,
    "upcomingDeliveries": 3,
    "thresholdRemaining": 350
  }
}
```

### Get Community Analytics
**GET** `/communities/:id/analytics`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires Role:** `communityAdmin`, `superAdmin`
**Response:**
```json
{
  "success": true,
  "analytics": {
    "pendingOrders": 12,
    "confirmedOrders": 33,
    "completedOrders": 45,
    "revenue": 15000,
    "averageOrder": 333.33,
    "thresholdAmount": 1000,
    "pendingOrderValue": 650,
    "activeUsers": 15,
    "monthlyMetrics": [...]
  }
}
```

### Get Best Delivery Day Recommendation
**GET** `/communities/:id/best-delivery-day`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires Role:** `communityAdmin`, `superAdmin`
**Response:**
```json
{
  "success": true,
  "recommendation": {
    "recommendedDeliveryDay": "Monday",
    "rationale": "Based on historical non-cancelled order value and order count.",
    "historicalPerformance": [
      { "day": "Monday", "orders": 45, "amount": 15000 },
      { "day": "Thursday", "orders": 35, "amount": 12000 }
    ]
  }
}
```

### Get Merge Suggestions
**GET** `/communities/:id/merge-suggestions`
**Headers:** `Authorization: Bearer <TOKEN>`
**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "_id": "...",
      "name": "Lakeview Cooperative",
      "description": "...",
      "currentOrderValue": 800,
      "thresholdAmount": 1500,
      "thresholdGap": 700,
      "scheduleScore": 100,
      "sharedSchedule": [...]
    }
  ]
}
```

### Join Community
**POST** `/communities/:id/join`
**Headers:** `Authorization: Bearer <TOKEN>`
**Response:**
```json
{
  "success": true,
  "message": "Joined community successfully.",
  "user": { ... }
}
```

### Leave Community
**POST** `/communities/leave`
**Headers:** `Authorization: Bearer <TOKEN>`
**Response:**
```json
{
  "success": true,
  "message": "Left community successfully.",
  "user": { "community": null, ... }
}
```

### Update Community
**PUT** `/communities/:id`
**Headers:** `Authorization: Bearer <TOKEN>`
Body: Partial community object
**Requires:** Creator or superAdmin

### Delete Community
**DELETE** `/communities/:id`
**Requires:** Creator or superAdmin
(Soft delete - sets isActive to false)

---

## Product Endpoints

### Create Product (Shopkeeper Only)
**POST** `/products`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires Role:** `shopkeeper`, `superAdmin`
```json
{
  "name": "Fresh Apples",
  "description": "2 kg carton",
  "category": "Fruits",
  "brand": "Green Farm",
  "price": 180,
  "stock": 50,
  "image": "https://..."
}
```

### Get All Products
**GET** `/products`
No auth required

### Get Product by ID
**GET** `/products/:id`

### Search Products
**GET** `/products/search?keyword=apple`

### Filter Products by Category
**GET** `/products/category/Fruits`
**Valid Categories:** Fruits, Vegetables, Bakery, Dairy, Grains, Pantry

### Update Product (Shopkeeper Only)
**PUT** `/products/:id`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires:** Shopkeeper who owns product or superAdmin

### Delete Product (Shopkeeper Only)
**DELETE** `/products/:id`
**Requires:** Shopkeeper who owns product or superAdmin

---

## Cart Endpoints

### Get Cart
**GET** `/cart`
**Headers:** `Authorization: Bearer <TOKEN>`
**Response:**
```json
{
  "success": true,
  "cart": {
    "_id": "...",
    "user": "...",
    "items": [
      {
        "product": {
          "_id": "...",
          "name": "Fresh Apples",
          "price": 180
        },
        "quantity": 2,
        "price": 180
      }
    ],
    "totalAmount": 360
  }
}
```

### Add to Cart
**POST** `/cart`
**Headers:** `Authorization: Bearer <TOKEN>`
```json
{
  "productId": "...",
  "quantity": 2
}
```

### Update Cart Item
**PUT** `/cart/:productId`
**Headers:** `Authorization: Bearer <TOKEN>`
```json
{
  "quantity": 3
}
```

### Remove from Cart
**DELETE** `/cart/:productId`
**Headers:** `Authorization: Bearer <TOKEN>`

### Clear Cart
**DELETE** `/cart`
**Headers:** `Authorization: Bearer <TOKEN>`

---

## Order Endpoints

### Place Order
**POST** `/orders`
**Headers:** `Authorization: Bearer <TOKEN>`
```json
{
  "deliveryDay": "Monday",
  "overrideCutoff": false,
  "overrideReason": ""
}
```
**Response:**
```json
{
  "success": true,
  "message": "Order placed successfully.",
  "order": {
    "_id": "...",
    "user": "...",
    "community": "...",
    "items": [...],
    "totalAmount": 360,
    "deliveryDay": "Monday",
    "status": "Pending"
  }
}
```

### Get My Orders
**GET** `/orders/my-orders`
**Headers:** `Authorization: Bearer <TOKEN>`

### Get Order by ID
**GET** `/orders/:id`
**Headers:** `Authorization: Bearer <TOKEN>`

### Update Order Status
**PATCH** `/orders/:id/status`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires Role:** `communityAdmin`, `shopkeeper`, `superAdmin`
```json
{
  "status": "Confirmed"
}
```
Valid statuses: `Pending`, `Confirmed`, `Packed`, `Out for Delivery`, `Delivered`

### Cancel Order
**PATCH** `/orders/:id/cancel`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires:** Order owner or superAdmin
Can only cancel if status is `Pending`

---

## Delivery Endpoints

### Create Delivery Proposal
**POST** `/deliveries`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires Role:** `communityAdmin`, `superAdmin`
```json
{
  "community": "...",
  "deliveryDay": "Monday",
  "deliveryDate": "2026-09-11T00:00:00Z"
}
```

### Get All Deliveries
**GET** `/deliveries`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires Role:** `communityAdmin`, `shopkeeper`, `superAdmin`

### Get Delivery by ID
**GET** `/deliveries/:id`
**Headers:** `Authorization: Bearer <TOKEN>`

### Approve/Reject Delivery
**PATCH** `/deliveries/:id/approval`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires Role:** `communityAdmin`, `superAdmin`
```json
{
  "approvalStatus": "Approved",
  "note": "Approved for delivery"
}
```
Valid actions: `Approved`, `Rejected`

### Confirm Inventory (Shopkeeper)
**PATCH** `/deliveries/:id/inventory-confirmation`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires Role:** `shopkeeper`, `superAdmin`
```json
{
  "action": "Accepted",
  "note": "All items in stock"
}
```
Valid actions: `Accepted`, `Rejected`

### Update Delivery Status
**PATCH** `/deliveries/:id/status`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires Role:** `communityAdmin`, `shopkeeper`, `superAdmin`
```json
{
  "status": "Packed"
}
```
Valid statuses: `Scheduled`, `Packed`, `Dispatched`, `Out for Delivery`, `Delivered`, `Cancelled`

### Delete Delivery
**DELETE** `/deliveries/:id`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires Role:** `communityAdmin`, `superAdmin`

---

## Threshold Endpoints

### Run Threshold Evaluation
**POST** `/threshold/run`
**Headers:** `Authorization: Bearer <TOKEN>`
**Requires Role:** `superAdmin`, `communityAdmin`
**Response:**
```json
{
  "success": true,
  "result": [
    {
      "community": "...",
      "thresholdReached": true,
      "currentOrderValue": 1200,
      "proposalsCreated": 1,
      "deliveries": ["..."]
    }
  ]
}
```

---

## Notification Endpoints

### Get Notifications
**GET** `/notifications`
**Headers:** `Authorization: Bearer <TOKEN>`
**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "_id": "...",
      "type": "delivery_approved",
      "message": "Your delivery proposal was approved.",
      "data": { "deliveryId": "...", "communityId": "..." },
      "isRead": false,
      "createdAt": "2026-09-04T10:30:00Z"
    }
  ]
}
```

### Mark Notification as Read
**PATCH** `/notifications/:id/read`
**Headers:** `Authorization: Bearer <TOKEN>`
**Response:**
```json
{
  "success": true,
  "notification": { "isRead": true, ... }
}
```

---

## Error Response Format

All error responses follow this format:
```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `500` - Server Error

---

## Rate Limiting & Best Practices

1. **Pagination**: For large result sets, implement pagination using skip/limit
2. **Caching**: Cache community and product data on the client
3. **Error Handling**: Always check `success` field before accessing data
4. **Token Refresh**: Tokens expire in 7 days, implement refresh logic
5. **Validation**: Frontend should validate inputs before sending to API

---

## Testing with cURL

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"Customer123!"}' \
  | jq -r '.token')

# Get communities
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:5000/api/v1/communities

# Place order
curl -X POST http://localhost:5000/api/v1/orders \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"deliveryDay":"Monday"}'
```

---

**Last Updated:** 2026-09-04
