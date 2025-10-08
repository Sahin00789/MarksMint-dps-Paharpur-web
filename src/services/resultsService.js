import api from './api';

// Public endpoints
export const getPublishedStatuses = async () => {
  try {
    const response = await api.get('/results/public/statuses');
    const data = response?.data;
    // Support both array and object payloads
    const items = Array.isArray(data)
      ? data
      : Array.isArray(data?.items)
        ? data.items
        : Array.isArray(data?.data?.items)
          ? data.data.items
          : Array.isArray(data?.data)
            ? data.data
            : [];
    return { success: true, data: items };
  } catch (error) {
    console.error('getPublishedStatuses error:', error);
    const message = error?.response?.data?.message || error.message || 'Failed to load published statuses';
    return { success: false, data: [], message };
  }
};

export const getPublishedStatus = async (term) => {
  try {
    const response = await api.get(`/results/public/status/${encodeURIComponent(term)}`);
    const payload = response?.data;
    const data = payload?.data ?? payload ?? null;
    return { success: true, data };
  } catch (error) {
    console.error('getPublishedStatus error:', error);
    const message = error?.response?.data?.message || error.message || 'Failed to load published status';
    return { success: false, data: null, message };
  }
};

// Protected endpoints (handled by api interceptor)
export const getResultsList = async () => {
  try {
    const response = await api.get('/results');
    const data = response?.data;
    const items = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
    return items;
  } catch (error) {
    console.error('getResultsList error:', error);
    return [];
  }
};

export const updatePublishStatus = async (term, isPublished, adminPassword) => {
  try {
    const response = await api.post('/results', { term, isPublished, adminPassword, publishedAt: new Date().toISOString() });
    return { success: true, data: response?.data };
  } catch (error) {
    console.error('updatePublishStatus error:', error);
    const message = error?.response?.data?.message || error.message || 'Failed to update publish status';
    // Throw so callers can present error feedback
    throw new Error(message);
  }
};

export const getTermStats = async (term) => {
  try {
    const response = await api.get(`/results/stats/${encodeURIComponent(term)}`);
    return response?.data ?? null;
  } catch (error) {
    console.error('getTermStats error:', error);
    return null;
  }
};
