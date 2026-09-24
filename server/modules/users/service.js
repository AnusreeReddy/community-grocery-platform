import User from "./model.js";
import { badRequest, notFound } from "../../utils/errors.js";

const getAllUsers = async (filters = {}) => {
  const query = {};
  if (filters.role) query.role = filters.role;
  if (filters.shopkeeperApprovalStatus) query.shopkeeperApprovalStatus = filters.shopkeeperApprovalStatus;
  return await User.find(query).select("-password").populate("community", "name");
};

const getUserById = async (id) => {
  const user = await User.findById(id).select("-password").populate("community", "name");

  if (!user) {
    throw notFound("User not found.");
  }

  return user;
};

const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password").populate("community", "name");

  if (!user) {
    throw notFound("User not found.");
  }

  return user;
};

const updateUserProfile = async (userId, data) => {
  const user = await User.findById(userId);

  if (!user) {
    throw notFound("User not found.");
  }

  if (data.fullName) user.fullName = data.fullName;
  if (data.email) user.email = data.email.toLowerCase();
  await user.save();

  return user;
};

const updateUserRole = async (userId, role) => {
  const user = await User.findById(userId);

  if (!user) {
    throw notFound("User not found.");
  }

  user.role = role;
  if (role === "shopkeeper" && user.shopkeeperApprovalStatus !== "Approved") {
    // An admin directly assigning the shopkeeper role is itself the approval.
    user.shopkeeperApprovalStatus = "Approved";
  }
  await user.save();

  return user;
};

const updateShopkeeperApproval = async (userId, status) => {
  const user = await User.findById(userId);

  if (!user) {
    throw notFound("User not found.");
  }

  if (user.role !== "shopkeeper") {
    throw badRequest("Only shopkeeper accounts can be approved or rejected.");
  }

  user.shopkeeperApprovalStatus = status;
  await user.save();

  return user;
};

const deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw notFound("User not found.");
  }

  await user.deleteOne();
};

export {
  getAllUsers,
  getUserById,
  getMe,
  updateUserProfile,
  updateUserRole,
  updateShopkeeperApproval,
  deleteUser,
};
