import api from "./api.js";

const getCommunities = async () => {
  const response = await api.get("/communities");
  return response.data;
};

const getCommunity = async (id) => {
  const response = await api.get(`/communities/${id}`);
  return response.data;
};

const createCommunity = async (data) => {
  const response = await api.post("/communities", data);
  return response.data;
};

const joinCommunity = async (id) => {
  const response = await api.post(`/communities/${id}/join`);
  return response.data;
};

const leaveCommunity = async () => {
  const response = await api.post("/communities/leave");
  return response.data;
};

const getDashboard = async (id) => {
  const response = await api.get(`/communities/${id}/dashboard`);
  return response.data;
};

const getMergeSuggestions = async (id) => {
  const response = await api.get(`/communities/${id}/merge-suggestions`);
  return response.data;
};

const runThresholdEvaluation = async () => {
  const response = await api.post("/threshold/run");
  return response.data;
};

export { getCommunities, getCommunity, createCommunity, joinCommunity, leaveCommunity, getDashboard, getMergeSuggestions, runThresholdEvaluation };
