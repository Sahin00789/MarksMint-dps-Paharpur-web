import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

const AttendanceConfigModal = ({
  isOpen,
  onClose,
  selectedClass,
  onSave,
  initialConfig = {
    schoolWorkingDays: 0,
    holidays: 0,
    academicYear: '2024-2025'
  }
}) => {
  const [config, setConfig] = useState(initialConfig);
  const [isSaving, setIsSaving] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfig(initialConfig);
      // Set input value to empty string if 0, otherwise show the actual value
      setInputValue(initialConfig.schoolWorkingDays > 0 ? String(initialConfig.schoolWorkingDays) : '');
      setValidationError('');
    }
  }, [isOpen, initialConfig]);

  // Leap year detection
  const isLeapYear = (year) => {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
  };

  // Get current year for calculation (session year)
  const getCurrentYear = () => {
    return new Date().getFullYear();
  };

  // Auto-calculate holidays when working days change
  useEffect(() => {
    const year = getCurrentYear(); // Use current year instead of academic year
    const totalDays = isLeapYear(year) ? 366 : 365;
    const calculatedHolidays = totalDays - (config.schoolWorkingDays || 0);
    
    setConfig(prev => ({
      ...prev,
      holidays: Math.max(0, calculatedHolidays)
    }));
  }, [config.schoolWorkingDays]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClass) {
      toast.warning('Please select a class first');
      return;
    }

    try {
      setIsSaving(true);
      await onSave(config);
      onClose();
    } catch (error) {
      console.error('Error saving attendance config:', error);
      toast.error('Failed to save attendance configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { value } = e.target;
    setInputValue(value);
    
    // Validate input
    if (value === '') {
      setValidationError('');
      setConfig(prev => ({
        ...prev,
        schoolWorkingDays: 0
      }));
      return;
    }
    
    // Check if input is a valid number
    if (!/^\d+$/.test(value)) {
      setValidationError('Please enter a valid number');
      return;
    }
    
    const numValue = parseInt(value, 10);
    
    // Check if number is within valid range
    if (numValue < 0 || numValue > 366) {
      setValidationError('Working days must be between 0 and 366');
      return;
    }
    
    // Valid input
    setValidationError('');
    setConfig(prev => ({
      ...prev,
      schoolWorkingDays: numValue
    }));
  };

  // Calculate display values
  const year = getCurrentYear();
  const totalDays = isLeapYear(year) ? 366 : 365;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="config-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <motion.div
                key="config-modal-content"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  transition: {
                    type: "spring",
                    damping: 25,
                    stiffness: 500,
                    mass: 0.5
                  }
                }}
                exit={{ 
                  opacity: 0, 
                  y: 20,
                  transition: {
                    duration: 0.15,
                    ease: [0.4, 0, 1, 1]
                  }
                }}
                className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0,
                      transition: { delay: 0.05 }
                    }}
                    className="border-b border-gray-200 dark:border-gray-700 pb-4"
                  >
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Attendance Configuration
                    </h2>
                    {selectedClass && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Class: {selectedClass}
                      </p>
                    )}
                  </motion.div>

                  <form onSubmit={handleSubmit} className="space-y-5">
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <label
                        htmlFor="schoolWorkingDays"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        School Working Days (per year)
                      </label>
                      <input
                        type='text'
                        id="schoolWorkingDays"
                        name="schoolWorkingDays"
                        placeholder="Enter working days"
                        value={inputValue}
                        onChange={handleInputChange}
                        className={`block w-full rounded-lg border ${
                          validationError 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' 
                            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                        } bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2.5 text-sm shadow-sm focus:ring-2 transition-all duration-200 outline-none`}
                        required
                      />
                      {validationError && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                          {validationError}
                        </p>
                      )}
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <label
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Holidays (Auto-calculated)
                      </label>
                      <div className="block w-full rounded-lg border border-gray-300 bg-gray-50 dark:bg-gray-700/50 dark:border-gray-600 px-4 py-2.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 dark:text-white font-semibold">
                            {config.holidays} days
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {totalDays} - {config.schoolWorkingDays} = {config.holidays}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Based on {totalDays} days in year {year} {isLeapYear(year) ? '(Leap Year)' : ''}
                        </p>
                      </div>
                    </motion.div>

                    <motion.div 
                      className="mt-6 flex justify-end space-x-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <motion.button
                        type="button"
                        whileHover={{ backgroundColor: 'rgba(0, 0, 0, 0.04)' }}
                        whileTap={{ backgroundColor: 'rgba(0, 0, 0, 0.08)' }}
                        transition={{ duration: 0.1, ease: 'easeOut' }}
                        onClick={onClose}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        type="submit"
                        whileHover={{ 
                          backgroundColor: '#1d4ed8',
                          transition: { duration: 0.1 }
                        }}
                        whileTap={{ 
                          backgroundColor: '#1e40af',
                          scale: 0.98
                        }}
                        transition={{ 
                          backgroundColor: { duration: 0.1 },
                          scale: { duration: 0.1 }
                        }}
                        disabled={isSaving}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </span>
                        ) : 'Save Configuration'}
                      </motion.button>
                    </motion.div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AttendanceConfigModal;
