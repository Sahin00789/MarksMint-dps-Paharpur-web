import React, { useState, useEffect, useCallback } from 'react';
import ExamDependentClassSelectorCard from '@/components/common/ExamDependentClassSelectorCard';
import { getStudentsByClass, bulkUpdateCoScholastic } from '@/services/students';
import { toast } from 'react-toastify';
import { FiEdit2, FiUpload, FiDownload } from 'react-icons/fi';
import EditCoScholasticModal from './Modals/EditCoScholasticModal';
import ExcelImportModalForCoScolastic from './Modals/ExcelImportModalForCo-scolastic';

const CoScholasticGradesPanel = () => {
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editedGrades, setEditedGrades] = useState({});
  const [error, setError] = useState('');

  // Co-scholastic categories and their display names
  const categories = [
    { key: 'workEd', label: 'Work Education', icon: '🛠️' },
    { key: 'artEd', label: 'Art Education', icon: '🎨' },
    { key: 'phyEd', label: 'Physical Education', icon: '🏃' },
    { key: 'discipline', label: 'Discipline', icon: '📝' }
  ];

  // Grade options
  const gradeOptions = ['A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'AB'];
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [currentGrades, setCurrentGrades] = useState({});

  const handleGradeChange = (category, value) => {
    setCurrentGrades(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const openEditModal = (student) => {
    setCurrentStudent(student);
    setCurrentGrades({
      workEd: student.cognitive?.workEd || '-',
      artEd: student.cognitive?.artEd || '-',
      phyEd: student.cognitive?.phyEd || '-',
      discipline: student.cognitive?.discipline || '-',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStudent(null);
    setCurrentGrades({});
  };

  const saveGrades = async () => {
    if (!selectedClass || !currentStudent) return;
    
    setIsSaving(true);
    try {
      const grades = {
        studentId: currentStudent._id,
        rollNumber: currentStudent.roll,
        grades: {
          workEd: currentGrades.workEd || '-',
          artEd: currentGrades.artEd || '-',
          phyEd: currentGrades.phyEd || '-',
          discipline: currentGrades.discipline || '-'
        }
      };

      console.log('Sending data to server:', {
        class: selectedClass,
        students: [grades]
      });

      await bulkUpdateCoScholastic(selectedClass, [grades]);
      
      // Update local state to match database structure
      setStudents(prevStudents => 
        prevStudents.map(s => 
          s._id === currentStudent._id 
            ? { 
                ...s, 
                coscholastic: {
                  workEd: currentGrades.workEd || '-',
                  artEd: currentGrades.artEd || '-',
                  phyEd: currentGrades.phyEd || '-',
                  discipline: currentGrades.discipline || '-'
                },
                cognitive: { ...currentGrades } // Keep this for backward compatibility if needed
              } 
            : s
        )
      );
      
      toast.success('Grades updated successfully');
      closeModal();
    } catch (error) {
      console.error('Error saving grades:', error);
      toast.error('Failed to update grades');
    } finally {
      setIsSaving(false);
    }
  };

  // Load selected class from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedClass = localStorage.getItem('ui.selectedClass');
      if (savedClass) setSelectedClass(savedClass);
    }
  }, []);

  // Fetch students when class is selected
  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedClass) {
        setStudents([]);
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const data = await getStudentsByClass(selectedClass);
        setStudents(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students');
        setStudents([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  const handleClassSelect = (className) => {
    setSelectedClass(className);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui.selectedClass', className);
    }
  };

  const handleImportSuccess = useCallback(async (importedData) => {
    if (!importedData || !Array.isArray(importedData) || importedData.length === 0) {
      toast.error('No valid data to import');
      return;
    }

    try {
      setIsSaving(true);
      
      const updates = [];
      
      // Transform the imported data to match the expected format for the server
      importedData.forEach(importedItem => {
        const student = students.find(s => 
          s.roll && importedItem['Roll Number'] && s.roll.toString() === importedItem['Roll Number'].toString()
        );
        
        if (student) {
          updates.push({
            studentId: student._id,
            rollNumber: student.roll,
            grades: {
              workEd: importedItem['Work Education'] || student.coscholastic?.workEd || '-',
              artEd: importedItem['Art Education'] || student.coscholastic?.artEd || '-',
              phyEd: importedItem['Physical Education'] || student.coscholastic?.phyEd || '-',
              discipline: importedItem['Discipline'] || student.coscholastic?.discipline || '-'
            }
          });
        }
      });

      if (updates.length === 0) {
        toast.info('No matching students found by roll number');
        return;
      }

      await bulkUpdateCoScholastic(selectedClass, updates);
      
      // Update local state
      setStudents(prevStudents => 
        prevStudents.map(s => {
          const update = updates.find(u => u.studentId === s._id);
          return update 
            ? { 
                ...s, 
                coscholastic: { ...update.grades },
                cognitive: { ...update.grades } // For safety
              } 
            : s;
        })
      );
      
      setIsImportModalOpen(false);
      toast.success(`Successfully updated ${updates.length} students`);
    } catch (error) {
      console.error('Error importing grades:', error);
      toast.error('Failed to save imported grades. Please check your data format.');
    } finally {
      setIsSaving(false);
    }
  }, [students, selectedClass]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">
            Co-Scholastic Grades Management
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            Manage co-scholastic grades for students
          </p>
        </div>
      </div>

      {/* Class Selector */}
      <div className="mb-6">
        <ExamDependentClassSelectorCard
          onSelect={handleClassSelect}
          selectedClass={selectedClass}
          title="Select Class"
          showConfigMessage={true}
          color="teal"
        />
      </div>

      {/* Student Cards */}
      {selectedClass && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Students in {selectedClass}
              </h2>
              <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                Manage co-scholastic grades for your class
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors"
              >
                <FiUpload className="mr-1.5 h-4 w-4" />
                Import Excel
              </button>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">
                {students.length} {students.length === 1 ? 'Student' : 'Students'}
              </div>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center h-64 rounded-xl bg-white dark:bg-gray-800 shadow-sm border border-orange-100 dark:border-orange-900/50">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-200 p-5 rounded-xl border border-red-200 dark:border-red-800">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
            </div>
          ) : students.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {students.map((student) => (
                <div 
                  key={student._id} 
                  className="group bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-orange-100 dark:border-gray-700 overflow-hidden hover:-translate-y-0.5 dark:bg-gradient-to-br dark:from-gray-800 dark:to-gray-800/80"
                >
                  {/* Card Header */}
                  <div className="px-5 pt-5 pb-3">
                    <div className="flex items-start">
                      <div className="relative h-14 w-14 flex-shrink-0 mr-3">
                        {student.photoUrl ? (
                          <>
                            <img
                              src={student.photoUrl}
                              alt={student.studentName || 'Student'}
                              className="h-full w-full rounded-full object-cover ring-2 ring-orange-200 dark:ring-orange-800/50"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="h-full w-full rounded-full bg-orange-100 dark:bg-orange-900/40 items-center justify-center ring-2 ring-orange-200 dark:ring-orange-800/50 hidden">
                              <span className="text-xl text-orange-600 dark:text-orange-300 font-medium">
                                {student.studentName?.charAt(0) || '?'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="h-full w-full rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center ring-2 ring-orange-200 dark:ring-orange-800/50">
                            <span className="text-xl text-orange-600 dark:text-orange-300 font-medium">
                              {student.studentName?.charAt(0) || '?'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                          {student.studentName}
                        </h3>
                        <div className="mt-1.5 text-sm">
                          <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-300">
                            <span className="inline-flex items-center">
                              <span className="text-gray-500 dark:text-gray-400 mr-1">Roll:</span>
                              <span className="font-medium text-gray-800 dark:text-gray-100">{student.roll}</span>
                            </span>
                            <span className="inline-flex items-center">
                              <span className="text-gray-500 dark:text-gray-400 mr-1">Class:</span>
                              <span className="font-medium text-gray-800 dark:text-gray-100">{selectedClass}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="px-4 pb-4">
                    <div className="space-y-2.5">
                      {categories.map((category) => {
                        // First try to get from coscholastic, fallback to cognitive, then to '-'
                        const grade = student.cognitive?.[category.key] || 
                                    student.coscholastic?.[category.key] || 
                                    '-';
                        const getGradeColor = (grade) => {
                          if (grade === 'A+' || grade === 'A') return 'text-green-600 dark:text-green-400';
                          if (grade === 'B+' || grade === 'B') return 'text-blue-600 dark:text-blue-400';
                          if (grade === 'C' || grade === 'D') return 'text-yellow-600 dark:text-yellow-400';
                          if (grade === 'E' || grade === 'AB') return 'text-red-600 dark:text-red-400';
                          return 'text-gray-500 dark:text-gray-400';
                        };
                        
                        return (
                          <div key={category.key} className="flex items-center justify-between group-hover:bg-orange-50/50 dark:group-hover:bg-gray-700/50 px-2.5 py-2 rounded-lg transition-colors border border-transparent hover:border-orange-100 dark:border-gray-700 dark:hover:border-orange-900/50">
                            <div className="flex items-center">
                              <span className="mr-2.5 text-lg">{category.icon}</span>
                              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {category.label}
                              </span>
                            </div>
                            <span className={`text-sm font-semibold ${getGradeColor(grade)}`}>
                              {grade}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    
                    <div className="mt-4 pt-3 border-t border-orange-100 dark:border-orange-900/30">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditModal(student);
                        }}
                        className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 dark:from-orange-600 dark:to-amber-600 dark:hover:from-orange-500 dark:hover:to-amber-500 rounded-lg shadow-sm transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <FiEdit2 className="mr-2 h-4 w-4" />
                        Update Grades
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No students found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                There are no students in {selectedClass}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Edit Modal */}
      <EditCoScholasticModal
        isOpen={isModalOpen}
        onClose={closeModal}
        student={currentStudent}
        grades={currentGrades}
        onGradeChange={handleGradeChange}
        onSave={saveGrades}
        isSaving={isSaving}
      />

      {/* Excel Import Modal */}
      <ExcelImportModalForCoScolastic
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        selectedClass={selectedClass}
        onImportSuccess={handleImportSuccess}
        selectedColumns={[
          'Roll Number',
          'Student Name',
          'Work Education',
          'Art Education',
          'Physical Education',
          'Discipline'
        ]}
        gradeOptions={['A+', 'A', 'B+', 'B', 'C', 'D', 'E', 'AB']}
      />

    </div>
  );
};

export default CoScholasticGradesPanel;
