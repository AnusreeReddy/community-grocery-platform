import api from "./api.js";

const getDeliveries = async () => {
  const response = await api.get("/deliveries");
  return response.data;
};

export { getDeliveries };
