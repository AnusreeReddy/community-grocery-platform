import Community from "../communities/model.js";
import Order from "../orders/model.js";
import Delivery from "../deliveries/model.js";
import { getNextDateForWeekday } from "../../utils/date.js";

const calculateTotalAmount = (orders) =>
  orders.reduce((sum, order) => sum + order.totalAmount, 0);

const buildRecommendations = (community, pendingOrders) => {
  const dayTotals = pendingOrders.reduce((totals, order) => {
    totals[order.deliveryDay] = (totals[order.deliveryDay] || 0) + order.totalAmount;
    return totals;
  }, {});

  const scheduledDays = community.deliverySchedule.map((item) => item.day);
  const recommendedDay = Object.keys(dayTotals).sort((a, b) => {
    if (dayTotals[b] !== dayTotals[a]) {
      return dayTotals[b] - dayTotals[a];
    }
    return scheduledDays.indexOf(a) - scheduledDays.indexOf(b);
  })[0];

  return {
    recommendedDeliveryDay: recommendedDay || scheduledDays[0] || null,
    recommendedAmount: recommendedDay ? dayTotals[recommendedDay] : 0,
    pendingByDay: dayTotals,
  };
};

const getPendingOrdersWithoutProposal = async (communityId, pendingOrders) => {
  const pendingOrderIds = pendingOrders.map((order) => order._id);
  const existingDeliveries = await Delivery.find({
    community: communityId,
    approvalStatus: "Pending",
    orders: { $in: pendingOrderIds },
  }).select("orders");

  const proposedOrderIds = new Set(
    existingDeliveries.flatMap((delivery) => delivery.orders.map((orderId) => orderId.toString()))
  );

  return pendingOrders.filter(
    (order) => !proposedOrderIds.has(order._id.toString())
  );
};

const recalculateCommunityOrderValue = async (community) => {
  const pendingOrders = await Order.find({ community: community._id, status: "Pending" });
  const currentOrderValue = calculateTotalAmount(pendingOrders);
  community.currentOrderValue = currentOrderValue;
  await community.save();
  return currentOrderValue;
};

const createDeliveryProposals = async (community, orders) => {
  const ordersByDay = orders.reduce((groups, order) => {
    groups[order.deliveryDay] = groups[order.deliveryDay] || [];
    groups[order.deliveryDay].push(order);
    return groups;
  }, {});

  const deliveries = [];

  for (const [deliveryDay, groupedOrders] of Object.entries(ordersByDay)) {
    const deliveryDate = getNextDateForWeekday(deliveryDay);

    const proposalKey = `${community._id}:${deliveryDay}:${deliveryDate.toISOString().slice(0, 10)}`;
    const existingProposal = await Delivery.findOne({ proposalKey, approvalStatus: "Pending" });
    if (existingProposal) {
      await Delivery.updateOne(
        { _id: existingProposal._id },
        {
          $addToSet: { orders: { $each: groupedOrders.map((order) => order._id) } },
          $inc: { totalOrders: groupedOrders.length, totalAmount: calculateTotalAmount(groupedOrders) },
        }
      );
      continue;
    }
    try {
      const delivery = await Delivery.create({
        community: community._id,
        deliveryDay,
        deliveryDate,
        proposalKey,
        orders: groupedOrders.map((order) => order._id),
        totalOrders: groupedOrders.length,
        totalAmount: calculateTotalAmount(groupedOrders),
        thresholdReached: true,
        approvalStatus: "Pending",
        deliveryStatus: "Scheduled",
      });
      deliveries.push(delivery);
    } catch (error) {
      // Another request won the race to create this proposal. It is safe to
      // treat Mongo's uniqueness error as an idempotent result.
      if (error?.code !== 11000) throw error;
      await Delivery.updateOne(
        { proposalKey, approvalStatus: "Pending" },
        {
          $addToSet: { orders: { $each: groupedOrders.map((order) => order._id) } },
          $inc: { totalOrders: groupedOrders.length, totalAmount: calculateTotalAmount(groupedOrders) },
        }
      );
    }
  }

  return deliveries;
};

const evaluateCommunityThreshold = async (communityId) => {
  const community = await Community.findById(communityId);

  if (!community || !community.isActive) {
    throw new Error("Community not found.");
  }

  const pendingOrders = await Order.find({ community: communityId, status: "Pending" });
  const currentOrderValue = calculateTotalAmount(pendingOrders);

  community.currentOrderValue = currentOrderValue;
  await community.save();

  if (currentOrderValue < community.thresholdAmount) {
    return {
      community: communityId,
      thresholdReached: false,
      currentOrderValue,
      thresholdAmount: community.thresholdAmount,
      amountRemaining: community.thresholdAmount - currentOrderValue,
      recommendation: buildRecommendations(community, pendingOrders),
    };
  }

  const unproposedOrders = await getPendingOrdersWithoutProposal(communityId, pendingOrders);

  if (unproposedOrders.length === 0) {
    return {
      community: communityId,
      thresholdReached: true,
      currentOrderValue,
      message: "Delivery proposal already exists for all pending orders.",
    };
  }

  const deliveries = await createDeliveryProposals(community, unproposedOrders);

  return {
    community: communityId,
    thresholdReached: true,
    currentOrderValue,
    proposalsCreated: deliveries.length,
    deliveries: deliveries.map((delivery) => delivery._id),
  };
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
    throw new Error("Community not found.");
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
        .filter((day) =>
          community.deliverySchedule.some((schedule) => schedule.day === day)
        );

      const sharedSchedule = candidate.deliverySchedule.filter((item) => sharedDays.includes(item.day));
      const combinedOrderValue = community.currentOrderValue + candidate.currentOrderValue;
      const combinedThreshold = Math.max(community.thresholdAmount, candidate.thresholdAmount);
      const thresholdGap = combinedThreshold - combinedOrderValue;
      const scheduleScore = Math.round((sharedDays.length / Math.max(community.deliverySchedule.length, candidate.deliverySchedule.length)) * 100);
      const thresholdScore = Math.max(0, 100 - Math.round((Math.abs(community.thresholdAmount - candidate.thresholdAmount) / combinedThreshold) * 100));
      const compatibilityScore = Math.round((scheduleScore * 0.55) + (thresholdScore * 0.25) + (candidate.pincode === community.pincode ? 20 : 0));

      return {
        community: candidate,
        sharedDays,
        sharedSchedule,
        combinedOrderValue,
        combinedThreshold,
        thresholdGap,
        canReachThreshold: combinedOrderValue >= combinedThreshold,
        compatibilityScore,
        recommendation: combinedOrderValue >= combinedThreshold
          ? "Merge recommended: pooled pending orders meet the delivery threshold."
          : "Merge may help, but pooled pending orders do not yet meet the threshold.",
      };
    })
    .filter((suggestion) => suggestion.sharedDays.length > 0)
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore || b.combinedOrderValue - a.combinedOrderValue);
};

export { evaluateCommunityThreshold, runThresholdEvaluation, findMergeSuggestions };
