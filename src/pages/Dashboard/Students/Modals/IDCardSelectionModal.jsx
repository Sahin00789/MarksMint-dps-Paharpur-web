import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes, FaSearch, FaCheckSquare, FaSquare, FaPrint, FaUser } from 'react-icons/fa';
import IDCardPrintModal from './IDCardPrintModal';

export default function IDCardSelectionModal({ isOpen, onClose, students = [] }) {
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [selectedClasses, setSelectedClasses] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);

  // Get all unique classes from students
  const allClasses = useMemo(() => {
    const classes = [...new Set(students.map(s => s.class))].sort((a, b) => {
      // Sort order: LKG, UKG, then other classes numerically/alphabetically
      const order = ['LKG', 'UKG'];
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      
      // For other classes, try to sort numerically first, then alphabetically
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      if (!isNaN(aNum) && !isNaN(bNum)) return aNum - bNum;
      return a.localeCompare(b);
    });
    return classes;
  }, [students]);

  // Filter students by selected classes and search term
  const filteredStudents = useMemo(() => {
    return students.filter(s => 
      (selectedClasses.size === 0 || selectedClasses.has(s.class)) &&
      (s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll.toString().includes(searchTerm))
    ).sort((a, b) => {
      // Sort by class first, then by roll
      if (a.class !== b.class) {
        return a.class.localeCompare(b.class);
      }
      return (Number(a.roll) || 0) - (Number(b.roll) || 0);
    });
  }, [students, selectedClasses, searchTerm]);

  const toggleAll = () => {
    if (selectedIds.size === filteredStudents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s._id)));
    }
  };

  const toggleStudent = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleClass = (className) => {
    const next = new Set(selectedClasses);
    if (next.has(className)) next.delete(className);
    else next.add(className);
    setSelectedClasses(next);
  };

  const toggleAllClasses = () => {
    if (selectedClasses.size === allClasses.length) {
      setSelectedClasses(new Set());
    } else {
      setSelectedClasses(new Set(allClasses));
    }
  };

  const selectedStudentsData = useMemo(() => {
    return students.filter(s => selectedIds.has(s._id));
  }, [students, selectedIds]);

  // Get selected class names for display
  const selectedClassNames = useMemo(() => {
    if (selectedClasses.size === 0) return 'All Classes';
    if (selectedClasses.size === 1) return Array.from(selectedClasses)[0];
    return `${selectedClasses.size} Classes`;
  }, [selectedClasses]);

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white dark:bg-gray-900 w-full max-w-5xl h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-8 py-6 border-b dark:border-gray-800 bg-white dark:bg-gray-900 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Select Students</h3>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{selectedClassNames} • {selectedIds.size} selected</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  disabled={selectedIds.size === 0}
                  onClick={() => setShowPrintModal(true)}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all font-bold shadow-lg disabled:opacity-50 disabled:shadow-none"
                >
                  <FaPrint /> Preview Print
                </button>
                <button onClick={onClose} className="p-3 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
                  <FaTimes size={20} />
                </button>
              </div>
            </div>

            {/* Class Toggle Section */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Select Classes</h4>
                <button 
                  onClick={toggleAllClasses}
                  className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all font-bold text-xs text-gray-600 dark:text-gray-400"
                >
                  {selectedClasses.size === allClasses.length ? <FaCheckSquare className="text-indigo-600" /> : <FaSquare />}
                  {selectedClasses.size === allClasses.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {allClasses.map((className) => (
                  <button
                    key={className}
                    onClick={() => toggleClass(className)}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all border-2 ${
                      selectedClasses.has(className)
                        ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 border-indigo-500 shadow-md'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}
                  >
                    {selectedClasses.has(className) ? <FaCheckSquare className="inline mr-2 text-indigo-600" /> : <FaSquare className="inline mr-2" />}
                    {className}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="relative flex-1 group w-full">
                <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search by name or roll..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-none rounded-2xl focus:ring-2 focus:ring-indigo-500 transition-all dark:text-white outline-none"
                />
              </div>
              <button 
                onClick={toggleAll}
                className="flex items-center gap-2 px-5 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-2xl transition-all font-bold text-gray-700 dark:text-gray-300 whitespace-nowrap"
              >
                {selectedIds.size === filteredStudents.length ? <FaCheckSquare className="text-indigo-600" /> : <FaSquare />}
                Select All ({filteredStudents.length})
              </button>
            </div>
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-auto p-6 bg-gray-50 dark:bg-gray-950/40">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredStudents.map((s) => (
                <div 
                  key={s._id}
                  onClick={() => toggleStudent(s._id)}
                  className={`relative p-4 rounded-3xl border-2 transition-all cursor-pointer group ${
                    selectedIds.has(s._id) 
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 shadow-md shadow-indigo-100 dark:shadow-none' 
                    : 'bg-white dark:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 bg-gray-100 dark:bg-gray-700 flex items-center justify-center`}>
                      {s.photoUrl ? (
                        <img src={s.photoUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <FaUser className="text-gray-400" size={24} />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-black text-gray-900 dark:text-white truncate text-sm mb-1">{s.studentName}</h4>
                      <div className="flex gap-2">
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md">Roll {s.roll}</span>
                        <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-md">{s.class}</span>
                      </div>
                    </div>
                    <div className={`transition-transform duration-200 ${selectedIds.has(s._id) ? 'scale-110' : 'scale-100'}`}>
                      {selectedIds.has(s._id) ? <FaCheckSquare className="text-indigo-600 w-6 h-6" /> : <FaSquare className="text-gray-300 dark:text-gray-600 w-6 h-6" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Child Print Modal */}
      <IDCardPrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        students={selectedStudentsData}
        selectedClass={selectedClassNames}
      />
    </>
  );
}
