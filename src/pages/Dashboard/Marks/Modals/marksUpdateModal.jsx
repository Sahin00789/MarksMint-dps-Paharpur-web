import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getClassConfig } from '@/services/classConfig';

export default function MarksUpdateModal({ 
  isOpen, 
  onClose, 
  student, 
  examName, 
  subjects = [], 
  initialMarks = {}, 
  onSubmit 
}) {
  const [marks, setMarks] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [absentSubjects, setAbsentSubjects] = useState({});
  const [fullMarks, setFullMarks] = useState({});

  // Load full marks configuration when student changes
  useEffect(() => {
    const loadClassConfig = async () => {
      if (student?.class) {
        try {
          const config = await getClassConfig(student.class);
          console.log('Class config loaded:', config);
          
          if (config?.fullMarks && Object.keys(config.fullMarks).length > 0) {
            // If we have specific full marks for subjects, use them
            setFullMarks(config.fullMarks);
          } else if (config?.subjects?.length > 0) {
            // If no full marks but we have subjects, create default full marks
            const defaultFullMarks = {};
            config.subjects.forEach(subject => {
              defaultFullMarks[subject] = 100; // Default to 100 if not specified
            });
            setFullMarks(defaultFullMarks);
          }
          
          // If no config is found, fullMarks remains an empty object
        } catch (error) {
          console.error('Error loading class config:', error);
          // On error, set default full marks for the current subjects
          if (subjects?.length > 0) {
            const defaultFullMarks = {};
            subjects.forEach(subject => {
              defaultFullMarks[subject] = 100;
            });
            setFullMarks(defaultFullMarks);
          }
        }
      }
    };

    loadClassConfig();
  }, [student, subjects]);

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: 'easeOut'
      }
    },
    exit: {
      y: 20,
      opacity: 0,
      transition: {
        duration: 0.2,
        ease: 'easeIn'
      }
    }
  };

  // Initialize marks and absent status when modal opens or student changes
  useEffect(() => {
    if (isOpen && student) {
      const initialMarksData = initialMarks || {};
      const initialAbsentStatus = {};
      
      // Check for existing 'AB' marks and set absent status
      Object.entries(initialMarksData).forEach(([subject, mark]) => {
        if (mark === 'AB' || mark === 'Ab' || mark === 'ab') {
          initialAbsentStatus[subject] = true;
          initialMarksData[subject] = ''; // Clear AB value for the input
        }
      });
      
      setMarks(initialMarksData);
      setAbsentSubjects(initialAbsentStatus);
    }
  }, [isOpen, student, initialMarks]);

  const handleMarksChange = (subject, value) => {
    // If marking as absent, ensure the value is empty
    if (absentSubjects[subject]) {
      setMarks(prev => ({
        ...prev,
        [subject]: ''
      }));
    } else {
      // Only allow numbers for non-absent subjects
      const numericValue = value.replace(/\D/g, '');
      setMarks(prev => ({
        ...prev,
        [subject]: numericValue
      }));
    }
  };

  const toggleAbsentStatus = (subject) => {
    const newAbsentStatus = !absentSubjects[subject];
    setAbsentSubjects(prev => ({
      ...prev,
      [subject]: newAbsentStatus
    }));
    
    // If marking as absent, clear any existing marks
    if (newAbsentStatus) {
      setMarks(prev => ({
        ...prev,
        [subject]: ''
      }));
    }
  };

  const prepareMarksForSubmission = () => {
    const preparedMarks = { ...marks };
    
    // Replace empty marks for absent subjects with 'AB'
    Object.entries(absentSubjects).forEach(([subject, isAbsent]) => {
      if (isAbsent && (!marks[subject] || marks[subject] === '')) {
        preparedMarks[subject] = 'AB';
      }
    });
    
    return preparedMarks;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSubmit) return;
    
    try {
      setIsSubmitting(true);
      const marksToSubmit = prepareMarksForSubmission();
      await onSubmit(marksToSubmit);
      onClose();
    } catch (error) {
      console.error('Error saving marks:', error);
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <AnimatePresence>
      {isOpen && student && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
        >
          <motion.div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={onClose}
            aria-hidden="true"
            variants={backdropVariants}
          />
          
          <motion.div 
            className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            variants={modalVariants}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    Edit Marks - {examName}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Update marks for {student.studentName} (Roll: {student.roll})
                  </p>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                  aria-label="Close"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
                  {subjects.map((subject, index) => (
                    <motion.div 
                      key={subject} 
                      className="space-y-1.5"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + (index * 0.03) }}
                    >
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {subject}
                      </label>
                      <div className="relative">
                        <div className="flex items-center">
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            min="0"
                            max={fullMarks[`${examName}`]}
                            value={absentSubjects[subject] ? 'AB' : (marks[subject] || '')}
                            onChange={(e) => handleMarksChange(subject, e.target.value)}
                            className={`w-full rounded-l-lg border ${absentSubjects[subject] ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'} text-gray-900 dark:text-white px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200`}
                            placeholder={absentSubjects[subject] ? 'AB' : `0-${fullMarks[`${examName}`] || 100}`}
                            disabled={absentSubjects[subject] || isSubmitting}
                          />
                          <button
                            type="button"
                            onClick={() => toggleAbsentStatus(subject)}
                            className={`h-full px-3 py-2.5 border-t border-b border-r rounded-r-lg flex items-center justify-center transition-colors ${
                              absentSubjects[subject]
                                ? 'bg-red-500 text-white border-red-600 hover:bg-red-600'
                                : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                            title={absentSubjects[subject] ? 'Mark as Present' : 'Mark as Absent'}
                            aria-label={absentSubjects[subject] ? 'Mark as Present' : 'Mark as Absent'}
                          >
                            <svg
                              className={`w-5 h-5 ${absentSubjects[subject] ? 'text-white' : 'text-gray-500'}`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                          </button>
                          <div className="absolute inset-y-0 right-16 flex items-center pointer-events-none">
                            <span className="text-gray-500 text-sm">/{fullMarks[`${examName}`] || 100}</span>
                          </div>
                        </div>
                        {absentSubjects[subject] && (
                          <p className="mt-1 text-xs text-red-600 dark:text-red-400">
                            Student will be marked as absent for this subject
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600 transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : 'Save Changes'}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
