import Delivery from "./model.js";
import Order from "../orders/model.js";
import Community from "../communities/model.js";
import Product from "../products/model.js";
import { createNotification } from "../notifications/service.js";
import { evaluateCommunityThreshold } from "../threshold/service.js";

const notifyDeliveryOrders = async (delivery, type, message) => {
  const orders = await Order.find({ _id: { $in: delivery.orders } }).select("user");
  const users = [...new Set(orders.map((order) => order.user.toString()))];
  await Promise.all(users.map((userId) => createNotification(userId, type, message, { deliveryId: delivery._id, communityId: delivery.community })));
};

const createDelivery = async (data) => {
  const existing = await Delivery.findOne({
    community: data.community,
    deliveryDay: data.deliveryDay,
    deliveryDate: new Date(data.deliveryDate),
    approvalStatus: { $in: ["Pending", "Approved"] },
  });
  if (existing) throw new Error("An active delivery is already scheduled for this community and date.");
  return Delivery.create(data);
};

const getAllDeliveries = async (filters = {}) => {
  const query = {};
  if (filters.community) query.community = filters.community;
  return Delivery.find(query)
    .populate("community", "name")
    .populate("orders")
    .sort({ createdAt: -1 });
};

const getDeliveryById = async (id) => {
  const delivery = await Delivery.findById(id)
    .populate("community", "name")
    .populate({
      path: "orders",
      populate: {
        path: "user",
        select: "fullName email",
      },
    });

  if (!delivery) {
    throw new Error("Delivery not found.");
  }

  return delivery;
};

const VALID_STATUS_TRANSITIONS = {
  Scheduled: ["Packed", "Cancelled"],
  Packed: ["Dispatched", "Cancelled"],
  Dispatched: ["Out for Delivery"],
  "Out for Delivery": ["Delivered"],
  Delivered: [],
  Cancelled: [],
};

const updateDeliveryStatus = async (id, status) => {
  const delivery = await Delivery.findById(id);

  if (!delivery) {
    throw new Error("Delivery not found.");
  }

  if (delivery.approvalStatus !== "Approved") throw new Error("Delivery must be approved before its status can progress.");
  if (status !== "Cancelled" && delivery.shopkeeperApproval.status !== "Accepted") throw new Error("Inventory must be accepted before delivery can progress.");
  if (!VALID_STATUS_TRANSITIONS[delivery.deliveryStatus]?.includes(status)) throw new Error("Invalid delivery status transition.");

  delivery.deliveryStatus = status;

  await delivery.save();

  if (status === "Cancelled") {
    await Order.updateMany({ _id: { $in: delivery.orders }, status: { $ne: "Delivered" } }, { status: "Pending" });
    delivery.proposalKey = undefined;
    await delivery.save();
    const community = await Community.findById(delivery.community);
    if (community) {
      community.currentOrderValue = (await Order.find({ community: community._id, status: "Pending" })).reduce((sum, order) => sum + order.totalAmount, 0);
      community.isDeliveryConfirmed = false;
      await community.save();
    }
    await evaluateCommunityThreshold(delivery.community);
  } else {
    await Order.updateMany({ _id: { $in: delivery.orders } }, { status });
  }

  await notifyDeliveryOrders(delivery, "delivery_status", `Delivery status updated to ${status}.`);

  return delivery;
};

