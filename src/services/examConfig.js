import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './api';

// Query keys
const examConfigKeys = {
  all: ['examConfigs'],
  lists: () => [...examConfigKeys.all, 'list'],
  list: (filters) => [...examConfigKeys.lists(), { ...filters }],
  details: () => [...examConfigKeys.all, 'detail'],
  detail: (id) => [...examConfigKeys.details(), id],
  status: (classNames, academicYear) => [
    ...examConfigKeys.all, 
    'status', 
    { classNames: Array.isArray(classNames) ? classNames.sort() : classNames, academicYear }
  ]
};

/**
 * Fetches exam configuration for a class
 * @param {string} className - The class name to fetch configuration for
 * @param {string} [academicYear] - The academic year (defaults to current)
 * @returns {Promise<Object>} Exam configuration object
 */
const fetchExamConfig = async (className, academicYear) => {
  try {
    const timestamp = Date.now();
    const response = await api.get(`/configs/class/${className}`, {
      params: { 
        academicYear,
        // Add a timestamp to prevent caching
        _t: timestamp
      }
    });
    
    // Handle different response formats
    if (response?.data) {
      return response.data;
    } else if (response?.status === 200) {
      return response;
    } else {
      console.warn('Unexpected response format in fetchExamConfig:', response);
      throw new Error('Unexpected response format from server');
    }
  } catch (error) {
    if (error.response?.status === 404) {
      return null;
    }
    console.error(`Error fetching config for ${className}:`, error);
    throw error;
  }
};

/**
 * Hook to get exam configuration for a class
 */
export const useExamConfig = (className, academicYear, options = {}) => {
  return useQuery({
    queryKey: examConfigKeys.detail(className),
    queryFn: () => fetchExamConfig(className, academicYear),
    ...options
  });
};

/**
 * Updates or creates exam configuration for a class
 * @param {Object} options - Options for the mutation
 * @param {string} options.className - The class name to update configuration for
 * @param {Object} options.config - The exam configuration object to save
 * @param {string} [options.academicYear] - The academic year (defaults to '2024-2025')
 */
