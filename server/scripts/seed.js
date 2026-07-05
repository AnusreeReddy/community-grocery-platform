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

  const superAdmin = await ensureUser({
    fullName: "System Admin",
    email: "admin@example.com",
    password: "Admin123!",
    role: "superAdmin",
  });

  const shopkeeper = await ensureUser({
    fullName: "Aman Shopkeeper",
    email: "shopkeeper@example.com",
    password: "Shop123!",
    role: "shopkeeper",
  });

  const customer = await ensureUser({
    fullName: "Priya Customer",
    email: "customer@example.com",
    password: "Customer123!",
    role: "customer",
  });

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
    thresholdAmount: 500,
    currentOrderValue: 0,
    createdBy: superAdmin._id,
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
      { day: "Thursday", cutOffTime: "20:00" },
      { day: "Saturday", cutOffTime: "19:00" },
    ],
    thresholdAmount: 500,
    currentOrderValue: 0,
    createdBy: superAdmin._id,
    isActive: true,
  });

  if (!customer.community) {
    customer.community = communityOne._id;
    await customer.save();
  }

  const productOne = await ensureProduct({
    name: "Fresh Apples",
    description: "Locally sourced apples in 2 kg cartons.",
    category: "Fruits",
    brand: "Green Farm",
    price: 180,
    stock: 40,
    image: "",
    shopkeeper: shopkeeper._id,
    isAvailable: true,
  });

  const productTwo = await ensureProduct({
    name: "Basmati Rice",
    description: "Premium basmati rice for weekly pantry needs.",
    category: "Grains",
    brand: "River Gold",
    price: 240,
    stock: 25,
    image: "",
    shopkeeper: shopkeeper._id,
    isAvailable: true,
  });

  const existingOrder = await Order.findOne({ user: customer._id, community: communityOne._id, status: "Pending" });
  if (!existingOrder) {
    const order = await Order.create({
      user: customer._id,
      community: communityOne._id,
      items: [
        { product: productOne._id, quantity: 2, price: productOne.price },
        { product: productTwo._id, quantity: 1, price: productTwo.price },
      ],
      totalAmount: 600,
      deliveryDay: "Thursday",
      deliveryDate: new Date(),
    });

    communityOne.currentOrderValue += order.totalAmount;
    await communityOne.save();
  }

  await evaluateCommunityThreshold(communityOne._id);

  console.log("Seed data complete. Demo accounts and communities are ready.");
  process.exit(0);
};

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
