import api from "./api.js";

const getDeliveries = async () => {
  const response = await api.get("/deliveries");
  return response.data;
};

const getDeliveryById = async (id) => {
  const response = await api.get(`/deliveries/${id}`);
  return response.data;
};

const approveDelivery = async (id, action, note = "") => {
  const response = await api.patch(`/deliveries/${id}/approval`, { approvalStatus: action, note });
  return response.data;
};

const confirmInventory = async (id, action, note = "") => {
  const response = await api.patch(`/deliveries/${id}/inventory-confirmation`, { action, note });
  return response.data;
};

const updateDeliveryStatus = async (id, status) => {
  const response = await api.patch(`/deliveries/${id}/status`, { status });
  return response.data;
};

export { getDeliveries, getDeliveryById, approveDelivery, confirmInventory, updateDeliveryStatus };
