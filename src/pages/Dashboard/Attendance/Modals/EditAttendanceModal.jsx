import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function EditAttendanceModal({
  isOpen,
  onClose,
  student,
  presentDays: initialPresentDays,
  totalDays,
  onSave,
  submitting
}) {
  const [presentDays, setPresentDays] = useState(initialPresentDays);
  
  // Update local state when prop changes
  useEffect(() => {
    setPresentDays(initialPresentDays);
  }, [initialPresentDays]);
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!student) return;
    
    // Convert presentDays to a number
    const daysPresent = parseInt(presentDays, 10) || 0;
    
    // Call onSave with the updated student data
    onSave({
      ...student,
      attendance: daysPresent,
      attendancePercentage: totalDays > 0 ? Math.round((daysPresent / totalDays) * 100) : 0
    });
  };
  // Handle escape key press to close modal
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="modal-backdrop"
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
                key="modal-content"
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
                      Update Attendance
                    </h2>
                    {student && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {student.studentName}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Class: {student.class} | Roll: {student.roll}
                        </p>
                      </div>
                    )}
                  </motion.div>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label 
                        htmlFor="present-days" 
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                      >
                        Present Days
                      </label>
                      <input
                        type='number'
                        id="present-days"
                        max="366"
                        value={presentDays}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || (parseInt(value, 10) <= 366)) {
                            setPresentDays(value);
                          }
                        }}
                        className="block w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white px-4 py-2.5 text-sm shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 outline-none"
                        placeholder="Enter present days"
                        autoFocus
                      />
                    </div>
                    
                    {totalDays > 0 && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500 dark:text-gray-400">Total working days:</span>
                          <span className="font-medium text-gray-700 dark:text-gray-200">{totalDays}</span>
                        </div>
                        
                        {presentDays && !isNaN(parseInt(presentDays)) && (
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500 dark:text-gray-400">Attendance:</span>
                              <span className="font-medium text-blue-600 dark:text-blue-400">
                                {Math.round((parseInt(presentDays) / totalDays) * 100)}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <motion.div 
                                className="h-full bg-blue-500 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ 
                                  width: `${Math.min(100, (parseInt(presentDays) / totalDays) * 100)}%`
                                }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <motion.button
                        type="button"
                        onClick={onClose}
                        initial={{ backgroundColor: '#fef2f2' }} // Light red initial background
                        whileHover={{ 
                          backgroundColor: '#fecaca', // Slightly darker red on hover
                          transition: { duration: 0.1 }
                        }}
                        whileTap={{ 
                          scale: 0.98,
                          backgroundColor: '#fca5a5' // Even darker red on tap
                        }}
                        className="px-4 py-2 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-red-900/30 dark:border-red-800 dark:text-red-200"
                        disabled={submitting}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        whileHover={{ 
                          backgroundColor: '#1d4ed8'
                        }}
                        whileTap={{ 
                          backgroundColor: '#1e40af',
                          scale: 0.98
                        }}
                        transition={{ 
                          backgroundColor: { duration: 0.1 },
                          scale: { duration: 0.1 }
                        }}
                        type="submit"
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!presentDays || submitting}
                      >
                        {submitting ? (
                          <span className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Updating...
                          </span>
                        ) : 'Update'}
                      </motion.button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
