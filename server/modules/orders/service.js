import Order from "./model.js";
import Cart from "../cart/model.js";
import User from "../users/model.js";
import Community from "../communities/model.js";
import Product from "../products/model.js";
import Delivery from "../deliveries/model.js";
import { evaluateCommunityThreshold, getPendingBatchOrders } from "../threshold/service.js";
import { getNearestDateForWeekday, hasCutOffPassed } from "../../utils/date.js";
import { badRequest, notFound, forbidden } from "../../utils/errors.js";

// Reserves stock for each order item atomically (conditional decrement), so
// two customers ordering the last units of a product can't both succeed.
// Rolls back any already-decremented items if a later item fails.
const reserveStock = async (items) => {
  const decremented = [];
  try {
    for (const item of items) {
      const result = await Product.updateOne(
        { _id: item.product, isAvailable: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } }
      );
      if (result.modifiedCount !== 1) {
        throw badRequest(`Insufficient stock for the requested quantity.`);
      }
      decremented.push(item);
    }
  } catch (error) {
    await Promise.all(
      decremented.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }))
    );
    throw error;
  }
};

const restoreStock = async (items) => {
  await Promise.all(
    items.map((item) => Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity } }))
  );
};

const placeOrder = async (userId, deliveryDay, cutoffOverride = {}) => {
  const user = await User.findById(userId);

  if (!user) {
    throw notFound("User not found.");
  }

  if (!user.community) {
    throw badRequest("Join a community first.");
  }

  const community = await Community.findById(user.community);

  if (!community || !community.isActive) {
    throw notFound("Community not found.");
  }

  const schedule = community.deliverySchedule.find((item) => item.day === deliveryDay);

  if (!schedule) {
    throw badRequest("Selected delivery day is not available for this community.");
  }

  const deliveryDate = getNearestDateForWeekday(deliveryDay);

  const overrideAllowed = cutoffOverride.enabled === true && ["communityAdmin", "superAdmin"].includes(user.role);
  if (hasCutOffPassed(deliveryDate, schedule.cutOffTime) && !overrideAllowed) {
    throw badRequest(
      `Order cut off time (${schedule.cutOffTime}) has passed for the ${deliveryDay} batch on ${deliveryDate.toDateString()}.`
    );
  }
  if (cutoffOverride.enabled && !overrideAllowed) {
    throw forbidden("Only a community administrator can override an order cutoff.");
  }

  const cart = await Cart.findOne({ user: userId }).populate("items.product");

  if (!cart || cart.items.length === 0) {
    throw badRequest("Cart is empty.");
  }

  const productIds = cart.items.map((item) => item.product?._id || item.product);
  const products = await Product.find({ _id: { $in: productIds }, isAvailable: true });
  const productsById = new Map(products.map((product) => [product._id.toString(), product]));
  const orderItems = cart.items.map((item) => {
    const productId = (item.product?._id || item.product).toString();
    const product = productsById.get(productId);
    if (!product) throw badRequest("A cart product is no longer available.");
    if (item.quantity > product.stock) throw badRequest(`Insufficient stock for ${product.name}.`);
    return { product: product._id, quantity: item.quantity, price: product.price };
  });
  const totalAmount = orderItems.reduce((total, item) => total + item.quantity * item.price, 0);

  // Batch capacity: this order must not push the pooled batch total past the
  // community's configured cap (if one is set), independent of the threshold
  // minimum which is a floor, not a ceiling.
  if (community.maxBatchAmount) {
    const batchOrders = await getPendingBatchOrders(community._id, deliveryDay, deliveryDate);
    const batchTotal = batchOrders.reduce((sum, order) => sum + order.totalAmount, 0);
    if (batchTotal + totalAmount > community.maxBatchAmount) {
      throw badRequest(
        `This delivery batch is near capacity (₹${batchTotal} of ₹${community.maxBatchAmount}). Choose a different delivery day.`
      );
    }
  }

  await reserveStock(orderItems);

  let order;
  try {
    order = await Order.create({
      user: userId,
      community: user.community,
      items: orderItems,
      totalAmount,
      deliveryDay,
      deliveryDate,
      cutoffOverride: overrideAllowed
        ? { overriddenBy: userId, overriddenAt: new Date(), reason: cutoffOverride.reason || "" }
        : undefined,
    });
  } catch (error) {
    await restoreStock(orderItems);
    throw error;
  }

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
    throw notFound("Order not found.");
  }

  if (userRole !== "superAdmin" && order.user._id.toString() !== userId) {
    throw forbidden("Unauthorized.");
  }

  return order;
};

const ORDER_STATUS_TRANSITIONS = {
  Pending: ["Confirmed", "Cancelled"],
  Confirmed: ["Packed", "Cancelled"],
  Packed: ["Out for Delivery"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

// This is an administrative override outside the normal delivery-driven
// lifecycle (delivery approval/status updates already move orders through
// Confirmed -> ... -> Delivered). It still must not skip states.
const updateOrderStatus = async (orderId, status) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw notFound("Order not found.");
  }

  if (!Object.keys(ORDER_STATUS_TRANSITIONS).includes(status)) {
    throw badRequest("Invalid order status.");
  }

  if (!ORDER_STATUS_TRANSITIONS[order.status]?.includes(status)) {
    throw badRequest(`Cannot move an order from ${order.status} to ${status}.`);
  }

  if (status === "Cancelled") {
    await restoreStock(order.items);
    const community = await Community.findById(order.community);
    if (community) {
      community.currentOrderValue = Math.max(0, community.currentOrderValue - order.totalAmount);
      await community.save();
    }
  }

  order.status = status;
  await order.save();

  if (status === "Cancelled") {
    await evaluateCommunityThreshold(order.community);
  }

  return order;
};

const cancelOrder = async (orderId, userId) => {
  const order = await Order.findById(orderId);

  if (!order) {
    throw notFound("Order not found.");
  }

  if (order.user.toString() !== userId) {
    throw forbidden("Unauthorized.");
  }

  if (order.status !== "Pending") {
    throw badRequest("Only pending orders can be cancelled.");
  }

  const proposedDelivery = await Delivery.exists({
    orders: order._id,
    approvalStatus: "Pending",
  });
  if (proposedDelivery) {
    throw badRequest("This order is already included in a delivery proposal and cannot be cancelled individually.");
  }

  await restoreStock(order.items);

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

export { placeOrder, getMyOrders, getOrderById, updateOrderStatus, cancelOrder, restoreStock };
