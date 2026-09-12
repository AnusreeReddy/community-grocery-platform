import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../database/db.js";
import User from "../modules/users/model.js";
import Community from "../modules/communities/model.js";
import Product from "../modules/products/model.js";
import Order from "../modules/orders/model.js";
import { evaluateCommunityThreshold } from "../modules/threshold/service.js";

dotenv.config();

const seed = async () => {
  await connectDB();

  const hashPassword = async (password) => bcrypt.hash(password, 10);

  const ensureUser = async ({ fullName, email, password, role }) => {
    const existing = await User.findOne({ email });
    if (existing) return existing;

    const hashedPassword = await hashPassword(password);
    return User.create({ fullName, email, password: hashedPassword, role });
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

  // Create shopkeeper
  const shopkeeper = await ensureUser({
    fullName: "Aman Shopkeeper",
    email: "shopkeeper@example.com",
    password: "Shop123!",
    role: "shopkeeper",
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

  // Create communities
  const communityOne = await ensureCommunity({
    name: "Green Ridge Community",
    description: "A friendly neighborhood pool for staple groceries and weekly essentials.",
    address: "12 Green Ridge Lane",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
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
    deliverySchedule: [
      { day: "Wednesday", cutOffTime: "17:00" },
      { day: "Saturday", cutOffTime: "19:00" },
    ],
    thresholdAmount: 1500,
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

  // Create diverse products
  const products = [];
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
      image: "",
      shopkeeper: shopkeeper._id,
      isAvailable: true,
    });
    products.push(product);
  }

  // Create orders for community 1
  const ordersForCommunity1 = [];
  
  // Order 1 - Customer 1
  const order1 = await Order.findOne({ user: customer1._id, community: communityOne._id, status: "Pending" }).catch(() => null);
  if (!order1) {
    const newOrder1 = await Order.create({
      user: customer1._id,
      community: communityOne._id,
      items: [
        { product: products[0]._id, quantity: 2, price: products[0].price },
        { product: products[1]._id, quantity: 1, price: products[1].price },
      ],
      totalAmount: 2 * products[0].price + 1 * products[1].price,
      deliveryDay: "Monday",
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    ordersForCommunity1.push(newOrder1);
    communityOne.currentOrderValue += newOrder1.totalAmount;
  }

  // Order 2 - Customer 2
  const order2 = await Order.findOne({ user: customer2._id, community: communityOne._id, status: "Pending" }).catch(() => null);
  if (!order2) {
    const newOrder2 = await Order.create({
      user: customer2._id,
      community: communityOne._id,
      items: [
        { product: products[2]._id, quantity: 3, price: products[2].price },
        { product: products[3]._id, quantity: 2, price: products[3].price },
        { product: products[5]._id, quantity: 2, price: products[5].price },
      ],
      totalAmount: 3 * products[2].price + 2 * products[3].price + 2 * products[5].price,
      deliveryDay: "Monday",
      deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    ordersForCommunity1.push(newOrder2);
    communityOne.currentOrderValue += newOrder2.totalAmount;
  }

  // Order 3 - Customer 3 in Community 2
  const order3 = await Order.findOne({ user: customer3._id, community: communityTwo._id, status: "Pending" }).catch(() => null);
  if (!order3) {
    const newOrder3 = await Order.create({
      user: customer3._id,
      community: communityTwo._id,
      items: [
        { product: products[4]._id, quantity: 2, price: products[4].price },
        { product: products[6]._id, quantity: 1, price: products[6].price },
        { product: products[7]._id, quantity: 1, price: products[7].price },
      ],
      totalAmount: 2 * products[4].price + 1 * products[6].price + 1 * products[7].price,
      deliveryDay: "Wednesday",
      deliveryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });
    ordersForCommunity1.push(newOrder3);
    communityTwo.currentOrderValue += newOrder3.totalAmount;
  }

  await communityOne.save();
  await communityTwo.save();

  // Evaluate thresholds to create delivery proposals if needed
  await evaluateCommunityThreshold(communityOne._id);
  await evaluateCommunityThreshold(communityTwo._id);

  console.log("✅ Seed data complete. Demo accounts and communities are ready.");
  console.log("\n📝 Demo Accounts:");
  console.log("  Super Admin: admin@example.com / Admin123!");
  console.log("  Community Admin: admin@community.com / Admin123!");
  console.log("  Shopkeeper: shopkeeper@example.com / Shop123!");
  console.log("  Customer 1: customer@example.com / Customer123!");
  console.log("  Customer 2: rajesh@example.com / Buyer123!");
  console.log("  Customer 3: anita@example.com / Shop123!");
  console.log("\n🏘️  Communities:");
  console.log(`  1. ${communityOne.name} (Pincode: ${communityOne.pincode})`);
  console.log(`     - Threshold: ₹${communityOne.thresholdAmount}`);
  console.log(`     - Current Orders: ₹${communityOne.currentOrderValue}`);
  console.log(`     - Status: ${communityOne.currentOrderValue >= communityOne.thresholdAmount ? "✓ Threshold Reached" : "Pending"}`);
  console.log(`  2. ${communityTwo.name} (Pincode: ${communityTwo.pincode})`);
  console.log(`     - Threshold: ₹${communityTwo.thresholdAmount}`);
  console.log(`     - Current Orders: ₹${communityTwo.currentOrderValue}`);
  console.log(`     - Status: ${communityTwo.currentOrderValue >= communityTwo.thresholdAmount ? "✓ Threshold Reached" : "Pending"}`);

  process.exit(0);
};

seed().catch((error) => {
  console.error("❌ Seed failed:", error.message);
  process.exit(1);
});
