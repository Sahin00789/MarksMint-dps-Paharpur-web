import axios from 'axios';

const API_URL = import.meta.env.VITE_API_BASE || '/api';

// Public endpoints
export const getPublishedStatuses = async () => {
  const response = await axios.get(`${API_URL}/results/public/statuses`);
  return response.data.items || [];
};

export const getPublishedStatus = async (term) => {
  const response = await axios.get(`${API_URL}/results/public/status/${encodeURIComponent(term)}`);
  return response.data;
};

// Protected endpoints (require authentication)
const getAuthHeaders = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
});

export const getResultsList = async () => {
  const response = await axios.get(`${API_URL}/results`, getAuthHeaders());
  return response.data.items || [];
};

export const updatePublishStatus = async (term, isPublished, adminPassword) => {
  const response = await axios.post(
    `${API_URL}/results`,
    { term, isPublished, adminPassword },
    getAuthHeaders()
  );
  return response.data;
};

export const getTermStats = async (term) => {
  const response = await axios.get(
    `${API_URL}/results/stats/${encodeURIComponent(term)}`,
    getAuthHeaders()
  );
  return response.data;
};
