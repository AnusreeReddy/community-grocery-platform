import {
  createCommunity,
  getAllCommunities,
  getCommunityById,
  joinCommunity,
  leaveCommunity,
  updateCommunity,
  deleteCommunity,
  getCommunityDashboard,
  getUpcomingBatches,
  getMergeSuggestions,
  getCommunityAnalytics,
  getBestDeliveryDayRecommendation,
} from "./service.js";

import { validateCommunity } from "./validation.js";
import { asyncRoute } from "../../utils/http.js";
import { badRequest } from "../../utils/errors.js";

const create = asyncRoute(async (req, res) => {
  const error = validateCommunity(req.body);
  if (error) throw badRequest(error);

  const community = await createCommunity({ ...req.body, createdBy: req.user.id });
  res.status(201).json({ success: true, message: "Community created successfully.", community });
});

const getAll = asyncRoute(async (req, res) => {
  const communities = await getAllCommunities();
  res.status(200).json({ success: true, count: communities.length, communities });
});

const getById = asyncRoute(async (req, res) => {
  const community = await getCommunityById(req.params.id);
  res.status(200).json({ success: true, community });
});

const join = asyncRoute(async (req, res) => {
  const user = await joinCommunity(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: "Joined community successfully.", user });
});

const leave = asyncRoute(async (req, res) => {
  const user = await leaveCommunity(req.user.id);
  res.status(200).json({ success: true, message: "Left community successfully.", user });
});

const update = asyncRoute(async (req, res) => {
  const community = await updateCommunity(req.params.id, req.body, req.user.id);
  res.status(200).json({ success: true, message: "Community updated successfully.", community });
});

const remove = asyncRoute(async (req, res) => {
  const community = await deleteCommunity(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: "Community deleted successfully.", community });
});

const dashboard = asyncRoute(async (req, res) => {
  const dashboardData = await getCommunityDashboard(req.params.id, req.user);
  res.status(200).json({ success: true, dashboard: dashboardData });
});

const batches = asyncRoute(async (req, res) => {
  const result = await getUpcomingBatches(req.params.id, req.user);
  res.status(200).json({ success: true, batches: result });
});

const mergeSuggestions = asyncRoute(async (req, res) => {
  const suggestions = await getMergeSuggestions(req.params.id, req.user);
  res.status(200).json({ success: true, suggestions });
});

const analytics = asyncRoute(async (req, res) => {
  const result = await getCommunityAnalytics(req.params.id, req.user);
  res.status(200).json({ success: true, analytics: result });
});

const bestDeliveryDay = asyncRoute(async (req, res) => {
  const recommendation = await getBestDeliveryDayRecommendation(req.params.id, req.user);
  res.status(200).json({ success: true, recommendation });
});

export {
  create,
  getAll,
  getById,
  join,
  leave,
  update,
  remove,
  dashboard,
  batches,
  mergeSuggestions,
  analytics,
  bestDeliveryDay,
};
