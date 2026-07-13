import Delivery from "./model.js";
import Order from "../orders/model.js";
import Community from "../communities/model.js";
import Product from "../products/model.js";

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
  if (!VALID_STATUS_TRANSITIONS[delivery.deliveryStatus]?.includes(status)) throw new Error("Invalid delivery status transition.");

  delivery.deliveryStatus = status;

  await delivery.save();

  await Order.updateMany(
    { _id: { $in: delivery.orders } },
    {
      status,
    }
  );

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
    await Promise.all(products.map((product) => Product.updateOne({ _id: product._id, stock: { $gte: requested.get(product._id.toString()) } }, { $inc: { stock: -requested.get(product._id.toString()) } })));
  } else {
    delivery.deliveryStatus = "Cancelled";
    delivery.proposalKey = undefined;
    await Order.updateMany({ _id: { $in: delivery.orders }, status: "Confirmed" }, { status: "Pending" });
  }

  delivery.shopkeeperApproval = { status: action, actionBy: actorId, actionAt: new Date(), note };
  await delivery.save();
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
