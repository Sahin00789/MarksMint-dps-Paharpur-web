import api from './api';

// Public endpoints

export const getPublishedStatusForPublic = async (term) => {
  try {
    const response = await api.get(`/publicresults/status/term/${encodeURIComponent(term)}`);
    const payload = response?.data;
    const data = payload?.data ?? payload ?? null;
    return { success: true, data };
  } catch (error) {
    console.error('getPublishedStatus error:', error);
    const message = error?.response?.data?.message || error.message || 'Failed to load published status';
    return { success: false, data: null, message };
  }
};


// Admin endpoints


export const getPublishedStatusForAdmin = async (term) => {
  try {
    const response = await api.get(`/publishresults/admin/term/${encodeURIComponent(term)}`);
    const data = response?.data?.data ?? response?.data ?? null;
    return { success: true, data };
  } catch (error) {
    console.error('getPublishedStatusForAdmin error:', error);
    const message = error?.response?.data?.message || error.message || 'Failed to load admin publish status for term';
    return { success: false, data: null, message };
  }
};

export const publishResults = async (term, classes = [], adminPassword, totalStudents) => {
  try {
    const response = await api.post('/publishresults/publish', { term, classes, adminPassword, totalStudents });
    return { success: true, data: response?.data };
  } catch (error) {
    console.error('publishResults error:', error);
    const message = error?.response?.data?.message || error.message || 'Failed to publish results';
    throw new Error(message);
  }
};

export const unpublishResults = async (term, adminPassword) => {
  try {
    const response = await api.post('/publishresults/unpublish', { term, adminPassword });
    return { success: true, data: response?.data };
  } catch (error) {
    console.error('unpublishResults error:', error);
    const message = error?.response?.data?.message || error.message || 'Failed to unpublish results';
    throw new Error(message);
  }
};

export const getResult = async (session, term, className, roll, dob) => {
  try {
    // Use the existing api instance which already handles public endpoints correctly
    const response = await api.post('/publicresults/getresult', {
      class: className,
      roll,
      dob,
      session
    }, {
      params: {
        term
      }
    });

    if (response.data && response.data.success === false) {
      throw new Error(response.data.message || 'Failed to fetch result');
    }

    return { success: true, data: response.data };
  } catch (error) {
    console.error('getResult error:', error);
    const message = error?.response?.data?.message || error.message || 'Failed to fetch result';
    return { success: false, data: null, message };
  }
};