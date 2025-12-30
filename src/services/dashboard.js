import api from './api';

// Get dashboard statistics
export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};

// Get class performance overview
export const getClassPerformanceOverview = async () => {
  try {
    const response = await api.get('/dashboard/class-performance');
    return response.data;
  } catch (error) {
    console.error('Error fetching class performance overview:', error);
    throw error;
  }
};

// Get class-wise absent data
export const getClassWiseAbsentData = async () => {
  try {
    const response = await api.get('/dashboard/class-wise-absent');
    return response.data;
  } catch (error) {
    console.error('Error fetching class-wise absent data:', error);
    throw error;
  }
};

// Get subject statistics
export const getSubjectStats = async () => {
  try {
    const response = await api.get('/dashboard/subject-stats');
    return response.data;
  } catch (error) {
    console.error('Error fetching subject stats:', error);
    throw error;
  }
};

// Get dashboard activities
export const getDashboardActivities = async () => {
  try {
    const response = await api.get('/dashboard/activities');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard activities:', error);
    throw error;
  }
};

// Get dashboard charts
export const getDashboardCharts = async () => {
  try {
    const response = await api.get('/dashboard/charts');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard charts:', error);
    throw error;
  }
};

// Export all services as a single object for easier importing
export const dashboardService = {
  getDashboardStats,
  getClassPerformanceOverview,
  getClassWiseAbsentData,
  getSubjectStats,
  getDashboardActivities,
  getDashboardCharts
};
