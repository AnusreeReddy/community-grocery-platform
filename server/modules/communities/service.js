import Community from "./model.js";
import User from "../users/model.js";
import Order from "../orders/model.js";
import Delivery from "../deliveries/model.js";
import { findMergeSuggestions, getCommunityBatches } from "../threshold/service.js";
import { badRequest, notFound, forbidden } from "../../utils/errors.js";

// Aggregate community info (member counts, totals, batch progress) is safe
// to show any member; it never lists who ordered what. Access is limited to
// members of the community, its creator/admin, and superAdmin so a stranger
// can't browse another community's internals.
// Note: the JWT payload only carries {id, role} (see auth/service.js), so
// membership must be checked against the live User record, not req.user.
const assertCommunityAccess = async (community, user) => {
  if (!user) throw forbidden("Sign in to view this community.");
  if (user.role === "superAdmin") return;
  if (community.createdBy && community.createdBy.toString() === user.id) return;

  const requester = await User.findById(user.id).select("community");
  if (requester?.community && requester.community.toString() === community._id.toString()) return;

  throw forbidden("You must be a member of this community to view this.");
};

const createCommunity = async (communityData) => {
  const existingCommunity = await Community.findOne({
    name: communityData.name,
    pincode: communityData.pincode,
  });

  if (existingCommunity) {
    throw badRequest("Community already exists.");
  }

  const normalizedCommunity = {
    ...communityData,
    deliveryDays: (communityData.deliverySchedule || []).map((item) => item.day),
  };

  return await Community.create(normalizedCommunity);
};

const getAllCommunities = async () => {
  return await Community.find({ isActive: true }).populate("createdBy", "fullName email").sort({ createdAt: -1 });
};

const getCommunityById = async (communityId) => {
  const community = await Community.findById(communityId).populate("createdBy", "fullName email");

  if (!community || !community.isActive) {
    throw notFound("Community not found.");
  }

  return community;
};

const joinCommunity = async (communityId, userId) => {
  const community = await Community.findById(communityId);

  if (!community || !community.isActive) {
    throw notFound("Community not found.");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw notFound("User not found.");
  }

  if (user.community) {
    throw badRequest("You are already part of a community. Leave it first to join another.");
  }

  user.community = communityId;
  await user.save();

  return user;
};

const leaveCommunity = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw notFound("User not found.");
  }

  if (!user.community) {
    throw badRequest("You are not part of any community.");
  }

  const activeOrder = await Order.exists({
    user: userId,
    community: user.community,
    status: { $in: ["Pending", "Confirmed", "Packed", "Out for Delivery"] },
  });
  if (activeOrder) {
    throw badRequest("You have an active order in this community. Cancel or wait for it to complete before leaving.");
  }

  user.community = null;
  await user.save();

  return user;
};

const updateCommunity = async (communityId, data, userId) => {
  const community = await Community.findById(communityId);

  if (!community || !community.isActive) {
    throw notFound("Community not found.");
  }

  if (community.createdBy.toString() !== userId) {
    throw forbidden("Unauthorized.");
  }

  Object.assign(community, data);

  if (community.deliverySchedule && community.deliverySchedule.length) {
    community.deliveryDays = community.deliverySchedule.map((item) => item.day);
  }

  await community.save();

  return community;
};

const deleteCommunity = async (communityId, userId) => {
  const community = await Community.findById(communityId);

  if (!community || !community.isActive) {
    throw notFound("Community not found.");
  }

  if (community.createdBy.toString() !== userId) {
    throw forbidden("Unauthorized.");
  }

  community.isActive = false;

  await community.save();

  return community;
};

const getCommunityDashboard = async (communityId, requestingUser) => {
  const community = await Community.findById(communityId).populate("createdBy", "fullName email");

  if (!community || !community.isActive) {
    throw notFound("Community not found.");
  }

  await assertCommunityAccess(community, requestingUser);

  const memberCount = await User.countDocuments({ community: communityId });

  const totalOrders = await Order.countDocuments({ community: communityId });
  const pendingOrders = await Order.countDocuments({ community: communityId, status: "Pending" });
  const confirmedOrders = await Order.countDocuments({ community: communityId, status: "Confirmed" });
  const upcomingDeliveries = await Delivery.countDocuments({
    community: communityId,
    approvalStatus: "Approved",
    deliveryStatus: { $nin: ["Delivered", "Cancelled"] },
  });

  return {
    community,
    memberCount,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    upcomingDeliveries,
    thresholdRemaining: Math.max(0, community.thresholdAmount - community.currentOrderValue),
  };
};

const getUpcomingBatches = async (communityId, requestingUser) => {
  const community = await Community.findById(communityId);
  if (!community || !community.isActive) throw notFound("Community not found.");
  await assertCommunityAccess(community, requestingUser);
  return getCommunityBatches(communityId);
};

