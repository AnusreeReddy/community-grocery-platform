import Community from "../communities/model.js";
import Order from "../orders/model.js";
import Delivery from "../deliveries/model.js";
import { createNotification } from "../notifications/service.js";
import { getNearestDateForWeekday, hasCutOffPassed } from "../../utils/date.js";
import { notFound } from "../../utils/errors.js";

const sumAmount = (orders) => orders.reduce((sum, order) => sum + order.totalAmount, 0);

// A "batch" is the real pooling unit: one community, one scheduled weekday,
// one concrete calendar date. Threshold and capacity are evaluated per
// batch, never pooled across a community's unrelated delivery days.
const getPendingBatchOrders = async (communityId, deliveryDay, deliveryDate) => {
  return Order.find({
    community: communityId,
    status: "Pending",
    deliveryDay,
    deliveryDate,
  });
};

// Community-level aggregate demand per upcoming batch, safe to show to any
// community member: only totals/counts, never who placed which order.
const getCommunityBatches = async (communityId) => {
  const community = await Community.findById(communityId);
  if (!community || !community.isActive) {
    throw notFound("Community not found.");
  }

  const batches = [];
  for (const schedule of community.deliverySchedule) {
    const deliveryDate = getNearestDateForWeekday(schedule.day);
    const pendingOrders = await getPendingBatchOrders(community._id, schedule.day, deliveryDate);
    const totalAmount = sumAmount(pendingOrders);
    const activeDelivery = await Delivery.findOne({
      community: community._id,
      deliveryDay: schedule.day,
      deliveryDate,
      approvalStatus: { $in: ["Pending", "Approved"] },
    }).select("_id approvalStatus deliveryStatus truckNumber driverName driverPhone");

    batches.push({
      deliveryDay: schedule.day,
      cutOffTime: schedule.cutOffTime,
      deliveryDate,
      cutoffPassed: hasCutOffPassed(deliveryDate, schedule.cutOffTime),
      orderCount: pendingOrders.length,
      totalAmount,
      thresholdAmount: community.thresholdAmount,
      maxBatchAmount: community.maxBatchAmount || null,
      percentToThreshold: community.thresholdAmount
        ? Math.min(100, Math.round((totalAmount / community.thresholdAmount) * 100))
        : 0,
      thresholdReached: totalAmount >= community.thresholdAmount,
      amountRemaining: Math.max(0, community.thresholdAmount - totalAmount),
      delivery: activeDelivery || null,
    });
  }

  return batches;
};

const createOrMergeProposal = async (community, deliveryDay, deliveryDate, orders) => {
  const proposalKey = `${community._id}:${deliveryDay}:${deliveryDate.toISOString().slice(0, 10)}`;
  const existingProposal = await Delivery.findOne({ proposalKey, approvalStatus: "Pending" });

  if (existingProposal) {
    const alreadyIncluded = new Set(existingProposal.orders.map((id) => id.toString()));
    const newOrders = orders.filter((order) => !alreadyIncluded.has(order._id.toString()));
    if (newOrders.length === 0) return null;

    await Delivery.updateOne(
      { _id: existingProposal._id },
      {
        $addToSet: { orders: { $each: newOrders.map((order) => order._id) } },
        $inc: { totalOrders: newOrders.length, totalAmount: sumAmount(newOrders) },
      }
    );
    await Promise.all(
      newOrders.map((order) =>
        createNotification(
          order.user,
          "delivery_proposed",
          `Your order was added to a delivery proposal for ${deliveryDay}.`,
          { deliveryId: existingProposal._id, communityId: community._id }
        )
      )
    );
    return existingProposal._id;
  }

  try {
    const delivery = await Delivery.create({
      community: community._id,
      deliveryDay,
      deliveryDate,
      proposalKey,
      orders: orders.map((order) => order._id),
      totalOrders: orders.length,
      totalAmount: sumAmount(orders),
      thresholdReached: true,
      approvalStatus: "Pending",
      deliveryStatus: "Scheduled",
    });
    await Promise.all(
      orders.map((order) =>
        createNotification(
          order.user,
          "delivery_proposed",
          `A delivery proposal was created for ${deliveryDay}.`,
          { deliveryId: delivery._id, communityId: community._id }
        )
      )
    );
    return delivery._id;
  } catch (error) {
    // Another concurrent evaluation won the race to create this exact batch's
    // proposal; merging into it is the idempotent, correct outcome.
    if (error?.code !== 11000) throw error;
    await Delivery.updateOne(
      { proposalKey, approvalStatus: "Pending" },
      {
        $addToSet: { orders: { $each: orders.map((order) => order._id) } },
        $inc: { totalOrders: orders.length, totalAmount: sumAmount(orders) },
      }
    );
    const merged = await Delivery.findOne({ proposalKey, approvalStatus: "Pending" }).select("_id");
    return merged?._id || null;
  }
};

