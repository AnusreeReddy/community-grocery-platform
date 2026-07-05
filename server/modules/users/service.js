import User from "./model.js";

const getAllUsers = async () => {
  return await User.find().populate("community", "name");
};

const getUserById = async (id) => {
  const user = await User.findById(id).populate("community", "name");

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
};

const getMe = async (userId) => {
  const user = await User.findById(userId).select("-password").populate("community", "name");

  if (!user) {
    throw new Error("User not found.");
  }

  return user;
};

const updateUserProfile = async (userId, data) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  if (data.fullName) user.fullName = data.fullName;
  if (data.email) user.email = data.email.toLowerCase();
  if (data.community) user.community = data.community;

  await user.save();

  return user;
};

const updateUserRole = async (userId, role) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  user.role = role;
  await user.save();

  return user;
};

const deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new Error("User not found.");
  }

  await user.deleteOne();
};

export { getAllUsers, getUserById, getMe, updateUserProfile, updateUserRole, deleteUser };