const getMergeSuggestionsGuarded = async (communityId, requestingUser) => {
  const community = await Community.findById(communityId);
  if (!community || !community.isActive) throw notFound("Community not found.");
  await assertCommunityAccess(community, requestingUser);
  return findMergeSuggestions(communityId);
};

const assertCommunityAdminOwnership = (community, requestingUser) => {
  if (requestingUser.role === "superAdmin") return;
  if (requestingUser.role === "communityAdmin" && community.createdBy.toString() === requestingUser.id) return;
  throw forbidden("Only this community's admin can view this.");
};

const getCommunityAnalytics = async (communityId, requestingUser) => {
  const community = await Community.findById(communityId);
  if (!community || !community.isActive) throw notFound("Community not found.");
  assertCommunityAdminOwnership(community, requestingUser);

  const [summary] = await Order.aggregate([
    { $match: { community: community._id } },
    {
      $group: {
        _id: null,
        pendingOrders: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] } },
        confirmedOrders: { $sum: { $cond: [{ $eq: ["$status", "Confirmed"] }, 1, 0] } },
        completedOrders: { $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] } },
        revenue: { $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, "$totalAmount", 0] } },
        orderCount: { $sum: { $cond: [{ $ne: ["$status", "Cancelled"] }, 1, 0] } },
        pendingValue: { $sum: { $cond: [{ $eq: ["$status", "Pending"] }, "$totalAmount", 0] } },
      },
    },
  ]);
  const [deliveries] = await Delivery.aggregate([
    { $match: { community: community._id } },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: { $sum: { $cond: [{ $eq: ["$approvalStatus", "Approved"] }, 1, 0] } },
        delivered: { $sum: { $cond: [{ $eq: ["$deliveryStatus", "Delivered"] }, 1, 0] } },
        cancelled: { $sum: { $cond: [{ $eq: ["$deliveryStatus", "Cancelled"] }, 1, 0] } },
      },
    },
  ]);
  const monthlyMetrics = await Order.aggregate([
    { $match: { community: community._id, status: { $ne: "Cancelled" } } },
    {
      $group: {
        _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
        orders: { $sum: 1 },
        revenue: { $sum: "$totalAmount" },
        averageOrder: { $avg: "$totalAmount" },
      },
    },
    { $sort: { "_id.year": -1, "_id.month": -1 } },
    { $limit: 12 },
  ]);
  const values = summary || {};
  return {
    pendingOrders: values.pendingOrders || 0,
    confirmedOrders: values.confirmedOrders || 0,
    completedOrders: values.completedOrders || 0,
    revenue: values.revenue || 0,
    averageOrder: values.orderCount ? values.revenue / values.orderCount : 0,
    thresholdAmount: community.thresholdAmount,
    pendingOrderValue: values.pendingValue || 0,
    thresholdRemaining: Math.max(0, community.thresholdAmount - (values.pendingValue || 0)),
    activeUsers: await User.countDocuments({ community: communityId }),
    deliveries: deliveries || { total: 0, approved: 0, delivered: 0, cancelled: 0 },
    monthlyMetrics,
  };
};

const getBestDeliveryDayRecommendation = async (communityId, requestingUser) => {
  const community = await Community.findById(communityId);
  if (!community || !community.isActive) throw notFound("Community not found.");
  await assertCommunityAccess(community, requestingUser);

  const allowedDays = community.deliverySchedule.map((item) => item.day);
  const history = await Order.aggregate([
    { $match: { community: community._id, deliveryDay: { $in: allowedDays }, status: { $ne: "Cancelled" } } },
    { $group: { _id: "$deliveryDay", orders: { $sum: 1 }, amount: { $sum: "$totalAmount" } } },
  ]);
  const byDay = new Map(history.map((item) => [item._id, item]));
  const historicalPerformance = allowedDays
    .map((day) => ({ day, orders: byDay.get(day)?.orders || 0, amount: byDay.get(day)?.amount || 0 }))
    .sort((a, b) => b.amount - a.amount || b.orders - a.orders || allowedDays.indexOf(a.day) - allowedDays.indexOf(b.day));
  return {
    recommendedDeliveryDay: historicalPerformance[0]?.day || null,
    rationale: "Based on historical non-cancelled order value and order count.",
    historicalPerformance,
  };
};

export {
  createCommunity,
  getAllCommunities,
  getCommunityById,
  joinCommunity,
  leaveCommunity,
  updateCommunity,
  deleteCommunity,
  getCommunityDashboard,
  getUpcomingBatches,
  getMergeSuggestionsGuarded as getMergeSuggestions,
  getCommunityAnalytics,
  getBestDeliveryDayRecommendation,
};
