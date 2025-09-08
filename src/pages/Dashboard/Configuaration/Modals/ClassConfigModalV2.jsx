import React, { useState, useEffect } from 'react';

export default function ClassConfigModalV2({ selectedClass, initialData, onSave, onClose }) {
  const [exams, setExams] = useState(initialData?.exams || [
    'First Summative Evaluation', 
    'Second Summative Evaluation', 
    'Third Summative Evaluation'
  ]);
  
  const [subjects, setSubjects] = useState(initialData?.subjects || []);
  const [fullMarksByExam, setFullMarksByExam] = useState(() => ({
    'First Summative Evaluation': 100,
    'Second Summative Evaluation': 100,
    'Third Summative Evaluation': 100,
    ...(initialData?.fullMarks || {})
  }));
  
  const [openDays, setOpenDays] = useState(initialData?.openDays || 0);
  const [newSubject, setNewSubject] = useState('');

  useEffect(() => {
    setExams(initialData?.exams || [
      'First Summative Evaluation', 
      'Second Summative Evaluation', 
      'Third Summative Evaluation'
    ]);
    setSubjects(initialData?.subjects || []);
    setFullMarksByExam(prev => ({
      'First Summative Evaluation': 100,
      'Second Summative Evaluation': 100,
      'Third Summative Evaluation': 100,
      ...(initialData?.fullMarks || {})
    }));
    setOpenDays(initialData?.openDays || 0);
  }, [selectedClass, initialData]);

  const handleSave = () => {
    const payload = {
      class: selectedClass,
      exams,
      subjects,
      fullMarks: fullMarksByExam,
      openDays: Number(openDays) || 0
    };
    onSave?.(payload);
  };

  const handleFullMarkChange = (exam, value) => {
    setFullMarksByExam(prev => ({
      ...prev,
      [exam]: Number(value) || 0
    }));
  };

  const updateExamName = (index, newName) => {
    const newExams = [...exams];
    const oldName = newExams[index];
    
    // Update the exam name in the exams array
    newExams[index] = newName;
    
    // Update full marks to maintain the same values with the new name
    const newFullMarks = { ...fullMarksByExam };
    if (oldName in newFullMarks) {
      newFullMarks[newName] = newFullMarks[oldName];
      delete newFullMarks[oldName];
    }
    
    setExams(newExams);
    setFullMarksByExam(newFullMarks);
  };

  const addNewExam = () => {
    const newExamName = `Exam ${exams.length + 1}`;
    setExams([...exams, newExamName]);
    setFullMarksByExam(prev => ({
      ...prev,
      [newExamName]: 100
    }));
  };

  const removeExam = (index) => {
    const examToRemove = exams[index];
    const newExams = exams.filter((_, i) => i !== index);
    const newFullMarks = { ...fullMarksByExam };
    delete newFullMarks[examToRemove];
    
    setExams(newExams);
    setFullMarksByExam(newFullMarks);
  };

  const addSubject = () => {
    if (!newSubject.trim()) return;
    setSubjects([...subjects, newSubject.trim()]);
    setNewSubject('');
  };

  const removeSubject = (index) => {
    const newSubjects = [...subjects];
    newSubjects.splice(index, 1);
    setSubjects(newSubjects);
  };

  return (
    <div className="min-w-[32rem] max-w-4xl mx-auto bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 p-6 rounded-xl shadow-xl transition-all duration-300 transform hover:shadow-2xl">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {selectedClass} • Configuration
        </h3>
        <div className="flex gap-2">
          <button 
            onClick={handleSave} 
            className="px-4 py-2 text-sm rounded-md bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg"
          >
            Save Configuration
          </button>
          <button 
            onClick={onClose} 
            className="px-4 py-2 text-sm rounded-md bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 dark:from-gray-700 dark:to-gray-600 dark:hover:from-gray-600 dark:hover:to-gray-500 text-gray-800 dark:text-gray-100 transition-all duration-300 transform hover:scale-105 shadow-md"
          >
            Close
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exams & Full Marks Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-base font-medium text-gray-900 dark:text-white">
              Exams & Full Marks
            </h4>
            <button
              onClick={addNewExam}
              className="px-3 py-1 text-xs rounded-md bg-gradient-to-r from-green-100 to-green-50 text-green-700 dark:from-green-900/30 dark:to-green-800/10 dark:text-green-300 hover:from-green-200 hover:to-green-100 dark:hover:from-green-800/50 dark:hover:to-green-700/30 transition-all duration-300 transform hover:scale-105 shadow-sm"
            >
              + Add Exam
            </button>
          </div>
          
          <div className="space-y-3">
            {exams.map((exam, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={exam}
                  onChange={(e) => updateExamName(index, e.target.value)}
                  className="min-w-0 flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 truncate"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={fullMarksByExam[exam] || ''}
                    onChange={(e) => handleFullMarkChange(exam, e.target.value)}
                    className="w-24 px-2 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-center focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                    min="1"
                    step="1"
                  />
                  <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">marks</span>
                  <button
                    onClick={() => removeExam(index)}
                    className="p-1 text-gray-400 hover:text-red-500 transition-all duration-200 transform hover:scale-110"
                    title="Remove exam"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Subjects Section */}
        <div className="space-y-4">
          <h4 className="text-base font-medium text-gray-900 dark:text-white">
            Subjects
          </h4>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSubject()}
              placeholder="Enter subject name"
              className="flex-1 px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
            <button
              onClick={addSubject}
              className="px-4 py-2 text-sm rounded-md bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg whitespace-nowrap"
            >
              Add Subject
            </button>
          </div>
          
          <div className="mt-3">
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Subjects ({subjects.length})
            </h5>
            {subjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {subjects.map((subject, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-white dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-650 transition-colors duration-200 transform hover:-translate-y-0.5 hover:shadow-sm">
                    <span className="text-sm text-gray-800 dark:text-gray-200 truncate">{subject}</span>
                    <button
                      onClick={() => removeSubject(idx)}
                      className="text-gray-400 hover:text-red-500 transition-all duration-200 transform hover:scale-110"
                      aria-label={`Remove ${subject}`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">No subjects added yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Classes Taken */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-base font-medium text-gray-900 dark:text-white mb-3">
          Classes Information
        </h4>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label htmlFor="openDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Number of Classes Taken
            </label>
            <input
              type="number"
              id="openDays"
              value={openDays}
              onChange={(e) => setOpenDays(Number(e.target.value) || 0)}
              min="0"
              step="1"
              className="w-full px-3 py-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
