import {
  getAllUsers,
  getUserById,
  getMe,
  updateUserProfile,
  updateUserRole,
  deleteUser,
} from "./service.js";
import { validateUserProfile, validateRoleUpdate } from "./validation.js";

const getAll = async (req, res) => {
  try {
    const users = await getAllUsers();

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await getMe(req.user.id);

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const getByIdController = async (req, res) => {
  try {
    const user = await getUserById(req.params.id);

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
};

const updateProfile = async (req, res) => {
  try {
    const error = validateUserProfile(req.body);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const user = await updateUserProfile(req.user.id, req.body);

    res.status(200).json({ success: true, message: "Profile updated successfully.", user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const changeRole = async (req, res) => {
  try {
    const error = validateRoleUpdate(req.body.role);
    if (error) {
      return res.status(400).json({ success: false, message: error });
    }

    const user = await updateUserRole(req.params.id, req.body.role);

    res.status(200).json({ success: true, message: "User role updated successfully.", user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    await deleteUser(req.params.id);

    res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export { getAll, getProfile, getByIdController as getById, updateProfile, changeRole, remove };
