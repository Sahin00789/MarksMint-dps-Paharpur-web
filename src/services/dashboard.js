import api from './api';

export const getDashboardStats = async () => {
  try {
    const response = await api.get('/dashboard/stats');
    // Return the data in a consistent format
    return {
      success: response.data?.success ?? false,
      data: response.data?.data ?? {}
    };
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    // Return a consistent error response
    return {
      success: false,
      error: error.message || 'Failed to fetch dashboard stats',
      data: {}
    };
  }
};

export const getDashboardActivities = async () => {
  try {
    const response = await api.get('/dashboard/activities');
    // Return the data in a consistent format
    return {
      success: response.data?.success ?? false,
      data: response.data?.data ?? []
    };
  } catch (error) {
    console.error('Error fetching dashboard activities:', error);
    // Return a consistent error response
    return {
      success: false,
      error: error.message || 'Failed to fetch activities',
      data: []
    };
  }
};

export const getDashboardCharts = async () => {
  try {
    const response = await api.get('/dashboard/charts');
    // Return the data in a consistent format with default empty arrays
    return {
      success: response.data?.success ?? false,
      data: {
        studentsByClass: response.data?.data?.studentsByClass || [],
        examStats: response.data?.data?.examStats || [],
        resultStats: response.data?.data?.resultStats || []
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard charts:', error);
    // Return a consistent error response with empty arrays
    return {
      success: false,
      error: error.message || 'Failed to fetch chart data',
      data: {
        studentsByClass: [],
        examStats: [],
        resultStats: []
      }
    };
  }
};
