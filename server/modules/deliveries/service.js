import Delivery from "./model.js";
import Order from "../orders/model.js";

const createDelivery = async (data) => {
  return await Delivery.create(data);
};

const getAllDeliveries = async () => {
  return await Delivery.find()
    .populate("community", "name")
    .populate("orders")
    .sort({ createdAt: -1 });
};

const getDeliveryById = async (id) => {
  const delivery = await Delivery.findById(id)
    .populate("community", "name")
    .populate({
      path: "orders",
      populate: {
        path: "user",
        select: "fullName email",
      },
    });

  if (!delivery) {
    throw new Error("Delivery not found.");
  }

  return delivery;
};

const updateDeliveryStatus = async (id, status) => {
  const delivery = await Delivery.findById(id);

  if (!delivery) {
    throw new Error("Delivery not found.");
  }

  delivery.deliveryStatus = status;

  await delivery.save();

  await Order.updateMany(
    { _id: { $in: delivery.orders } },
    {
      status,
    }
  );

  return delivery;
};

const deleteDelivery = async (id) => {
  const delivery = await Delivery.findById(id);

  if (!delivery) {
    throw new Error("Delivery not found.");
  }

  await delivery.deleteOne();

  return;
};

export {
  createDelivery,
  getAllDeliveries,
  getDeliveryById,
  updateDeliveryStatus,
  deleteDelivery,
};