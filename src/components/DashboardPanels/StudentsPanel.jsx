import React, { useEffect, useState, useCallback } from 'react';
import ClassSelecorCard from '../common/ClassSelectorCard';
import StudentCard from '../common/StudentCard';
import { getStudentsByClass, createStudent, bulkCreateStudents, updateStudent, uploadStudentPhotosBatch } from '../../services/students';
import { AddStudentModal, EditStudentModal } from '../Modals';
import ExcelImportModal from '../Modals/ExcelImportModal';
import BulkPhotoUpload from '../Modals/Students/bulkPhotoUpload';
import { FaUserPlus, FaFileExcel, FaImages } from 'react-icons/fa';

export default function StudentsPanel() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showExcelImport, setShowExcelImport] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPhotosModal, setShowPhotosModal] = useState(false);
  const [photosPreview, setPhotosPreview] = useState([]);

  // Initialize from persisted selection (do not persist changes here)
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('ui.selectedClass') : null;
    if (saved) setSelectedClass(saved);
  }, []);

  const handleExcelImport = useCallback(async (importedData) => {
    try {
      setLoading(true);
      setError(null);
      
      // Transform the imported data to match the student structure
      const formattedStudents = importedData.rows.map((row) => {
        // Create a mapping from header to value
        const student = {};
        importedData.headers.forEach((header, idx) => {
          if (header && row[idx] !== undefined && row[idx] !== '') {
            // Clean up the header name for consistent access
            const cleanHeader = header.trim();
            student[cleanHeader] = row[idx];
          }
        });

        // Map the fields to the student structure
        return {
          name: student['Student Name'] || student.Name || '',
          roll: student['Roll'] || student.Roll || '',
          fatherName: student["Father's Name"] || student.FatherName || '',
          className: selectedClass || student.Class || student.className || '',
          section: student.Section || student.section || 'A',
          contactNumber: student['Mobile Number'] || student['Contact Number'] || student.Phone || '',
          address: student.Address || student.address || '',
          dob: student['Date of Birth'] || student.DOB || '',
        };
      });

      // Filter out any empty rows (where name and roll are empty)
      const validStudents = formattedStudents.filter(s => s.name && s.roll);
      
      if (validStudents.length === 0) {
        throw new Error('No valid student records found in the file');
      }
      
      // Call the bulk create API
      await bulkCreateStudents(validStudents);
      
      // Refresh the student list
      await fetchStudents(selectedClass);
      
      // Show success message
      alert(`Successfully imported ${validStudents.length} students`);
      
      return true;
    } catch (error) {
      console.error('Error importing students:', error);
      setError(error.message || 'Failed to process the Excel file. Please check the format.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

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

  const refresh = async () => {
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

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    if (!selectedClass) return;
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const studentName = form.get('studentName')?.toString().trim();
    const roll = form.get('roll')?.toString().trim();
    const section = form.get('section')?.toString().trim();
    const session = form.get('session')?.toString().trim();
    const dob = form.get('dob')?.toString().trim();
    const fatherName = form.get('fatherName')?.toString().trim();
    const mobileNumber = form.get('mobileNumber')?.toString().trim();
    const address = form.get('address')?.toString().trim();
    const photoFile = formEl.elements.photo?.files?.[0];
    if (!studentName || !roll) return;
    setSubmitting(true);
    try {
      if (photoFile) {
        const fd = new FormData();
        fd.append('class', selectedClass);
        fd.append('studentName', studentName);
        fd.append('roll', roll);
        if (section) fd.append('section', section);
        if (session) fd.append('session', session);
        if (dob) fd.append('dob', dob);
        if (fatherName) fd.append('fatherName', fatherName);
        if (mobileNumber) fd.append('mobileNumber', mobileNumber);
        if (address) fd.append('address', address);
        fd.append('photo', photoFile);
        await createStudent(fd);
      } else {
        await createStudent({ class: selectedClass, studentName, roll, section, session, dob, fatherName, mobileNumber, address });
      }
      setShowAddModal(false);
      await refresh();
    } catch (e) {
      setError('Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (stu) => {
    setEditingStudent(stu);
    setShowEditModal(true);
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent?._id) return;
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const studentName = form.get('studentName')?.toString().trim();
    const roll = form.get('roll')?.toString().trim();
    const section = form.get('section')?.toString().trim();
    const session = form.get('session')?.toString().trim();
    const dob = form.get('dob')?.toString().trim();
    const fatherName = form.get('fatherName')?.toString().trim();
    const mobileNumber = form.get('mobileNumber')?.toString().trim();
    const address = form.get('address')?.toString().trim();
    const payload = { studentName, roll, section, session, dob, fatherName, mobileNumber, address };
    setSubmitting(true);
    try {
      await updateStudent(editingStudent._id, payload);
      setShowEditModal(false);
      setEditingStudent(null);
      await refresh();
    } catch (e) {
      setError('Failed to update student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkPhotoUpload = async (formData) => {
    if (!selectedClass) return;
    setSubmitting(true);
    try {
      await uploadStudentPhotosBatch(selectedClass, formData);
      setShowPhotosModal(false);
      setPhotosPreview([]);
      await refresh();
    } catch (error) {
      console.error('Error uploading photos:', error);
      setError('Failed to upload photos');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Students</h2>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowExcelImport(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              <FaFileExcel className="mr-2" />
              Import Excel
            </button>
            <button
              onClick={() => setShowPhotosModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
            >
              <FaImages className="mr-2" />
              Upload Photos
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <FaUserPlus className="mr-2" />
              Add Student
            </button>
          </div>
        </div>
        
        {/* Class Selector */}
        <ClassSelecorCard 
          selected={selectedClass}
          onSelect={setSelectedClass}
        />

        {/* Content */}
        {!selectedClass ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Select a class to view students.</p>
        ) : loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">Loading students...</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.length > 0 ? (
              students.map((stu) => (
                <StudentCard 
                  key={stu._id || `${stu.class}_${stu.roll}`} 
                  student={stu} 
                  variant="students" 
                  onView={() => {}} 
                  onEdit={handleOpenEdit} 
                />
              ))
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No students found for {selectedClass}.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddModal}
        cls={selectedClass}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (studentData) => {
          try {
            setSubmitting(true);
            const newStudent = await createStudent({
              ...studentData,
              cls: selectedClass
            });
            setStudents(prev => [...prev, newStudent]);
            setShowAddModal(false);
          } catch (error) {
            console.error('Error creating student:', error);
            setError(error.message || 'Failed to add student');
          } finally {
            setSubmitting(false);
          }
        }}
      />

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={showExcelImport}
        onClose={() => setShowExcelImport(false)}
        selectedClass={selectedClass}
        selectedColumns={["Student Name", "Roll", "Father's Name", "Address", "Contact Number"]}
        onImport={handleExcelImport}
      />

      {/* Bulk Photo Upload Modal */}
      <BulkPhotoUpload
        isOpen={showPhotosModal}
        onClose={() => {
          setShowPhotosModal(false);
          setPhotosPreview([]);
        }}
        onUpload={handleBulkPhotoUpload}
      />

      {/* Edit Student Modal */}
      {editingStudent && (
        <EditStudentModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingStudent(null);
          }}
          student={editingStudent}
          onSubmit={async (updatedData) => {
            try {
              setSubmitting(true);
              const updatedStudent = await updateStudent(editingStudent._id, updatedData);
              setStudents(prev => 
                prev.map(s => s._id === updatedStudent._id ? updatedStudent : s)
              );
              setShowEditModal(false);
              setEditingStudent(null);
            } catch (error) {
              console.error('Error updating student:', error);
              setError(error.message || 'Failed to update student');
            } finally {
              setSubmitting(false);
            }
          }}
        />
      )}
    </div>
  );
}
