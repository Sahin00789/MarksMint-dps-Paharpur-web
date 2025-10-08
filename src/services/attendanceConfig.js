import api from './api';

/**
 * Fetches attendance configuration for a class
 * @param {string} className - The class name to fetch configuration for
 * @param {string} [academicYear] - The academic year (defaults to current)
 * @returns {Promise<Object>} Attendance configuration object
 */
export const getAttendanceConfig = async (className, academicYear) => {
  try {
    const response = await api.get(`/attendance-configs/class/${className}`, {
      params: { academicYear }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance config:', error);
    throw error;
  }
};

/**
 * Updates or creates attendance configuration for a class
 * @param {string} className - The class name to update configuration for
 * @param {Object} config - The configuration object with schoolWorkingDays and holidays
 * @param {string} [academicYear] - The academic year (defaults to current)
 * @returns {Promise<Object>} Updated attendance configuration
 */
export const updateAttendanceConfig = async (className, config, academicYear) => {
  try {
    const response = await api.post('/attendance-configs', {
      className,
      ...config,
      academicYear
    });
    return response.data;
  } catch (error) {
    console.error('Error updating attendance config:', error);
    throw error;
  }
};

/**
 * Gets attendance configuration status for multiple classes
 * @param {Array<string>} classNames - Array of class names to get status for
 * @param {string} [academicYear] - The academic year (defaults to current)
 * @returns {Promise<Array>} Array of status objects for each class
 */
export const getAttendanceConfigStatus = async (classNames, academicYear) => {
  try {
    const response = await api.get('/attendance-configs/status', {
      params: { 
        classes: classNames.join(','),
        academicYear
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error getting attendance config status:', error);
    throw error;
  }
};

/**
 * Lists all attendance configurations
 * @param {string} [academicYear] - The academic year (defaults to current)
 * @returns {Promise<Array>} Array of attendance configurations
 */
export const listAttendanceConfigs = async (academicYear) => {
  try {
    const response = await api.get('/attendance-configs', {
      params: { academicYear }
    });
    return response.data;
  } catch (error) {
    console.error('Error listing attendance configs:', error);
    throw error;
  }
};

export default {
  getAttendanceConfig,
  updateAttendanceConfig,
  getAttendanceConfigStatus,
  listAttendanceConfigs
};
