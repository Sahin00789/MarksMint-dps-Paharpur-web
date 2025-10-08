import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import { FiX, FiCheck, FiMinus, FiEdit2, FiSave } from 'react-icons/fi';

export default function MarksUpdateModalV2({ 
  isOpen, 
  onClose, 
  student, 
  examName, 
  subjects: propSubjects = [],
  examMethods: propExamMethods = [],
  examConfig,
  initialMarks = {},
  onSubmit 
}) {
  // Use subjects from examConfig if available, otherwise use propSubjects
  const subjects = examConfig?.subjects || propSubjects;
  
  // Calculate examMethods from examConfig if available
  const examMethods = useMemo(() => {
    if (examConfig?.subjectMarksConfig) {
      const methods = new Set();
      Object.values(examConfig.subjectMarksConfig).forEach(subjectConfig => {
        if (subjectConfig && typeof subjectConfig === 'object') {
          Object.keys(subjectConfig).forEach(key => {
            if (key !== 'SubjectTotal') {
              methods.add(key);
            }
          });
        }
      });
      return Array.from(methods).map(method => ({
        type: method,
        marks: examConfig.fullMarks?.[method] || 0
      }));
    }
    return propExamMethods;
  }, [examConfig, propExamMethods]);
  const [marks, setMarks] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [absentSubjects, setAbsentSubjects] = useState({});
  const [absentMethods, setAbsentMethods] = useState({});
  const [methodMarks, setMethodMarks] = useState({});
  
  // Calculate total full marks for the exam
  const totalFullMarks = useMemo(() => {
    return examMethods.reduce((total, method) => {
      return total + (parseInt(method.marks) || 0);
    }, 0);
  }, [examMethods]);

  // Initialize marks when modal opens or student changes
  useEffect(() => {
    if (isOpen && student) {
      console.log('Initial marks:', initialMarks);
      console.log('Exam methods:', examMethods);
      console.log('Subjects:', subjects);
      
      const initialAbsentStatus = {};
      const initialAbsentMethods = {};
      const initialMethodMarks = {};

      // Initialize structure for all subjects and methods
      subjects.forEach(subject => {
        const subjectMarks = initialMarks[subject];
        
        // Initialize method marks and absence status for this subject
        initialMethodMarks[subject] = {};
        initialAbsentMethods[subject] = {};
        
        // Check if the entire subject is marked as absent
        const isSubjectAbsent = subjectMarks === 'AB' || subjectMarks === '';
        initialAbsentStatus[subject] = isSubjectAbsent;

        examMethods.forEach(method => {
          const methodType = method.type;
          let methodMark = '';
          let isMethodAbsent = isSubjectAbsent; // Default to subject's absent status

          if (subjectMarks && typeof subjectMarks === 'object') {
            // Check for method mark in different possible formats
            if (subjectMarks[methodType] !== undefined) {
              methodMark = subjectMarks[methodType];
              isMethodAbsent = methodMark === 'AB' || methodMark === '';
            } else if (subjectMarks[`${methodType}Marks`] !== undefined) {
              methodMark = subjectMarks[`${methodType}Marks`];
              isMethodAbsent = methodMark === 'AB' || methodMark === '';
            } else if (subjectMarks[`${methodType.toLowerCase()}`] !== undefined) {
              methodMark = subjectMarks[`${methodType.toLowerCase()}`];
              isMethodAbsent = methodMark === 'AB' || methodMark === '';
            }
          } else if (subjectMarks === 'AB') {
            methodMark = 'AB';
            isMethodAbsent = true;
          }

          // Convert to string for the input field
          methodMark = methodMark !== undefined && methodMark !== null ? String(methodMark) : '';
          
          initialMethodMarks[subject][methodType] = methodMark;
          initialAbsentMethods[subject][methodType] = isMethodAbsent;
        });
      });

      setAbsentSubjects(initialAbsentStatus);
      setAbsentMethods(initialAbsentMethods);
      setMethodMarks(initialMethodMarks);
    }
  }, [isOpen, student, subjects, examMethods, initialMarks]);

  const handleMethodMarkChange = (subject, method, value) => {
    // If marking as absent
    if (value === 'AB') {
      setMethodMarks(prev => ({
        ...prev,
        [subject]: {
          ...(prev[subject] || {}),
          [method]: 'AB'
        }
      }));
      
      setAbsentMethods(prev => ({
        ...prev,
        [subject]: {
          ...(prev[subject] || {}),
          [method]: true
        }
      }));
    } 
    // If entering a mark
    else {
      // Allow only numbers and decimal point
      const numericValue = value.replace(/[^0-9.]/g, '');
      
      // If it's a number, parse it to handle cases like '10.5' properly
      const parsedValue = numericValue === '' ? '' : 
                         numericValue.includes('.') ? 
                         parseFloat(numericValue).toString() : 
                         numericValue;
      
      setMethodMarks(prev => ({
        ...prev,
        [subject]: {
          ...(prev[subject] || {}),
          [method]: parsedValue
        }
      }));
      
      setAbsentMethods(prev => ({
        ...prev,
        [subject]: {
          ...(prev[subject] || {}),
          [method]: false
        }
      }));
      
      // If marking a method as present, ensure subject is also marked as present
      if (absentSubjects[subject]) {
        setAbsentSubjects(prev => ({
          ...prev,
          [subject]: false
        }));
      }
    }
  };

  const toggleAbsentStatus = (subject) => {
    const newAbsentStatus = !absentSubjects[subject];
    
    setAbsentSubjects(prev => ({
      ...prev,
      [subject]: newAbsentStatus
    }));
    
    // Update method marks and absent status
    const updatedMethodMarks = { ...methodMarks };
    const updatedAbsentMethods = { ...absentMethods };
    
    examMethods.forEach(method => {
      const methodType = method.type;
      
      if (!updatedMethodMarks[subject]) updatedMethodMarks[subject] = {};
      if (!updatedAbsentMethods[subject]) updatedAbsentMethods[subject] = {};
      
      if (newAbsentStatus) {
        // Mark all methods as absent
        updatedMethodMarks[subject][methodType] = 'AB';
        updatedAbsentMethods[subject][methodType] = true;
      } else {
        // Clear method marks when unmarking absent
        updatedMethodMarks[subject][methodType] = '';
        updatedAbsentMethods[subject][methodType] = false;
      }
    });
    
    setMethodMarks(updatedMethodMarks);
    setAbsentMethods(updatedAbsentMethods);
  };
  
  const toggleMethodAbsentStatus = (subject, method) => {
    const isAbsent = absentMethods[subject]?.[method];
    
    setAbsentMethods(prev => ({
      ...prev,
      [subject]: {
        ...(prev[subject] || {}),
        [method]: !isAbsent
      }
    }));
    setMethodMarks(prev => ({
      ...prev,
      [subject]: {
        ...prev[subject],
        [method]: isAbsent ? '' : 'AB'
      }
    }));
  };

  // Calculate total marks for a subject
  const calculateTotalMarks = (subject) => {
    // If subject is marked as absent, return AB
    if (absentSubjects[subject]) return 'AB';
    
    let total = 0;
    let hasMarks = false;
    let allMethodsAbsent = true;
    
    // Calculate total from all methods
    examMethods.forEach(method => {
      const methodType = method.type;
      const methodMark = methodMarks[subject]?.[methodType];
      
      // If method is absent, skip it
      if (absentMethods[subject]?.[methodType] || methodMark === 'AB') {
        return;
      }
      
      // If we have a valid number, add to total
      const numMark = Number(methodMark);
      if (!isNaN(numMark) && methodMark !== '') {
        total += numMark;
        hasMarks = true;
        allMethodsAbsent = false;
      }
    });
    
    // If all methods are absent or have no marks, return AB
    if ((allMethodsAbsent || !hasMarks) && examMethods.length > 0) {
      return 'AB';
    }
    
    return hasMarks ? total.toString() : '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const marksToSubmit = {};
    let hasAtLeastOneMark = false;

    subjects.forEach(subject => {
      // If subject is marked as absent
      if (absentSubjects[subject]) {
        marksToSubmit[subject] = 'AB';
        hasAtLeastOneMark = true;
      } 
      // Otherwise check individual methods
      else {
        const subjectMarks = {};
        let hasSubjectMarks = false;
        
        // Process each method for the subject
        examMethods.forEach(method => {
          const methodType = method.type;
          const methodMark = methodMarks[subject]?.[methodType];
          
          // Only include if there's a mark or it's marked as absent
          if (methodMark && methodMark !== '') {
            subjectMarks[methodType] = methodMark;
            hasSubjectMarks = true;
          } else if (absentMethods[subject]?.[methodType]) {
            subjectMarks[methodType] = 'AB';
            hasSubjectMarks = true;
          }
        });
        
        // If there are any marks for this subject, add to submission
        if (hasSubjectMarks) {
          marksToSubmit[subject] = subjectMarks;
          hasAtLeastOneMark = true;
        }
      }
    });

    if (!hasAtLeastOneMark) {
      toast.warning('Please enter marks or mark as absent for at least one subject');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSubmit(marksToSubmit);
      toast.success('Marks updated successfully');
      onClose();
    } catch (error) {
      console.error('Error updating marks:', error);
      toast.error(error.response?.data?.message || 'Failed to update marks');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.2 }
    }
  };

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      y: 50,
      scale: 0.98
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        damping: 25,
        stiffness: 350,
        when: 'beforeChildren',
        staggerChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      y: 20,
      scale: 0.98,
      transition: { duration: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  console.log('Rendering with methodMarks:', methodMarks);
  console.log('Exam methods:', examMethods);
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          initial="hidden"
          animate="visible"
          exit="hidden"
          variants={backdropVariants}
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div 
            variants={modalVariants}
            className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-3 mb-2">
                  <FiEdit2 className="text-blue-500 flex-shrink-0" size={24} />
                  Update Marks
                </h2>
                {student && (
                  <div className="flex flex-wrap items-center gap-2 text-base">
                    <span className="font-semibold text-gray-800 dark:text-gray-100">
                      {student.studentName || student.name || 'N/A'}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                      Roll: {student.roll || student.rollNo || student.rollNumber || 'N/A'}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span className="text-indigo-600 dark:text-indigo-400 font-semibold">{examName || 'Exam'}</span>
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-full hover:bg-gray-200/50 dark:hover:bg-gray-700/50 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {subjects.map((subject, index) => {
                const isAbsent = absentSubjects[subject];
                const totalMarks = calculateTotalMarks(subject);
                
                return (
                  <motion.div 
                    key={subject}
                    variants={itemVariants}
                    className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border ${
                      isAbsent 
                        ? 'border-red-200 dark:border-red-900/50 bg-red-50/30 dark:bg-red-900/5' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-900/50'
                    } overflow-hidden transition-all duration-200`}
                    whileHover={{ scale: 1.005 }}
                  >
                    {/* Subject Header */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center">
                      <div className="flex items-center">
                        <span className={`w-2.5 h-2.5 rounded-full mr-3 ${
                          (Number(totalMarks) || 0) >= (totalFullMarks * 0.8) 
                            ? 'bg-green-500' 
                            : (Number(totalMarks) || 0) >= (totalFullMarks * 0.4)
                              ? 'bg-amber-400'
                              : 'bg-red-400'
                        }`}></span>
                        <h3 className="font-semibold text-gray-800 dark:text-white">
                          {subject}
                        </h3>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Total: <span className="font-medium text-gray-700 dark:text-gray-200">
                            {totalMarks || '--'}
                            <span className="text-gray-400">/{totalFullMarks}</span>
                          </span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Evaluation Methods */}
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {console.log(`Rendering methods for ${subject}:`, methodMarks[subject])}
                      {examMethods.map((method) => {
                        const methodType = method.type;
                        const methodMark = methodMarks[subject]?.[methodType] || '';
                        const isMethodAbsent = absentMethods[subject]?.[methodType];
                        
                        console.log(`Method ${methodType} for ${subject}:`, {
                          methodMark,
                          isMethodAbsent,
                          subjectMarks: initialMarks[subject]
                        });
                        
                        return (
                          <div 
                            key={methodType}
                            className={`p-3 rounded-lg border ${
                              isAbsent || isMethodAbsent 
                                ? 'bg-gray-50/50 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700' 
                                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-200 dark:hover:border-blue-800/50'
                            } transition-colors`}
                          >
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {methodType}
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Max: {method.marks || '0'}
                              </span>
                            </div>
                            
                            <div className="relative">
                              <input
                                type="text"
                                value={isMethodAbsent ? 'AB' : methodMark}
                                onChange={(e) => handleMethodMarkChange(subject, methodType, e.target.value)}
                                disabled={isMethodAbsent || isSubmitting}
                                className={`w-full px-3 py-2 text-sm border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                                  isMethodAbsent
                                    ? 'bg-red-50/50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800/50' 
                                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                                } text-center font-medium`}
                                placeholder={isMethodAbsent ? 'AB' : '0'}
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleMethodAbsentStatus(subject, methodType);
                                }}
                                disabled={isSubmitting}
                                className={`absolute right-2 top-1/2 transform -translate-y-1/2 p-1 rounded-full text-xs transition-colors ${
                                  isMethodAbsent
                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-800/50'
                                    : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                                title={isMethodAbsent ? 'Mark as present' : 'Mark as absent'}
                              >
                                {isMethodAbsent ? '✓' : <FiMinus className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                            
                            {isMethodAbsent && (
                              <div className="mt-1 flex items-center text-xs text-red-600 dark:text-red-400">
                                <FiMinus className="w-3 h-3 mr-1" />
                                Absent for {methodType}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {isAbsent && (
                      <div className="px-4 py-2 bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-300 text-sm border-t border-red-100 dark:border-red-900/20">
                        Student is marked as absent for this subject. All evaluation methods are disabled.
                      </div>
                    )}
                  </motion.div>
                );
              })}
              
              {subjects.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  No subjects available for this exam.
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/80 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {Object.values(absentSubjects).filter(Boolean).length > 0 && (
                  <div className="group relative inline-flex items-center">
                    <span className="inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 cursor-help">
                      {Object.values(absentSubjects).filter(Boolean).length}
                    </span>
                    <div className="absolute z-10 hidden group-hover:block left-full ml-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 whitespace-nowrap">
                      {Object.values(absentSubjects).filter(Boolean).length} subject(s) marked as absent
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <motion.button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-150"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 border border-transparent rounded-lg shadow-sm hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 flex items-center transition-all duration-150"
                  disabled={isSubmitting}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <FiSave className="mr-2 w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
