import React from 'react';
import ModalPortal from '../../common/ModalPortal';

export default function EditAttendanceModal({
  isOpen,
  onClose,
  student,
  presentDays,
  setPresentDays,
  onSubmit,
  submitting
}) {
  if (!isOpen) return null;

  return (
    <ModalPortal onClose={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">
          {student 
            ? `Update Attendance for ${student.studentName}`
            : 'Mark Attendance for All Students'
          }
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Present Days
            </label>
            <input
              type="number"
              value={presentDays}
              onChange={(e) => setPresentDays(e.target.value)}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Number of days present"
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSubmit}
              disabled={!presentDays || submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
