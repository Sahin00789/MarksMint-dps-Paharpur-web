import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { format, parseISO } from 'date-fns';
import { 
  FaCog, 
  FaChevronRight, 
  FaInfoCircle,
  FaCalendarAlt,
  FaEdit,
  FaClock,
  FaExclamationTriangle
} from 'react-icons/fa';
import { FiPlus, FiTrash2, FiEdit2, FiSave, FiX, FiCheck, FiClock, FiAward } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import ExamDependentClassSelectorCard from '@/components/common/ExamDependentClassSelectorCard';
import { fetchExamConfig as getExamConfig, updateExamConfig } from '@/services/examConfig';
import { examTermsInTheSchool } from '@/shared/schoolInformation';
import ExamScheduleModal from './Modals/ExamScheduleModal';
import ExamConfigModal from './Modals/ExamConfigModal';

// Safe extraction utility functions
const safeExtract = (obj, path, defaultValue = '') => {
  if (!obj) return defaultValue;
  const keys = path.split('.');
  let result = obj;
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue;
    result = result[key];
  }
  return result !== undefined ? result : defaultValue;
};

const safeNumber = (value, defaultValue = 0) => {
  const num = Number(value);
  return isNaN(num) ? defaultValue : num;
};

// Skeleton Loader Component
const SkeletonLoader = ({ className = "", count = 1 }) => {
  return (
    <div className={`space-y-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, j) => (
              <div key={j} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};


// Status Badge Component
const StatusBadge = ({ status, children }) => {
  const statusStyles = {
    active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    default: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
  };
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[status] || statusStyles.default}`}>
      {children}
    </span>
  );
};

