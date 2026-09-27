import api from "./api.js";

const registerUser = async (data) => {
  const response = await api.post("/auth/register", data);
  return response.data;
};

const loginUser = async (data) => {
  const response = await api.post("/auth/login", data);
  return response.data;
};

export { registerUser, loginUser };
