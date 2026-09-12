import Order from "./model.js";
import Cart from "../cart/model.js";
import User from "../users/model.js";
import Community from "../communities/model.js";
import Product from "../products/model.js";
import Delivery from "../deliveries/model.js";
import { evaluateCommunityThreshold } from "../threshold/service.js";
import { getNextDateForWeekday, hasCutOffPassed } from "../../utils/date.js";

const placeOrder = async (userId, deliveryDay, cutoffOverride = {}) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (!user.community) {
    throw new Error("Join a community first.");
  }

  const community = await Community.findById(user.community);

  if (!community || !community.isActive) {
    throw new Error("Community not found.");
  }

  const schedule = community.deliverySchedule.find((item) => item.day === deliveryDay);

  if (!schedule) {
    throw new Error("Selected delivery day is not available for this community.");
  }

  const deliveryDate = getNextDateForWeekday(deliveryDay);

  const overrideAllowed = cutoffOverride.enabled === true && ["communityAdmin", "superAdmin"].includes(user.role);
  if (hasCutOffPassed(deliveryDate, schedule.cutOffTime) && !overrideAllowed) {
    throw new Error("Order cut off time has passed for the selected delivery day.");
  }
  if (cutoffOverride.enabled && !overrideAllowed) throw new Error("Only a community administrator can override an order cutoff.");

  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const productIds = cart.items.map((item) => item.product?._id || item.product);
  const products = await Product.find({ _id: { $in: productIds }, isAvailable: true });
  const productsById = new Map(products.map((product) => [product._id.toString(), product]));
  const orderItems = cart.items.map((item) => {
    const productId = (item.product?._id || item.product).toString();
    const product = productsById.get(productId);
    if (!product) throw new Error("A cart product is no longer available.");
    if (item.quantity > product.stock) throw new Error(`Insufficient stock for ${product.name}.`);
    return { product: product._id, quantity: item.quantity, price: product.price };
  });
  const totalAmount = orderItems.reduce((total, item) => total + item.quantity * item.price, 0);

  const order = await Order.create({
    user: userId,
    community: user.community,
    items: orderItems,
    totalAmount,
    deliveryDay,
    deliveryDate,
    cutoffOverride: overrideAllowed ? { overriddenBy: userId, overriddenAt: new Date(), reason: cutoffOverride.reason || "" } : undefined,
  });

  community.currentOrderValue += totalAmount;
  await community.save();

  cart.items = [];
  cart.totalAmount = 0;
  await cart.save();

  await evaluateCommunityThreshold(community._id);

  return order.populate("items.product");
};

const getMyOrders = async (userId) => {
  return await Order.find({ user: userId })
    .populate("items.product")
    .populate("community", "name")
    .sort({ createdAt: -1 });
};

const getOrderById = async (orderId, userId, userRole) => {
  const order = await Order.findById(orderId)
    .populate("items.product")
    .populate("community", "name")
    .populate("user", "fullName email");

  if (!order) {
    throw new Error("Order not found.");
  }

  if (userRole !== "superAdmin" && order.user._id.toString() !== userId) {
    throw new Error("Unauthorized.");
  }

  return order;
};

const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (!["Pending", "Confirmed", "Packed", "Out for Delivery", "Delivered", "Cancelled"].includes(status)) throw new Error("Invalid order status.");
  order.status = status;
  await order.save();

  return order;
};

const cancelOrder = async (orderId, userId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw new Error("Order not found.");
  }

  if (order.user.toString() !== userId) {
    throw new Error("Unauthorized.");
  }

  if (order.status !== "Pending") {
    throw new Error("Only pending orders can be cancelled.");
  }

  const proposedDelivery = await Delivery.exists({
    orders: order._id,
    approvalStatus: "Pending",
  });
  if (proposedDelivery) {
    throw new Error("This order is already included in a delivery proposal and cannot be cancelled individually.");
  }

  const community = await Community.findById(order.community);

  if (community) {
    community.currentOrderValue = Math.max(0, community.currentOrderValue - order.totalAmount);
    await community.save();
  }

  order.status = "Cancelled";
  await order.save();

  await evaluateCommunityThreshold(order.community);

  return order;
};

export { placeOrder, getMyOrders, getOrderById, updateOrderStatus, cancelOrder };
