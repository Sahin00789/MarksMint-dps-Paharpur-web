import React, { useEffect, useState, useCallback } from "react";
import ClassSelecorCard from "@/components/common/ClassSelectorCard";
import {
  getStudentsByClass,
  createStudent,
  bulkCreateStudents,
  updateStudent,
  uploadStudentPhotosBatch,
  deleteStudent,
} from "@/services/students";
import AddStudentModal from "./Modals/addStudentModal";
import EditStudentModal from "./Modals/editStudentModal";
import ExcelImportModal from "./Modals/ExcelImportModalforStudents";
import BulkPhotoUpload from "./Modals/bulkPhotoUpload";
import DeleteConfirmationModal from "./Modals/DeleteConfirmationModal";
import { FaUserPlus, FaFileExcel, FaImages, FaTrash } from "react-icons/fa";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import schoolInformation from "@/shared/schoolInformation";
import { isObject } from "framer-motion";

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Initialize from persisted selection (do not persist changes here)
  // Load selected class from localStorage on component mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedClass = localStorage.getItem("ui.selected");
      if (savedClass) {
        setSelectedClass(savedClass);
      }
    }
  }, []);

  // Save selected class to localStorage when it changes
  useEffect(() => {
    if (selectedClass && typeof window !== "undefined") {
      localStorage.setItem("ui.selected", selectedClass);
    }
  }, [selectedClass]);

  const handleExcelImport = useCallback(
    async (importedData) => {
      try {
        setLoading(true);
        setError(null);

        // Transform the imported data to match the student structure
        const formattedStudents = importedData.rows.map((row) => {
          // Create a mapping from header to value
          const student = {};
          importedData.headers.forEach((header, idx) => {
            const cleanHeader = header.trim();
            if (
              header &&
              row[cleanHeader] !== undefined &&
              row[cleanHeader] !== ""
            ) {
              // Clean up the header name for consistent access
              student[cleanHeader] = row[cleanHeader];
            }
          });

          // Map the fields to the student structure
          return {
            studentName: student["Student Name"],
            class: selectedClass,
            session: "2025",
            roll: student.Roll,
            fatherName: student["Father Name"],
            className: selectedClass,
            mobileNumber: student["Mobile Number"],
            address: student.Address,
            dob: student["Date of Birth"],
          };
        });

        // Filter out any empty rows (where name and roll are empty)
        const validStudents = formattedStudents.filter(
          (s) => s.studentName && s.roll
        );

        if (validStudents.length === 0) {
          throw new Error("No valid student records found in the file");
        }

        // Call the bulk create API
        await bulkCreateStudents(validStudents);
        // Refresh the student list
        await getStudentsByClass(selectedClass);

        // Show success message
        toast.success(`Successfully imported ${validStudents.length} students`);
        return true;
      } catch (error) {
        console.error("Error importing students:", error);
        setError(
          error.message ||
            "Failed to process the Excel file. Please check the format."
        );
        return false;
      } finally {
        setLoading(false);
      }
    },
    [selectedClass]
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClass) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentsByClass(selectedClass);
        data.sort((a, b) => a.roll - b.roll);
        setStudents(Array.isArray(data) ? data : []);
      } catch (e) {
        setError("Failed to load students");
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
      setError("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    
    if (!selectedClass) {
      toast.warning("Please select a class first");
      return;
    }
    
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    
    // Get all form fields
    const formData = {
      studentName: form.get("studentName")?.toString().trim(),
      roll: form.get("roll")?.toString().trim(),
      section: form.get("section")?.toString().trim(),
      session: form.get("session")?.toString().trim() || new Date().getFullYear().toString(),
      dob: form.get("dob")?.toString().trim(),
      fatherName: form.get("fatherName")?.toString().trim(),
      mobileNumber: form.get("mobileNumber")?.toString().trim(),
      address: form.get("address")?.toString().trim()
    };
    
    // Validate required fields
    if (!formData.studentName || !formData.roll) {
      toast.error("Student name and roll number are required");
      return;
    }
    
    // Validate mobile number if provided
    if (formData.mobileNumber && !/^\d{10}$/.test(formData.mobileNumber)) {
      toast.error("Please enter a valid 10-digit mobile number");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const photoFile = formEl.elements.photo?.files?.[0];
      
      if (photoFile) {
        // If there's a photo, use FormData for file upload
        const fd = new FormData();
        fd.append("class", selectedClass);
        
        // Append all non-empty fields
        Object.entries(formData).forEach(([key, value]) => {
          if (value) fd.append(key, value);
        });
        
        fd.append("photo", photoFile);
        await createStudent(fd);
      } else {
        // For non-file submission, send as JSON
        await createStudent({
          class: selectedClass,
          ...formData
        });
      }
      setShowAddModal(false);
      await refresh();
    } catch (e) {
      const errorMessage = e.response?.data?.message || "Failed to create student";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (stu) => {
    setEditingStudent(stu);
    setShowEditModal(true);
  };

  const handleOpenDelete = (student) => {
    setStudentToDelete(student);
    setShowDeleteModal(true);
  };

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteStudent(studentToDelete._id);
      setStudents(prev => prev.filter(s => s._id !== studentToDelete._id));
      setShowDeleteModal(false);
      setStudentToDelete(null);
      toast.success("Student deleted successfully");
    } catch (error) {
      console.error("Error deleting student:", error);
      const errorMessage = error.message || "Failed to delete student";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  // Reorder fields to show contact at the bottom
  const renderStudentDetails = (stu) => {
    const details = [];
    
    if (stu.fatherName) {
      details.push(
        <div key="father" className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600/30">
          <div className="flex items-center">
            <span className="w-20 text-sm font-medium text-gray-500 dark:text-gray-300">Father</span>
            <span className="text-gray-700 dark:text-gray-100 font-medium">{stu.fatherName}</span>
          </div>
        </div>
      );
    }

    if (stu.dob) {
      details.push(
        <div key="dob" className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600/30">
          <div className="flex items-center">
            <span className="w-20 text-sm font-medium text-gray-500 dark:text-gray-300">DOB</span>
            <span className="text-gray-700 dark:text-gray-100 font-medium">
              {new Date(stu.dob).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>
        </div>
      );
    }

    if (stu.address) {
      details.push(
        <div key="address" className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600/30">
          <div className="flex items-start">
            <span className="w-20 text-sm font-medium text-gray-500 dark:text-gray-300 flex-shrink-0">
              <svg className="w-4 h-4 inline-block mr-1 -mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address
            </span>
            <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">{stu.address}</p>
          </div>
        </div>
      );
    }

    // Add contact at the end
    if (stu.mobileNumber) {
      details.push(
        <div key="contact" className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
          <div className="flex items-center">
            <span className="w-20 text-sm font-medium text-blue-600 dark:text-blue-400">Contact</span>
            <a 
              href={`tel:${stu.mobileNumber}`} 
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors flex items-center font-medium"
            >
              <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span className="truncate text-base">{stu.mobileNumber}</span>
            </a>
          </div>
        </div>
      );
    }

    return details;
  };

  const handleUpdateStudent = async (e) => {
    e.preventDefault();
    if (!editingStudent?._id) return;
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const payload = {};
    
    // Get all form fields and add to payload if they exist
    const fields = [
      'studentName', 'roll', 'section', 'session', 
      'dob', 'fatherName', 'mobileNumber', 'address'
    ];
    
    fields.forEach(field => {
      const value = form.get(field)?.toString().trim();
      if (value) {
        payload[field] = value;
      }
    });
    
    // Handle file upload if a new photo is selected
    const photoFile = formEl.elements.photo?.files?.[0];
    if (photoFile) {
      const fd = new FormData();
      Object.keys(payload).forEach(key => {
        fd.append(key, payload[key]);
      });
      fd.append('photo', photoFile);
      setSubmitting(true);
      try {
        await updateStudent(editingStudent._id, fd);
        setShowEditModal(false);
        setEditingStudent(null);
        await refresh();
        return;
      } catch (e) {
        setError("Failed to update student");
        return;
      } finally {
        setSubmitting(false);
      }
    }
    setSubmitting(true);
    try {
      await updateStudent(editingStudent._id, payload);
      setShowEditModal(false);
      setEditingStudent(null);
      await refresh();
    } catch (e) {
      const errorMessage = e.response?.data?.message || "Failed to update student";
      setError(errorMessage);
      toast.error(errorMessage);
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
      console.error("Error uploading photos:", error);
      setError("Failed to upload photos");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-2">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className="flex flex-col space-y-4">
        <div className="flex md:flex-row flex-col space-y-2 justify-between items-center  mb-6">
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
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Select a class to view students.
          </p>
        ) : loading ? (
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Loading students...
          </p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 p-4">
            {students.length > 0 ? (
              students.map((stu) => (
                <div 
                  key={stu._id || stu.roll}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:border-blue-100 dark:hover:border-blue-900 overflow-hidden group"
                >
                  {/* Header with Gradient Background */}
                  <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-5 text-white">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        
                        <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-md overflow-hidden">
                        {stu.photoUrl || stu.photo ? (
                          <img 
                            src={stu.photoUrl || stu.photo} 
                            alt={stu.studentName} 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // If image fails to load, show initials
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`absolute inset-0 flex items-center justify-center ${(stu.photoUrl || stu.photo) ? 'hidden' : 'flex'}`}>
                          {(() => {
                            const nameParts = stu.studentName?.split(' ') || [];
                            const firstLetter = nameParts[0]?.charAt(0) || 'S';
                            const lastLetter = nameParts.length > 1 ? nameParts[nameParts.length - 1].charAt(0) : '';
                            return `${firstLetter}${lastLetter}`.toUpperCase();
                          })()}
                        </div>
                      </div>
                    </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate mb-1.5">{stu.studentName || 'N/A'}</h3>
                        <div className="flex flex-wrap items-center gap-2.5">
                          <span className="bg-blue-500/90 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
                            Roll: {stu.roll || 'N/A'}
                          </span>
                          <span className="bg-indigo-500/90 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
                            {stu.class || 'N/A'}
                          </span>
                          {stu.session && (
                            <span className="bg-purple-500/90 text-white px-3 py-1.5 rounded-lg text-sm font-semibold shadow-sm">
                              {stu.session}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Details Section */}
                  <div className="p-5">
                    <div className="space-y-3.5">
                      {renderStudentDetails(stu)}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between">
                      <button 
                        onClick={() => handleOpenDelete(stu)}
                        className="flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm"
                      >
                        <FaTrash className="w-3.5 h-3.5 mr-1.5" />
                        Delete
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(stu)}
                        className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm"
                      >
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
                // Student profile card ends
              ))
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                No students found for {selectedClass}.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => {
          setShowDeleteModal(false);
          setStudentToDelete(null);
        }}
        student={studentToDelete || {}}
        onConfirm={handleDeleteStudent}
        isLoading={isDeleting}
      />

      {/* Add Student Modal */}
      <AddStudentModal
        isOpen={showAddModal}
        cls={selectedClass}
        onClose={() => setShowAddModal(false)}
        onSubmit={async (formData) => {
          try {
            setSubmitting(true);
            
            // Convert FormData to object
            const formDataObj = {};
            formData.forEach((value, key) => {
              formDataObj[key] = value;
            });
            
            // Create a proper FormData object for the API call
            const apiFormData = new FormData();
            
            // Add all fields from the form
            Object.entries(formDataObj).forEach(([key, value]) => {
              if (key !== 'photo' && value !== null && value !== undefined) {
                apiFormData.append(key, value);
              }
            });
            
            // Add the photo file if it exists
            if (formDataObj.photo) {
              apiFormData.append('photo', formDataObj.photo);
            }
            
            // Call the API with the FormData
            const newStudent = await createStudent(apiFormData);
            
            // Update the UI
            setStudents((prev) => [...prev, newStudent]);
            setShowAddModal(false);
          } catch (error) {
            console.error("Error creating student:", error);
            setError(error.message || "Failed to add student");
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
        title="Import Students from Excel"
        selectedColumns={[
          "Roll",
          "Student Name",
          "Father Name",
          "Address",
          "Date of Birth",
        ]}
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
          onSave={handleUpdateStudent}
        />
      )}
    </div>
  );
}
