import Order from "./model.js";
import Cart from "../cart/model.js";
import User from "../users/model.js";
import Community from "../communities/model.js";
import { evaluateCommunityThreshold } from "../threshold/service.js";
import { getNextDateForWeekday, hasCutOffPassed } from "../../utils/date.js";

const placeOrder = async (userId, deliveryDay) => {
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

  if (hasCutOffPassed(deliveryDate, schedule.cutOffTime)) {
    throw new Error("Order cut off time has passed for the selected delivery day.");
  }

  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const order = await Order.create({
    user: userId,
    community: user.community,
    items: cart.items.map((item) => ({
      product: item.product._id || item.product,
      quantity: item.quantity,
      price: item.price,
    })),
    totalAmount: cart.totalAmount,
    deliveryDay,
    deliveryDate,
  });

  community.currentOrderValue += order.totalAmount;
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

  const community = await Community.findById(order.community);

  if (community) {
    community.currentOrderValue = Math.max(0, community.currentOrderValue - order.totalAmount);
    await community.save();
  }

  order.status = "Cancelled";
  await order.save();

  return order;
};

export { placeOrder, getMyOrders, getOrderById, updateOrderStatus, cancelOrder };
