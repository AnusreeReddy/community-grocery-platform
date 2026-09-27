import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../database/db.js";
import User from "../modules/users/model.js";
import Community from "../modules/communities/model.js";
import Product from "../modules/products/model.js";
import Order from "../modules/orders/model.js";
import { evaluateCommunityThreshold } from "../modules/threshold/service.js";
import { getNearestDateForWeekday } from "../utils/date.js";

dotenv.config();

const seed = async () => {
  await connectDB();

  const hashPassword = async (password) => bcrypt.hash(password, 10);

  const ensureUser = async ({ fullName, email, password, role, shopkeeperApprovalStatus }) => {
    const existing = await User.findOne({ email });
    if (existing) return existing;

    const hashedPassword = await hashPassword(password);
    return User.create({ fullName, email, password: hashedPassword, role, shopkeeperApprovalStatus });
  };

  const ensureCommunity = async (payload) => {
    const existing = await Community.findOne({ name: payload.name, pincode: payload.pincode });
    if (existing) return existing;

    return Community.create(payload);
  };

  const ensureProduct = async (payload) => {
    const existing = await Product.findOne({ name: payload.name, shopkeeper: payload.shopkeeper });
    if (existing) return existing;

    return Product.create(payload);
  };

  // Create super admin
  const superAdmin = await ensureUser({
    fullName: "System Admin",
    email: "admin@example.com",
    password: "Admin123!",
    role: "superAdmin",
  });

  // Create shopkeeper (already approved, so the demo account can list
  // products immediately)
  const shopkeeper = await ensureUser({
    fullName: "Aman Shopkeeper",
    email: "shopkeeper@example.com",
    password: "Shop123!",
    role: "shopkeeper",
    shopkeeperApprovalStatus: "Approved",
  });

  // A second shopkeeper still waiting on admin approval, to demonstrate the
  // approval workflow out of the box.
  const pendingShopkeeper = await ensureUser({
    fullName: "New Shop Owner",
    email: "newshop@example.com",
    password: "Shop123!",
    role: "shopkeeper",
    shopkeeperApprovalStatus: "Pending",
  });

  // Create community admin
  const communityAdmin = await ensureUser({
    fullName: "Sarah Admin",
    email: "admin@community.com",
    password: "Admin123!",
    role: "communityAdmin",
  });

  // Create customers
  const customer1 = await ensureUser({
    fullName: "Priya Customer",
    email: "customer@example.com",
    password: "Customer123!",
    role: "customer",
  });

  const customer2 = await ensureUser({
    fullName: "Rajesh Buyer",
    email: "rajesh@example.com",
    password: "Buyer123!",
    role: "customer",
  });

  const customer3 = await ensureUser({
    fullName: "Anita Shopper",
    email: "anita@example.com",
    password: "Shop123!",
    role: "customer",
  });

  const customer4 = await ensureUser({
    fullName: "Meera Patel",
    email: "meera@example.com",
    password: "Buyer123!",
    role: "customer",
  });

  // Create communities
  const communityOne = await ensureCommunity({
    name: "Green Ridge Community",
    description: "A friendly neighborhood pool for staple groceries and weekly essentials.",
    address: "12 Green Ridge Lane",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    latitude: 12.9716,
    longitude: 77.5946,
    deliverySchedule: [
      { day: "Monday", cutOffTime: "18:00" },
      { day: "Thursday", cutOffTime: "20:00" },
    ],
    thresholdAmount: 1000,
    currentOrderValue: 0,
    createdBy: communityAdmin._id,
    isActive: true,
  });

  const communityTwo = await ensureCommunity({
    name: "Lakeview Cooperative",
    description: "Shared bulk ordering for households near the lake district.",
    address: "88 Lakeview Road",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    latitude: 12.9351,
    longitude: 77.6245,
    deliverySchedule: [
      { day: "Wednesday", cutOffTime: "17:00" },
      { day: "Saturday", cutOffTime: "19:00" },
    ],
    thresholdAmount: 1500,
    maxBatchAmount: 5000,
    currentOrderValue: 0,
    createdBy: superAdmin._id,
    isActive: true,
  });

  // Assign customers to communities
  if (!customer1.community) {
    customer1.community = communityOne._id;
    await customer1.save();
  }
  if (!customer2.community) {
    customer2.community = communityOne._id;
    await customer2.save();
  }
  if (!customer3.community) {
    customer3.community = communityTwo._id;
    await customer3.save();
  }
  if (!customer4.community) {
    customer4.community = communityOne._id;
    await customer4.save();
  }

  // Create diverse products (available community-wide by default)
  const products = [];
  // A clean generated SVG icon per category -- avoids depending on any
  // external image host (reliability) and avoids third-party photo
  // copyright/licensing concerns for demo data.
  const CATEGORY_STYLE = {
    Fruits: { color: "#f97316", emoji: "🍎" },
    Vegetables: { color: "#16a34a", emoji: "🥕" },
    Bakery: { color: "#b45309", emoji: "🍞" },
    Dairy: { color: "#0ea5e9", emoji: "🥛" },
    Pantry: { color: "#a16207", emoji: "🍯" },
    Grains: { color: "#ca8a04", emoji: "🌾" },
  };
  const productImage = (category) => {
    const style = CATEGORY_STYLE[category] || { color: "#64748b", emoji: "🛒" };
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160">
      <rect width="160" height="160" rx="24" fill="${style.color}"/>
      <text x="50%" y="54%" font-size="72" text-anchor="middle" dominant-baseline="middle">${style.emoji}</text>
    </svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  const productSpecs = [
    { name: "Fresh Apples", desc: "Locally sourced apples in 2 kg cartons.", category: "Fruits", brand: "Green Farm", price: 180, stock: 40 },
    { name: "Basmati Rice", desc: "Premium basmati rice for weekly pantry needs.", category: "Grains", brand: "River Gold", price: 240, stock: 25 },
    { name: "Tomatoes", desc: "Fresh red tomatoes from local farms.", category: "Vegetables", brand: "Farm Fresh", price: 50, stock: 60 },
    { name: "Carrots", desc: "Organic carrots, 1 kg pack.", category: "Vegetables", brand: "Organic Valley", price: 40, stock: 50 },
    { name: "Whole Wheat Bread", desc: "Fresh baked whole wheat bread.", category: "Bakery", brand: "Homemade", price: 80, stock: 30 },
    { name: "Milk", desc: "Fresh cow milk, 1 liter.", category: "Dairy", brand: "Pure Dairy", price: 60, stock: 100 },
    { name: "Paneer", desc: "Fresh paneer cheese, 500g.", category: "Dairy", brand: "Pure Dairy", price: 250, stock: 20 },
    { name: "Olive Oil", desc: "Extra virgin olive oil, 500ml.", category: "Pantry", brand: "Golden", price: 350, stock: 15 },
    { name: "Honey", desc: "Pure honey, 500g jar.", category: "Pantry", brand: "Bee Sweet", price: 200, stock: 25 },
    { name: "Banana", desc: "Fresh yellow bananas, 1 dozen.", category: "Fruits", brand: "Farm Fresh", price: 60, stock: 45 },
  ];

  for (const spec of productSpecs) {
    const product = await ensureProduct({
      name: spec.name,
      description: spec.desc,
      category: spec.category,
      brand: spec.brand,
      price: spec.price,
      stock: spec.stock,
      image: productImage(spec.category),
      shopkeeper: shopkeeper._id,
      communities: [],
      isAvailable: true,
    });
    products.push(product);
  }

  // Orders reference the exact batch date the threshold engine will look
  // for (nearest upcoming occurrence of that weekday), so seeded orders
  // actually participate in pooling instead of silently missing their batch.
  const mondayDate = getNearestDateForWeekday("Monday");
  const wednesdayDate = getNearestDateForWeekday("Wednesday");

  const ensureOrder = async ({ user, community, items, deliveryDay, deliveryDate }) => {
    const existing = await Order.findOne({ user: user._id, community: community._id, deliveryDay, status: "Pending" });
    if (existing) return existing;

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
    return Order.create({ user: user._id, community: community._id, items, totalAmount, deliveryDay, deliveryDate, status: "Pending" });
  };

  // Community One / Monday batch: three customers pooling under the ₹1000
  // threshold, then a fourth crosses it -- demonstrating that a proposal is
  // only created once the *batch* (not the whole community) reaches target.
  await ensureOrder({
    user: customer1,
    community: communityOne,
    deliveryDay: "Monday",
    deliveryDate: mondayDate,
    items: [
      { product: products[0]._id, quantity: 2, price: products[0].price },
      { product: products[1]._id, quantity: 1, price: products[1].price },
    ],
  });

  await ensureOrder({
    user: customer2,
    community: communityOne,
    deliveryDay: "Monday",
    deliveryDate: mondayDate,
    items: [
      { product: products[2]._id, quantity: 3, price: products[2].price },
      { product: products[3]._id, quantity: 2, price: products[3].price },
      { product: products[5]._id, quantity: 2, price: products[5].price },
    ],
  });

  await ensureOrder({
    user: customer4,
    community: communityOne,
    deliveryDay: "Monday",
    deliveryDate: mondayDate,
    items: [{ product: products[1]._id, quantity: 1, price: products[1].price }],
  });

  // Community Two / Wednesday batch: single order, well under threshold.
  await ensureOrder({
    user: customer3,
    community: communityTwo,
    deliveryDay: "Wednesday",
    deliveryDate: wednesdayDate,
    items: [
      { product: products[4]._id, quantity: 2, price: products[4].price },
      { product: products[6]._id, quantity: 1, price: products[6].price },
      { product: products[7]._id, quantity: 1, price: products[7].price },
    ],
  });

  // Evaluate thresholds per batch to create delivery proposals where earned.
  const resultOne = await evaluateCommunityThreshold(communityOne._id);
  const resultTwo = await evaluateCommunityThreshold(communityTwo._id);

  const freshOne = await Community.findById(communityOne._id);
  const freshTwo = await Community.findById(communityTwo._id);

  console.log("Seed data complete. Demo accounts and communities are ready.");
  console.log("\nDemo Accounts:");
  console.log("  Super Admin: admin@example.com / Admin123!");
  console.log("  Community Admin: admin@community.com / Admin123!");
  console.log("  Shopkeeper (approved): shopkeeper@example.com / Shop123!");
  console.log("  Shopkeeper (pending approval): newshop@example.com / Shop123!");
  console.log("  Customer 1 (Green Ridge): customer@example.com / Customer123!");
  console.log("  Customer 2 (Green Ridge): rajesh@example.com / Buyer123!");
  console.log("  Customer 3 (Lakeview): anita@example.com / Shop123!");
  console.log("  Customer 4 (Green Ridge): meera@example.com / Buyer123!");
  console.log("\nCommunities:");
  console.log(`  1. ${freshOne.name} (Pincode: ${freshOne.pincode}) - threshold Rs.${freshOne.thresholdAmount}`);
  resultOne.batches.forEach((b) => console.log(`     ${b.deliveryDay}: Rs.${b.totalAmount} (${b.orderCount} orders) - proposal: ${b.proposalCreatedOrUpdated}`));
  console.log(`  2. ${freshTwo.name} (Pincode: ${freshTwo.pincode}) - threshold Rs.${freshTwo.thresholdAmount}`);
  resultTwo.batches.forEach((b) => console.log(`     ${b.deliveryDay}: Rs.${b.totalAmount} (${b.orderCount} orders) - proposal: ${b.proposalCreatedOrUpdated}`));

  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error.message, error.stack);
  process.exit(1);
});