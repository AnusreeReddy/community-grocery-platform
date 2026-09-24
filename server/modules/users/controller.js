import {
  getAllUsers,
  getUserById,
  getMe,
  updateUserProfile,
  updateUserRole,
  updateShopkeeperApproval,
  deleteUser,
} from "./service.js";
import { validateUserProfile, validateRoleUpdate, validateShopkeeperApproval } from "./validation.js";
import { asyncRoute } from "../../utils/http.js";
import { badRequest } from "../../utils/errors.js";

const getAll = asyncRoute(async (req, res) => {
  const users = await getAllUsers({
    role: req.query.role,
    shopkeeperApprovalStatus: req.query.status,
  });
  res.status(200).json({ success: true, count: users.length, users });
});

const getProfile = asyncRoute(async (req, res) => {
  const user = await getMe(req.user.id);
  res.status(200).json({ success: true, user });
});

const getByIdController = asyncRoute(async (req, res) => {
  const user = await getUserById(req.params.id);
  res.status(200).json({ success: true, user });
});

const updateProfile = asyncRoute(async (req, res) => {
  const error = validateUserProfile(req.body);
  if (error) throw badRequest(error);

  const user = await updateUserProfile(req.user.id, req.body);
  res.status(200).json({ success: true, message: "Profile updated successfully.", user });
});

const changeRole = asyncRoute(async (req, res) => {
  const error = validateRoleUpdate(req.body.role);
  if (error) throw badRequest(error);

  const user = await updateUserRole(req.params.id, req.body.role);
  res.status(200).json({ success: true, message: "User role updated successfully.", user });
});

const approveShopkeeper = asyncRoute(async (req, res) => {
  const error = validateShopkeeperApproval(req.body.status);
  if (error) throw badRequest(error);

  const user = await updateShopkeeperApproval(req.params.id, req.body.status);
  res.status(200).json({ success: true, message: `Shopkeeper ${req.body.status.toLowerCase()}.`, user });
});

const remove = asyncRoute(async (req, res) => {
  await deleteUser(req.params.id);
  res.status(200).json({ success: true, message: "User deleted successfully." });
});

export {
  getAll,
  getProfile,
  getByIdController as getById,
  updateProfile,
  changeRole,
  approveShopkeeper,
  remove,
};
