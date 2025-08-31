import React, { useState, useEffect } from 'react';

export default function ClassConfigModalV2({ selectedClass, section, initialData, onSave, onClose }) {
  const [activeTab, setActiveTab] = useState(section || 'exams');
  const [exams, setExams] = useState(initialData?.exams || []);
  const [subjects, setSubjects] = useState(initialData?.subjects || []);
  const [fullMarksByExam, setFullMarksByExam] = useState(() => ({ ...(initialData?.fullMarks || {}) }));
  const [openDays, setOpenDays] = useState(initialData?.openDays ?? '');

  useEffect(() => {
    setActiveTab(section || 'exams');
    setExams(initialData?.exams || [ 'First Summative Evaluation','Second Summative Evaluation', 'Third Summative Evaluation']);
    setSubjects(initialData?.subjects || []);
    setFullMarksByExam({ ...(initialData?.fullMarks || {}) });
    setOpenDays(initialData?.openDays ?? '');
  }, [selectedClass, section, initialData]);

  const addItem = (setter, list) => {
    const value = prompt('Enter value');
    if (!value) return;
    setter([...(list || []), value]);
  };

  const removeItem = (setter, list, index) => {
    const next = [...list];
    next.splice(index, 1);
    setter(next);
  };

  const handleSave = () => {
    const payload = {
      class: selectedClass,
      exams,
      subjects,
      fullMarks: normalizeFullMarksByExam(exams, fullMarksByExam),
      openDays: Number(openDays) || 0,
      section,
    };
    onSave?.(payload);
  };

  return (
    <div className="space-y-4 ">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {selectedClass} • {labelFor(activeTab)}
        </h3>
        <div className="flex gap-2">
          <button onClick={handleSave} className="px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Save</button>
          <button onClick={onClose} className="px-3 py-1.5 text-sm rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100">Close</button>
        </div>
      </div>
      <div className="flex gap-2 mt-2 mb-2">
        {[ 'subjects', 'fullMarks', 'Classes Taken'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs rounded-md border ${activeTab === tab ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-600'}`}
          >
            {labelFor(tab)}
          </button>
        ))}
      </div>

     

      {activeTab === 'subjects' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Manage subject names for {selectedClass}.</p>
          <div className="flex flex-wrap gap-2">
            {(subjects || []).map((name, idx) => (
              <span key={idx} className="inline-flex items-center gap-2 px-2 py-1 rounded-md bg-gray-100 dark:bg-gray-700 text-sm text-gray-800 dark:text-gray-100">
                {name}
                <button onClick={() => removeItem(setSubjects, subjects, idx)} className="text-xs text-red-600">x</button>
              </span>
            ))}
            <button onClick={() => addItem(setSubjects, subjects)} className="px-2 py-1 text-xs rounded-md bg-indigo-600 text-white">Add</button>
          </div>
        </div>
      )}

      {activeTab === 'fullMarks' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Set full marks per exam for {selectedClass}.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(exams || []).map((name, idx) => (
              <label key={idx} className="flex items-center justify-between gap-3 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 p-2 text-sm">
                <span className="text-gray-800 dark:text-gray-100">{name}</span>
                <input
                  type="number"
                  className="w-28 rounded-md ring-1 ring-gray-200 dark:ring-gray-600 bg-white dark:bg-gray-900 p-1.5 text-sm"
                  value={fullMarksByExam?.[name] ?? ''}
                  onChange={(e) => setFullMarksByExam(prev => ({ ...prev, [name]: Number(e.target.value) || '' }))}
                  min={0}
                  placeholder="100"
                />
              </label>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'Classes Taken' && (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Set total Classes Taken ( days ) for the session for {selectedClass}.</p>
          <input
            type="number"
            className="w-40 rounded-md ring-1 ring-gray-200 dark:ring-gray-700 bg-white dark:bg-gray-800 p-2 text-sm"
            value={openDays}
            onChange={(e) => setOpenDays(e.target.value)}
            min={0}
          />
        </div>
      )}
    </div>
  );
}

function labelFor(section) {
  switch (section) {
    case 'exams': return 'Exams';
    case 'subjects': return 'Subjects';
    case 'fullMarks': return 'Exam Full Marks';
    case 'Classes Taken': return 'Classes Taken';
    
  }
}

function serializeFullMarks() { return ''; }

function normalizeFullMarksByExam(exams = [], fm = {}) {
  const out = {};
  (exams || []).forEach((ex) => {
    const val = fm?.[ex];
    if (typeof val === 'number' && !isNaN(val)) out[ex] = val;
  });
  return out;
}
