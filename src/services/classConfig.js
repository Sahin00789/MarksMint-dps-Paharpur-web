import api from './api';

/**
 * Fetches class configuration including subjects and terms
 * @param {string} className - The class name to fetch configuration for
 * @returns {Promise<Object>} Class configuration object
 */
export const getClassConfig = async (className) => {
  try {
    const response = await api.get(`/configs/${className}`);
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      // Return empty config if not found
      return { terms: [], subjects: [], fullMarks: {} };
    }
    console.error('Error fetching class config:', error);
    throw error;
  }
};

/**
 * Updates class configuration
 * @param {string} className - The class name to update configuration for
 * @param {Object} config - The configuration object to save
 * @returns {Promise<Object>} Updated class configuration
 */
export const updateClassConfig = async (className, config) => {
  try {
    const response = await api.post('/configs', { 
      class: className, 
      terms: config.terms || [],
      subjects: config.subjects || [],
      fullMarks: config.fullMarks || {},
      openDays: config.openDays || 0
    });
    return response.data;
  } catch (error) {
    console.error('Error updating class config:', error);
    throw error;
  }
};

/**
 * Gets configuration status for all classes
 * @param {Array<string>} classNames - Array of class names to get status for
 * @returns {Promise<Object>} Object with class names as keys and their config status
 */
export const getClassesConfigStatus = async (classNames) => {
  try {
    // Fetch all configs
    const response = await api.get('/configs');
    const items = response.data?.items || [];
    
    // Create a map of class names to their config status
    const statusMap = {};
    classNames.forEach(className => {
      // The server returns configs with 'class' field
      const config = items.find(c => c && c.class === className);
      if (config) {
        statusMap[className] = { 
          configured: true,
          ...config,
          // Map fields to match what the component expects
          exams: config.terms || [],
          subjects: config.subjects || [],
          openDays: config.openDays || 0
        };
      } else {
        // Return empty config for classes that don't exist yet
        statusMap[className] = { 
          configured: false,
          exams: [],
          subjects: [],
          openDays: 0,
          fullMarks: {}
        };
      }
    });
    
    return statusMap;
  } catch (error) {
    console.error('Error fetching classes config status:', error);
    // Return empty configs for all classes if there's an error
    return classNames.reduce((acc, className) => ({
      ...acc,
      [className]: {
        configured: false,
        exams: [],
        subjects: [],
        openDays: 0,
        fullMarks: {}
      }
    }), {});
  }
};

/**
 * Gets default class configuration
 * @returns {Object} Default class configuration
 */


export default {
  getClassConfig,
  updateClassConfig,
  getClassesConfigStatus,
};
