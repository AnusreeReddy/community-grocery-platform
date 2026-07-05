import {
  createCommunity,
  getAllCommunities,
  getCommunityById,
  joinCommunity,
  leaveCommunity,
  updateCommunity,
  deleteCommunity,
  getCommunityDashboard,
  getMergeSuggestions,
} from "./service.js";

import { validateCommunity } from "./validation.js";

const create = async (req, res) => {
  try {
    const error = validateCommunity(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const community = await createCommunity({
      ...req.body,
      createdBy: req.user.id,
    });

    res.status(201).json({
      success: true,
      message: "Community created successfully.",
      community,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getAll = async (req, res) => {
  try {
    const communities = await getAllCommunities();

    res.status(200).json({
      success: true,
      count: communities.length,
      communities,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getById = async (req, res) => {
  try {
    const community = await getCommunityById(req.params.id);

    res.status(200).json({
      success: true,
      community,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const join = async (req, res) => {
  try {
    const user = await joinCommunity(req.params.id, req.user.id);

    res.status(200).json({
      success: true,
      message: "Joined community successfully.",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const leave = async (req, res) => {
  try {
    const user = await leaveCommunity(req.user.id);

    res.status(200).json({
      success: true,
      message: "Left community successfully.",
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const update = async (req, res) => {
  try {
    const community = await updateCommunity(
      req.params.id,
      req.body,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Community updated successfully.",
      community,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    const community = await deleteCommunity(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Community deleted successfully.",
      community,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const dashboard = async (req, res) => {
  try {
    const dashboard = await getCommunityDashboard(req.params.id);

    res.status(200).json({
      success: true,
      dashboard,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const mergeSuggestions = async (req, res) => {
  try {
    const suggestions = await getMergeSuggestions(req.params.id);

    res.status(200).json({
      success: true,
      suggestions,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export {
  create,
  getAll,
  getById,
  join,
  leave,
  update,
  remove,
  dashboard,
  mergeSuggestions,
};