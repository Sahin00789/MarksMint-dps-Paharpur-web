import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Current academic year
const CURRENT_YEAR = '2025';

// Query keys
export const examConfigKeys = {
  all: ['examConfigs'],
  lists: () => [...examConfigKeys.all, 'list'],
  list: (filters = {}) => [...examConfigKeys.lists(), { ...filters }],
  details: () => [...examConfigKeys.all, 'detail'],
  detail: (id) => [...examConfigKeys.details(), id],
  status: (classNames) => [
    ...examConfigKeys.all,
    'status',
    {
      classNames: Array.isArray(classNames) ? classNames.sort() : classNames
    }
  ]
};

/**
 * Fetches exam configuration for a class
 * @param {string} className - The class name to fetch configuration for
 * @returns {Promise<Object>} Exam configuration object
 */
export const fetchExamConfig = async (className) => {
  try {
    console.log(`[fetchExamConfig] Fetching config for ${className}`);
    const response = await api.get(`/configs/class/${className}`, {
      params: {
        academicYear: '2025',
        _t: Date.now() // Add cache buster
      }
    });
    
    // Process the response
    if (response?.data?.success && response.data.data) {
      const { data } = response.data;
      const { examConfig, ...rest } = data;
      
      // Process examConfig to ensure proper format
      const processedExamConfig = {};
      if (examConfig && typeof examConfig === 'object') {
        Object.entries(examConfig).forEach(([examName, examData]) => {
          if (!examData || typeof examData !== 'object') return;
          
          processedExamConfig[examName] = {
            examName,
            _examName: examName,
            subjects: Array.isArray(examData.subjects) 
              ? [...examData.subjects] 
              : [],
            evaluationTypes: Array.isArray(examData.evaluationTypes)
              ? [...new Set(examData.evaluationTypes)]
              : ['Written'],
            fullMarks: examData.fullMarks || {},
            schedule: examData.schedule || {},
            _createdAt: examData._createdAt || new Date().toISOString(),
            _updatedAt: examData._updatedAt || new Date().toISOString()
          };
        });
      }
      
      const result = {
        success: true,
        data: {
          ...rest,
          className: data.className || className,
          academicYear: data.academicYear || '2025',
          examConfig: processedExamConfig,
          _id: data._id,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt || new Date().toISOString()
        }
      };
      
      console.log('[fetchExamConfig] Processed config:', result);
      return result;
    }
    
    // Handle other response formats
    console.warn('Unexpected response format in fetchExamConfig:', response);
    return {
      success: true,
      data: {
        className,
        academicYear: '2025',
        examConfig: {},
        _id: `temp-${Date.now()}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error(`Error in fetchExamConfig for ${className}:`, error);
    
    if (error.response?.status === 404) {
      console.log(`No exam config found for ${className}`);
      return {
        success: true,
        data: {
          className,
          academicYear: '2025',
          examConfig: {},
          _id: `temp-${Date.now()}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
    }
    
    throw error;
  }
};

/**
 * Hook to get exam configuration for a class
 * @param {string} className - The class name to fetch configuration for
 * @param {Object} [options={}] - Additional options for the query
 * @returns {Object} The query result
 */
export const useExamConfig = (className, options = {}) => {
  return useQuery({
    queryKey: examConfigKeys.detail(className),
    queryFn: () => fetchExamConfig(className),
    ...options
  });
};

/**
 * Updates or creates exam configuration for a class
 * @param {Object} options - Options for the mutation
 * @param {string} options.className - The class name to update configuration for
 * @param {Object} options.config - The exam configuration object to save
 * @returns {Promise<Object>} The updated configuration
 */
/**
 * Updates or creates exam configuration for a class
 * @param {Object} options - Options for the mutation
 * @param {string} options.className - The class name to update configuration for
 * @param {Object} options.config - The exam configuration object to save
 * @returns {Promise<Object>} The updated configuration
 */
export const updateExamConfig = async ({ className, config }) => {
  try {
    // Extract the examConfig from the config object if it exists
    const examConfig = config.examConfig || config;
    
    const response = await api.post('/configs', {
      className,
      academicYear: '2025',
      examConfig
    });
    return response.data;
  } catch (error) {
    console.error('Error updating exam config:', error);
    throw error;
  }
};

/**
 * Hook to update exam configuration
 * @returns {Object} The mutation object
 */
export const useUpdateExamConfig = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateExamConfig,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(examConfigKeys.detail(variables.className));
    }
  });
};

/**
 * Fetches exam configuration status for multiple classes
 * @param {string|string[]} classNames - The class names to fetch status for
 * @returns {Promise<Array>} Array of status objects
 */
export const fetchExamConfigStatus = async (classNames) => {
  try {
    const response = await api.get('/configs/status', {
      params: {
        classes: Array.isArray(classNames) ? classNames.join(',') : classNames,
        academicYear: '2025'
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching exam config status:', error);
    throw error;
  }
};

/**
 * Hook to get exam configuration status
 * @param {string|string[]} classNames - The class names to fetch status for
 * @param {string} [academicYear='2025'] - The academic year to fetch status for
 * @param {Object} [options={}] - Additional options for the query
 * @returns {Object} The query result
 */
export const useExamConfigStatus = (classNames, academicYear = '2025', options = {}) => {
  const normalizedClassNames = Array.isArray(classNames) ? classNames : [classNames];
  
  return useQuery({
    queryKey: [...examConfigKeys.status(normalizedClassNames), academicYear],
    queryFn: () => fetchExamConfigStatus(normalizedClassNames, academicYear),
    ...options
  });
};
