import React from 'react';
import { FiX } from 'react-icons/fi';

const EditCoScholasticModal = ({
  isOpen,
  onClose,
  student,
  grades,
  onGradeChange,
  onSave,
  isSaving,
}) => {
  if (!isOpen) return null;

  const categories = [
    { key: 'workEd', label: 'Work Education' },
    { key: 'artEd', label: 'Art Education' },
    { key: 'phyEd', label: 'Health & Physical Education' },
    { key: 'discipline', label: 'Discipline' },
  ];

  const gradeOptions = ['A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'AB'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" onClick={onClose}>
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

        <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
              Edit Co-Scholastic Grades - {student?.studentName}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 dark:text-gray-300 dark:hover:text-gray-200"
              onClick={onClose}
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="mt-4 space-y-6">
            {categories.map((category) => (
              <div key={category.key} className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {category.label}
                </label>
                <div className="flex flex-wrap gap-2">
                  {gradeOptions.map((grade) => {
                    const isSelected = (grades?.[category.key] || '') === grade;
                    return (
                      <button
                        key={grade}
                        type="button"
                        onClick={() => onGradeChange(category.key, isSelected ? '' : grade)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                          isSelected 
                            ? 'bg-teal-600 text-white hover:bg-teal-700' 
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                      >
                        {grade}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-md shadow-sm hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditCoScholasticModal;
