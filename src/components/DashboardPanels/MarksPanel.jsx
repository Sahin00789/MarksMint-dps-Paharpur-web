import React, { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { FiUpload, FiPrinter } from 'react-icons/fi';
import ClassSelectorCard from '../common/ClassSelectorCard';
import StudentCard from '../common/StudentCard';
import ModalPortal from '../common/ModalPortal';
import { getStudentsByClass, updateStudent, bulkUpdateMarks } from '../../services/students';
import { getClassConfig } from '../../services/config';
import MarksImportModal from '../Modals/Marks/MarksImportModal';
import MarksPrintPreview from '../Modals/Marks/MarksPrintPreview';

export default function MarksPanel() {
  const [selectedClass, setSelectedClass] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [exams, setExams] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showMarksModal, setShowMarksModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [marksForm, setMarksForm] = useState({});
  const [showImportModal, setShowImportModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const printPreviewRef = useRef(null);

  // Handle marks import
  const handleMarksImport = useCallback(async (importData) => {
    if (!selectedClass || !selectedExam) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Transform the mapping into the format expected by the API
      const marksData = [];
      
      // This is a simplified example - you'll need to adjust based on your actual Excel structure
      // and API requirements
      Object.entries(importData.mapping).forEach(([subjectCode, excelHeader]) => {
        if (!excelHeader) return; // Skip unmapped subjects
        
        // Here you would process the Excel data based on the mapping
        // This is a placeholder - you'll need to implement the actual transformation
        // based on your Excel structure
        marksData.push({
          subjectCode,
          marks: {} // This should contain the actual marks data from Excel
        });
      });
      
      await bulkUpdateMarks(selectedClass, selectedExam, marksData);
      
      // Refresh the student data
      const data = await getStudentsByClass(selectedClass);
      setStudents(Array.isArray(data) ? data : []);
      
      return true;
    } catch (error) {
      console.error('Error importing marks:', error);
      setError(error.message || 'Failed to import marks');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [selectedClass, selectedExam]);

  // Load and persist class selection
  useEffect(() => {
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem('ui.selectedClass') : null;
    if (saved) setSelectedClass(saved);
  }, []);

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
        const [data, cfg] = await Promise.all([
          getStudentsByClass(selectedClass),
          getClassConfig(selectedClass),
        ]);
        setStudents(Array.isArray(data) ? data : []);
        setExams(Array.isArray(cfg?.exams) ? cfg.exams : []);
        setSubjects(Array.isArray(cfg?.subjects) ? cfg.subjects : []);
        if (!selectedExam && Array.isArray(cfg?.exams) && cfg.exams.length) {
          setSelectedExam(cfg.exams[0]);
        }
      } catch (e) {
        setError('Failed to load students/config');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedClass]);

  const subjectList = useMemo(() => Array.isArray(subjects) ? subjects : [], [subjects]);

  const openMarksModal = (stu) => {
    setEditingStudent(stu);
    const termMarks = (stu?.marks && typeof stu.marks === 'object' ? (stu.marks[selectedExam] || {}) : {}) || {};
    const init = Object.fromEntries(subjectList.map(sub => [sub, termMarks[sub] ?? '']));
    setMarksForm(init);
    setShowMarksModal(true);
  };

  const handleMarksChange = (sub, val) => {
    setMarksForm(prev => ({ ...prev, [sub]: val }));
  };

  const saveMarks = async (e) => {
    e.preventDefault();
    if (!editingStudent?._id || !selectedExam) return;
    setSubmitting(true);
    try {
      // Build new marks object: keep others, replace selectedExam
      const existing = (editingStudent.marks && typeof editingStudent.marks === 'object') ? editingStudent.marks : {};
      const cleaned = {};
      Object.entries(marksForm).forEach(([k, v]) => {
        if (v === '' || v === null || v === undefined) return; // skip empty to let backend ignore
        cleaned[k] = v;
      });
      const payload = { marks: { ...existing, [selectedExam]: cleaned } };
      await updateStudent(editingStudent._id, payload);
      setShowMarksModal(false);
      setEditingStudent(null);
      await (async () => {
        try {
          const data = await getStudentsByClass(selectedClass);
          setStudents(Array.isArray(data) ? data : []);
        } catch (_) {}
      })();
    } catch (e) {
      setError('Failed to save marks');
    } finally {
      setSubmitting(false);
    }
  };

  // Prepare data for printing
  const printData = useMemo(() => {
    return students.map(student => ({
      ...student,
      studentName: student.name || student.studentName,
      marks: student.marks?.[selectedExam] || {}
    }));
  }, [students, selectedExam]);

  // Handle print action
  const handlePrint = useCallback(() => {
    console.log('handlePrint called');
    console.log('printData:', printData);
    setShowPrintPreview(true);
  }, [printData]);

  return (
    <div className="space-y-4 p-4">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Marks Management</h2>
            {selectedClass && selectedExam && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedClass} - {selectedExam}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowImportModal(true)}
              disabled={!selectedClass || loading}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg shadow-sm transition-all ${
                selectedClass && !loading
                  ? 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md transform hover:-translate-y-0.5'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!selectedClass ? 'Please select a class first' : ''}
            >
              <FiUpload className="text-base" />
              Import Marks
            </button>
            <button
              onClick={() => {
                console.log('Print button clicked');
                console.log('selectedClass:', selectedClass);
                console.log('selectedExam:', selectedExam);
                console.log('students:', students);
                handlePrint();
              }}
              disabled={!selectedClass || !selectedExam || students.length === 0}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white ${
                !selectedClass || !selectedExam || students.length === 0
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
              title={!selectedClass ? 'Select a class first' : !selectedExam ? 'Select an exam first' : students.length === 0 ? 'No students found' : 'Print marks'}
            >
              <FiPrinter className="mr-2 h-4 w-4" />
              Print Marks
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full">
            <ClassSelectorCard 
              selected={selectedClass}
              onSelect={setSelectedClass}
            />
            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2 dark:text-white">Select Exam:</h3>
              <div className="flex flex-wrap gap-2">
                {exams.length > 0 ? (
                  exams.map(exam => (
                    <button 
                      key={exam} 
                      onClick={() => setSelectedExam(exam)} 
                      className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                        selectedExam === exam 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-600'
                      }`}
                    >
                      {exam}
                    </button>
                  ))
                ) : (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    No exams configured. Configure in Configuration panel.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          {!selectedClass ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">Select a class to manage marks.</p>
          ) : loading ? (
            <p className="text-sm text-gray-600 dark:text-gray-300">Loading students…</p>
          ) : error ? (
            <p className="text-sm text-red-600">{error}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.length > 0 ? (
                students.map((stu) => (
                  <StudentCard
                    key={stu._id || `${stu.class}_${stu.roll}`}
                    student={stu}
                    variant="marks"
                    onView={() => {}}
                    onEdit={() => {}}
                    onEditMarks={selectedExam ? openMarksModal : undefined}
                    selectedExam={selectedExam}
                    subjects={subjectList}
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
      </div>

      {/* Import Marks Modal */}
      {showImportModal && (
        <MarksImportModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onImport={handleMarksImport}
          classId={selectedClass}
          examId={selectedExam}
        />
      )}
      
      <MarksPrintPreview
        ref={printPreviewRef}
        isOpen={showPrintPreview}
        onClose={() => setShowPrintPreview(false)}
        data={printData}
        title={`Marks - ${selectedClass || ''} - ${selectedExam || ''}`}
      />
    </div>
  );
}
