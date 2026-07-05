import {
  placeOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
} from "./service.js";

import { validateOrder } from "./validation.js";

const create = async (req, res) => {
  try {
    const error = validateOrder(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error,
      });
    }

    const order = await placeOrder(
      req.user.id,
      req.body.deliveryDay
    );

    res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const getMine = async (req, res) => {
  try {
    const orders = await getMyOrders(req.user.id);

    res.status(200).json({
      success: true,
      orders,
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
    const order = await getOrderById(req.params.id, req.user.id, req.user.role);

    res.status(200).json({
      success: true,
      order,
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
    const order = await updateOrderStatus(
      req.params.id,
      req.body.status
    );

    res.status(200).json({
      success: true,
      message: "Order updated successfully.",
      order,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

const cancel = async (req, res) => {
  try {
    const order = await cancelOrder(
      req.params.id,
      req.user.id
    );

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      order,
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
  getMine,
  getById,
  updateStatus,
  cancel,
};