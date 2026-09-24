import Delivery from "./model.js";
import Order from "../orders/model.js";
import Community from "../communities/model.js";
import Product from "../products/model.js";
import { createNotification } from "../notifications/service.js";
import { evaluateCommunityThreshold } from "../threshold/service.js";
import { restoreStock } from "../orders/service.js";
import { badRequest, notFound } from "../../utils/errors.js";

const notifyDeliveryOrders = async (delivery, type, message) => {
  const orders = await Order.find({ _id: { $in: delivery.orders } }).select("user");
  const users = [...new Set(orders.map((order) => order.user.toString()))];
  await Promise.all(
    users.map((userId) =>
      createNotification(userId, type, message, { deliveryId: delivery._id, communityId: delivery.community })
    )
  );
};

const createDelivery = async (data) => {
  const existing = await Delivery.findOne({
    community: data.community,
    deliveryDay: data.deliveryDay,
    deliveryDate: new Date(data.deliveryDate),
    approvalStatus: { $in: ["Pending", "Approved"] },
  });
  if (existing) throw badRequest("An active delivery is already scheduled for this community and date.");
  return Delivery.create(data);
};

const getAllDeliveries = async (filters = {}) => {
  const query = {};
  if (filters.community) query.community = filters.community;
  return Delivery.find(query).populate("community", "name").populate("orders").sort({ createdAt: -1 });
};

const getDeliveryById = async (id) => {
  const delivery = await Delivery.findById(id)
    .populate("community", "name")
    .populate({
      path: "orders",
      populate: { path: "user", select: "fullName email" },
    });

  if (!delivery) {
    throw notFound("Delivery not found.");
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
    throw notFound("Delivery not found.");
  }

  if (delivery.approvalStatus !== "Approved") throw badRequest("Delivery must be approved before its status can progress.");
  if (status !== "Cancelled" && delivery.shopkeeperApproval.status !== "Accepted")
    throw badRequest("Inventory must be accepted before delivery can progress.");
  if (!VALID_STATUS_TRANSITIONS[delivery.deliveryStatus]?.includes(status))
    throw badRequest(`Cannot move a delivery from ${delivery.deliveryStatus} to ${status}.`);

  delivery.deliveryStatus = status;
  await delivery.save();

  if (status === "Cancelled") {
    // Orders return to Pending (not Cancelled) so they can be re-pooled into
    // a future batch; their stock reservation is untouched since the order
    // itself was never cancelled.
    await Order.updateMany({ _id: { $in: delivery.orders }, status: { $ne: "Delivered" } }, { status: "Pending" });
    delivery.proposalKey = undefined;
    await delivery.save();
    const community = await Community.findById(delivery.community);
    if (community) {
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
    throw notFound("Delivery not found.");
  }

  if (delivery.approvalStatus !== "Pending") {
    throw badRequest("Delivery approval has already been processed.");
  }

  if (!["Approved", "Rejected"].includes(approvalAction)) {
    throw badRequest("Invalid approval action.");
  }

  delivery.approvalStatus = approvalAction;
  delivery.adminApproval = { actionBy: actorId, actionAt: new Date(), note };

  if (approvalAction === "Approved") {
    delivery.deliveryStatus = "Scheduled";
    await Order.updateMany({ _id: { $in: delivery.orders }, status: "Pending" }, { status: "Confirmed" });
    const community = await Community.findById(delivery.community);
    if (community) {
      // These orders just left "Pending", so the community's aggregate
      // pending-demand figure needs to drop by their amount.
      const pendingOrders = await Order.find({ community: community._id, status: "Pending" });
      community.currentOrderValue = pendingOrders.reduce((sum, order) => sum + order.totalAmount, 0);
      community.isDeliveryConfirmed = true;
      await community.save();
    }
  } else {
    // Rejected: orders stay Pending (their stock stays reserved) so they can
    // be picked up by a future proposal for the same or a different batch.
    delivery.deliveryStatus = "Cancelled";
    delivery.proposalKey = undefined;
  }

  await delivery.save();

  await notifyDeliveryOrders(
    delivery,
    approvalAction === "Approved" ? "delivery_approved" : "delivery_rejected",
    approvalAction === "Approved" ? "Your delivery proposal was approved." : "Your delivery proposal was rejected."
  );

  return delivery;
};

// The shopkeeper confirms they can physically fulfil the pooled batch.
// Stock was already reserved (decremented) for every order at the moment it
// was placed, so this step does not touch stock on Accept -- it only checks
// the ordered products still exist. On Reject, the batch's orders return to
// Pending and their stock reservation is released back to the shop.
const confirmInventory = async (id, action, actorId, note = "") => {
  const delivery = await Delivery.findById(id).populate({ path: "orders", populate: { path: "items.product" } });
  if (!delivery) throw notFound("Delivery not found.");
  if (delivery.approvalStatus !== "Approved") throw badRequest("Only an admin-approved delivery can be confirmed by a shopkeeper.");
  if (delivery.shopkeeperApproval.status !== "Pending") throw badRequest("Inventory confirmation has already been processed.");
  if (!["Accepted", "Rejected"].includes(action)) throw badRequest("Invalid inventory confirmation action.");

  if (action === "Accepted") {
    for (const order of delivery.orders) {
      for (const item of order.items) {
        if (!item.product) throw badRequest("One or more ordered products no longer exist.");
      }
    }
  } else {
    delivery.deliveryStatus = "Cancelled";
    delivery.proposalKey = undefined;
    await Order.updateMany({ _id: { $in: delivery.orders }, status: "Confirmed" }, { status: "Pending" });

    const allItems = delivery.orders.flatMap((order) =>
      order.items.map((item) => ({ product: item.product?._id || item.product, quantity: item.quantity }))
    );
    await restoreStock(allItems);

    const community = await Community.findById(delivery.community);
    if (community) {
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

// Truck/driver assignment is how the pooled batch data turns into an actual
// dispatch: only meaningful once the batch has been approved.
const assignTruck = async (id, { truckNumber, driverName, driverPhone }) => {
  const delivery = await Delivery.findById(id);
  if (!delivery) throw notFound("Delivery not found.");
  if (delivery.approvalStatus !== "Approved") {
    throw badRequest("Assign a truck only after the delivery proposal has been approved.");
  }

  if (truckNumber !== undefined) delivery.truckNumber = truckNumber;
  if (driverName !== undefined) delivery.driverName = driverName;
  if (driverPhone !== undefined) delivery.driverPhone = driverPhone;

  await delivery.save();
  return delivery;
};

const deleteDelivery = async (id) => {
  const delivery = await Delivery.findById(id);

  if (!delivery) {
    throw notFound("Delivery not found.");
  }

  await delivery.deleteOne();
};

export {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  approveDelivery,
  confirmInventory,
  assignTruck,
  deleteDelivery,
};
