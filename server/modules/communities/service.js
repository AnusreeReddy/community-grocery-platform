import Community from "./model.js";
import User from "../users/model.js";

const createCommunity = async (communityData) => {
  const existingCommunity = await Community.findOne({
    name: communityData.name,
    pincode: communityData.pincode,
  });

  if (existingCommunity) {
    throw new Error("Community already exists.");
  }

  const normalizedCommunity = {
    ...communityData,
    deliveryDays: (communityData.deliverySchedule || []).map((item) => item.day),
  };

  return await Community.create(normalizedCommunity);
};

const getAllCommunities = async () => {
  return await Community.find({ isActive: true })
    .populate("createdBy", "fullName email")
    .sort({ createdAt: -1 });
};

const getCommunityById = async (communityId) => {
  const community = await Community.findById(communityId).populate(
    "createdBy",
    "fullName email"
  );

  if (!community || !community.isActive) {
    throw new Error("Community not found.");
  }

  return community;
};

const joinCommunity = async (communityId, userId) => {
  const community = await Community.findById(communityId);

  if (!community || !community.isActive) {
    throw new Error("Community not found.");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (user.community) {
    throw new Error("You are already part of a community.");
  }

  user.community = communityId;
  await user.save();

  return user;
};

const leaveCommunity = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (!user.community) {
    throw new Error("You are not part of any community.");
  }

  user.community = null;
  await user.save();

  return user;
};

const updateCommunity = async (communityId, data, userId) => {
  const community = await Community.findById(communityId);

  if (!community || !community.isActive) {
    throw new Error("Community not found.");
  }

  if (community.createdBy.toString() !== userId) {
    throw new Error("Unauthorized.");
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
    throw new Error("Community not found.");
  }

  if (community.createdBy.toString() !== userId) {
    throw new Error("Unauthorized.");
  }

  community.isActive = false;

  await community.save();

  return community;
};

const getCommunityDashboard = async (communityId) => {
  const community = await Community.findById(communityId)
    .populate("createdBy", "fullName email");

  if (!community || !community.isActive) {
    throw new Error("Community not found.");
  }

  const memberCount = await User.countDocuments({
    community: communityId,
  });

  return {
    community,
    memberCount,
  };
};

const getMergeSuggestions = async (communityId) => {
  const community = await Community.findById(communityId);

  if (!community || !community.isActive) {
    throw new Error("Community not found.");
  }

  const candidates = await Community.find({
    _id: { $ne: communityId },
    pincode: community.pincode,
    isActive: true,
  });

  return candidates.filter((candidate) => {
    const sharedDay = candidate.deliverySchedule.some((item) =>
      community.deliverySchedule.some((schedule) => schedule.day === item.day)
    );

    return sharedDay && candidate.currentOrderValue >= candidate.thresholdAmount;
  });
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
  getMergeSuggestions,
};