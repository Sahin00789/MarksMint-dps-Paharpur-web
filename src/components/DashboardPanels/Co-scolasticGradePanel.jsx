import React, { useEffect, useState } from "react";
import ClassSelecorCard from '../common/ClassSelectorCard';
import StudentCard from '../common/StudentCard';
import { getStudentsByClass } from '../../services/students';
import { FaFileExcel } from 'react-icons/fa';
import ExcelImportExportButton from '../common/ExcelImportExportButton';

export default function CoScolasticGradePanel() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  // Initialize from persisted selection (do not persist changes here)
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('ui.selectedClass') : null;
    if (saved) setSelectedClass(saved);
  }, []);

  const handleImportData = (importedData) => {
    try {
      const formattedData = importedData.map(item => ({
        ...item,
        // Add any necessary transformations here
      }));
      setStudents(formattedData);
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClass) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentsByClass(selectedClass);
        setStudents(Array.isArray(data) ? data : []);
      } catch (e) {
        setError('Failed to load students');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedClass]);


  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="w-full flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Co-Scholastic Grades</h2>
        <ClassSelecorCard onSelect={setSelectedClass} selected={selectedClass} />
      </div>

      {/* Toolbar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 bg-white/80 dark:bg-gray-800/70 backdrop-blur p-3 rounded-lg ring-1 ring-gray-200 dark:ring-gray-700">
        <div className="flex gap-2">
          <button className="bg-indigo-600 text-white px-3 py-2 rounded-md text-sm hover:bg-indigo-700">Add Area</button>
          <ExcelImportExportButton
            data={students}
            onImport={handleImportData}
            buttonClassName="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            modalTitle="Co-scholastic Grades - Import/Export"
          >
            <FaFileExcel className="mr-1" /> Excel
          </ExcelImportExportButton>
        </div>
        <div className="flex gap-2">
          <button className="bg-gray-900/80 dark:bg-gray-700 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-900 dark:hover:bg-gray-600">Export</button>
        </div>
      </div>

      {/* Content */}
      {!selectedClass && (
        <p className="text-sm text-gray-600 dark:text-gray-300">Select a class to manage co-scholastic grades.</p>
      )}
      {selectedClass && loading && (
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading students…</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {selectedClass && !loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((stu) => (
            <StudentCard key={stu._id || `${stu.class}_${stu.roll}`} student={stu} variant="coscholastic" onView={() => {}} onEdit={() => {}} />
          ))}
          {students.length === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-300">No students found for {selectedClass}.</p>
          )}
        </div>
      )}
      
    </div>
  );
}
