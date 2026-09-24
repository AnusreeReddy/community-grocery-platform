import {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  approveDelivery,
  confirmInventory,
  assignTruck,
  deleteDelivery,
} from "./service.js";

import {
  validateDelivery,
  validateDeliveryStatus,
  validateDeliveryApproval,
  validateInventoryConfirmation,
  validateTruckAssignment,
} from "./validation.js";
import { asyncRoute } from "../../utils/http.js";
import { badRequest } from "../../utils/errors.js";

const create = asyncRoute(async (req, res) => {
  const error = validateDelivery(req.body);
  if (error) throw badRequest(error);

  const delivery = await createDelivery(req.body);
  res.status(201).json({ success: true, message: "Delivery created successfully.", delivery });
});

const getAll = asyncRoute(async (req, res) => {
  const deliveries = await getAllDeliveries({ community: req.query.community });
  res.status(200).json({ success: true, deliveries });
});

const getById = asyncRoute(async (req, res) => {
  const delivery = await getDeliveryById(req.params.id);
  res.status(200).json({ success: true, delivery });
});

const updateStatus = asyncRoute(async (req, res) => {
  const error = validateDeliveryStatus(req.body);
  if (error) throw badRequest(error);

  const delivery = await updateDeliveryStatus(req.params.id, req.body.status);
  res.status(200).json({ success: true, message: "Delivery updated successfully.", delivery });
});

const approve = asyncRoute(async (req, res) => {
  const error = validateDeliveryApproval(req.body);
  if (error) throw badRequest(error);

  const delivery = await approveDelivery(req.params.id, req.body.approvalStatus, req.user.id, req.body.note);
  res.status(200).json({ success: true, message: "Delivery approval updated successfully.", delivery });
});

const inventoryConfirmation = asyncRoute(async (req, res) => {
  const error = validateInventoryConfirmation(req.body);
  if (error) throw badRequest(error);

  const delivery = await confirmInventory(req.params.id, req.body.action, req.user.id, req.body.note);
  res.status(200).json({ success: true, message: "Inventory confirmation updated successfully.", delivery });
});

const truck = asyncRoute(async (req, res) => {
  const error = validateTruckAssignment(req.body);
  if (error) throw badRequest(error);

  const delivery = await assignTruck(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Truck details updated.", delivery });
});

const remove = asyncRoute(async (req, res) => {
  await deleteDelivery(req.params.id);
  res.status(200).json({ success: true, message: "Delivery deleted successfully." });
});

export { create, getAll, getById, updateStatus, approve, inventoryConfirmation, truck, remove };
