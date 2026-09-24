import api from "./api.js";

// Products are shown in the context of the customer's joined community so
// the catalog reflects what's actually orderable there, not a flat global
// list. communityId is optional (admins/shopkeepers browsing without one
// simply see everything).
const getProducts = async (communityId) => {
  const query = communityId ? `?community=${communityId}` : "";
  const response = await api.get(`/products${query}`);
  return response.data;
};

const getProduct = async (id) => {
  const response = await api.get(`/products/${id}`);
  return response.data;
};

const searchProducts = async (keyword, communityId) => {
  const params = new URLSearchParams({ keyword });
  if (communityId) params.set("community", communityId);
  const response = await api.get(`/products/search?${params.toString()}`);
  return response.data;
};

const getProductsByCategory = async (category, communityId) => {
  const query = communityId ? `?community=${communityId}` : "";
  const response = await api.get(`/products/category/${encodeURIComponent(category)}${query}`);
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

export {
  getProducts,
  getProduct,
  searchProducts,
  getProductsByCategory,
  createProduct,
  updateProduct,
  deleteProduct,
};
