import React, { useState } from 'react';
import { FiEye, FiDownload, FiPrinter } from 'react-icons/fi';

export default function StudentCard({ 
  student, 
  variant = 'students', 
  onView, 
  onEdit, 
  onEditAttendance, 
  onEditMarks, 
  selectedExam, 
  subjects,
  onPreviewMarksheet,
  onDownloadMarksheet,
  onPrintMarksheet
}) {
  if (!student) return null;
  const {
    studentName,
    roll,
    class: cls,
    section,
    photoUrl,
    attendance,
    marks,
    coscholastic,
  } = student;

  // Determine single primary action
  let primaryAction = null;
  let primaryLabel = '';
  if (variant === 'attendance' && onEditAttendance) {
    primaryAction = () => onEditAttendance?.(student);
    primaryLabel = 'Edit Attendance';
  } else if (variant === 'marks' && onEditMarks) {
    primaryAction = () => onEditMarks?.(student);
    primaryLabel = 'Edit Marks';
  } else if (onEdit) {
    primaryAction = () => onEdit?.(student);
    primaryLabel = 'Edit';
  } else if (onView) {
    primaryAction = () => onView?.(student);
    primaryLabel = 'View';
  }

  // Render marksheet variant
  if (variant === 'marksheet') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{studentName}</h3>
              <div className="flex items-center space-x-4 mt-1">
                <span className="text-sm text-gray-600 dark:text-gray-300">Roll: {roll}</span>
                <span className="text-sm text-gray-600 dark:text-gray-300">Class: {cls}{section ? `-${section}` : ''}</span>
              </div>
            </div>
            <div className="flex space-x-2">
              {onPreviewMarksheet && (
                <button
                  onClick={() => onPreviewMarksheet(student)}
                  className="p-2 text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors"
                  title="Preview Marksheet"
                >
                  <FiEye className="w-5 h-5" />
                </button>
              )}
              {onDownloadMarksheet && (
                <button
                  onClick={() => onDownloadMarksheet(student)}
                  className="p-2 text-gray-600 hover:text-green-600 dark:text-gray-300 dark:hover:text-green-400 transition-colors"
                  title="Download Marksheet"
                >
                  <FiDownload className="w-5 h-5" />
                </button>
              )}
              {onPrintMarksheet && (
                <button
                  onClick={() => onPrintMarksheet(student)}
                  className="p-2 text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                  title="Print Marksheet"
                >
                  <FiPrinter className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
          
          {selectedExam && (
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{selectedExam}</p>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {subjects?.slice(0, 4).map((subject) => (
                  <div key={subject} className="flex justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{subject}</span>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-200">
                      {marks?.[selectedExam]?.[subject] || '-'}
                    </span>
                  </div>
                ))}
                {subjects?.length > 4 && (
                  <div className="col-span-2 text-xs text-indigo-600 dark:text-indigo-400 text-right">
                    +{subjects.length - 4} more subjects
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Original variants
  return (
    <div className="group relative bg-white/80 dark:bg-gray-800/70 backdrop-blur rounded-xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden transition hover:shadow-md">
      <div className="p-4 flex items-center gap-4">
        <img
          src={photoUrl}
          alt={studentName}
          className="h-14 w-14 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
          onError={(e) => { e.currentTarget.src = 'https://via.placeholder.com/56x56?text=No+Photo'; }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{studentName}</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 whitespace-nowrap">Roll: {roll}</span>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{cls}{section ? ` • ${section}` : ''}</p>

          {/* Variant specific info */}
          {variant === 'students' && (
            <div className="mt-1 space-y-0.5">
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Session: {student.session || '—'}</p>
              {student.fatherName && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Father: {student.fatherName}</p>}
              {student.mobileNumber && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Mobile: {student.mobileNumber}</p>}
            </div>
          )}

          {variant === 'attendance' && (
            <div className="mt-1 space-y-0.5">
              <p className="text-xs text-gray-500 dark:text-gray-400">Attendance: {attendance || '—'}</p>
              {student.session && <p className="text-[11px] text-gray-500 dark:text-gray-400">Session: {student.session}</p>}
            </div>
          )}

          {variant === 'marks' && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1.5 rounded-md">
                <span className="text-xs font-medium text-indigo-700 dark:text-indigo-300">
                  {selectedExam || 'No Exam Selected'}
                </span>
               
              </div>
              
              {selectedExam && Array.isArray(subjects) && subjects.length > 0 ? (
                <div className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg border border-gray-100 dark:border-gray-700">
                  <div className="grid grid-cols-2 gap-2">
                    {subjects.slice(0, 6).map((sub) => {
                      const val = (marks && marks[selectedExam] && marks[selectedExam][sub]) ?? '-';
                      const isEmpty = !val || val === '-';
                      return (
                        <div key={sub} className="flex items-center justify-between group">
                          <span className="text-xs text-gray-600 dark:text-gray-300 truncate pr-2">{sub}</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${isEmpty 
                            ? 'bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-300' 
                            : 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-200 shadow-sm border border-gray-100 dark:border-gray-600'}`}>
                            {String(val)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  {subjects.length > 6 && (
                    <div className="mt-2 text-center">
                      <span className="inline-block text-xs text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30">
                        +{subjects.length - 6} more subjects
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-dashed border-gray-200 dark:border-gray-600">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {selectedExam ? 'No marks recorded' : 'Select an exam to view marks'}
                  </p>
                </div>
              )}
            </div>
          )}

          {variant === 'coscholastic' && coscholastic && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">Grades: {Object.values(coscholastic).join(', ')}</p>
          )}
        </div>
      </div>
      {primaryAction && (
        <div className="px-4 pb-3">
          <button
            onClick={primaryAction}
            className="w-full px-3 py-1.5 text-xs font-medium rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center justify-center space-x-1"
          >
            {variant === 'marksheet' && <FiEye className="w-3.5 h-3.5 mr-1" />}
            <span>{primaryLabel}</span>
          </button>
        </div>
      )}
    </div>
  );
}
