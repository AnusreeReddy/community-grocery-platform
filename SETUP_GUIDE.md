# Community Grocery Pooling Platform - Setup & Startup Guide

## Prerequisites
- Node.js 16+ and npm
- MongoDB instance (local or cloud)
- Git

## Installation

### 1. Clone or Navigate to Project
```bash
cd community-grocery-platform
```

### 2. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

## Configuration

### Backend Environment Variables
Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/community_grocery_db?retryWrites=true&w=majority
JWT_SECRET=your_secret_key_here
```

### Frontend Environment Variables
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Startup Instructions

### Option 1: Start Both Services Separately

**Terminal 1 - Backend Server:**
```bash
cd server
npm run dev
```
Output: `🚀 Server is running on port 5000`

**Terminal 2 - Frontend Development Server:**
```bash
cd client
npm run dev
```
Output: `VITE v8.1.0 ready in 123 ms`

Access the application at: `http://localhost:5173`

### Option 2: Seed Database (Optional)
Before running the application, populate demo data:
```bash
cd server
npm run seed
```
This creates:
- 6 demo users with different roles
- 2 communities with delivery schedules
- 10 sample products
- Multiple orders to test workflows

## Demo Accounts

After seeding, use these credentials:

| Email | Password | Role |
|-------|----------|------|
| admin@example.com | Admin123! | Super Admin |
| admin@community.com | Admin123! | Community Admin |
| shopkeeper@example.com | Shop123! | Shopkeeper |
| customer@example.com | Customer123! | Customer |
| rajesh@example.com | Buyer123! | Customer |
| anita@example.com | Shop123! | Customer |

## Key Features to Test

### 1. Customer Flow
1. Register/Login as a customer
2. Browse communities on `/communities`
3. Join a community
4. Go to `/products` and add items to cart
5. Proceed to checkout at `/cart`
6. Place order - note the best delivery day recommendation
7. View orders at `/orders`

### 2. Threshold Triggering
1. Login as superAdmin and go to `/admin`
2. Click "Run threshold evaluation"
3. If orders meet community threshold, delivery proposals are auto-created
4. Review delivery proposals in the "Deliveries" tab

### 3. Approval Workflow
1. In Admin Panel → Deliveries tab
2. See pending delivery proposals
3. Click Approve/Reject and add notes
4. Shopkeeper gets notification to confirm inventory

### 4. Inventory Confirmation
1. Login as shopkeeper
2. Go to `/deliveries`
3. See inventory confirmation requests
4. Accept or reject inventory
5. Delivery progresses to next status if accepted

### 5. Delivery Tracking
1. Any authorized user can go to `/deliveries`
2. View all community deliveries with status
3. Update delivery status as it progresses
4. See order details by expanding delivery card

### 6. Dashboard Analytics
1. Login as any user
2. Go to `/dashboard`
3. View community threshold progress
4. See best delivery day recommendation
5. Review community insights and analytics

## API Testing

### Using cURL or Postman

**Login:**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"Customer123!"}'
```

**Get Communities:**
```bash
curl http://localhost:5000/api/v1/communities
```

**List Products:**
```bash
curl http://localhost:5000/api/v1/products
```

**View Dashboard:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/v1/communities/COMMUNITY_ID/dashboard
```

## Build for Production

### Backend
No additional build needed. The Node.js server runs directly from source.

### Frontend
```bash
cd client
npm run build
```
This creates an optimized production build in the `dist/` folder.

Serve the production build:
```bash
npm run preview
```

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB URI in `.env` is correct
- Check if MongoDB Atlas cluster is active
- Ensure IP whitelist includes your machine

### Port Already in Use
- Backend (port 5000): `lsof -i :5000` or `netstat -ano | findstr :5000`
- Frontend (port 5173): `lsof -i :5173`
- Change ports in package.json scripts if needed

### CORS Issues
- Ensure frontend URL matches `VITE_API_URL`
- Check CORS middleware in `server/app.js`

### Module Not Found
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Project Structure

```
community-grocery-platform/
├── server/                    # Node.js Express API
│   ├── modules/              # Feature modules
│   ├── middleware/           # Auth, error handling
│   ├── scripts/              # Database seeding
│   ├── server.js             # Server entry point
│   └── package.json
├── client/                    # React Vite frontend
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── services/        # API client services
│   │   ├── context/         # Auth context
│   │   └── App.jsx
│   └── package.json
├── docs/                      # Documentation
└── README.md
```

## Performance Tips

### Development
- Use `npm run dev` for hot module reloading
- Check browser DevTools for React component performance

### Production
- Run `npm run build` before deployment
- Use environment variables for sensitive data
- Enable MongoDB connection pooling
- Set up CDN for static assets

## Logging

### Backend
- Enable debug logs: Set `DEBUG=*` environment variable
- Check `server.log` for persistent logs

### Frontend
- Browser console shows API errors and warnings
- React DevTools extension helpful for debugging

## Support & Documentation

- **Swagger API Docs**: http://localhost:5000/api-docs (if configured)
- **Project README**: See README.md in root directory
- **Implementation Summary**: See IMPLEMENTATION_SUMMARY.md

## Next Steps

1. Customize branding and styling in Tailwind config
2. Add your MongoDB connection string
3. Deploy to cloud platforms (Heroku, AWS, Railway, Render)
4. Set up automated backups for MongoDB
5. Implement monitoring and logging
6. Add email/SMS notifications

---

**Happy Grocery Pooling! 🚀**
