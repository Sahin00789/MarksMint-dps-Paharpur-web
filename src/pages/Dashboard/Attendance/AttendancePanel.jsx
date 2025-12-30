import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { FiUpload, FiCalendar, FiSettings, FiUsers, FiPlus, FiEdit2, FiInfo } from 'react-icons/fi';
import AttendanceConfigModal from './Modals/AttendanceConfigModal';
import EditAttendanceModal from './Modals/EditAttendanceModal';
import ExcelImportModalForAttendance from './Modals/ExcelImportModalForAttendance';
import ClassSelectorCard from '@/components/common/ClassSelectorCard';
import { getStudentsByClass, updateStudent } from '@/services/students';
import { getAttendanceConfig, updateAttendanceConfig } from '@/services/attendanceConfig';
import api from '@/services/api';
import { toast } from 'react-toastify';

export default function AttendancePanel() {
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editingPresentDays, setEditingPresentDays] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [attendanceConfig, setAttendanceConfig] = useState({
    schoolWorkingDays: 0,
    holidays: 0,
    academicYear: '2024-2025'
  });
  const [totalWorkingDays, setTotalWorkingDays] = useState(0);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Prepare data for printing
  const printData = useMemo(() => {
    if (!students.length) return [];
    
    return students.map(student => {
      // Handle both number and string formats for attendance
      let present, total;
      if (typeof student.attendance === 'number') {
        present = student.attendance;
        total = attendanceConfig.schoolWorkingDays || 1;
      } else if (typeof student.attendance === 'string') {
        const parts = student.attendance.split('/');
        present = parseInt(parts[0], 10) || 0;
        total = parts.length > 1 ? parseInt(parts[1], 10) || 1 : 1;
      } else {
        present = 0;
        total = attendanceConfig.schoolWorkingDays || 1;
      }
      
      // Calculate percentage safely
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
      
      return {
        _id: student._id,
        studentName: student.studentName,
        roll: student.roll,
        class: student.class,
        section: student.section || '',
        attendance: present, // Store as number
        attendancePercentage: `${percentage}%`,
        totalDays: total
      };
    });
  }, [students, attendanceConfig.schoolWorkingDays]);

  // Fetch students when selectedClass changes
  const fetchStudents = useCallback(async () => {
    if (!selectedClass) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await getStudentsByClass(selectedClass);
      setStudents(data);
    } catch (err) {
      console.error('Failed to fetch students:', err);
      setError('Failed to load students. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedClass]);

  // Handle class selection change
  const handleClassSelect = (className) => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('ui.selectedClass', className);
    }
    setSelectedClass(className);
  };

  // Calculate attendance stats for the selected class
  const attendanceStats = useMemo(() => {
    if (!selectedClass || !students.length) {
      return { totalDays: 0, presentDays: 0, absentDays: 0, percentage: 0 };
    }

    let totalPresentDays = 0;
    let totalPossibleDays = 0;
    let studentsWithAttendance = 0;

    students.forEach(student => {
      if (student.attendance !== null && student.attendance !== undefined) {
        studentsWithAttendance++;
        let presentDays = 0;
        
        if (typeof student.attendance === 'number') {
          presentDays = Math.min(student.attendance, attendanceConfig.schoolWorkingDays);
        } else if (typeof student.attendance === 'string') {
          const [daysPresent] = (student.attendance || '0/0').split('/').map(Number);
          presentDays = Math.min(isNaN(daysPresent) ? 0 : daysPresent, attendanceConfig.schoolWorkingDays);
        }
        
        totalPresentDays += presentDays;
        totalPossibleDays += attendanceConfig.schoolWorkingDays;
      }
    });

    const totalAbsentDays = Math.max(0, totalPossibleDays - totalPresentDays);
    const averagePercentage = studentsWithAttendance > 0 ? Math.round((totalPresentDays / totalPossibleDays) * 100) : 0;
    
    return {
      totalDays: attendanceConfig.schoolWorkingDays,
      presentDays: Math.round(totalPresentDays / studentsWithAttendance) || 0,
      absentDays: Math.round(totalAbsentDays / studentsWithAttendance) || 0,
      percentage: averagePercentage
    };
  }, [selectedClass, students, attendanceConfig.schoolWorkingDays]);

  const { totalDays, presentDays, absentDays, percentage } = attendanceStats;

  // Load persisted class selection once
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('ui.selectedClass') : null;
    if (saved) setSelectedClass(saved);
  }, []);

  // Persist selection on change
  useEffect(() => {
    if (selectedClass) {
      try { window.localStorage.setItem('ui.selectedClass', selectedClass); } catch (_) {}
    }
  }, [selectedClass]);

  // Fetch students and attendance config when selected class changes
  useEffect(() => {
    const fetchData = async () => {
      if (!selectedClass) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Fetch students
        const [studentsData, configData] = await Promise.all([
          getStudentsByClass(selectedClass),
          getAttendanceConfig(selectedClass)
        ]);
        
        setStudents(Array.isArray(studentsData) ? studentsData : []);
        
        // Update attendance config if available
        if (configData) {
          setAttendanceConfig({
            schoolWorkingDays: configData.schoolWorkingDays || 0,
            holidays: configData.holidays || 0,
            academicYear: configData.academicYear || '2024-2025'
          });
        }
      } catch (e) {
        console.error('Error fetching data:', e);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [selectedClass]);

  const handleAttendanceImport = async (importData) => {
    if (!selectedClass) return false;
    
    setImporting(true);
    setImportError(null);
    
    try {
      // Process each student's attendance
      const updates = importData.attendance.map(record => {
        const student = students.find(s => s.rollNumber === record.rollNumber || s.studentId === record.studentId);
        if (!student) return null;
        
        // Update attendance based on the imported data
        // This is a simplified example - adjust according to your data structure
        return {
          id: student._id,
          data: {
            attendance: record.dates
          }
        };
      }).filter(Boolean);
      
      // Update all students' attendance
      await Promise.all(updates.map(update => 
        updateStudent(update.id, update.data)
      ));
      
      // Refresh the student list
      const data = await getStudentsByClass(selectedClass);
      setStudents(Array.isArray(data) ? data : []);
      return true;
    } catch (err) {
      console.error('Error importing attendance:', err);
      setImportError(err.message || 'Failed to import attendance');
      return false;
    } finally {
      setImporting(false);
    }
  };

  const handleEditAttendance = (student) => {
    // Reset any previous state
    setError(null);
    setSubmitting(false);
    
    // Set the student being edited
    setEditingStudent(student);
    
    // Set present days from student.attendance (which is now just a number)
    const present = student.attendance || 0;
    setEditingPresentDays(present.toString());
    
    // Show the modal
    setShowAttendanceModal(true);
    
    // Show the modal after state updates
    setShowAttendanceModal(true);
  };

  // Function to handle opening the edit modal for a student
  const handleEditStudent = (student) => {
    // Get present days from student.attendance (which is now just a number)
    const present = student.attendance || 0;
    setEditingStudent(student);
    setEditingPresentDays(present.toString());
    setShowAttendanceModal(true);
  };

  // Handle mark all present/absent
  const handleMarkAll = async (present) => {
    if (!selectedClass || !students.length) return;
    
    if (!window.confirm(`Are you sure you want to mark all students as ${present ? 'present' : 'absent'}?`)) {
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      const updates = students.map(student => {
        const [currentPresent = '0', currentTotal = '0'] = (student.attendance || '0/0').split('/');
        const newPresent = present ? (parseInt(currentPresent) + 1).toString() : currentPresent;
        const newTotal = (parseInt(currentTotal) + 1).toString();
        return {
          id: student._id,
          data: { attendance: `${newPresent}/${newTotal}` }
        };
      });

      // Update all students' attendance
      await Promise.all(updates.map(update => 
        updateStudent(update.id, update.data)
      ));
      
      // Refresh the student list
      const data = await getStudentsByClass(selectedClass);
      setStudents(Array.isArray(data) ? data : []);
      
      toast.success(`Marked all students as ${present ? 'present' : 'absent'}`);
    } catch (err) {
      console.error('Error updating attendance:', err);
      toast.error('Failed to update attendance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Attendance Management</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Track and manage student attendance records</p>
      </div>

      {/* Class Selector Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 w-full">
        <div className="flex items-center gap-2 mb-4">
          <FiUsers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Select Class</h3>
        </div>
        <div className="w-full">
          <ClassSelectorCard 
            selectedClass={selectedClass}
            onSelect={handleClassSelect}
            title="Select Class for Attendance"
          />
        </div>
      </div>

      {/* Enhanced Attendance Configuration */}
      <div className="bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <FiSettings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Attendance Configuration</h3>
          </div>
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center space-x-2"
          >
            <FiSettings className="w-4 h-4" />
            Configure Settings
          </button>
        </div>
        
        {selectedClass ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <FiUsers className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Class</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{selectedClass}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <FiCalendar className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Working Days</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {attendanceConfig.schoolWorkingDays || 'Not set'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-md border border-gray-100 dark:border-gray-700">
              <div className="flex items-center space-x-3 mb-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <FiCalendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Holidays</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">
                    {attendanceConfig.holidays || 'Not set'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="inline-flex items-center space-x-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <FiInfo className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Select a class to view configuration</p>
            </div>
          </div>
        )}
      </div>

      {/* Import Card - Only show when a class is selected */}
      {selectedClass && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowImportModal(true)}
              disabled={!selectedClass || importing}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 disabled:opacity-50"
            >
              <FiUpload size={16} />
              {importing ? 'Importing...' : 'Import from Excel'}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Upload an Excel file with student attendance data
            </p>
          </div>
        </div>
      )}

      {/* Students Grid */}
      {selectedClass && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Students in {selectedClass}
              {students.length > 0 && (
                <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                  ({students.filter(s => {
                    if (!s.attendance) return false;
                    return typeof s.attendance === 'string' 
                      ? s.attendance.includes('/') 
                      : !isNaN(Number(s.attendance));
                  }).length} students with attendance recorded)
                </span>
              )}
            </h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading students...</p>
            </div>
          ) : error ? (
            <div className="p-4 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-md m-4">
              {error}
            </div>
          ) : importError ? (
            <div className="p-4 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-md m-4">
              {importError}
            </div>
          ) : students.length > 0 ? (
            <div className="space-y-3 p-6">
              {/* Student List with Enhanced Bars */}
              <div className="space-y-3">
                {students.map((student, index) => {
                  // Safely handle both number and string formats for attendance
                  let presentDays, totalDays;
                  if (typeof student.attendance === 'number') {
                    presentDays = student.attendance;
                    totalDays = attendanceConfig.schoolWorkingDays || 1;
                  } else if (typeof student.attendance === 'string') {
                    const parts = (student.attendance || '0/0').split('/');
                    presentDays = parseInt(parts[0], 10) || 0;
                    totalDays = parts.length > 1 ? parseInt(parts[1], 10) || 1 : 1;
                  } else {
                    presentDays = 0;
                    totalDays = attendanceConfig.schoolWorkingDays || 1;
                  }
                  const absentDays = Math.max(0, totalDays - presentDays);
                  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;
                  
                  // Determine status color
                  const statusColor = percentage >= 75 ? 'green' : percentage >= 50 ? 'amber' : 'red';
                  const statusGradient = percentage >= 75 ? 'from-green-400 to-emerald-500' : percentage >= 50 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-rose-500';
                  
                  return (
                  <div key={student._id} className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 p-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.02] overflow-hidden">
                      {/* Animated Background Pattern */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${statusGradient} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                      
                      <div className="relative flex items-center space-x-4">
                        {/* Student Photo */}
                        <div className="flex-shrink-0 relative">
                          <div className={`absolute -inset-1 bg-gradient-to-br ${statusGradient} rounded-full opacity-20 animate-pulse`}></div>
                          {student.photoUrl ? (
                            <img
                              src={student.photoUrl}
                              alt={student.studentName || 'Student'}
                              className="relative h-11 w-11 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-lg z-10"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                const fallback = e.target.nextElementSibling;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : (
                            <div className="h-11 w-11 rounded-full border-2 border-white dark:border-gray-700 flex items-center justify-center bg-gradient-to-br from-gray-400 to-gray-600 text-white font-bold text-sm shadow-lg z-10">
                              {student.studentName ? student.studentName.trim().charAt(0).toUpperCase() : 'N'}
                            </div>
                          )}
                        </div>
                        
                        {/* Student Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate capitalize">
                                {student.studentName?.trim() || 'No Name'}
                              </h3>
                              <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-gray-400 mr-1.5"></span>
                                  Roll: {student.roll?.trim() || 'N/A'}
                                </span>
                                <span className="flex items-center">
                                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-1.5"></span>
                                  {selectedClass || 'N/A'}
                                </span>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => handleEditStudent(student)}
                              className="flex-shrink-0 p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all duration-200 group"
                              title="Edit attendance"
                            >
                              <FiEdit2 size={14} className="group-hover:scale-110 transition-transform duration-200" />
                            </button>
                          </div>
                          
                          {/* Attendance Progress */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Attendance Progress</span>
                              <span className="font-bold text-gray-900 dark:text-white">{presentDays}/{totalDays} ({percentage}%)</span>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="relative">
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                <div 
                                  className={`h-2 rounded-full bg-gradient-to-r ${statusGradient} transition-all duration-500 ease-out relative overflow-hidden`}
                                  style={{ width: `${Math.min(100, percentage)}%` }}
                                >
                                  {/* Animated shimmer effect */}
                                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
                                </div>
                              </div>
                              
                              {/* Percentage Badge */}
                              <div className={`absolute -top-1 -right-1 px-2 py-1 rounded-full text-xs font-bold text-white shadow-lg ${
                                percentage >= 75 ? 'bg-green-500' : 
                                percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}>
                                {percentage}%
                              </div>
                            </div>
                            
                            {/* Stats Row */}
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center space-x-3">
                                <span className="flex items-center text-green-600 dark:text-green-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1"></span>
                                  {presentDays} present
                                </span>
                                <span className="flex items-center text-red-600 dark:text-red-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1"></span>
                                  {absentDays} absent
                                </span>
                              </div>
                              
                              {/* Status Badge */}
                              <div className={`px-2 py-1 rounded-full text-xs font-bold text-white shadow-md ${
                                percentage >= 75 ? 'bg-green-500' : 
                                percentage >= 50 ? 'bg-amber-500' : 'bg-red-500'
                              }`}>
                                {percentage >= 75 ? 'Excellent' : percentage >= 50 ? 'Good' : 'Needs Attention'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">No students found in {selectedClass}.</p>
              <p className="text-sm text-gray-400 mt-1">Please check if the class has any enrolled students.</p>
            </div>
          )}
        </div>
      )}

      {/* Attendance Edit Modal */}
      <EditAttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => {
          setShowAttendanceModal(false);
          setEditingStudent(null);
          setEditingPresentDays('');
        }}
        student={editingStudent}
        presentDays={editingPresentDays}
        totalDays={attendanceConfig.schoolWorkingDays}
        onSave={async (updatedStudent) => {
          try {
            setSubmitting(true);
            
            // Convert attendance to a number
            const attendanceNumber = typeof updatedStudent.attendance === 'number' 
              ? updatedStudent.attendance 
              : parseInt(updatedStudent.attendance, 10) || 0;
            
            // Update the student in the database with attendance as a number
            await updateStudent(updatedStudent._id, { 
              attendance: attendanceNumber
            });
            
            // Update the student in the local state
            setStudents(students.map(s => 
              s._id === updatedStudent._id ? {
                ...s,
                attendance: attendanceNumber,
                attendancePercentage: attendanceConfig.schoolWorkingDays > 0 
                  ? Math.round((attendanceNumber / attendanceConfig.schoolWorkingDays) * 100) 
                  : 0
              } : s
            ));
            
            setShowAttendanceModal(false);
            setEditingStudent(null);
            setEditingPresentDays('');
            toast.success('Attendance updated successfully');
          } catch (error) {
            console.error('Error updating attendance:', error);
            toast.error('Failed to update attendance');
          } finally {
            setSubmitting(false);
          }
        }}
      />

      {/* Attendance Import Modal */}
      <ExcelImportModalForAttendance
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Attendance"
        selectedColumns={['Roll Number', 'Student Name', 'Attendance']}
        onImport={async (importedData) => {
          try {
            setImporting(true);
            setImportError(null);
            
            // Extract rows from the imported data object
            const rows = importedData.rows || importedData;
            console.log('=== ATTENDANCE IMPORT (BULK MODE) ===');
            console.log('Total rows to process:', rows.length);
            
            // Prepare bulk updates
            const bulkUpdates = [];
            const errors = [];
            
            for (const row of rows) {
              try {
                const rollNumber = String(row['Roll Number'] || '').trim();
                const attendanceValue = row['Attendance'];
                
                if (!rollNumber) {
                  errors.push({ row, reason: 'No roll number' });
                  continue;
                }
                
                // Parse attendance - handle "Abs" as 0
                let presentDays;
                if (attendanceValue === 'Abs' || attendanceValue === 'AB' || attendanceValue === 'ab') {
                  presentDays = 0;
                } else {
                  presentDays = parseInt(attendanceValue, 10);
                }
                
                if (isNaN(presentDays)) {
                  errors.push({ row, reason: `Invalid attendance: ${attendanceValue}` });
                  continue;
                }
                
                // Find student by roll number
                const student = students.find(s => String(s.roll).trim() === rollNumber);
                
                if (student) {
                  bulkUpdates.push({
                    studentId: student._id,
                    rollNumber: rollNumber,
                    attendance: presentDays
                  });
                } else {
                  errors.push({ row, reason: `Student not found with roll: ${rollNumber}` });
                }
              } catch (err) {
                errors.push({ row, reason: err.message });
              }
            }
            
            console.log(`Prepared ${bulkUpdates.length} updates`);
            console.log(`Errors: ${errors.length}`);
            
            if (bulkUpdates.length === 0) {
              toast.warning('No valid attendance records to import');
              return false;
            }
            
            // Perform bulk update with single API call
            console.log('📤 Sending bulk update request...');
            const startTime = Date.now();
            
            const response = await api.post('/students/bulk-update/attendance', {
              class: selectedClass,
              updates: bulkUpdates
            });
            
            const duration = ((Date.now() - startTime) / 1000).toFixed(1);
            console.log(`✅ Bulk update completed in ${duration}s`);
            console.log('Server response:', response.data);
            
            // Refresh the students list
            console.log('🔄 Refreshing students list...');
            await fetchStudents();
            
            const successCount = response.data.modifiedCount || bulkUpdates.length;
            toast.success(`Successfully imported attendance for ${successCount} students in ${duration}s`);
            if (errors.length > 0) {
              toast.warning(`${errors.length} records had errors. Check console for details.`);
              console.log('Error details:', errors);
            }
            
            return true;
          } catch (err) {
            console.error('❌ Import failed:', err);
            setImportError(err?.message || 'Failed to import attendance');
            toast.error('Failed to import attendance');
            return false;
          } finally {
            setImporting(false);
          }
        }}
        selectedClass={selectedClass}
      />

      <AttendanceConfigModal
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        selectedClass={selectedClass}
        initialConfig={attendanceConfig}
        onSave={async (config) => {
          try {
            // Call the API to save the configuration
            await updateAttendanceConfig(selectedClass, {
              schoolWorkingDays: config.schoolWorkingDays,
              holidays: config.holidays
            }, config.academicYear);
            
            // Update local state
            setAttendanceConfig(config);
            
            // Update all students' total days to match the new configuration
            const updates = students.map(student => ({
              id: student._id,
              data: {
                attendance: student.attendance 
                  ? `${student.attendance.split('/')[0]}/${config.schoolWorkingDays}`
                  : `0/${config.schoolWorkingDays}`
              }
            }));
            
            // Update all students in parallel
            await Promise.all(updates.map(update => 
              updateStudent(update.id, update.data)
            ));
            
            // Refresh the students list
            await fetchStudents();
            
            toast.success('Attendance configuration saved successfully');
          } catch (error) {
            console.error('Error saving attendance config:', error);
            toast.error('Failed to save attendance configuration');
          }
        }}
      />
    </div>
  );
}
