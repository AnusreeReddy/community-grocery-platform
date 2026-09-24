import { placeOrder, getMyOrders, getOrderById, updateOrderStatus, cancelOrder } from "./service.js";
import { validateOrder } from "./validation.js";
import { asyncRoute } from "../../utils/http.js";
import { badRequest } from "../../utils/errors.js";

const create = asyncRoute(async (req, res) => {
  const error = validateOrder(req.body);
  if (error) throw badRequest(error);

  const order = await placeOrder(req.user.id, req.body.deliveryDay, {
    enabled: req.body.overrideCutoff,
    reason: req.body.overrideReason,
  });

  res.status(201).json({ success: true, message: "Order placed successfully.", order });
});

const getMine = asyncRoute(async (req, res) => {
  const orders = await getMyOrders(req.user.id);
  res.status(200).json({ success: true, orders });
});

const getById = asyncRoute(async (req, res) => {
  const order = await getOrderById(req.params.id, req.user.id, req.user.role);
  res.status(200).json({ success: true, order });
});

const updateStatus = asyncRoute(async (req, res) => {
  const order = await updateOrderStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, message: "Order updated successfully.", order });
});

const cancel = asyncRoute(async (req, res) => {
  const order = await cancelOrder(req.params.id, req.user.id);
  res.status(200).json({ success: true, message: "Order cancelled successfully.", order });
});

export { create, getMine, getById, updateStatus, cancel };
