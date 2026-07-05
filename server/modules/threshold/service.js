import Community from "../communities/model.js";
import Order from "../orders/model.js";
import Delivery from "../deliveries/model.js";

const WEEK_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const getNextDateForWeekday = (weekday, fromDate = new Date()) => {
  const dayIndex = WEEK_DAYS.indexOf(weekday);
  if (dayIndex === -1) return null;

  const result = new Date(fromDate);
  const currentDay = result.getDay();
  const delta = (dayIndex + 7 - currentDay) % 7;
  result.setDate(result.getDate() + (delta === 0 ? 7 : delta));
  result.setHours(0, 0, 0, 0);

  return result;
};

const evaluateCommunityThreshold = async (communityId) => {
  const community = await Community.findById(communityId);

  if (!community || !community.isActive) {
    throw new Error("Community not found.");
  }

  if (community.currentOrderValue < community.thresholdAmount) {
    return null;
  }

  const pendingOrders = await Order.find({ community: communityId, status: "Pending" });

  if (pendingOrders.length === 0) {
    community.currentOrderValue = 0;
    await community.save();
    return null;
  }

  const ordersByDay = pendingOrders.reduce((groups, order) => {
    groups[order.deliveryDay] = groups[order.deliveryDay] || [];
    groups[order.deliveryDay].push(order);
    return groups;
  }, {});

  const deliveries = [];

  for (const deliveryDay of Object.keys(ordersByDay)) {
    const daySchedule = community.deliverySchedule.find((item) => item.day === deliveryDay);
    const deliveryDate = daySchedule
      ? getNextDateForWeekday(deliveryDay)
      : getNextDateForWeekday(deliveryDay);

    const groupedOrders = ordersByDay[deliveryDay];

    const delivery = await Delivery.create({
      community: communityId,
      deliveryDay,
      deliveryDate,
      orders: groupedOrders.map((order) => order._id),
      totalOrders: groupedOrders.length,
      totalAmount: groupedOrders.reduce((sum, order) => sum + order.totalAmount, 0),
      thresholdReached: true,
      deliveryStatus: "Scheduled",
    });

    await Order.updateMany(
      { _id: { $in: groupedOrders.map((order) => order._id) } },
      { status: "Confirmed", deliveryDate }
    );

    deliveries.push(delivery);
  }

  community.currentOrderValue = 0;
  community.isDeliveryConfirmed = true;
  await community.save();

  return deliveries;
};

const runThresholdEvaluation = async () => {
  const communities = await Community.find({ isActive: true });

  const results = [];

  for (const community of communities) {
    if (community.currentOrderValue >= community.thresholdAmount) {
      const deliveries = await evaluateCommunityThreshold(community._id);
      if (deliveries) {
        results.push({ community: community._id.toString(), deliveries: deliveries.length });
      }
    }
  }

  return results;
};

const findMergeSuggestions = async (communityId) => {
  const community = await Community.findById(communityId);

  if (!community || !community.isActive) {
    throw new Error("Community not found.");
  }

  const suggestions = await Community.find({
    _id: { $ne: communityId },
    pincode: community.pincode,
    isActive: true,
  });

  const matched = suggestions.filter((candidate) => {
    const sharedDay = candidate.deliverySchedule.some((item) =>
      community.deliverySchedule.some((current) => current.day === item.day)
    );

    return (
      sharedDay &&
      candidate.currentOrderValue >= candidate.thresholdAmount
    );
  });

  return matched;
};

export { evaluateCommunityThreshold, runThresholdEvaluation, findMergeSuggestions };
