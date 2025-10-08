import React, { useState, useEffect, useMemo, useCallback,useRef } from 'react';
import { X, Plus, Trash2, Calendar, Check } from 'lucide-react';

// Toggle switch styles
const toggleStyles = `
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 3rem;
    height: 1.5rem;
  }
  
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: #9CA3AF;
    transition: .4s;
    border-radius: 2rem;
  }
  
  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 1.125rem;
    width: 1.125rem;
    left: 0.25rem;
    bottom: 0.1875rem;
    background-color: white;
    transition: .4s;
    border-radius: 50%;
  }
  
  input:checked + .toggle-slider {
    background-color: #4F46E5;
  }
  
  input:checked + .toggle-slider:before {
    transform: translateX(1.5rem);
  }
  
  .toggle-label {
    margin-left: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.25rem;
    font-weight: 500;
    color: #374151;
  }
  
  .dark .toggle-label {
    color: #E5E7EB;
  }
`;
import { subjectsInTheSchool } from '@/shared/schoolInformation';



// Toggle button component
const ToggleButton = ({ active, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
      active
        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
    }`}
  >
    {children}
    {active && <Check className="inline ml-1 w-4 h-4" />}
  </button>
);



export default function ExamConfigModal({ 
  selectedClass, 
  examName,
  initialExamConfig ={},
  onSave, 
  onClose, 
  loading = false 
}) {
  // Initialize state with empty/default values
  const [subjects, setSubjects] = useState([]);
  const [evaluationTypes, setEvaluationTypes] = useState([]);
  const [fullMarks, setFullMarks] = useState({});
  const [schedule, setSchedule] = useState({});

  console.log("initialExamConfig in mdal",initialExamConfig);
  
  
  // Helper function to clean data of MongoDB internal properties
  const cleanData = (data) => {
    if (Array.isArray(data)) {
      return data.map(cleanData);
    } else if (data && typeof data === 'object') {
      const cleanObj = {};
      // Filter out internal MongoDB properties (those starting with $__)
      Object.entries(data).forEach(([key, value]) => {
        if (!key.startsWith('$__')) {
          cleanObj[key] = cleanData(value);
        }
      });
      return cleanObj;
    }
    return data;
  };

  // Update state when initialExamConfig changes
  useEffect(() => {
    console.log('Initial exam config received:', initialExamConfig);
    
    // Create a function to update the state
    const updateState = () => {
      if (initialExamConfig && Object.keys(initialExamConfig).length > 0) {
        console.log('Updating state from initialExamConfig:', initialExamConfig);
        
        // Clean the initial config to remove any MongoDB internal properties
        const cleanInitialConfig = cleanData(initialExamConfig);
        
        // Ensure examName is a string (not an array of characters)
        const examNameStr = Array.isArray(examName) ? examName.join('') : String(examName || '');
        
        // Get the config data (handle both direct props and nested under examName)
        const configData = cleanInitialConfig[examNameStr] || cleanInitialConfig;
        
        // Update subjects
        const newSubjects = Array.isArray(configData.subjects) 
          ? [...configData.subjects].filter(Boolean)
          : [];
        
        // Update evaluation types - ensure it's always an array and filter out any invalid values
        const newEvalTypes = Array.isArray(configData.evaluationTypes)
          ? [...configData.evaluationTypes].filter(type => 
              typeof type === 'string' && type.trim() !== '' && !type.startsWith('$__')
            )
          : [];
        
        console.log('Setting evaluation types:', newEvalTypes);
        
        // Update full marks - ensure it's a clean object
        let newFullMarks = {};
        if (configData.fullMarks && typeof configData.fullMarks === 'object') {
          // Filter out any internal properties from fullMarks
          Object.entries(configData.fullMarks).forEach(([subject, marks]) => {
            if (typeof subject === 'string' && !subject.startsWith('$__') && marks && typeof marks === 'object') {
              newFullMarks[subject] = {};
              Object.entries(marks).forEach(([evalType, value]) => {
                if (typeof evalType === 'string' && !evalType.startsWith('$__')) {
                  newFullMarks[subject][evalType] = value;
                }
              });
            }
          });
        }
        
        // Update schedule - ensure it's a clean object
        let newSchedule = {};
        if (configData.schedule && typeof configData.schedule === 'object') {
          // Filter out any internal properties from schedule
          Object.entries(configData.schedule).forEach(([subject, subjectSchedule]) => {
            if (typeof subject === 'string' && !subject.startsWith('$__') && subjectSchedule && typeof subjectSchedule === 'object') {
              newSchedule[subject] = {};
              Object.entries(subjectSchedule).forEach(([evalType, scheduleData]) => {
                if (typeof evalType === 'string' && !evalType.startsWith('$__') && scheduleData && typeof scheduleData === 'object') {
                  newSchedule[subject][evalType] = { ...scheduleData };
                }
              });
            }
          });
        }
        
        // Update states
        setSubjects(prev => 
          JSON.stringify(prev) !== JSON.stringify(newSubjects) ? newSubjects : prev
        );
        
        setEvaluationTypes(prev => 
          JSON.stringify(prev) !== JSON.stringify(newEvalTypes) ? newEvalTypes : prev
        );
        
        setFullMarks(prev => 
          JSON.stringify(prev) !== JSON.stringify(newFullMarks) ? newFullMarks : prev
        );
        
        setSchedule(prev => 
          JSON.stringify(prev) !== JSON.stringify(newSchedule) ? newSchedule : prev
        );
        
        // Initialize uniform marks state
        const newUniformMarks = {};
        const newUniformMarksEnabled = {};
        
        newEvalTypes.forEach(type => {
          const marks = new Set();
          
          // Collect all mark values for this evaluation type
          Object.values(newFullMarks).forEach(subjectMarks => {
            if (subjectMarks && typeof subjectMarks === 'object' && subjectMarks[type] !== undefined) {
              marks.add(subjectMarks[type]);
            }
          });
          
          // If all marks are the value (or only one mark exists), enable uniform marks
          newUniformMarksEnabled[type] = marks.size <= 1;
          newUniformMarks[type] = marks.size === 1 ? marks.values().next().value : 0;
        });
        
        setUniformMarks(prev => 
          JSON.stringify(prev) !== JSON.stringify(newUniformMarks) ? newUniformMarks : prev
        );
        
        setUniformMarksEnabled(prev => 
          JSON.stringify(prev) !== JSON.stringify(newUniformMarksEnabled) ? newUniformMarksEnabled : prev
        );
      } else {
        console.log('No initialExamConfig or empty config, resetting state');
        setSubjects([]);
        setEvaluationTypes([]);
        setFullMarks({});
        setSchedule({});
        setUniformMarks({});
        setUniformMarksEnabled({});
      }
    };
    
    // Use requestAnimationFrame to ensure state updates are batched
    const rafId = requestAnimationFrame(() => {
      updateState();
    });
    
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [initialExamConfig]);
  
  const [activeTab, setActiveTab] = useState('configure'); // 'setup' or 'configure'
  const [uniformMarks, setUniformMarks] = useState({});
  const [uniformMarksEnabled, setUniformMarksEnabled] = useState({});
  
  // Toggle subject selection
  const toggleSubject = useCallback((subject, e) => {
    // Prevent default to avoid any form submission or navigation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Use functional updates to ensure we have the latest state
    setSubjects(prevSubjects => {
      const isAdding = !prevSubjects.includes(subject);
      const newSubjects = isAdding 
        ? [...prevSubjects, subject]             // Add if not exists
        : prevSubjects.filter(s => s !== subject); // Remove if exists
      
      // Get current evaluation types and uniform marks
      setEvaluationTypes(currentEvalTypes => {
        setUniformMarks(currentUniformMarks => {
          // Initialize or clean up full marks for the subject
          setFullMarks(prevMarks => {
            const newFullMarks = { ...prevMarks };
            
            if (isAdding) {
              // Add new subject with marks for all evaluation types
              if (!newFullMarks[subject]) {
                newFullMarks[subject] = {};
                currentEvalTypes.forEach(type => {
                  newFullMarks[subject][type] = currentUniformMarks[type] || 0;
                });
              }
            } else {
              // Remove subject from full marks
              if (newFullMarks[subject]) {
                delete newFullMarks[subject];
              }
            }
            
            return newFullMarks;
          });
          
          return currentUniformMarks;
        });
        
        return currentEvalTypes;
      });
      
      return newSubjects;
    });
  }, []); // No dependencies needed as we use functional updates

  // Toggle evaluation type
  const toggleEvaluationType = useCallback((type) => {
    // Use functional updates to ensure we have the latest state
    setEvaluationTypes(prevEvalTypes => {
      const isAdding = !prevEvalTypes.includes(type);
      const newEvaluationTypes = isAdding 
        ? [...prevEvalTypes, type]       // Add if not exists
        : prevEvalTypes.filter(t => t !== type); // Remove if exists
      
      // Get current subjects and uniform marks
      setSubjects(currentSubjects => {
        setUniformMarks(currentUniformMarks => {
          // Update full marks for all subjects based on the evaluation type change
          setFullMarks(prevMarks => {
            const newFullMarks = { ...prevMarks };
            
            if (isAdding) {
              // Add new evaluation type to all subjects
              currentSubjects.forEach(subject => {
                if (!newFullMarks[subject]) {
                  newFullMarks[subject] = {};
                }
                // Only initialize if not already set
                if (newFullMarks[subject][type] === undefined) {
                  newFullMarks[subject][type] = currentUniformMarks[type] || 0;
                }
              });
              
              // Initialize uniform marks for the new type if it doesn't exist
              if (currentUniformMarks[type] === undefined) {
                setUniformMarks(prev => ({
                  ...prev,
                  [type]: 0
                }));
                
                setUniformMarksEnabled(prev => ({
                  ...prev,
                  [type]: false
                }));
              }
            } else {
              // Remove the evaluation type from all subjects
              Object.keys(newFullMarks).forEach(subject => {
                if (newFullMarks[subject] && newFullMarks[subject][type] !== undefined) {
                  delete newFullMarks[subject][type];
                }
              });
              
              // Clean up uniform marks for the removed type
              setUniformMarks(prev => {
                const newUniformMarks = { ...prev };
                delete newUniformMarks[type];
                return newUniformMarks;
              });
              
              setUniformMarksEnabled(prev => {
                const newUniformMarksEnabled = { ...prev };
                delete newUniformMarksEnabled[type];
                return newUniformMarksEnabled;
              });
            }
            
            return newFullMarks;
          });
          
          return currentUniformMarks;
        });
        
        return currentSubjects;
      });
      
      return newEvaluationTypes;
    });
  }, []); // No dependencies needed as we use functional updates

  // Helper function to clean MongoDB internal properties from an object
  const cleanMongoDBProps = useCallback((obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(cleanMongoDBProps);
    }
    
    // Handle objects
    const cleanObj = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip internal MongoDB properties
      if (key.startsWith('$__')) continue;
      
      // Recursively clean nested objects/arrays
      if (value && typeof value === 'object') {
        cleanObj[key] = cleanMongoDBProps(value);
      } else if (value !== undefined && value !== null) {
        cleanObj[key] = value;
      }
    }
    return cleanObj;
  }, []);

  // Helper function to prepare data for saving
  const prepareDataForSave = useCallback((data) => {
    // First, clean any MongoDB internal properties
    const cleanedData = cleanMongoDBProps(data);
    
    // Then prepare the data structure
    if (Array.isArray(cleanedData)) {
      return cleanedData.filter(Boolean);
    } else if (cleanedData && typeof cleanedData === 'object') {
      const result = {};
      
      // Handle schedule separately to ensure it's always an object
      if (cleanedData.schedule) {
        result.schedule = cleanedData.schedule;
      }
      
      // Process other properties
      for (const [key, value] of Object.entries(cleanedData)) {
        // Skip schedule as we've already handled it
        if (key === 'schedule') continue;
        
        // Preserve evaluationTypes exactly as they are
        if (key === 'evaluationTypes' && Array.isArray(value)) {
          result[key] = [...value];
          continue;
        }
        
        if (Array.isArray(value)) {
          if (value.length > 0) {
            result[key] = prepareDataForSave(value);
          }
        } else if (value && typeof value === 'object') {
          const nested = prepareDataForSave(value);
          if (Object.keys(nested).length > 0) {
            result[key] = nested;
          }
        } else if (value !== undefined && value !== null) {
          result[key] = value;
        }
      }
      
      return result;
    }
    return cleanedData;
  }, [cleanMongoDBProps]);

  // Handle form submission
  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    // Create a clean config object with the correct structure
    const examConfig = {
      subjects: [...subjects],
      evaluationTypes: [...evaluationTypes],
      fullMarks: { ...fullMarks },
      schedule: { ...schedule } // Include the current schedule data
    };
    
    // Clean and prepare the data for saving
    const configToSave = prepareDataForSave(examConfig);
    
    // Ensure evaluation types are properly set based on the actual data
    const updatedConfig = {
      ...configToSave,
      evaluationTypes: [...evaluationTypes] // Ensure we use the current evaluation types
    };
    
    // Log the data being saved for debugging
    console.log('=== SAVING EXAM CONFIG ===');
    console.log('Exam name:', examName);
    console.log('Subjects:', updatedConfig.subjects);
    console.log('Evaluation Types:', updatedConfig.evaluationTypes);
    console.log('Full Marks:', updatedConfig.fullMarks);
    console.log('Schedule:', updatedConfig.schedule);
    
    // Call the onSave prop with the updated config
    if (onSave) {
      onSave(examName, updatedConfig);
    }
  }, [subjects, evaluationTypes, fullMarks, schedule, examName, initialExamConfig, onSave]);
  
  // Handle changes to full marks
  const handleMarksChange = useCallback((subject, type, value) => {
    setFullMarks(prev => ({
      ...prev,
      [subject]: {
        ...(prev[subject] || {}),
        [type]: Number(value) || 0
      }
    }));
  }, []);
  
  // Toggle uniform marks for an evaluation type
  const toggleUniformMarks = useCallback((type) => {
    console.log(`Toggling uniform marks for ${type}`);
    
    setUniformMarksEnabled(prev => {
      const newEnabled = !prev[type];
      console.log(`New enabled state for ${type}:`, newEnabled);
      
      // Update the enabled state first
      const newEnabledState = { ...prev, [type]: newEnabled };
      
      // If enabling uniform marks
      if (newEnabled) {
        // Get the first non-zero mark value for this type, or default to 0
        let uniformValue = 0;
        for (const subject of subjects) {
          const mark = fullMarks[subject]?.[type];
          if (mark !== undefined) {
            uniformValue = mark;
            break;
          }
        }
        
        console.log(`Setting uniform value for ${type} to ${uniformValue}`);
        
        // Update the uniform marks value
        setUniformMarks(prev => {
          const updated = { ...prev, [type]: uniformValue };
          console.log('Updated uniform marks:', updated);
          return updated;
        });
        
        // Update all subjects with this uniform value
        setFullMarks(prev => {
          const newFullMarks = { ...prev };
          let hasChanges = false;
          
          // Check if we need to update any marks
          for (const subject of subjects) {
            if (!newFullMarks[subject]) {
              newFullMarks[subject] = {};
            }
            
            // Only update if the value has changed
            if (newFullMarks[subject][type] !== uniformValue) {
              // Preserve any existing schedule data for this subject and type
              const existingSchedule = schedule[subject]?.[type];
              if (existingSchedule) {
                if (!newFullMarks[subject].schedule) {
                  newFullMarks[subject].schedule = {};
                }
                newFullMarks[subject].schedule[type] = existingSchedule;
              }
              
              newFullMarks[subject][type] = uniformValue;
              hasChanges = true;
            }
          }
          
          if (hasChanges) {
            console.log('Updating full marks with uniform values:', newFullMarks);
            return newFullMarks;
          }
          
          return prev;
        });
      }
      
      return newEnabledState;
    });
  }, [subjects, fullMarks, schedule]);
  
  // Handle changes to uniform marks
  const handleUniformMarksChange = useCallback((type, value) => {
    const numericValue = value === '' ? '' : Math.max(0, parseInt(value) || 0);
    
    console.log(`Updating uniform marks for ${type} to:`, numericValue);
    
    // Update the uniform marks value
    setUniformMarks(prev => {
      // Only update if the value has actually changed
      if (prev[type] === numericValue) return prev;
      const updated = {
        ...prev,
        [type]: numericValue
      };
      console.log('Updated uniform marks state:', updated);
      return updated;
    });
    
    // Only update full marks if we have a valid number
    if (numericValue !== '') {
      // Update all subjects with this uniform value
      setFullMarks(prev => {
        const newFullMarks = { ...prev };
        let hasChanges = false;
        
        // Update all subjects with the new uniform value
        for (const subject of subjects) {
          if (!newFullMarks[subject]) {
            newFullMarks[subject] = {};
          }
          
          // Only update if the value has changed
          if (newFullMarks[subject][type] !== numericValue) {
            newFullMarks[subject][type] = numericValue;
            hasChanges = true;
          }
        }
        
        if (hasChanges) {
          console.log('Updating full marks with new uniform values:', newFullMarks);
          return newFullMarks;
        }
        
        return prev;
      });
    }
  }, [subjects]);
        
  // Track initial load
  const initialLoad = useRef(true);

  // Initialize uniform marks when component mounts or when data changes
  useEffect(() => {
    if (subjects.length > 0 && evaluationTypes.length > 0) {
      console.log('Initializing uniform marks with fullMarks:', fullMarks);
      
      const newUniformMarks = {};
      const newUniformMarksEnabled = {};
      
      // Check for uniform marks
      evaluationTypes.forEach(type => {
        const values = new Set();
        let hasValues = false;
        
        // Collect all values for this evaluation type
        subjects.forEach(subject => {
          if (fullMarks[subject]?.[type] !== undefined) {
            values.add(fullMarks[subject][type]);
            hasValues = true;
          }
        });
        
        console.log(`Type: ${type}, Values:`, Array.from(values));
        
        // If all subjects have the same value for this type, enable uniform marks
        if (hasValues) {
          if (values.size === 1) {
            const value = values.values().next().value;
            newUniformMarks[type] = value;
            newUniformMarksEnabled[type] = true;
            console.log(`Enabling uniform marks for ${type} with value ${value}`);
          } else {
            newUniformMarks[type] = 0; // Default value
            newUniformMarksEnabled[type] = false;
            console.log(`Disabling uniform marks for ${type} - multiple values found`);
          }
        } else {
          // No values set yet
          newUniformMarks[type] = 0;
          newUniformMarksEnabled[type] = false;
          console.log(`No values found for ${type}, initializing disabled`);
        }
      });
      
      console.log('Setting uniform marks:', newUniformMarks);
      console.log('Setting uniform marks enabled:', newUniformMarksEnabled);
      
      setUniformMarks(prev => {
        const updated = { ...prev, ...newUniformMarks };
        console.log('Updated uniform marks state:', updated);
        return updated;
      });
      
      setUniformMarksEnabled(prev => {
        const updated = { ...prev, ...newUniformMarksEnabled };
        console.log('Updated uniform marks enabled state:', updated);
        return updated;
      });
      
      // Only switch to configure tab on initial load when we have data
      if (initialLoad.current) {
        setActiveTab('configure');
        initialLoad.current = false;
      }
    } else if (initialLoad.current) {
      setActiveTab('setup');
      initialLoad.current = false;
    }
  }, [subjects, evaluationTypes, fullMarks]);

  // Render setup tab
  const renderSetupTab = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Configure {examName}
        </h3>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Evaluation Types
            </h4>
            <div className="flex flex-wrap gap-2">
              {['Written', 'Oral', 'Practical'].map((type) => (
                <ToggleButton
                  key={type}
                  active={evaluationTypes.includes(type)}
                  onClick={() => toggleEvaluationType(type)}
                >
                  {type}
                </ToggleButton>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Subjects
            </h4>
            <div className="flex flex-wrap gap-2">
              {subjectsInTheSchool.map((subject) => {
                const isActive = subjects.includes(subject);
                return (
                  <button
                    key={subject}
                    type="button"
                    onClick={(e) => toggleSubject(subject, e)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {subject}
                    {isActive && <Check className="inline ml-1 w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render configuration tab
  const renderConfigureTab = () => (
    <div className="space-y-4">
      {/* Exam Info Section */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {examName}
        </h3>
        <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Class: {selectedClass} • {subjects.length} subjects • {evaluationTypes.length} evaluation types
        </div>
        
        {/* Save Button - Moved here for better mobile layout */}
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 h-9 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
      
      {/* Configuration form */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm">
        {/* Uniform Marks Toggle */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Set uniform marks for evaluation types:
          </h4>
          
          <div className="space-y-3">
            {evaluationTypes.map(type => (
              <div key={`uniform-${type}`} className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
                <div className="flex items-center">
                  <label className="flex items-center cursor-pointer">
                    <div className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={!!uniformMarksEnabled[type]}
                        onChange={() => toggleUniformMarks(type)}
                      />
                      <span className="toggle-slider"></span>
                    </div>
                    <span className="toggle-label">
                      Set uniform marks for {type}
                    </span>
                  </label>
                </div>
                
                {uniformMarksEnabled[type] && (
                  <div className="flex items-center space-x-2 sm:ml-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Marks:</span>
                    <input
                      type="number"
                      min="0"
                      value={uniformMarks[type] ?? ''}
                      onChange={(e) => {
                        // Use the handleUniformMarksChange function to update the marks
                        const value = e.target.value;
                        handleUniformMarksChange(type, value);
                      }}
                      className="w-20 px-2 py-1 text-sm border rounded-md focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-600 dark:border-gray-600 dark:text-white"
                      placeholder="0"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-5">
          {subjects.map((subject, index) => (
            <div key={subject} className={`pb-4 ${index < subjects.length - 1 ? 'border-b border-gray-100 dark:border-gray-700 mb-4' : ''}`}>
              <div className="flex justify-between items-center mb-3">
                <h5 className="font-medium text-gray-900 dark:text-white text-base">{subject}</h5>
                <div className="text-sm font-medium bg-gray-50 dark:bg-gray-700 px-3 py-1 rounded-md">
                  <span className="text-gray-600 dark:text-gray-300">Total: </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                    {calculateSubjectTotal(fullMarks[subject] || {})}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                {evaluationTypes.map((type) => (
                  <div key={`${subject}-${type}`} className="flex items-center space-x-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 w-20">
                      {type}:
                    </label>
                    <div className="flex-1">
                      <input
                        type="number"
                        min="0"
                        value={fullMarks[subject]?.[type] || ''}
                        onChange={(e) => {
                          if (uniformMarksEnabled[type]) return; // Prevent changes when uniform marks is on for this type
                          const value = e.target.value ? parseInt(e.target.value) : 0;
                          setFullMarks(prev => ({
                            ...prev,
                            [subject]: {
                              ...(prev[subject] || {}),
                              [type]: value
                            }
                          }));
                        }}
                        disabled={uniformMarksEnabled[type]}
                        className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white h-9 px-3 ${
                          uniformMarksEnabled[type] ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : ''
                        }`}
                        placeholder="0"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-2">
            <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Exam Total:</span>
              <span className="text-lg font-semibold text-indigo-600 dark:text-indigo-400">
                {subjects.reduce((total, subject) => {
                  return total + calculateSubjectTotal(fullMarks[subject] || {});
                }, 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Calculate total marks for a subject
  const calculateSubjectTotal = useCallback((subjectData) => {
    if (!subjectData) return 0;
    
    return evaluationTypes.reduce((total, type) => {
      const value = subjectData[type] || 0;
      // Convert to number and ensure it's a valid number
      const numValue = Number(value);
      return total + (isNaN(numValue) ? 0 : Math.max(0, numValue));
    }, 0);
  }, [evaluationTypes]);

  // Validate configuration before saving
  const validateConfig = () => {
    const errors = [];
    
    if (!examName?.trim()) {
      errors.push('Exam name is required');
    }
    
    if (subjects.length === 0) {
      errors.push('Please select at least one subject');
    }
    
    if (evaluationTypes.length === 0) {
      errors.push('Please select at least one evaluation type');
    }
    
    // Validate full marks for all subjects and evaluation types
    const invalidMarks = [];
    subjects.forEach(subject => {
      evaluationTypes.forEach(type => {
        const marks = fullMarks[subject]?.[type];
        if (marks === undefined || marks === null || marks === '') {
          invalidMarks.push(`${subject} - ${type}: Marks required`);
        } else if (isNaN(Number(marks)) || Number(marks) <= 0) {
          invalidMarks.push(`${subject} - ${type}: Invalid marks value`);
        }
      });
    });
    
    if (invalidMarks.length > 0) {
      errors.push('Invalid or missing marks for some subjects:', ...invalidMarks);
    }
    
    return errors;
  };

  // Handle save with improved validation and error handling
  const handleSave = async () => {
    try {
      // Validate the configuration
      const validationErrors = validateConfig();
      if (validationErrors.length > 0) {
        // Show first error to user, log all for debugging
        console.error('Validation errors:', validationErrors);
        alert(validationErrors[0]);
        return;
      }
      
      // Prepare the data to save with proper structure
      const configToSave = {
        subjects: [...new Set(subjects)].filter(Boolean), // Remove duplicates and empty values
        evaluationTypes: [...new Set(evaluationTypes)].filter(Boolean), // Remove duplicates and empty values
        fullMarks: {},
        schedule: { ...schedule }
      };
      
      // Process full marks with validation
      const validatedFullMarks = {};
      
      // Ensure all subjects have all evaluation types with valid marks
      configToSave.subjects.forEach(subject => {
        validatedFullMarks[subject] = {};
        
        configToSave.evaluationTypes.forEach(type => {
          // Use existing marks if valid, otherwise default to 0
          const existingMarks = fullMarks[subject]?.[type];
          const marksValue = Number(existingMarks);
          
          validatedFullMarks[subject][type] = (!isNaN(marksValue) && marksValue > 0) 
            ? marksValue 
            : 0;
        });
      });
      
      // Add the processed full marks to the config
      configToSave.fullMarks = validatedFullMarks;
      
      // Log the prepared config for debugging
      console.log('Prepared config for save:', {
        examName,
        ...configToSave,
        // Log a summary instead of the full objects for better readability
        _summary: {
          subjectCount: configToSave.subjects.length,
          evaluationTypeCount: configToSave.evaluationTypes.length,
          scheduleCount: Object.keys(configToSave.schedule).length
        }
      });
      
      // Call the onSave callback with the properly formatted data
      if (onSave) {
        try {
          setLoading?.(true);
          await onSave(examName, configToSave);
          // Success handling is done by the parent component
        } catch (error) {
          console.error('Error in onSave callback:', error);
          throw error; // Re-throw to be caught by the outer try-catch
        } finally {
          setLoading?.(false);
        }
      }
      
    } catch (error) {
      console.error('Error saving exam configuration:', error);
      alert(`Failed to save configuration: ${error.message || 'Unknown error occurred'}`);
    }
  };


  // Add styles to the document head
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = toggleStyles;
    document.head.appendChild(styleElement);
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Main render
  return (
    <div className="w-full p-6">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {activeTab === 'setup' ? 'Setup Exam' : 'Configure Exam'}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Class: {selectedClass} • {examName || 'No exam selected'}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="p-2.5 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg focus:outline-none transition-colors duration-200"
          aria-label="Close"
          disabled={loading}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('setup')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'setup'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            Setup
          </button>
          <button
            onClick={() => setActiveTab('configure')}
            disabled={!examName}
            className={`inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'configure'
                ? 'border-indigo-500 text-indigo-600 dark:border-indigo-400 dark:text-indigo-300'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-200 disabled:opacity-50'
            }`}
          >
            Configure
            <svg className="ml-1.5 -mr-0.5 h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'setup' ? renderSetupTab() : renderConfigureTab()}
      </div>

    </div>
  );
}
