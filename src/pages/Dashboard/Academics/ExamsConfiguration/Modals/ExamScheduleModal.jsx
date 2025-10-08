import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { X, Calendar, Clock, Clock3, Loader2 } from 'lucide-react';

// Tab component for evaluation types
const Tab = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`whitespace-nowrap py-2 px-4 border-b-2 font-medium text-sm transition-colors duration-200 ${
      active
        ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
    }`}
  >
    {children}
  </button>
);

// Loading spinner component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="h-6 w-6 animate-spin text-indigo-600 dark:text-indigo-400" />
    <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
  </div>
);

export default function ExamScheduleModal({
  isOpen,
  onClose,
  selectedClass,
  selectedExam,
  subjects = [],
  evaluationTypes = [],
  schedule = {},
  onSave,
  loading = false
}) {
  const [scheduleData, setScheduleData] = useState({});
  const [selectedType, setSelectedType] = useState(evaluationTypes[0] || '');
  const isInitialMount = useRef(true);

  // Track if we've already initialized the state
  const initializedRef = useRef(false);
  
  console.log("exam shedule",schedule);
  
  // Set the first evaluation type as selected if available
  useEffect(() => {
    if (evaluationTypes.length > 0 && !selectedType) {
      setSelectedType(evaluationTypes[0]);
    }
  }, [evaluationTypes, selectedType]);

  // Initialize schedule data when the modal opens or subjects/evaluation types change
  useEffect(() => {
    if (!isOpen || subjects.length === 0 || evaluationTypes.length === 0) {
      return;
    }
    
    // Only run this effect once when the modal opens
    if (initializedRef.current) {
      return;
    }
    
    const initialSchedule = {};
    
    // Initialize schedule data for all subjects and evaluation types
    subjects.forEach(subjectName => {
      initialSchedule[subjectName] = evaluationTypes.reduce((acc, type) => {
        // Use existing schedule data if available, otherwise use defaults
        const existingData = schedule[subjectName]?.[type] || {};
        
        // Convert 12-hour times to 24-hour format for the input fields
        const startTime = existingData.startTime ? 
          (existingData.startTime.includes('AM') || existingData.startTime.includes('PM') ? 
            convertTo24Hour(existingData.startTime) : existingData.startTime) : '09:00';
            
        const endTime = existingData.endTime ? 
          (existingData.endTime.includes('AM') || existingData.endTime.includes('PM') ? 
            convertTo24Hour(existingData.endTime) : existingData.endTime) : '12:00';
        
        return {
          ...acc,
          [type]: {
            examDate: existingData.examDate || new Date().toISOString().split('T')[0],
            startTime: startTime,
            endTime: endTime,
            duration: existingData.duration || '180' // Default to 3 hours
          }
        };
      }, {});
    });
    
    setScheduleData(initialSchedule);
    initializedRef.current = true;
    
    // Reset the ref when the modal closes
    return () => {
      if (!isOpen) {
        initializedRef.current = false;
      }
    };
  }, [isOpen, subjects, evaluationTypes, schedule]);

  const handleDateChange = useCallback((subjectName, evaluationType, date) => {
    setScheduleData(prev => {
      const currentSubject = prev[subjectName] || {};
      const currentType = currentSubject[evaluationType] || {};
      
      return {
        ...prev,
        [subjectName]: {
          ...currentSubject,
          [evaluationType]: {
            ...currentType,
            examDate: date
          }
        }
      };
    });
  }, []);

  const handleTimeChange = useCallback((subjectName, evaluationType, field, time) => {
    setScheduleData(prev => {
      const currentSubject = prev[subjectName] || {};
      const currentType = currentSubject[evaluationType] || {};
      
      return {
        ...prev,
        [subjectName]: {
          ...currentSubject,
          [evaluationType]: {
            ...currentType,
            [field]: time // Store the raw time value (24-hour format)
          }
        }
      };
    });
  }, []);

  const handleTypeChange = useCallback((type) => {
    setSelectedType(type);
  }, []);

  // Helper function to convert 12-hour time to 24-hour format for input[type="time"]
  const convertTo24Hour = (time12h) => {
    if (!time12h) return '';
    
    // If already in 24-hour format, return as is
    if (time12h.match(/^\d{1,2}:\d{2}$/)) {
      return time12h;
    }
    
    try {
      const [time, period] = time12h.split(' ');
      let [hours, minutes] = time.split(':');
      
      if (period === 'PM' && hours !== '12') {
        hours = String(parseInt(hours, 10) + 12);
      } else if (period === 'AM' && hours === '12') {
        hours = '00';
      }
      
      return `${hours.padStart(2, '0')}:${minutes || '00'}`;
    } catch (error) {
      console.error('Error converting to 24-hour format:', error);
      return '09:00';
    }
  };
  
  // Helper function to convert 24-hour time to 12-hour format with AM/PM
  const formatTimeTo12Hour = (time24) => {
    if (!time24) return '12:00 PM'; // Default value if time is not provided
    
    // If already in 12-hour format, return as is
    if (time24.includes('AM') || time24.includes('PM')) {
      return time24;
    }
    
    try {
      // Parse the 24-hour time
      const [hours, minutes] = time24.split(':');
      let hour = parseInt(hours, 10);
      const minute = minutes || '00';
      
      // Convert to 12-hour format
      const period = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12; // Convert 0 to 12 for 12 AM
      
      return `${hour}:${minute.padStart(2, '0')} ${period}`;
    } catch (error) {
      console.error('Error formatting time:', error);
      return '12:00 PM'; // Fallback to a default time
    }
  };

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    console.log('Saving exam schedule:', {
      selectedClass,
      selectedExam,
      subjects,
      evaluationTypes,
      scheduleData,
      timestamp: new Date().toISOString(),
      scheduleDataStructure: {
        totalSubjects: subjects.length,
        totalScheduled: Object.values(scheduleData).filter(Boolean).length,
        subjectsWithSchedule: Object.entries(scheduleData)
          .filter(([_, data]) => data && Object.keys(data).length > 0)
          .map(([subject]) => subject)
      }
    });
    
    // Prepare the schedule data in the expected format
    const formattedSchedule = {};
    
    // Process each subject's schedule
    subjects.forEach(subject => {
      if (!scheduleData[subject]) return;
      
      const subjectSchedules = {};
      
      // Process each evaluation type for the subject
      evaluationTypes.forEach(type => {
        const scheduleEntry = scheduleData[subject]?.[type];
        if (!scheduleEntry || !scheduleEntry.examDate) return;
        
        // Format the times to 12-hour format with AM/PM
        subjectSchedules[type] = {
          examDate: scheduleEntry.examDate,
          startTime: formatTimeTo12Hour(scheduleEntry.startTime || '09:00'),
          endTime: formatTimeTo12Hour(scheduleEntry.endTime || '12:00')
        };
      });
      
      // Only add the subject if it has valid schedules
      if (Object.keys(subjectSchedules).length > 0) {
        formattedSchedule[subject] = subjectSchedules;
      }
    });
    
    console.log('Formatted schedule data:', formattedSchedule);
    
    // Call the onSave callback with the formatted schedule data
    onSave(formattedSchedule);
  }, [onSave, scheduleData, selectedClass, selectedExam, subjects, evaluationTypes]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 bg-gray-900/75 backdrop-blur-sm transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* Modal panel */}
        <div className="fixed inset-0 z-10 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Schedule for {selectedExam}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Class: {selectedClass} • {subjects.length} subjects • {evaluationTypes.length} evaluation types
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none transition-colors duration-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Content */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {loading ? (
                <LoadingSpinner />
              ) : (
                <form onSubmit={handleSubmit}>
                  {evaluationTypes.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                      <nav className="-mb-px flex space-x-8" aria-label="Exam Types">
                        {evaluationTypes.map((type) => (
                          <Tab
                            key={type}
                            active={selectedType === type}
                            onClick={() => handleTypeChange(type)}
                          >
                            {type}
                          </Tab>
                        ))}
                      </nav>
                    </div>
                  )}
                  <div className="space-y-6">
                    {subjects.map((subjectName) => (
                      <div 
                        key={subjectName} 
                        className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow duration-200"
                      >
                        <div className="mb-4">
                          <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                            {subjectName}
                          </h4>
                        </div>
                        
                        {selectedType && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Exam Date
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Calendar className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="date"
                                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 sm:text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg h-11"
                                  value={scheduleData[subjectName]?.[selectedType]?.examDate || ''}
                                  onChange={(e) => handleDateChange(subjectName, selectedType, e.target.value)}
                                  required
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Start Time
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Clock className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="time"
                                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 sm:text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg h-11"
                                  value={scheduleData[subjectName]?.[selectedType]?.startTime || '09:00'}
                                  onChange={(e) => handleTimeChange(subjectName, selectedType, 'startTime', e.target.value)}
                                  step="300" // 5 minute intervals
                                  required
                                />
                              </div>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                End Time
                              </label>
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <Clock3 className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="time"
                                  className="focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 pr-3 sm:text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 dark:text-white rounded-lg h-11"
                                  value={scheduleData[subjectName]?.[selectedType]?.endTime || '12:00'}
                                  onChange={(e) => handleTimeChange(subjectName, selectedType, 'endTime', e.target.value)}
                                  step="300" // 5 minute intervals
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={loading}
                      className="inline-flex justify-center items-center px-6 py-2.5 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600 transition-colors duration-200 disabled:opacity-50 h-11"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex justify-center items-center px-6 py-2.5 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed h-11"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                          Saving...
                        </>
                      ) : 'Save Schedule'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}        