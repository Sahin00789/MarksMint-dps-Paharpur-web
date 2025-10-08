import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { FiUpload, FiCalendar, FiSettings, FiUsers, FiPlus, FiEdit2 } from 'react-icons/fi';
import AttendanceConfigModal from './Modals/AttendanceConfigModal';
import EditAttendanceModal from './Modals/EditAttendanceModal';
import ExcelImportModalForAttendance from './Modals/ExcelImportModalForAttendance';
import ClassSelectorCard from '@/components/common/ClassSelectorCard';
import { getStudentsByClass, updateStudent } from '@/services/students';
import { getAttendanceConfig, updateAttendanceConfig } from '@/services/attendanceConfig';
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

    const presentCount = students.reduce((sum, student) => {
      // If attendance is a number, use it directly (capped at schoolWorkingDays)
      if (typeof student.attendance === 'number') {
        return sum + Math.min(student.attendance, attendanceConfig.schoolWorkingDays);
      }
      // Handle old format 'present/total' if needed
      const [daysPresent] = (student.attendance || '0/0').split('/').map(Number);
      return sum + Math.min(isNaN(daysPresent) ? 0 : daysPresent, attendanceConfig.schoolWorkingDays);
    }, 0);

    const totalPossibleDays = students.length * attendanceConfig.schoolWorkingDays;
    const absentCount = Math.max(0, totalPossibleDays - presentCount);
    
    return {
      totalDays: attendanceConfig.schoolWorkingDays,
      presentDays: presentCount,
      absentDays: absentCount,
      percentage: Math.round((presentCount / totalPossibleDays) * 100) || 0
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

      {/* Quick Actions Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Attendance Configuration</h3>
          <button
            onClick={() => setShowConfigModal(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:bg-gray-600"
            title="Configure Attendance"
          >
            <FiSettings className="mr-1.5 h-3.5 w-3.5" />
            Configure
          </button>
        </div>
        
        {selectedClass ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Class</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{selectedClass}</p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Total Working Days</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {attendanceConfig.schoolWorkingDays || 'Not set'}
              </p>
            </div>
            <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Holidays</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {attendanceConfig.holidays || 'Not set'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">Select a class to view configuration</p>
        )}
      </div>

      {/* Import Card - Only show when a class is selected */}
      {selectedClass && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-4">
            <FiUpload className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Import Attendance</h3>
          </div>
          
          <div>
            <button
              onClick={() => setShowImportModal(true)}
              disabled={!selectedClass || importing}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-sm rounded-md hover:bg-amber-600 disabled:opacity-50"
            >
              <FiUpload size={16} />
              {importing ? 'Importing...' : 'Import from Excel'}
            </button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
              {students.map((student) => {
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
                
                return (
                  <div key={student._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out transform hover:scale-[1.02] hover:shadow-md hover:border-pink-200 dark:hover:border-pink-500/30">
                    {/* Student Header */}
                    <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-3 relative rounded-t-2xl">
                      <div className="absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 bg-white/10 rounded-full"></div>
                      <div className="relative z-10 flex items-center space-x-3">
                        <div className="flex-shrink-0 relative">
                          {student.photoUrl ? (
                            <>
                              <img
                                src={student.photoUrl}
                                alt={student.studentName || 'Student'}
                                className="h-10 w-10 rounded-full object-cover border-2 border-white/40"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = 'none';
                                  const fallback = e.target.nextElementSibling;
                                  if (fallback) fallback.style.display = 'flex';
                                }}
                              />
                              <div className="h-10 w-10 rounded-full border-2 border-white/40 items-center justify-center bg-pink-400/30 backdrop-blur-sm text-white font-bold text-sm hidden">
                                {student.studentName ? student.studentName.trim().charAt(0).toUpperCase() : 'N'}
                              </div>
                            </>
                          ) : (
                            <div className="h-10 w-10 rounded-full border-2 border-white/40 flex items-center justify-center bg-pink-400/30 backdrop-blur-sm text-white font-bold text-sm">
                              {student.studentName ? student.studentName.trim().charAt(0).toUpperCase() : 'N'}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-semibold text-white truncate">
                            {student.studentName?.trim() || 'No Name'}
                          </h3>
                          <div className="flex items-center space-x-1.5">
                            <span className="text-xs text-pink-100">R: {student.roll?.trim() || 'N/A'}</span>
                            <span className="text-pink-200">•</span>
                            <span className="text-xs text-pink-100">{selectedClass || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Attendance Stats */}
                    <div className="p-4 bg-white dark:bg-gray-800">
                      <div className="space-y-3">
                        {/* Present Days */}
                        <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3 border border-pink-100 dark:border-pink-800/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                              <span className="text-sm font-medium text-pink-800 dark:text-pink-200">Present</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-base font-bold text-pink-600 dark:text-pink-400">
                                {typeof student.attendance === 'number' 
                                  ? student.attendance 
                                  : (student.attendance || '0/0').split('/')[0]}
                              </span>
                              <span className="ml-1 text-xs text-pink-600/70 dark:text-pink-400/70">days</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Absent Days */}
                        <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-3 border border-rose-100 dark:border-rose-800/30">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                              <span className="text-sm font-medium text-rose-800 dark:text-rose-200">Absent</span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-base font-bold text-rose-600 dark:text-rose-400">
                                {attendanceConfig.schoolWorkingDays - 
                                  (typeof student.attendance === 'number' 
                                    ? student.attendance 
                                    : (() => {
                                        const parts = (student.attendance || '0/0').toString().split('/');
                                        return parseInt(parts[0], 10) || 0;
                                      })())}
                              </span>
                              <span className="ml-1 text-xs text-rose-600/70 dark:text-rose-400/70">days</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Total Days */}
                        <div className="bg-rose-50/50 dark:bg-rose-900/10 rounded-lg p-3 border border-rose-50 dark:border-rose-800/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 rounded-full bg-rose-400"></div>
                              <span className="text-sm font-medium text-rose-800/90 dark:text-rose-200">Total </span>
                            </div>
                            <div className="flex items-center">
                              <span className="text-base font-bold text-rose-700 dark:text-rose-300">
                                {attendanceConfig.schoolWorkingDays}
                              </span>
                              <span className="ml-1 text-xs text-rose-600/70 dark:text-rose-300/70">days</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                            <span>Attendance</span>
                            <span className="font-medium">{percentage}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                            <div 
                              className="h-2 rounded-full bg-gradient-to-r from-pink-500 to-rose-500" 
                              style={{ width: `${Math.min(100, percentage)}%` }}
                            ></div>
                          </div>
                        </div>
                        
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditStudent(student)}
                          className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-medium rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                          title="Edit attendance"
                        >
                          <FiEdit2 size={16} className="text-white" />
                          <span>Edit Attendance</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
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
            
            // Process the imported data
            const updatedStudents = [...students];
            let successCount = 0;
            let errorCount = 0;
            
            for (const row of importedData) {
              try {
                const rollNumber = String(row['Roll Number']).trim();
                const presentDays = parseInt(row['Attendance'], 10);
                
                if (isNaN(presentDays)) {
                  console.warn(`Invalid attendance value for roll ${rollNumber}:`, row['Attendance']);
                  errorCount++;
                  continue;
                }
                
                const student = updatedStudents.find(s => String(s.roll).trim() === rollNumber);
                if (student) {
                  await updateStudent(student._id, { 
                    attendance: `${presentDays}/${attendanceConfig.schoolWorkingDays}`
                  });
                  successCount++;
                } else {
                  console.warn(`Student with roll ${rollNumber} not found`);
                  errorCount++;
                }
              } catch (err) {
                console.error(`Error processing student ${row['Roll Number']}:`, err);
                errorCount++;
              }
            }
            
            // Refresh the students list
            if (successCount > 0) {
              await fetchStudents();
              toast.success(`Successfully imported attendance for ${successCount} students`);
              if (errorCount > 0) {
                toast.warning(`Failed to import ${errorCount} records`);
              }
            } else {
              toast.warning('No attendance records were updated');
            }
            
            return true;
          } catch (err) {
            console.error('Import failed:', err);
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
