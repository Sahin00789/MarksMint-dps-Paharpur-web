import api from './api';

// Public endpoints
export const getPublishedStatuses = async () => {
  const response = await api.get('/results/public/statuses');
  return response.data.items || [];
};

export const getPublishedStatus = async (term) => {
  const response = await api.get(`/results/public/status/${encodeURIComponent(term)}`);
  return response.data;
};

// Protected endpoints (handled by api interceptor)
export const getResultsList = async () => {
  const response = await api.get('/results');
  return response.data.items || [];
};

export const updatePublishStatus = async (term, isPublished, adminPassword) => {
  const response = await api.post('/results', { term, isPublished, adminPassword });
  return response.data;
};

export const getTermStats = async (term) => {
  const response = await api.get(`/results/stats/${encodeURIComponent(term)}`);
  return response.data;
};