const updateExamConfigFn = async ({ className, config, academicYear = String(new Date().getFullYear() + 1) }) => {
  console.log('=== UPDATE EXAM CONFIG REQUEST ===');
  console.log('Initial input:', { className, academicYear, config });
  
  // Validate input parameters
  if (!className) {
    const error = new Error('Class name is required');
    console.error('Validation error:', error);
    throw error;
  }
  
  if (!config || typeof config !== 'object') {
    const error = new Error('Invalid configuration object');
    console.error('Validation error:', error);
    throw error;
  }
  
  // If we have examConfig, we'll use that directly
  if (config.examConfig && typeof config.examConfig === 'object') {
    // Clone the examConfig to avoid modifying the original
    const examConfig = { ...config.examConfig };
    
    // Prepare the request data with all exams
    const requestData = {
      className: className.toUpperCase().trim(),
      academicYear: academicYear || config.academicYear || String(new Date().getFullYear() + 1),
      examConfig: {}
    };
    
    // Process each exam in the config
    Object.entries(examConfig).forEach(([examName, examData]) => {
      if (!examData || typeof examData !== 'object') return;
      
      // Ensure required fields are present
      requestData.examConfig[examName] = {
        ...examData,
        subjects: Array.isArray(examData.subjects) 
          ? examData.subjects.filter(s => s && s !== 'Default')
         : [],
        evaluationTypes: Array.isArray(examData.evaluationTypes)
          ? [...new Set(examData.evaluationTypes.filter(t => t && t !== 'Default'))]
          : ['Written'],
        fullMarks: examData.fullMarks || {},
        schedule: examData.schedule || {},
        examName: examName,
        _examName: examName,
        _updatedAt: new Date().toISOString(),
        _createdAt: examData._createdAt || new Date().toISOString()
      };
    });
    
    console.log('Sending request to server with data:', requestData);
    // Make the actual API call to save the configuration
    const response = await api.post('/configs', requestData);
    console.log('Server response:', response.data);
    return response.data;
  }
  
  console.log('Processed exam data:', examData);
  
  // If we get here, we don't have an examConfig object, so we'll process a single exam
  const examData = { ...config };
  delete examData.examConfig; // Remove examConfig to avoid circular references
  
  // Extract subjects
  const subjects = Array.isArray(examData.subjects) 
    ? examData.subjects.filter(s => s && s !== 'Default')
    : [];
    
  // Get evaluation types from multiple sources
  const allEvalTypes = new Set();
  
  // 1. From explicit evaluationTypes array if provided
  if (Array.isArray(examData.evaluationTypes)) {
    examData.evaluationTypes.forEach(type => {
      if (type && type !== 'Default') allEvalTypes.add(type);
    });
  }
  
  // 2. From fullMarks data (this should be the source of truth)
  if (examData.fullMarks && typeof examData.fullMarks === 'object') {
    Object.values(examData.fullMarks).forEach(marks => {
      if (marks && typeof marks === 'object') {
        Object.keys(marks).forEach(evalType => {
          if (evalType && evalType !== 'Default') {
            allEvalTypes.add(evalType);
          }
        });
      }
    });
  }
  
  // 3. If we still don't have any evaluation types, use a default
  if (allEvalTypes.size === 0) {
    allEvalTypes.add('Written');
  }
  
  // Convert to array and remove duplicates
  const evaluationTypes = Array.from(allEvalTypes);
  
  // Validate we have required data
  if (subjects.length === 0) {
    throw new Error('No valid subjects found in the configuration');
  }
  
  if (evaluationTypes.length === 0) {
    evaluationTypes.push('Written'); // Default evaluation type
  }
  
  // Get the exam name from the config or use a default
  const examName = examData.examName || examData._examName || 'New Exam';
  
  // Prepare the request data
  const requestData = {
    className: className.toUpperCase().trim(),
    academicYear: academicYear || examData.academicYear || String(new Date().getFullYear() + 1),
    examConfig: {
      [examName]: {
        // Include the exam data
        ...examData,
        // Ensure required fields are set
        subjects: subjects,
        evaluationTypes: evaluationTypes,
        fullMarks: examData.fullMarks || {},
        schedule: examData.schedule || {},
        // Ensure exam name is set correctly
        examName: examName,
        _examName: examName,
        // Add timestamps
        _createdAt: examData._createdAt || new Date().toISOString(),
        _updatedAt: new Date().toISOString()
      }
    }
  };
  
  console.log('Initial request data structure:', JSON.stringify(requestData, null, 2));
  
  // Process fullMarks if available
  if (examData.fullMarks && typeof examData.fullMarks === 'object') {
    console.log('Processing fullMarks:', JSON.stringify(examData.fullMarks, null, 2));
    // Initialize fullMarks for all subjects and evaluation types
    subjects.forEach(subject => {
      if (!subject || subject === 'Default') return;
      
      requestData.examConfig[examName].fullMarks[subject] = {};
      
      // Initialize all evaluation types with default value of 0 if not present
      evaluationTypes.forEach(evalType => {
        const existingValue = examData.fullMarks[subject]?.[evalType];
        requestData.examConfig[examName].fullMarks[subject][evalType] = 
          typeof existingValue === 'number' ? existingValue : 0;
      });
    });
    
    // Now apply any existing marks from the input
    Object.entries(examData.fullMarks).forEach(([subject, marks]) => {
      // Skip invalid subjects
      if (!subject || subject === 'Default' || !subjects.includes(subject)) {
        return;
      }
      
      // Process each evaluation type
      evaluationTypes.forEach(evalType => {
        if (marks && typeof marks === 'object' && evalType in marks) {
          const value = Number(marks[evalType]);
          if (!isNaN(value)) {
          }
        }
      });
    });
    
  }
  
  // Process schedule if available
  if (examData.schedule && typeof examData.schedule === 'object' && Object.keys(examData.schedule).length > 0) {
    console.log('Processing schedule data:', JSON.stringify(examData.schedule, null, 2));
    
    // Ensure we have a clean schedule object
    const cleanSchedule = {};
    
    // Process each subject in the schedule
    Object.entries(examData.schedule).forEach(([subject, scheduleData]) => {
      if (!subject || !scheduleData || typeof scheduleData !== 'object') return;
      
      cleanSchedule[subject] = {};
      
      // Process each evaluation type for the subject
      Object.entries(scheduleData).forEach(([evalType, evalData]) => {
        if (!evalType || !evalData || typeof evalData !== 'object') return;
        
        // Only include the fields we need
        cleanSchedule[subject][evalType] = {
          examDate: evalData.examDate || '',
          startTime: evalData.startTime || '',
          endTime: evalData.endTime || ''
        };
      });
    });
    
    console.log('Cleaned schedule data:', JSON.stringify(cleanSchedule, null, 2));
    requestData.examConfig[examName].schedule = cleanSchedule;
  } else {
    // If no schedule provided, ensure we don't override existing schedule
    const existingConfig = await fetchExamConfig(className, academicYear);
    if (existingConfig?.examConfig?.[examName]?.schedule) {
      requestData.examConfig[examName].schedule = { ...existingConfig.examConfig[examName].schedule };
    }
  }
  
  try {
    console.log('Sending request to /configs with data:', JSON.stringify(requestData, null, 2));
    const response = await api.post('/configs', requestData);
    console.log('Received response from server:', response);
    return response.data;
  } catch (error) {
    console.error('Error updating exam config:', {
      requestData: requestData
    });
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error('Unknown error');
    }
  }
};

