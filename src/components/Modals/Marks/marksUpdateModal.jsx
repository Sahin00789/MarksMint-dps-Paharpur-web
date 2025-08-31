import React, { useState, useEffect } from 'react';
import ModalPortal from '../../common/ModalPortal';

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

  // Initialize marks when modal opens or student changes
  useEffect(() => {
    if (isOpen && student) {
      setMarks(initialMarks || {});
    }
  }, [isOpen, student, initialMarks]);

  const handleMarksChange = (subject, value) => {
    setMarks(prev => ({
      ...prev,
      [subject]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!onSubmit) return;
    
    try {
      setIsSubmitting(true);
      await onSubmit(marks);
      onClose();
    } catch (error) {
      console.error('Error saving marks:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !student) return null;

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="absolute inset-0 bg-black/30 backdrop-blur-sm" 
          onClick={onClose}
          aria-hidden="true"
        />
        
        <div className="relative z-10 w-full max-w-xl bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Edit Marks - {examName}
              </h3>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                aria-label="Close"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Student: <span className="font-medium">{student.studentName}</span> (Roll: {student.roll})
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {subjects.map((subject) => (
                  <div key={subject} className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      {subject}
                    </label>
                    <input
                      type="text"
                      value={marks[subject] || ''}
                      onChange={(e) => handleMarksChange(subject, e.target.value)}
                      className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="e.g., 78 or AB"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
