import React, { useEffect, useState, useMemo } from 'react';
import { FiUpload, FiAward } from 'react-icons/fi';
import ClassSelectorCard from '../common/ClassSelectorCard';
import PrintButton from '../common/PrintButton';
import ImportGradesModal from '../Modals/CoScholastic/ImportGradesModal';
import { getStudentsByClass } from '../../services/students';

export default function CoScholasticPanel() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState('');

  // Available terms
  const terms = [
    { id: 'term1', name: 'Term 1' },
    { id: 'term2', name: 'Term 2' },
  ];

  // Prepare data for printing
  const printData = useMemo(() => {
    if (!students.length) return [];

    return students.map(student => ({
      _id: student._id,
      studentName: student.studentName,
      roll: student.roll,
      class: student.class,
      section: student.section || '',
      grades: student.coscholastic
    }));
  }, [students]);

  // Fetch students when class changes
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) return;

      setLoading(true);
      setError('');

      try {
        const data = await getStudentsByClass(selectedClass);
        // Ensure each student has the coscholastic object with default values
        const studentsWithDefaults = Array.isArray(data) ? data.map(student => ({
          ...student,
          coscholastic: {
            workEducation: '-',
            artEducation: '-',
            healthAndPhysicalEducation: '-',
            discipline: '-',
            values: '-',
            ...student.coscholastic
          }
        })) : [];
        setStudents(studentsWithDefaults);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  // Handle co-scholastic grades import
  const handleGradesImport = async (importData) => {
    if (!selectedClass) {
      setImportError('Please select a class');
      return false;
    }

    setImporting(true);
    setImportError('');

    try {
      // Transform the imported data to match the database schema
      const gradesToUpdate = importData.map(studentData => ({
        rollNumber: studentData['Roll Number'],
        grades: {
          workEd: studentData['Work Education'] || '-',
          artEd: studentData['Art Education'] || '-',
          phyEd: studentData['Health & Physical Education'] || '-',
          discipline: studentData['Discipline'] || '-',
          values: studentData['Values'] || '-'
        }
      }));

      // Make API call to update the grades
      const response = await fetch('/api/students/bulk-update/coscholastic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          class: selectedClass,
          grades: gradesToUpdate
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update co-scholastic grades');
      }

      // Refresh the student list
      const data = await getStudentsByClass(selectedClass);
      // Ensure each student has the coscholastic object with default values
      const studentsWithDefaults = Array.isArray(data) ? data.map(student => ({
        ...student,
        coscholastic: {
          workEducation: '-',
          artEducation: '-',
          healthAndPhysicalEducation: '-',
          discipline: '-',
          values: '-',
          ...student.coscholastic
        }
      })) : [];
      setStudents(studentsWithDefaults);

      return true;
    } catch (err) {
      console.error('Error importing co-scholastic grades:', err);
      setImportError(err.message || 'Failed to import co-scholastic grades');
      return false;
    } finally {
      setImporting(false);
    }
  };

  // Function to render grade badge
  const renderGradeBadge = (grade) => {
    const getBadgeColor = (grade) => {
      if (!grade || grade === '-') return 'bg-gray-100 text-gray-800';
      if (grade.toUpperCase() === 'A+') return 'bg-green-100 text-green-800';
      if (['A', 'A-'].includes(grade.toUpperCase())) return 'bg-blue-100 text-blue-800';
      if (['B+', 'B', 'B-'].includes(grade.toUpperCase())) return 'bg-yellow-100 text-yellow-800';
      if (['C+', 'C', 'C-'].includes(grade.toUpperCase())) return 'bg-orange-100 text-orange-800';
      return 'bg-red-100 text-red-800';
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeColor(grade)}`}>
        {grade || '-'}
      </span>
    );
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          Co-Scholastic Grades {selectedClass && `- ${selectedClass}`}
        </h2>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            disabled={!selectedClass}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
              !selectedClass 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            }`}
            title={!selectedClass ? 'Please select a class' : 'Import Grades'}
          >
            <FiUpload className="-ml-1 mr-2 h-4 w-4" />
            Import Grades
          </button>
          <PrintButton
            data={printData}
            fileName={`co_scholastic_grades_${selectedClass || ''}_${new Date().toISOString().split('T')[0]}`}
            title={`Co-Scholastic Grades - ${selectedClass || ''}`}
            disabled={!selectedClass || students.length === 0}
          />
        </div>
      </div>

      <ClassSelectorCard
        selected={selectedClass}
        onSelect={setSelectedClass}
      />

      {importError && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p>{importError}</p>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      ) : !selectedClass ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <FiAward className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No class selected</h3>
          <p className="mt-1 text-sm text-gray-500">
            Select a class to view co-scholastic grades
          </p>
        </div>
      ) : students.length === 0 ? (
        <div className="text-center py-10 bg-gray-50 rounded-lg">
          <FiAward className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            No students are registered in {selectedClass}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {students.map((student) => (
            <div key={student._id} className="bg-white rounded-lg shadow p-4 border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">{student.studentName}</h3>
                  <p className="text-sm text-gray-500">Roll No: {student.roll}</p>
                </div>
              </div>
              
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Work Education</span>
                  {renderGradeBadge(student.coscholastic?.workEducation)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Art Education</span>
                  {renderGradeBadge(student.coscholastic?.artEducation)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Physical Education</span>
                  {renderGradeBadge(student.coscholastic?.healthAndPhysicalEducation)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Discipline</span>
                  {renderGradeBadge(student.coscholastic?.discipline)}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Values</span>
                  {renderGradeBadge(student.coscholastic?.values)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Co-Scholastic Import Modal */}
      <ImportGradesModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleGradesImport}
        selectedClass={selectedClass}
      />
    </div>
  );
}
