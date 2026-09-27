import api from "./api.js";

const placeOrder = async (deliveryDay, paymentMethod = "Cash on Delivery") => {
  const response = await api.post("/orders", { deliveryDay, paymentMethod });
  return response.data;
};

const getOrders = async () => {
  const response = await api.get("/orders/my-orders");
  return response.data;
};

const cancelOrder = async (id) => {
  const response = await api.patch(`/orders/${id}/cancel`);
  return response.data;
};

export { placeOrder, getOrders, cancelOrder };