export const useUpdateExamConfig = (options = {}) => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateExamConfigFn,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: examConfigKeys.detail(variables.className) 
      });
      queryClient.invalidateQueries({ 
        queryKey: examConfigKeys.status() 
      });
      
      if (options.onSuccess) {
        options.onSuccess(data, variables);
      }
    },
    ...options
  });
};

/**
 * Gets exam configuration status for multiple classes
 * @param {Array<string>} classNames - Array of class names to get status for
 * @param {string} [academicYear] - The academic year (defaults to current)
 * @returns {Promise<Array>} Array of status objects for each class
 */
const fetchExamConfigStatus = async ({ classNames, academicYear }) => {
  // If no class names provided, return empty array
  if (!classNames || (Array.isArray(classNames) && classNames.length === 0)) {
    console.warn('No class names provided to fetchExamConfigStatus');
    return [];
  }

  // Ensure classNames is an array and filter out any empty values
  const validClasses = Array.isArray(classNames) 
    ? classNames.filter(Boolean) 
    : [classNames].filter(Boolean);
    
  if (validClasses.length === 0) {
    return [];
  }

  try {
    const response = await api.get('/configs/status', {
      params: { 
        classes: validClasses.join(','),
        academicYear
      }
    });
    
    // Transform the response data into an array of class status objects
    if (response.data && typeof response.data === 'object' && response.data.data) {
      return Object.entries(response.data.data).map(([className, status]) => ({
        className,
        configured: status.configured || false,
        hasExams: status.hasExams || false,
        examCount: status.examCount || 0,
        lastUpdated: status.lastUpdated ? new Date(status.lastUpdated) : null
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching exam config status:', error);
    // Return an array with error status for each class
    return validClasses.map(className => ({
      className,
      configured: false,
      hasExams: false,
      examCount: 0,
      lastUpdated: null,
      error: error.message || 'Failed to fetch status'
    }));
  }
};

/**
 * Hook to get exam configuration status for multiple classes
 */
export const useExamConfigStatus = (classNames, academicYear, options = {}) => {
  // Extract just the academicYear value if it's an object with enabled/onError
  const academicYearValue = academicYear && typeof academicYear === 'object' && academicYear.enabled !== undefined 
    ? String(new Date().getFullYear() + 1) // Default to next year
    : academicYear;
    
  return useQuery({
    queryKey: examConfigKeys.status(classNames, academicYearValue),
    queryFn: () => fetchExamConfigStatus({ 
      classNames, 
      academicYear: academicYearValue 
    }),
    ...options
  });
};

/**
 * Lists all exam configurations
 * @param {string} [academicYear] - The academic year (defaults to current)
 * @returns {Promise<Array>} Array of exam configurations
 */
const listExamConfigsFn = async (academicYear) => {
  const response = await api.get('/configs', {
    params: { academicYear }
  });
  return response.data;
};

/**
 * Hook to list all exam configurations
 */
export const useListExamConfigs = (academicYear, options = {}) => {
  return useQuery({
    queryKey: examConfigKeys.list({ academicYear }),
    queryFn: () => listExamConfigsFn(academicYear),
    ...options
  });
};

/**
 * Fetches all exam configurations
 * @returns {Promise<Array>} Array of all exam configurations
 */
const getAllExamConfigs = async () => {
  const response = await api.get('/exam-configs');
  return response.data;
};

// Export the original functions for backward compatibility
export const getExamConfig = fetchExamConfig;
export const getExamConfigStatus = fetchExamConfigStatus;
export const updateExamConfig = updateExamConfigFn;
export { getAllExamConfigs };
export { listExamConfigsFn as listExamConfigs };

export default {
  // New React Query hooks
  useExamConfig,
  useUpdateExamConfig,
  useExamConfigStatus,
  useListExamConfigs,
  
  // Legacy functions
  getExamConfig,
  updateExamConfig,
  getExamConfigStatus,
  listExamConfigs: listExamConfigsFn
};