const approveDelivery = async (id, approvalAction, actorId, note = "") => {
  const delivery = await Delivery.findById(id);

  if (!delivery) {
    throw new Error("Delivery not found.");
  }

  if (delivery.approvalStatus !== "Pending") {
    throw new Error("Delivery approval has already been processed.");
  }

  if (!["Approved", "Rejected"].includes(approvalAction)) {
    throw new Error("Invalid approval action.");
  }

  delivery.approvalStatus = approvalAction;
  delivery.adminApproval = { actionBy: actorId, actionAt: new Date(), note };

  if (approvalAction === "Approved") {
    delivery.deliveryStatus = "Scheduled";
    await Order.updateMany(
      { _id: { $in: delivery.orders }, status: "Pending" },
      { status: "Confirmed" }
    );
  } else {
    delivery.deliveryStatus = "Cancelled";
    delivery.proposalKey = undefined;
  }

  if (approvalAction === "Approved") {
    const community = await Community.findById(delivery.community);
    if (community) {
      const pendingOrders = await Order.find({
        community: community._id,
        status: "Pending",
      });
      community.currentOrderValue = pendingOrders.reduce(
        (sum, order) => sum + order.totalAmount,
        0
      );
      community.isDeliveryConfirmed = true;
      await community.save();
    }
  }

  await delivery.save();

  await notifyDeliveryOrders(
    delivery,
    approvalAction === "Approved" ? "delivery_approved" : "delivery_rejected",
    approvalAction === "Approved" ? "Your delivery proposal was approved." : "Your delivery proposal was rejected."
  );

  return delivery;
};

const confirmInventory = async (id, action, actorId, note = "") => {
  const delivery = await Delivery.findById(id).populate({ path: "orders", populate: { path: "items.product" } });
  if (!delivery) throw new Error("Delivery not found.");
  if (delivery.approvalStatus !== "Approved") throw new Error("Only an admin-approved delivery can be confirmed by a shopkeeper.");
  if (delivery.shopkeeperApproval.status !== "Pending") throw new Error("Inventory confirmation has already been processed.");
  if (!["Accepted", "Rejected"].includes(action)) throw new Error("Invalid inventory confirmation action.");

  if (action === "Accepted") {
    const requested = new Map();
    for (const order of delivery.orders) {
      for (const item of order.items) {
        const productId = item.product?._id?.toString() || item.product.toString();
        requested.set(productId, (requested.get(productId) || 0) + item.quantity);
      }
    }
    const products = await Product.find({ _id: { $in: [...requested.keys()] } });
    for (const product of products) {
      if (!product.isAvailable || product.stock < requested.get(product._id.toString())) {
        throw new Error(`Insufficient inventory for ${product.name}.`);
      }
    }
    if (products.length !== requested.size) throw new Error("One or more ordered products no longer exist.");
    const decremented = [];
    try {
      for (const product of products) {
        const quantity = requested.get(product._id.toString());
        const result = await Product.updateOne(
          { _id: product._id, isAvailable: true, stock: { $gte: quantity } },
          { $inc: { stock: -quantity } }
        );
        if (result.modifiedCount !== 1) throw new Error(`Insufficient inventory for ${product.name}.`);
        decremented.push({ productId: product._id, quantity });
      }
    } catch (error) {
      await Promise.all(decremented.map(({ productId, quantity }) => Product.updateOne({ _id: productId }, { $inc: { stock: quantity } })));
      throw error;
    }
  } else {
    delivery.deliveryStatus = "Cancelled";
    delivery.proposalKey = undefined;
    await Order.updateMany({ _id: { $in: delivery.orders }, status: "Confirmed" }, { status: "Pending" });
    const community = await Community.findById(delivery.community);
    if (community) {
      community.currentOrderValue = (await Order.find({ community: community._id, status: "Pending" })).reduce((sum, order) => sum + order.totalAmount, 0);
      community.isDeliveryConfirmed = false;
      await community.save();
    }
    await evaluateCommunityThreshold(delivery.community);
  }

  delivery.shopkeeperApproval = { status: action, actionBy: actorId, actionAt: new Date(), note };
  await delivery.save();
  await notifyDeliveryOrders(
    delivery,
    action === "Accepted" ? "inventory_confirmed" : "inventory_rejected",
    action === "Accepted" ? "Inventory was confirmed for your delivery." : "Inventory could not be confirmed; your order is pending again."
  );
  return delivery;
};

const deleteDelivery = async (id) => {
  const delivery = await Delivery.findById(id);

  if (!delivery) {
    throw new Error("Delivery not found.");
  }

  await delivery.deleteOne();

  return;
};

export {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  approveDelivery,
  confirmInventory,
  deleteDelivery,
};
