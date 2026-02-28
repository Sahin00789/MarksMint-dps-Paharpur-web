import React, { useEffect, useState, useCallback } from "react";
import ClassSelecorCard from "@/components/common/ClassSelectorCard";
import {
  getStudentsByClass,
  getAllStudents,
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
import IDCardSelectionModal from "./Modals/IDCardSelectionModal";
import { FaUserPlus, FaFileExcel, FaImages, FaTrash, FaIdCard } from "react-icons/fa";
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import schoolInformation from "@/shared/schoolInformation";
import { isObject } from "framer-motion";
import { differenceInYears, parseISO } from 'date-fns';

export default function StudentsPanel() {
  const [selectedClass, setSelectedClass] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ui.selectedClass') || null;
    }
    return null;
  });
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
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
  const [showIDSelection, setShowIDSelection] = useState(false);


  // Save selected class to localStorage when it changes
  useEffect(() => {
    if (selectedClass && typeof window !== 'undefined') {
      localStorage.setItem('ui.selectedClass', selectedClass);
    }
  }, [selectedClass]);
  
  // Handle class selection change
  const handleClassSelect = (className) => {
    setSelectedClass(className);
  };

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
            session: new Date().getFullYear().toString(),
            roll: student.Roll || student.roll || '',
            fatherName: student["Father Name"] || student.fatherName || '',
            motherName: student["Mother Name"] || student.motherName || '',
            gender: student.Gender || student.gender || '',
            className: selectedClass,
            mobileNumber: student["Mobile Number"] || student.mobileNumber || '',
            address: student.Address || student.address || '',
            dob: student["Date of Birth"] || student.dob || '',
            religion: student.Religion || student.religion || '',
            caste: student.Caste || student.caste || '',
            category: student.Category || student.category || '',
            bloodGroup: student["Blood Group"] || student.bloodGroup || '',
            section: student.Section || student.section || '',
            admissionType: student["Admission Type"] || student.admissionType || ''
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
    const fetchStudents = async () => {
      if (!selectedClass) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const data = await getStudentsByClass(selectedClass);
        setStudents(data);
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('Failed to load students. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchStudents();
  }, [selectedClass]);

  // Fetch all students for ID card modal
  useEffect(() => {
    const fetchAllStudents = async () => {
      try {
        const data = await getAllStudents(); // We need to create this function
        setAllStudents(data);
      } catch (err) {
        console.error('Error fetching all students:', err);
      }
    };
    
    fetchAllStudents();
  }, []);

  const refresh = async () => {
    if (!selectedClass) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentsByClass(selectedClass);
      setStudents(data);
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
      class: selectedClass,
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

  const renderStudentDetails = (stu) => {
    const details = [];
    
    // Date of Birth with Age
    if (stu.dob) {
      let birthDate;
      let displayDate = '';
      let ageDisplay = '';
      
      try {
        // Handle different date formats
        if (typeof stu.dob === 'string') {
          // Try parsing ISO string first
          const parsedDate = new Date(stu.dob);
          if (!isNaN(parsedDate.getTime())) {
            birthDate = parsedDate;
            displayDate = parsedDate.toLocaleDateString('en-IN', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric' 
            });
          } else {
            // Try parsing other formats if ISO fails
            const dateParts = stu.dob.split(/[-/]/);
            if (dateParts.length === 3) {
              // Try DD-MM-YYYY or YYYY-MM-DD format
              const year = dateParts[0].length === 4 ? dateParts[0] : dateParts[2];
              const month = dateParts[1].length === 1 ? `0${dateParts[1]}` : dateParts[1];
              const day = dateParts[0].length <= 2 ? dateParts[0] : dateParts[2];
              const isoDate = `${year}-${month}-${day}`;
              birthDate = new Date(isoDate);
              displayDate = birthDate.toLocaleDateString('en-IN', { 
                day: '2-digit', 
                month: 'short', 
                year: 'numeric' 
              });
            }
          }
        } else if (stu.dob instanceof Date) {
          birthDate = stu.dob;
          displayDate = birthDate.toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          });
        }
        
        // Calculate age if we have a valid date
        if (birthDate && !isNaN(birthDate.getTime())) {
          const today = new Date();
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          
          ageDisplay = `${age} years old`;
        } else {
          ageDisplay = 'Age not available';
          displayDate = 'Invalid date';
        }
      } catch (error) {
        console.error('Error parsing date:', error);
        displayDate = 'Invalid date';
        ageDisplay = 'Age not available';
      }
      
      details.push(
        <div key="dob" className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-300">
                {displayDate}
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              {ageDisplay}
            </span>
          </div>
        </div>
      );
    }

    // Father's Name
    if (stu.fatherName) {
      details.push(
        <div key="father" className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600/30">
          <div className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Father's Name</p>
              <p className="text-gray-700 dark:text-gray-100 font-medium">{stu.fatherName}</p>
            </div>
          </div>
        </div>
      );
    }

    // Admission Type
    if (stu.admissionType) {
      details.push(
        <div key="admission-type" className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600/30">
          <div className="flex items-center">
            {getAdmissionTypeIcon(stu.admissionType)}
            <div className="ml-2">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Admission Type</p>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAdmissionTypeColor(stu.admissionType)}`}>
                {getAdmissionTypeLabel(stu.admissionType)}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // Address
    if (stu.address) {
      details.push(
        <div key="address" className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600/30">
          <div className="flex">
            <svg className="w-4 h-4 mr-2 mt-0.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Address</p>
              <p className="text-sm text-gray-700 dark:text-gray-200">{stu.address}</p>
            </div>
          </div>
        </div>
      );
    }

    // Mobile Number (as a contact card at the bottom)
    if (stu.mobileNumber) {
      details.push(
        <div key="contact-card" className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Mobile Number</p>
                <a 
                  href={`tel:${stu.mobileNumber}`} 
                  className="text-blue-700 dark:text-blue-300 hover:underline font-medium"
                >
                  {stu.mobileNumber}
                </a>
              </div>
            </div>
            <a 
              href={`https://wa.me/+91${stu.mobileNumber}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50"
              title="Message on WhatsApp"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.966-.273-.099-.471-.148-.67.15-.197.297-.767.963-.94 1.16-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.795-1.484-1.784-1.66-2.087-.173-.297-.018-.458.13-.606.136-.133.296-.347.445-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.508-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.492.709.306 1.262.489 1.694.625.712.227 1.36.195 1.87.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.885 9.888-9.885 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.55 4.142 1.595 5.945L0 24l6.335-1.652a11.882 11.882 0 005.723 1.47h.005c6.554 0 11.89-5.335 11.89-11.893 0-3.18-1.264-6.17-3.558-8.418z" />
              </svg>
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
      'studentName', 'roll', 'session', 
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

  const handleBulkPhotoUpload = async (files, onProgress) => {
    if (!selectedClass) {
      const error = new Error('No class selected');
      console.error('Upload failed - no class selected');
      throw error;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Ensure files is an array
      const filesArray = Array.isArray(files) ? files : [files];
      
      // Extract file objects and include metadata
      const filesWithMetadata = filesArray.map(fileObj => {
        const file = fileObj.file || fileObj;
        if (file instanceof File) {
          return {
            file,
            name: file.name,
            type: file.type,
            size: file.size,
            roll: fileObj.roll || file.name.split('.')[0],
            studentName: fileObj.studentName || ''
          };
        }
        return null;
      }).filter(Boolean);
      
      console.log('Preparing to upload photos:', {
        fileCount: filesWithMetadata.length,
        selectedClass,
        files: filesWithMetadata.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size,
          roll: f.roll,
          studentName: f.studentName
        }))
      });
      
      if (filesWithMetadata.length === 0) {
        const error = new Error('No valid files found for upload');
        console.error('Upload failed - no valid files found', { files });
        throw error;
      }
      
      // Call uploadStudentPhotosBatch with progress tracking
      const result = await uploadStudentPhotosBatch(
        filesWithMetadata, 
        { class: selectedClass },
        onProgress // Pass the progress callback through
      );
      
      if (result && result.success) {
        const uploadedCount = Array.isArray(result.uploaded) ? result.uploaded.length : 0;
        const failedCount = Array.isArray(result.failed) ? result.failed.length : 0;
        
          // Show toast notification
        if (uploadedCount > 0) {
          toast.success(`Successfully uploaded ${uploadedCount} photo(s)${failedCount > 0 ? `, ${failedCount} failed` : ''}`, {
            toastId: 'upload-success',
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          });
        } else if (failedCount > 0) {
          toast.error(`Failed to upload ${failedCount} photo(s)`, {
            toastId: 'upload-error',
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          });
        } else {
          toast.info('No photos were uploaded', {
            toastId: 'upload-info',
            position: 'top-right',
            autoClose: 3000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true
          });
        }
        
        await refresh();
        return result;
      } else {
        const errorMessage = result?.message || 'Failed to upload some photos';
        console.error('Upload failed:', errorMessage, { 
          result, 
          selectedClass,
          fileCount: filesWithMetadata.length,
          files: filesWithMetadata.map(f => ({
            name: f.name,
            type: f.type,
            size: f.size,
            roll: f.roll,
            studentName: f.studentName
          }))
        });
        setError(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error('Error uploading photos:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to upload photos. Please try again.';
      setError(errorMessage);
      
      // Show error toast
      toast.error(errorMessage, {
        toastId: 'upload-error-message',
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      
      return { success: false, message: errorMessage };
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to get initials from full name
const getInitials = (name) => {
  if (!name) return '??';
  const names = name.trim().split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
};

const getAdmissionTypeLabel = (type) => {
  switch (type) {
    case 'day scholar': return 'Day Scholar';
    case 'day hostel': return 'Day Hostel';
    case 'hosteller': return 'Hosteller';
    default: return 'Not Specified';
  }
};

const getAdmissionTypeIcon = (type) => {
  switch (type) {
    case 'day scholar': 
      return (
        <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1z"/>
        </svg>
      );
    case 'day hostel': 
      return (
        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      );
    case 'hosteller': 
      return (
        <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z"/>
        </svg>
      );
    default: 
      return (
        <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      );
  }
};

const getAdmissionTypeColor = (type) => {
  switch (type) {
    case 'day scholar': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    case 'day hostel': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
    case 'hosteller': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  }
};

  return (
    <div className="p-2 bg-gray-50 dark:bg-gray-900 min-h-full">
      <div className="flex flex-col h-full">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 space-y-3 sm:space-y-0">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Students</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowExcelImport(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 flex-1 sm:flex-none justify-center"
            >
              <FaFileExcel className="mr-2" />
              Import Excel
            </button>
            <button
              onClick={() => setShowPhotosModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 flex-1 sm:flex-none justify-center"
            >
              <FaImages className="mr-2" />
              Upload Photos
            </button>
            <button
              onClick={() => setShowIDSelection(true)}
              disabled={!selectedClass}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-amber-600 rounded-lg hover:bg-amber-700 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 flex-1 sm:flex-none justify-center disabled:opacity-50"
            >
              <FaIdCard className="mr-2" />
              Generate ID Cards
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex-1 sm:flex-none justify-center"
            >
              <FaUserPlus className="mr-2" />
              Add Student
            </button>
          </div>
        </div>

        <div className="mb-6">
          <ClassSelecorCard
            onSelect={handleClassSelect}
            selectedClass={selectedClass}
          />
        </div>

        {/* Content */}
        {!selectedClass ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Select a class to view students.
            </p>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Loading students...
            </p>
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5 p-4">
            {students.length > 0 ? (
              students.map((stu) => (
                <div 
                  key={stu._id} 
                  className="flex flex-col h-full overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 dark:border-gray-700 transform hover:-translate-y-0.5 hover:scale-[1.02]"
                >
                  {/* Card Header */}
                  <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-800 dark:to-indigo-900 rounded-t-2xl">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        {/* Student Photo */}
                        <div className="relative flex-shrink-0">
                          {stu.photoUrl ? (
                            <img
                              className="h-16 w-16 rounded-lg object-cover border-2 border-white dark:border-gray-200 shadow-sm"
                              src={stu.photoUrl}
                              alt={stu.studentName}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextElementSibling.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div 
                              className="h-16 w-16 rounded-lg border-2 border-white dark:border-gray-200 shadow-sm flex items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-bold text-xl"
                            >
                              {getInitials(stu.studentName)}
                            </div>
                          )}
                          {/* Fallback that shows up if image fails to load */}
                          <div 
                            className="h-16 w-16 rounded-lg border-2 border-white dark:border-gray-200 shadow-sm hidden items-center justify-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 font-bold text-xl"
                          >
                            {getInitials(stu.studentName)}
                          </div>
                        </div>
                        
                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-white truncate">
                            {stu.studentName}
                          </h3>
                          <div className="flex items-center space-x-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white border border-white/30">
                              Class: {stu.class || 'N/A'}
                            </span>
                            {stu.admissionType && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getAdmissionTypeColor(stu.admissionType)} border border-white/30`}>
                                {getAdmissionTypeIcon(stu.admissionType)}
                                <span className="ml-1">{getAdmissionTypeLabel(stu.admissionType)}</span>
                              </span>
                            )}
                            {stu.session && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-white/20 text-white border border-white/30">
                                {stu.session}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Card Body */}
                  <div className="flex-1 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                    <div className="space-y-3">
                      {renderStudentDetails(stu)}
                    </div>
                  </div>
                  
                  {/* Card Footer */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between space-x-3">
                      <button 
                        onClick={() => handleOpenDelete(stu)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm"
                      >
                        <FaTrash className="w-3.5 h-3.5 mr-1.5" />
                        Delete
                      </button>
                      <button 
                        onClick={() => handleOpenEdit(stu)}
                        className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors duration-200 shadow-sm"
                      >
                        <svg className="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
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

      {/* ID Card Selection Modal */}
      <IDCardSelectionModal
        isOpen={showIDSelection}
        onClose={() => setShowIDSelection(false)}
        students={allStudents}
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
          "Mother Name",
          "Date of Birth",
          "Address",
          "Religion",
          "Mobile Number",
          "Gender",
          "Blood Group",
          "Caste",
          "Category",
          "Admission Type",
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
        selectedClass={selectedClass}
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
