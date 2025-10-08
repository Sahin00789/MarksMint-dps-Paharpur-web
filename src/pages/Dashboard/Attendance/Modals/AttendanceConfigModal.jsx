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

  useEffect(() => {
    if (isOpen) {
      setConfig(initialConfig);
    }
  }, [isOpen, initialConfig]);

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
    const { name, value } = e.target;
    setConfig(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

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
                      type='number'
                        id="schoolWorkingDays"
                        name="schoolWorkingDays"
                        max="366"
                        value={config.schoolWorkingDays}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                        required
                      />
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <label
                        htmlFor="holidays"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Number of Holidays
                      </label>
                      <input
                      type='number'
                        id="holidays"
                        name="holidays"
                        max="366"
                        value={config.holidays}
                        onChange={handleInputChange}
                        className="block w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                        required
                      />
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
