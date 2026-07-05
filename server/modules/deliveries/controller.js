import {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  deleteDelivery,
} from "./service.js";

import { validateDelivery } from "./validation.js";

const create = async (req, res) => {
  try {
    const error = validateDelivery(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const delivery = await createDelivery(req.body);

    res.status(201).json({
      success: true,
      message: "Delivery created successfully.",
      delivery,
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
    const deliveries = await getAllDeliveries();

    res.status(200).json({
      success: true,
      deliveries,
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
    const delivery = await getDeliveryById(req.params.id);

    res.status(200).json({
      success: true,
      delivery,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

const updateStatus = async (req, res) => {
  try {
    const delivery = await updateDeliveryStatus(
      req.params.id,
      req.body.status
    );

    res.status(200).json({
      success: true,
      message: "Delivery updated successfully.",
      delivery,
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
    await deleteDelivery(req.params.id);

    res.status(200).json({
      success: true,
      message: "Delivery deleted successfully.",
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
  updateStatus,
  remove,
};