// Evaluates every upcoming batch for a community independently. A proposal
// is only created for a specific (day, date) batch once THAT batch's pooled
// total reaches the community threshold -- other under-threshold batches in
// the same community are left alone.
const evaluateCommunityThreshold = async (communityId) => {
  const community = await Community.findById(communityId);

  if (!community || !community.isActive) {
    throw notFound("Community not found.");
  }

  const results = [];
  let communityWidePendingTotal = 0;

  for (const schedule of community.deliverySchedule) {
    const deliveryDate = getNearestDateForWeekday(schedule.day);
    const pendingOrders = await getPendingBatchOrders(community._id, schedule.day, deliveryDate);
    const totalAmount = sumAmount(pendingOrders);
    communityWidePendingTotal += totalAmount;

    const thresholdReached = totalAmount >= community.thresholdAmount;
    let deliveryId = null;

    if (thresholdReached && pendingOrders.length > 0) {
      deliveryId = await createOrMergeProposal(community, schedule.day, deliveryDate, pendingOrders);
    }

    results.push({
      deliveryDay: schedule.day,
      deliveryDate,
      totalAmount,
      orderCount: pendingOrders.length,
      thresholdAmount: community.thresholdAmount,
      thresholdReached,
      proposalCreatedOrUpdated: Boolean(deliveryId),
      deliveryId,
    });
  }

  // Kept as a general "how much demand is currently queued" stat for the
  // community record; proposal creation itself is decided per batch above.
  community.currentOrderValue = communityWidePendingTotal;
  await community.save();

  return { community: community._id, batches: results };
};

const runThresholdEvaluation = async () => {
  const communities = await Community.find({ isActive: true });
  const results = [];

  for (const community of communities) {
    const result = await evaluateCommunityThreshold(community._id);
    results.push(result);
  }

  return results;
};

const findMergeSuggestions = async (communityId) => {
  const community = await Community.findById(communityId);

  if (!community || !community.isActive) {
    throw notFound("Community not found.");
  }

  const candidates = await Community.find({
    _id: { $ne: communityId },
    pincode: community.pincode,
    isActive: true,
  });

  return candidates
    .map((candidate) => {
      const sharedDays = candidate.deliverySchedule
        .map((item) => item.day)
        .filter((day) => community.deliverySchedule.some((schedule) => schedule.day === day));

      const sharedSchedule = candidate.deliverySchedule.filter((item) => sharedDays.includes(item.day));
      const combinedOrderValue = community.currentOrderValue + candidate.currentOrderValue;
      const combinedThreshold = Math.max(community.thresholdAmount, candidate.thresholdAmount);
      const thresholdGap = combinedThreshold - combinedOrderValue;
      const scheduleScore = Math.round(
        (sharedDays.length / Math.max(community.deliverySchedule.length, candidate.deliverySchedule.length)) * 100
      );
      const thresholdScore = Math.max(
        0,
        100 - Math.round((Math.abs(community.thresholdAmount - candidate.thresholdAmount) / combinedThreshold) * 100)
      );
      const compatibilityScore = Math.round(
        scheduleScore * 0.55 + thresholdScore * 0.25 + (candidate.pincode === community.pincode ? 20 : 0)
      );

      return {
        community: candidate,
        sharedDays,
        sharedSchedule,
        combinedOrderValue,
        combinedThreshold,
        thresholdGap,
        canReachThreshold: combinedOrderValue >= combinedThreshold,
        compatibilityScore,
        recommendation:
          combinedOrderValue >= combinedThreshold
            ? "Merge recommended: pooled pending orders meet the delivery threshold."
            : "Merge may help, but pooled pending orders do not yet meet the threshold.",
      };
    })
    .filter((suggestion) => suggestion.sharedDays.length > 0)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore || b.combinedOrderValue - a.combinedOrderValue);
};

export {
  evaluateCommunityThreshold,
  runThresholdEvaluation,
  findMergeSuggestions,
  getCommunityBatches,
  getPendingBatchOrders,
};
