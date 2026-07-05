import api from "./api.js";

const getProducts = async () => {
  const response = await api.get("/products");
  return response.data;
};

const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

const searchProducts = async (keyword) => {
  const response = await api.get(`/products/search?keyword=${encodeURIComponent(keyword)}`);
  return response.data;
};

const getProductsByCategory = async (category) => {
  const response = await api.get(`/products/category/${encodeURIComponent(category)}`);
  return response.data;
};

const createProduct = async (data) => {
  const response = await api.post("/products", data);
  return response.data;
};

const updateProduct = async (id, data) => {
  const response = await api.put(`/products/${id}`, data);
  return response.data;
};

const deleteProduct = async (id) => {
  const response = await api.delete(`/products/${id}`);
  return response.data;
};

export { getProducts, getProduct, searchProducts, getProductsByCategory, createProduct, updateProduct, deleteProduct };