function ExamConfigurationPanel() {
  // State management with localStorage persistence
  const [selectedClass, setSelectedClass] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ui.selectedClass') || null;
    }
    return null;
  });
  
  const [selectedExam, setSelectedExam] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ui.selectedExam') || null;
    }
    return null;
  });
  const [examConfigs, setExamConfigs] = useState({});
  const [initialData, setInitialData] = useState(null);
  const [isMarksModalOpen, setIsMarksModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  
  // Load exam configurations for the selected class
  const loadExamConfigs = useCallback(async () => {
    if (!selectedClass) return;
    
    try {
      const response = await getExamConfig(selectedClass, '2024-2025');
      console.log('API Response:', response);
      
      if (response?.data) {
        // Process the response to ensure exam names are strings
        const processedData = { ...response.data };
        
        if (processedData.examConfig) {
          const fixedExamConfig = {};
          
          // Convert any array-like exam names to strings
          Object.entries(processedData.examConfig).forEach(([key, value]) => {
            const examName = Array.isArray(key) ? key.join('') : String(key || '');
            fixedExamConfig[examName] = value;
            
            // Also ensure the exam name in the value is a string
            if (value && typeof value === 'object') {
              value.examName = examName;
            }
          });
          
          processedData.examConfig = fixedExamConfig;
        }
        
        setExamConfigs(prev => ({
          ...prev,
          [selectedClass]: processedData
        }));
        
        // If we have a selected exam, update the initial data
        if (selectedExam) {
          const examName = Array.isArray(selectedExam) ? selectedExam.join('') : String(selectedExam || '');
          const examData = processedData.examConfig?.[examName];
          
          if (examData) {
            setInitialData({
              ...processedData,
              selectedExam: examName,
              examData
            });
          }
        }
      }
    } catch (error) {
      console.error('Error loading exam configs:', error);
      toast.error('Failed to load exam configurations');
    } finally {
      setStatusLoading(false);
    }
  }, [selectedClass, selectedExam]);

  // Load configs when class changes
  useEffect(() => {
    if (selectedClass) {
      loadExamConfigs();
    }
  }, [selectedClass, loadExamConfigs]);

  // Handle class selection
  const handleClassSelect = (className) => {
    setSelectedClass(className);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui.selectedClass', className);
      // Clear selected exam when class changes
      setSelectedExam(null);
      localStorage.removeItem('ui.selectedExam');
    }
  };

  // Handle exam selection
  const handleExamSelect = async (examTerm) => {
    console.log('handleExamSelect called with:', examTerm);
    
    // Ensure examTerm is a proper string
    let examTermStr;
    if (Array.isArray(examTerm)) {
      console.warn('Received examTerm as array, converting to string:', examTerm);
      examTermStr = examTerm.join('');
    } else if (typeof examTerm === 'string') {
      examTermStr = examTerm;
    } else {
      console.warn('Received examTerm as non-string, converting to string:', examTerm);
      examTermStr = String(examTerm);
    }
    
    console.log('Using examTermStr:', examTermStr);
    
    // Save to state and localStorage
    setSelectedExam(examTermStr);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui.selectedExam', examTermStr);
    }
    
    if (selectedClass) {
      try {
        console.log(`Loading config for class: ${selectedClass}, exam: ${examTermStr}`);
        const response = await getExamConfig(selectedClass, '2025');
        console.log('Config response:', response);
        
        if (response?.data?.examConfig?.[examTermStr]) {
          console.log('Setting initial data for exam:', examTermStr);
          setInitialData({
            ...response.data,
            selectedExam: examTermStr,
            examData: response.data.examConfig[examTermStr]
          });
        } else {
          console.warn('No exam config found for:', examTermStr);
        }
      } catch (error) {
        console.error('Error loading exam details:', error);
        toast.error('Failed to load exam details');
      }
    }
  };
  
  // Debug effect to log selectedExam changes
  useEffect(() => {
    console.log('selectedExam changed:', selectedExam, 'type:', typeof selectedExam);
  }, [selectedExam]);
  
  // Clean schedule data to ensure it has the correct structure
  const cleanScheduleData = (schedule) => {
    if (!schedule) {
      console.log('No schedule data provided, returning empty object');
      return {};
    }
    
    // Handle case where schedule is an array (can happen with some MongoDB responses)
    if (Array.isArray(schedule)) {
      console.log('Schedule is an array, converting to object');
      const scheduleObj = {};
      schedule.forEach((item, index) => {
        if (item && typeof item === 'object' && item.subject) {
          scheduleObj[item.subject] = item;
        } else if (typeof item === 'string') {
          scheduleObj[`item_${index}`] = { subject: item };
        }
      });
      schedule = scheduleObj;
    }
    
    // If it's still not an object, return empty object
    if (typeof schedule !== 'object' || schedule === null) {
      console.log('Invalid schedule data, returning empty object');
      return {};
    }
    
    const cleaned = { ...schedule };
    const internalProps = ['$__deferred', '$__parent', '$__path', '$__schemaType', '__v', '_id'];
    
    console.log('=== CLEANING SCHEDULE ===');
    console.log('Original schedule keys:', Object.keys(schedule));
    
    // Remove internal MongoDB properties
    internalProps.forEach(prop => {
      delete cleaned[prop];
    });
    
    // Handle case where schedule data might be nested under a specific key
    let scheduleData = cleaned;
    if (cleaned.schedule && typeof cleaned.schedule === 'object') {
      scheduleData = cleaned.schedule;
      delete cleaned.schedule; // Remove the nested schedule to avoid duplication
    }
    
    // Process each subject in the schedule
    Object.entries(scheduleData).forEach(([subject, evalTypes]) => {
      // Skip internal properties and invalid subjects
      if (internalProps.includes(subject) || !subject || typeof subject !== 'string') {
        console.log(`Skipping invalid subject: ${subject}`);
        return;
      }
      
      // If evalTypes is not an object but the subject is valid, initialize with empty object
      if (!evalTypes || typeof evalTypes !== 'object') {
        console.log(`Initializing empty schedule for subject ${subject}`);
        cleaned[subject] = {};
        return;
      }
      
      // Initialize subject in cleaned schedule
      cleaned[subject] = {};
      
      // Process each evaluation type
      Object.entries(evalTypes).forEach(([evalType, data]) => {
        // Skip internal properties and invalid evaluation types
        if (internalProps.includes(evalType) || !evalType || typeof evalType !== 'string') {
          console.log(`Skipping invalid evalType ${evalType} for subject ${subject}`);
          return;
        }
        
        // Handle case where data might be nested under a 'data' property
        const scheduleData = data?.data || data;
        
        // Only include valid schedule data
        if (scheduleData && typeof scheduleData === 'object' && 
            scheduleData.examDate && scheduleData.startTime && scheduleData.endTime) {
          cleaned[subject][evalType] = {
            examDate: scheduleData.examDate,
            startTime: scheduleData.startTime,
            endTime: scheduleData.endTime
          };
        } else {
          console.log(`Skipping invalid schedule data for ${subject}.${evalType}:`, scheduleData);
          // Initialize with empty values if data is invalid
          cleaned[subject][evalType] = {
            examDate: '',
            startTime: '',
            endTime: ''
          };
        }
      });
    });
    
    console.log('Cleaned schedule keys:', Object.keys(cleaned));
    return cleaned;
  };

  // Convert array of characters to string if needed
  const convertToString = (value) => {
    if (Array.isArray(value)) {
      return value.join('');
    }
    return value;
  };

  // Clean and validate configuration data before saving
  const cleanAndValidateConfig = (config) => {
    console.log('=== START cleanAndValidateConfig ===');
    console.log('Input config:', JSON.parse(JSON.stringify(config || {})));
    
    if (!config) {
      console.log('No config provided, returning empty object');
      return { 
        subjects: [], 
        evaluationTypes: [], 
        fullMarks: {}, 
        schedule: {},
        examName: ''
      };
    }
    
    // Create a clean copy of the config
    const cleaned = { ...config };
    
    // Ensure examName is a string
    if (cleaned.examName) {
      cleaned.examName = convertToString(cleaned.examName);
    } else if (cleaned._examName) {
      // Fallback to _examName if examName is not set
      cleaned.examName = convertToString(cleaned._examName);
    } else {
      cleaned.examName = '';
    }
    
    // Helper function to clean and validate arrays
    const cleanArray = (value) => {
      if (!value) return [];
      
      let array = [];
      
      if (Array.isArray(value)) {
        array = [...value];
      } else if (typeof value === 'object' && value !== null) {
        // Convert object to array of values
        array = Object.values(value).filter(v => v !== null && v !== undefined);
      } else if (typeof value === 'string') {
        // Handle comma-separated strings
        array = value.split(',').map(s => s.trim()).filter(Boolean);
      }
      
      // Clean and deduplicate the array
      return [...new Set(array)]
        .filter(item => {
          const str = String(item || '').trim();
          return str !== '' && !str.startsWith('_');
        })
        .map(item => String(item).trim());
    };
    
    // Clean subjects
    cleaned.subjects = cleanArray(cleaned.subjects);
    console.log('Cleaned subjects:', cleaned.subjects);
    
    // Clean evaluation types
    cleaned.evaluationTypes = cleanArray(cleaned.evaluationTypes);
    console.log('Cleaned evaluation types:', cleaned.evaluationTypes);
    
    // Ensure fullMarks is an object
    if (!cleaned.fullMarks || typeof cleaned.fullMarks !== 'object' || Array.isArray(cleaned.fullMarks)) {
      cleaned.fullMarks = {};
    }
    
    // Ensure schedule is an object and clean it
    if (!cleaned.schedule || typeof cleaned.schedule !== 'object' || Array.isArray(cleaned.schedule)) {
      cleaned.schedule = {};
    } else {
      // Clean the schedule data
      const cleanedSchedule = {};
      
      // Process each subject in the schedule
      Object.entries(cleaned.schedule).forEach(([subject, evalTypes]) => {
        // Skip internal properties and invalid subjects
        if (!subject || typeof subject !== 'string' || 
            subject.startsWith('$') || subject.startsWith('_') || 
            !cleaned.subjects.includes(subject)) {
          return;
        }
        
        // Initialize subject in cleaned schedule
        cleanedSchedule[subject] = {};
        
        // If evalTypes is not an object, skip to next subject
        if (!evalTypes || typeof evalTypes !== 'object' || Array.isArray(evalTypes)) {
          return;
        }
        
        // Process each evaluation type
        Object.entries(evalTypes).forEach(([evalType, data]) => {
          // Skip internal properties and invalid evaluation types
          if (!evalType || typeof evalType !== 'string' || 
              evalType.startsWith('$') || evalType.startsWith('_') ||
              !cleaned.evaluationTypes.includes(evalType)) {
            return;
          }
          
          // Ensure data is an object with the required fields
          if (data && typeof data === 'object' && !Array.isArray(data)) {
            cleanedSchedule[subject][evalType] = {
              examDate: data.examDate || '',
              startTime: data.startTime || '',
              endTime: data.endTime || ''
            };
          }
        });
      });
      
      // Replace the schedule with the cleaned version
      cleaned.schedule = cleanedSchedule;
    }

    // Clean fullMarks to match subjects and evaluation types
    const validFullMarks = {};
    
    // Only process if we have both subjects and evaluation types
    if (cleaned.subjects.length > 0 && cleaned.evaluationTypes.length > 0) {
      cleaned.subjects.forEach(subject => {
        validFullMarks[subject] = {};
        
        cleaned.evaluationTypes.forEach(type => {
          // Try to get existing value if it exists
          const existingValue = cleaned.fullMarks[subject]?.[type];
          const numericValue = Number(existingValue);
          
          // Set to existing value if valid, otherwise default to 0
          validFullMarks[subject][type] = !isNaN(numericValue) ? Math.max(0, numericValue) : 0;
        });
      });
    }
    
    cleaned.fullMarks = validFullMarks;
    
    console.log('Processed fullMarks:', cleaned.fullMarks);
    
    // Clean schedule to match subjects and evaluation types
    const validSchedule = {};
    
    if (cleaned.subjects.length > 0 && cleaned.evaluationTypes.length > 0) {
      cleaned.subjects.forEach(subject => {
        validSchedule[subject] = {};
        
        cleaned.evaluationTypes.forEach(type => {
          // Try to get existing schedule if it exists
          const existingSchedule = cleaned.schedule[subject]?.[type];
          
          validSchedule[subject][type] = {
            examDate: existingSchedule?.examDate || '',
            startTime: existingSchedule?.startTime || '',
            endTime: existingSchedule?.endTime || ''
          };
        });
      });
    }
    
    cleaned.schedule = validSchedule;
    
    console.log('Processed schedule:', cleaned.schedule);
    
    // Add timestamp if not present
    if (!cleaned._timestamp) {
      cleaned._timestamp = new Date().toISOString();
    }
    
    console.log('=== FINAL CLEANED CONFIG ===');
    console.log(JSON.parse(JSON.stringify({
      examName: cleaned.examName,
      subjects: cleaned.subjects,
      evaluationTypes: cleaned.evaluationTypes,
      fullMarks: cleaned.fullMarks,
      schedule: cleaned.schedule,
      _timestamp: cleaned._timestamp
    })));
    
    return cleaned;
  };


  // Handle save operation for exam configuration
  const handleSaveExamConfig = async (examName, config) => {
    try {
      // Normalize exam name
      const examNameToUse = Array.isArray(examName || selectedExam) ? 
        (examName || selectedExam).join('') : 
        String(examName || selectedExam || '');
      
      if (!selectedClass || !examNameToUse) {
        toast.error('Missing required fields: Class or Exam Name');
        return;
      }
      
      // Initialize config with default structure
      const configToSave = {
        subjects: [],
        evaluationTypes: [],
        fullMarks: {},
        schedule: {},
        examName: examNameToUse,
        _examName: examNameToUse,
        _timestamp: new Date().toISOString()
      };

      // Process subjects
      if (Array.isArray(config?.subjects)) {
        configToSave.subjects = [...new Set(config.subjects)]
          .filter(subject => subject && String(subject).trim() !== '')
          .map(subject => String(subject).trim());
      }
      
      // Process evaluation types
      if (Array.isArray(config?.evaluationTypes)) {
        configToSave.evaluationTypes = [...new Set(config.evaluationTypes)]
          .filter(type => type && String(type).trim() !== '')
          .map(type => String(type).trim());
      }
      
      // Process fullMarks
      if (config?.fullMarks && typeof config.fullMarks === 'object') {
        configToSave.fullMarks = {};
        
        if (configToSave.subjects.length > 0 && configToSave.evaluationTypes.length > 0) {
          configToSave.subjects.forEach(subject => {
            configToSave.fullMarks[subject] = {};
            
            configToSave.evaluationTypes.forEach(type => {
              const existingValue = config.fullMarks[subject]?.[type];
              const numericValue = Number(existingValue);
              configToSave.fullMarks[subject][type] = !isNaN(numericValue) ? Math.max(0, numericValue) : 0;
            });
          });
        }
      }
      
      // Process schedule
      if (config?.schedule && typeof config.schedule === 'object') {
        configToSave.schedule = { ...config.schedule };
      }
      
      // Log only the data being sent to the backend
      console.log('=== SENDING TO BACKEND ===');
      console.log(JSON.stringify({
        className: selectedClass,
        academicYear: '2024-2025',
        examConfig: {
          [examNameToUse]: configToSave
        }
      }, null, 2));
      
      setSaving(true);
      
      // Get or initialize the current config
      const currentConfig = { 
        ...(examConfigs[selectedClass] || { examConfig: {} }) 
      };
      
      // Initialize examConfig if it doesn't exist
      if (!currentConfig.examConfig) {
        currentConfig.examConfig = {};
      }
      
      // Clean and validate the incoming config
      const cleanedConfig = cleanAndValidateConfig(configToSave);
      
      console.log('Cleaned config:', cleanedConfig);
      
      // If we don't have any subjects but the form had some, use those
      if ((!cleanedConfig.subjects || cleanedConfig.subjects.length === 0) && 
          configToSave.subjects && configToSave.subjects.length > 0) {
        console.log('Using subjects from form data');
        cleanedConfig.subjects = [...configToSave.subjects];
      }
      
      // If we don't have any evaluation types but the form had some, use those
      if ((!cleanedConfig.evaluationTypes || cleanedConfig.evaluationTypes.length === 0) && 
          configToSave.evaluationTypes && configToSave.evaluationTypes.length > 0) {
        console.log('Using evaluation types from form data');
        cleanedConfig.evaluationTypes = [...configToSave.evaluationTypes];
      }
      
      // Final validation
      console.log('Cleaned config after fallbacks:', cleanedConfig);
      
      if (!cleanedConfig.subjects || !Array.isArray(cleanedConfig.subjects) || cleanedConfig.subjects.length === 0) {
        const errorMsg = 'No valid subjects found in the configuration';
        console.error(errorMsg, { cleanedConfig, originalConfig: config });
        throw new Error(errorMsg);
      }
      
      if (!cleanedConfig.evaluationTypes || !Array.isArray(cleanedConfig.evaluationTypes) || cleanedConfig.evaluationTypes.length === 0) {
        const errorMsg = 'No valid evaluation types found in the configuration';
        console.error(errorMsg, { cleanedConfig, originalConfig: config });
        throw new Error(errorMsg);
      }
      
      // Initialize exam config for the selected exam if it doesn't exist
      if (!currentConfig.examConfig[examNameToUse]) {
        currentConfig.examConfig[examNameToUse] = {
          subjects: [],
          evaluationTypes: [],
          fullMarks: {},
          schedule: {},
          _createdAt: new Date().toISOString()
        };
      }

      const existingConfig = currentConfig.examConfig[examNameToUse];
      
      // Merge the cleaned config with the existing one
      const updatedConfig = {
        ...existingConfig,
        ...cleanedConfig,
        // Preserve the existing schedule if we have one and it's valid
        schedule: cleanScheduleData(existingConfig.schedule || {}) || {},
        // Add metadata
        _updatedAt: new Date().toISOString()
      };
      
      // Ensure we have the required fields
      if (!updatedConfig.subjects || !Array.isArray(updatedConfig.subjects)) {
        updatedConfig.subjects = [];
      }
      
      if (!updatedConfig.evaluationTypes || !Array.isArray(updatedConfig.evaluationTypes)) {
        updatedConfig.evaluationTypes = [];
      }
      
      if (!updatedConfig.fullMarks || typeof updatedConfig.fullMarks !== 'object') {
        updatedConfig.fullMarks = {};
      }
      
      if (!updatedConfig.schedule || typeof updatedConfig.schedule !== 'object') {
        updatedConfig.schedule = {};
      }
      
      // Update the current config with the merged data
      currentConfig.examConfig[examNameToUse] = updatedConfig;
      
      console.log("Saving exam config:", {
        className: selectedClass,
        examName: examNameToUse,
        config: currentConfig,
        updatedConfig
      });
      
      // Call the API to save the configuration
      const saveResponse = await updateExamConfig({
        className: selectedClass,
        config: currentConfig,
        academicYear: '2024-2025'
      });
      
      console.log('Save response:', saveResponse);
      
      // Reload the configurations
      await loadExamConfigs();
      
      // Show success message
      toast.success('Exam configuration saved successfully');
      
      // Close the modal
      setIsMarksModalOpen(false);
    } catch (error) {
      console.error('Error saving exam config:', error);
      toast.error(`Failed to save exam configuration: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setSaving(false);
    }
  };

  // Handle save operation for exam schedule
  const handleSaveSchedule = async (scheduleData) => {
    // Ensure selectedExam is a string (not an array of characters)
    const examName = Array.isArray(selectedExam) ? selectedExam.join('') : String(selectedExam || '');
    
    if (!selectedClass || !examName) {
      console.warn('Missing required fields: selectedClass or selectedExam');
      toast.error('Please select a class and exam before saving the schedule');
      return;
    }

    console.log("Saving exam schedule:", scheduleData);
    
    // If scheduleData is an object with a schedule property, use that
    const scheduleToSave = scheduleData.schedule || scheduleData;
    
    console.log("Processing schedule data:", scheduleToSave);
    
    setSaving(true);
    
    try {
      // Get or initialize the current config
      const currentConfig = { 
        ...(examConfigs[selectedClass] || { examConfig: {} }) 
      };
      
      // Initialize examConfig if it doesn't exist
      if (!currentConfig.examConfig) {
        currentConfig.examConfig = {};
      }
      
      // Initialize exam config for the selected exam if it doesn't exist
      if (!currentConfig.examConfig[examName]) {
        currentConfig.examConfig[examName] = {
          subjects: [],
          evaluationTypes: [],
          fullMarks: {},
          schedule: {}
        };
      }

      const existingConfig = currentConfig.examConfig[examName];
      
      // Clean and validate the schedule data
      const cleanedSchedule = cleanScheduleData(scheduleToSave);
      
      console.log("Cleaned schedule:", cleanedSchedule);
      
      // Update the config with the new schedule
      const updatedConfig = {
        ...existingConfig,
        schedule: cleanedSchedule
      };
      
      // Update the current config with the merged data
      currentConfig.examConfig[examName] = updatedConfig;
      
      console.log("Saving exam configuration with schedule:", {
        className: selectedClass,
        examName,
        config: currentConfig
      });
      
      // Call the API to save the configuration
      const saveResponse = await updateExamConfig({
        className: selectedClass,
        config: currentConfig,
        academicYear: '2024-2025'
      });
      
      console.log('Save response:', saveResponse);
      
      // Reload the configurations
      await loadExamConfigs();
      
      // Show success message
      toast.success('Exam schedule saved successfully');
      
      // Close the modal
      setIsScheduleModalOpen(false);
    } catch (error) {
      console.error('Error saving exam schedule:', error);
      toast.error(`Failed to save exam schedule: ${error.message || 'Unknown error occurred'}`);
    } finally {
      setSaving(false);
    }
  };

  // Calculate configuration status
  const getConfigStatus = (config) => {
    if (!config?.examConfig || Object.keys(config.examConfig).length === 0) {
      return { status: 'empty', message: 'No configuration found' };
    }
    
    const examConfigs = Object.values(config.examConfig);
    const hasCompleteConfig = examConfigs.some(exam => 
      exam.subjects?.length > 0 && 
      exam.evaluationTypes?.length > 0 && 
      Object.keys(exam.fullMarks || {}).length > 0
    );
    
    if (!hasCompleteConfig) {
      return { status: 'incomplete', message: 'Configuration incomplete' };
    }
    
    return { status: 'complete', message: 'Configuration complete' };
  };

  // Render configuration cards (Marks and Schedule)
  const renderConfigCards = (config) => {
    // Initialize with default values if no config exists
    let hasSchedule = false;
    let hasSubjects = false;
    
    // Check if we have a selected exam and its configuration
    if (selectedExam && config?.examConfig?.[selectedExam]) {
      const examData = config.examConfig[selectedExam];
      hasSchedule = examData.schedule && Object.keys(examData.schedule).length > 0;
      hasSubjects = examData.subjects?.length > 0;
    }
  
    
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {/* Marks Configuration Card */}
          <div className={`rounded-lg shadow-sm border p-6 hover:shadow-md transition-all ${
            hasSubjects 
              ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
              : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
          }`}>
            <div className="flex items-start">
              <div className={`flex-shrink-0 p-3 rounded-full ${
                hasSubjects 
                  ? 'bg-green-100 dark:bg-green-900/30' 
                  : 'bg-yellow-100 dark:bg-yellow-900/30'
              }`}>
                <FaEdit className={`h-6 w-6 ${
                  hasSubjects 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Marks Configuration</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Set up subjects, evaluation types, and marks distribution
                </p>
                <button
                  onClick={() => setIsMarksModalOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaEdit className="mr-2 h-4 w-4" />
                  {hasSubjects ? 'Edit Configuration' : 'Configure Now'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Schedule Exam Card */}
          <div className={`relative rounded-lg shadow-sm border p-6 transition-all ${
            !hasSubjects 
              ? 'bg-gray-50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 opacity-70 group' 
              : hasSchedule 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 hover:shadow-md' 
                : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 hover:shadow-md'
          }`}>
            {/* Tooltip for disabled state */}
            {!hasSubjects && (
              <div className="absolute -top-2 -right-2">
                <div className="relative">
                  <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block whitespace-nowrap px-3 py-2 bg-gray-800 text-white text-sm rounded shadow-lg z-10">
                    Complete Marks Configuration to enable scheduling
                    <div className="absolute right-2 top-full w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-800"></div>
                  </div>
                  <div className="w-6 h-6 flex items-center justify-center bg-yellow-500 rounded-full text-white text-xs font-bold">
                    <span>!</span>
                  </div>
                </div>
              </div>
            )}
            <div className="flex items-start">
              <div className={`flex-shrink-0 p-3 rounded-full ${
                !hasSubjects 
                  ? 'bg-gray-100 dark:bg-gray-700/50' 
                  : hasSchedule 
                    ? 'bg-green-100 dark:bg-green-900/30' 
                    : 'bg-yellow-100 dark:bg-yellow-900/30'
              }`}>
                <FaCalendarAlt className={`h-6 w-6 ${
                  !hasSubjects 
                    ? 'text-gray-400 dark:text-gray-500' 
                    : hasSchedule 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-yellow-600 dark:text-yellow-400'
                }`} />
              </div>
              <div className="ml-4">
                <h3 className={`text-lg font-medium mb-1 ${
                  !hasSubjects ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'
                }`}>
                  Exam Schedule
                  {!hasSubjects && <span className="ml-2 text-xs font-normal">(Complete Marks Configuration First)</span>}
                </h3>
                <p className={`text-sm mb-4 ${
                  !hasSubjects ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  Set up exam dates, timings, and subject schedules
                </p>
                <button
                  onClick={() => hasSubjects && setIsScheduleModalOpen(true)}
                  disabled={!hasSubjects}
                  className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm ${
                    hasSubjects 
                      ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
                      : 'text-gray-400 bg-gray-200 dark:bg-gray-700 cursor-not-allowed'
                  }`}
                >
                  <FaCalendarAlt className="mr-2 h-4 w-4" />
                  {hasSchedule ? 'Edit Schedule' : 'Add Schedule'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // Render exam configuration details
  const renderExamConfigs = (config) => {
    if (statusLoading) {
      return <SkeletonLoader count={2} className="mt-4" />;
    }

    if (!selectedExam || !config?.examConfig?.[selectedExam]) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 p-8 text-center"
        >
          <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-3">
            <FaInfoCircle className="w-full h-full" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No exam selected</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Please select an exam from the list above to view or configure its details
          </p>
        </motion.div>
      );
    }
    
    const examData = config.examConfig[selectedExam];
    if (typeof examData !== 'object' || examData === null) return null;
    
    // Get subjects and evaluation types
    const subjects = Array.isArray(examData.subjects) ? examData.subjects : [];
    const evaluationTypes = Array.isArray(examData.evaluationTypes) ? examData.evaluationTypes : [];
    const fullMarks = examData.fullMarks || {};
    
    // Check if schedule is configured
    const schedule = examData.schedule || {};
    const hasSchedule = Object.keys(schedule).length > 0;
    
    // Calculate subject totals
    const subjectTotals = {};
    let examTotal = 0;
    
    subjects.forEach(subject => {
      const total = evaluationTypes.reduce((sum, type) => {
        return sum + (parseInt(fullMarks[subject]?.[type]) || 0);
      }, 0);
      subjectTotals[subject] = total;
      examTotal += total;
    });

    return (
      <div className="space-y-6">
        {/* Exam Details Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Exam Details</h3>
          
          {/* Subject Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {subjects.map((subject) => {
                const subjectSchedule = schedule[subject] || {};
                const totalMarks = subjectTotals[subject] || 0;
                
                return (
                  <div key={subject} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{subject}</h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {totalMarks} Marks
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {evaluationTypes.length > 0 ? (
                        evaluationTypes.map((evalType) => {
                          const evalSchedule = subjectSchedule[evalType];
                          const evalMarks = fullMarks[subject]?.[evalType] || 0;
                          
                          return (
                            <div key={`${subject}-${evalType}`} className="mb-3 last:mb-0">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{evalType}</span>
                                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{evalMarks} Marks</span>
                              </div>
                              
                              {evalSchedule ? (
                                <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-md border border-gray-200 dark:border-gray-600">
                                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300 mb-1">
                                    <FaCalendarAlt className="mr-2 h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                                    <span>
                                      {format(parseISO(evalSchedule.examDate), 'EEEE, MMMM d, yyyy')}
                                    </span>
                                  </div>
                                  <div className="flex items-center text-sm text-gray-600 dark:text-gray-300">
                                    <FaClock className="mr-2 h-3.5 w-3.5 text-indigo-500" />
                                    {evalSchedule.startTime} - {evalSchedule.endTime}
                                  </div>
                                </div>
                              ) : (
                                <div className="text-xs text-center text-gray-500 dark:text-gray-400 py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-md border border-dashed border-gray-300 dark:border-gray-600">
                                  No schedule set
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">No evaluation types configured</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {!hasSchedule && (
            <div className="mt-6 text-center">
              <div className="inline-flex items-center px-4 py-2 text-sm font-medium text-yellow-700 bg-yellow-100 rounded-md dark:bg-yellow-900/30 dark:text-yellow-300">
                <FaExclamationTriangle className="mr-2 h-4 w-4" />
                Schedule not configured yet
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="ml-4 inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md shadow-sm text-yellow-700 bg-yellow-200 hover:bg-yellow-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:bg-yellow-800/50 dark:text-yellow-200 dark:hover:bg-yellow-800"
                >
                  <FaCalendarAlt className="mr-1 h-3 w-3" />
                  Add Schedule
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Load configs when class changes
  useEffect(() => {
    if (selectedClass) {
      loadExamConfigs();
    }
  }, [selectedClass, loadExamConfigs]);

  // Render exam terms selection
  const renderExamTerms = () => (
    <div className="p-4">
      <h2 className="text-base font-medium text-gray-800 dark:text-white mb-2">
        {selectedClass} - Select Exam Term
      </h2>
      <div className="flex flex-wrap gap-2">
        {examTermsInTheSchool && examTermsInTheSchool.length > 0 ? (
          examTermsInTheSchool.map((term) => (
            <button
              key={term}
              onClick={() => setSelectedExam(term)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                selectedExam === term
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {term}
            </button>
          ))
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No exam terms found. Please check the configuration.</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="w-full">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 sm:mb-6">Exam Configuration</h1>
      
      {/* Class Selection */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">Select Class</h2>
        <ExamDependentClassSelectorCard
          selectedClass={selectedClass}
          onSelect={setSelectedClass}
        />
      </div>

      {selectedClass && (
        <div className="space-y-6">
          {renderExamTerms()}
          
          {/* Configuration Cards */}
          {selectedExam && (
            <div className="space-y-4 sm:space-y-6">
              <div className="px-0 sm:px-2">
                <h2 className="text-lg font-medium text-gray-800 dark:text-white mb-1">
                  {selectedClass} - {selectedExam} Configuration
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Manage exam settings and schedule
                </p>
              </div>
              
              {/* Render configuration cards */}
              <div className="px-0 sm:px-2">
                {renderConfigCards(examConfigs[selectedClass] || {})}
              </div>
              
              {/* Exam Configuration Details */}
              <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-sm border-0 sm:border border-gray-200 dark:border-gray-700 p-0 sm:p-4 md:p-6">
                {statusLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
                  </div>
                ) : (
                  renderExamConfigs(examConfigs[selectedClass] || {})
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {isMarksModalOpen && selectedClass && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div 
            className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[90vh] overflow-y-auto p-1">
              <ExamConfigModal
                selectedClass={selectedClass}
                examName={selectedExam}
                initialExamConfig={examConfigs[selectedClass]?.examConfig?.[selectedExam] || {}}
                onSave={handleSaveExamConfig}
                onClose={() => setIsMarksModalOpen(false)}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}
      {isScheduleModalOpen && selectedClass && selectedExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div 
            className="w-full max-w-4xl bg-white dark:bg-gray-800 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-h-[90vh] overflow-y-auto p-1">
              <ExamScheduleModal
                isOpen={isScheduleModalOpen}
                onClose={() => setIsScheduleModalOpen(false)}
                onSave={handleSaveSchedule}
                subjects={examConfigs[selectedClass]?.examConfig?.[selectedExam]?.subjects || []}
                evaluationTypes={examConfigs[selectedClass]?.examConfig?.[selectedExam]?.evaluationTypes || []}
                schedule={examConfigs[selectedClass]?.examConfig?.[selectedExam]?.schedule || {}}
                loading={saving}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ExamConfigurationPanel;
