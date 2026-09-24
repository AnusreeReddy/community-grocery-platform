import { validateRegister, validateLogin } from "./validation.js";
import { registerUser, loginUser } from "./service.js";
import User from "../users/model.js";
import { asyncRoute } from "../../utils/http.js";
import { badRequest } from "../../utils/errors.js";

const register = asyncRoute(async (req, res) => {
  const error = validateRegister(req.body);
  if (error) throw badRequest(error);

  const user = await registerUser(req.body);
  const { password, ...userData } = user.toObject();

  const message =
    userData.role === "shopkeeper"
      ? "Shopkeeper account created. It is pending admin approval before you can list products."
      : "User registered successfully.";

  res.status(201).json({ success: true, message, user: userData });
});

const login = asyncRoute(async (req, res) => {
  const error = validateLogin(req.body);
  if (error) throw badRequest(error);

  const { user, token } = await loginUser(req.body);
  const { password, ...userData } = user.toObject();

  res.status(200).json({ success: true, token, user: userData });
});

const me = asyncRoute(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.status(200).json({ success: true, user });
});

export { register, login, me };
