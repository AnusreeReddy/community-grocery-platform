import api from "./api.js";

const placeOrder = async (deliveryDay) => {
  const response = await api.post("/orders", { deliveryDay });
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
