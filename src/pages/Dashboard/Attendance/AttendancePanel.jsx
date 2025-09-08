import React, { useEffect, useState, useRef, useMemo } from "react";
import { FiUpload } from 'react-icons/fi';
import ClassSelectorCard from '../common/ClassSelectorCard';
import StudentCard from '../common/StudentCard';
import ModalPortal from '../common/ModalPortal';
import PrintButton from '../common/PrintButton';
import { getStudentsByClass, updateStudent } from '../../services/students';
import AttendanceImportModal from '../Modals/Attendance/AttendanceImportModal';
import EditAttendanceModal from '../Modals/Attendance/EditAttendanceModal';

export default function AttendancePanel() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [presentDays, setPresentDays] = useState('');
  const [totalDays, setTotalDays] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const fileInputRef = useRef(null);

  // Prepare data for printing
  const printData = useMemo(() => {
    if (!students.length) return [];
    
    return students.map(student => ({
      _id: student._id,
      studentName: student.studentName,
      roll: student.roll,
      class: student.class,
      section: student.section || '',
      attendance: student.attendance || '0/0',
      attendancePercentage: student.attendance ? 
        (() => {
          const [present, total] = student.attendance.split('/').map(Number);
          return total > 0 ? `${Math.round((present / total) * 100)}%` : '0%';
        })() : '0%'
    }));
  }, [students]);

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
    
    // Parse existing attendance if it exists (format: "present" or "present/total")
    if (student.attendance) {
      if (student.attendance.includes('/')) {
        const [present, total] = student.attendance.split('/').map(Number);
        setPresentDays(isNaN(present) ? '' : present.toString());
        setTotalDays(isNaN(total) ? '' : total.toString());
      } else {
        // Handle case where attendance is just a number (no total)
        const present = parseInt(student.attendance);
        setPresentDays(isNaN(present) ? '' : present.toString());
        setTotalDays('');
      }
    } else {
      setPresentDays('');
      setTotalDays('');
    }
    
    // Show the modal after state updates
    setShowAttendanceModal(true);
  };

  const handleUpdateAttendance = async () => {
    const present = presentDays ? parseInt(presentDays) : 0;
    if (isNaN(present) || present < 0) {
      setError('Please enter a valid number of present days');
      return;
    }
    
    setSubmitting(true);
    setError(null);
    
    try {
      // If editing a specific student
      if (editingStudent) {
        try {
          // Keep the existing total days if they exist, otherwise use present days as total
          const total = totalDays ? parseInt(totalDays) : present;
          const attendanceStr = total > 0 ? `${present}/${total}` : `${present}`;
          
          await updateStudent(editingStudent._id, { attendance: attendanceStr });
          
          const updatedStudents = students.map(s => 
            s._id === editingStudent._id 
              ? { ...s, attendance: attendanceStr } 
              : s
          );
          setStudents(updatedStudents);
          setShowAttendanceModal(false);
        } catch (error) {
          console.error('Error updating attendance:', error);
          setError('Failed to update attendance');
        }
      } else {
        // Bulk updating all students
        const updates = students.map(student => {
          // Preserve the total days if they exist, otherwise use present days as total
          let total = present;
          if (student.attendance && student.attendance.includes('/')) {
            const [, existingTotal] = student.attendance.split('/');
            total = parseInt(existingTotal) || present;
          }
          const attendanceStr = total > 0 ? `${present}/${total}` : `${present}`;
          
          return {
            id: student._id,
            data: { attendance: attendanceStr }
          };
        });
        
        await Promise.all(updates.map(update => 
          updateStudent(update.id, update.data)
        ));
        
        // Refresh the student list
        const data = await getStudentsByClass(selectedClass);
        setStudents(Array.isArray(data) ? data : []);
      }
      
      setShowAttendanceModal(false);
      setEditingStudent(null);
      setPresentDays('');
      setTotalDays('');
    } catch (err) {
      console.error('Error updating attendance:', err);
      setError('Failed to update attendance');
    } finally {
      setSubmitting(false);
    }
  };

  

  return (
    <div className="space-y-4 p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Attendance Management</h2>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (students.length === 0) {
                setError('No students found in the selected class');
                return;
              }
              setShowAttendanceModal(true);
            }}
            disabled={!selectedClass || students.length === 0}
            className={`px-4 py-2 ${!selectedClass || students.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white rounded-md transition-colors`}
          >
            Mark Attendance
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            disabled={!selectedClass || importing}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg shadow-sm transition-all ${
              selectedClass && !importing
                ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md transform hover:-translate-y-0.5'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!selectedClass ? 'Please select a class first' : ''}
          >
            <FiUpload className="text-base" />
            Import Attendance
          </button>
          <PrintButton 
            data={printData}
            title={`Attendance - ${selectedClass || 'All Classes'}`}
            type="attendance"
            buttonText="Print Attendance"
            className="no-print"
          />
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full ">
          <ClassSelectorCard 
            selected={selectedClass}
            onSelect={setSelectedClass}
          />
          <AttendanceImportModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleAttendanceImport}
            selectedClass={selectedClass}
          />
          <input 
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files && e.target.files[0];
              if (!file || !selectedClass) return;
              setImportError(null);
              setImporting(true);
              try {
                const XLSX = (await import('xlsx')).default;
                const data = await file.arrayBuffer();
                const wb = XLSX.read(data, { type: 'array' });
                const sheetName = wb.SheetNames[0];
                const ws = wb.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

                // Build a map: roll -> attendance
                const norm = (k) => String(k || '').trim().toLowerCase();
                const rollKeys = ['roll', 'Roll', 'ROLL'];
                const attKeys = ['attendance', 'Attendance', 'ATTENDANCE'];

                const findKey = (obj, candidates) => {
                  const keys = Object.keys(obj);
                  for (const c of candidates) {
                    const found = keys.find(k => norm(k) === norm(c));
                    if (found) return found;
                  }
                  return null;
                };

                const rollKey = rows.length ? findKey(rows[0], rollKeys) : null;
                const attKey = rows.length ? findKey(rows[0], attKeys) : null;
                if (!rollKey || !attKey) throw new Error('Missing required columns: Roll and Attendance');

                const incoming = new Map();
                for (const r of rows) {
                  const rollVal = r[rollKey];
                  if (rollVal === undefined || rollVal === null || String(rollVal).trim() === '') continue;
                  incoming.set(String(rollVal).trim(), r[attKey]);
                }

                // Apply to current students (optimistic UI), then persist
                const updated = students.map(s => {
                  const v = incoming.get(String(s.roll).trim());
                  return v !== undefined ? { ...s, attendance: v } : s;
                });
                setStudents(updated);

                // Persist sequentially to avoid server overload
                for (const s of updated) {
                  const v = incoming.get(String(s.roll).trim());
                  if (v !== undefined && s._id) {
                    try {
                      await updateStudent(s._id, { attendance: v });
                    } catch (_) {
                      // keep going; collect minimal error
                      setImportError('Some rows failed to save.');
                    }
                  }
                }

                // Clear input to allow same file reselect
                if (fileInputRef.current) fileInputRef.current.value = '';
              } catch (err) {
                setImportError(err?.message || 'Import failed');
              } finally {
                setImporting(false);
              }
            }}
          />
          <button
            disabled={!selectedClass || importing}
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
            className="bg-amber-500 text-white px-3 py-2 rounded-md text-sm hover:bg-amber-600 disabled:opacity-60 disabled:cursor-not-allowed"
            aria-disabled={!selectedClass || importing}
            title={!selectedClass ? 'Select a class first' : 'Import attendance from Excel'}
          >
            {importing ? 'Importing…' : 'Import'}
          </button>
          <button onClick={async () => {
            // Export attendance view
            try {
              const XLSX = (await import('xlsx')).default;
              const rows = students.map(s => ({
                Class: s.class,
                Roll: s.roll,
                Name: s.studentName,
                Section: s.section || '',
                Attendance: s.attendance || ''
              }));
              const ws = XLSX.utils.json_to_sheet(rows);
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
              XLSX.writeFile(wb, `${selectedClass || 'class'}-attendance.xlsx`);
            } catch (_) {}
          }} className="bg-gray-900/80 dark:bg-gray-700 text-white px-3 py-2 rounded-md text-sm hover:bg-gray-900 dark:hover:bg-gray-600">Export</button>
        </div>
      </div>

      {/* Content */}
      {!selectedClass && (
        <p className="text-sm text-gray-600 dark:text-gray-300">Select a class to manage attendance.</p>
      )}
      {selectedClass && loading && (
        <p className="text-sm text-gray-600 dark:text-gray-300">Loading students…</p>
      )}
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {importError && (
        <p className="text-sm text-amber-700">{importError}</p>
      )}

      {selectedClass && !loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {students.map((stu) => (
            <StudentCard key={stu._id || `${stu.class}_${stu.roll}`} student={stu} variant="attendance" onEditAttendance={handleEditAttendance} />
          ))}
          {students.length === 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-300">No students found for {selectedClass}.</p>
          )}
        </div>
      )}

      {/* Attendance Edit Modal */}
      <EditAttendanceModal
        isOpen={showAttendanceModal}
        onClose={() => {
          setShowAttendanceModal(false);
          setEditingStudent(null);
          setPresentDays('');
        }}
        student={editingStudent}
        presentDays={presentDays}
        setPresentDays={setPresentDays}
        onSubmit={handleUpdateAttendance}
        submitting={submitting}
      />
    </div>
  );
}
