import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import { PrinterIcon, EyeIcon } from '@heroicons/react/24/outline';
import ExamDependentClassSelectorCard from '@/components/common/ExamDependentClassSelectorCard';
import api from '@/services/api';
import MarksheetPreviewModal from './Modals/MarksheetPreviewModal';
import MarksheetPrintPage from './MarksheetPage/MarksheetPrintPage';

const MarksheetsPanel = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [studentMarks, setStudentMarks] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentMarks, setSelectedStudentMarks] = useState([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedClass = localStorage.getItem('ui.selectedClass');
      if (savedClass) setSelectedClass(savedClass);
    }
  }, []);

  useEffect(() => {
    const fetchStudentMarks = async () => {
      if (!selectedClass) return;
      
      setIsLoading(true);
      setError('');
      
      try {
        // Fetch all students for the class
        const studentsRes = await api.get(`/students?class=${selectedClass}`);
        setStudents(studentsRes.data);
        
        // Use existing student data instead of making API calls
        const marksData = {};
        for (const student of studentsRes.data) {
          // Use student's marks if available, otherwise use an empty object
          marksData[student._id] = student.marks || {};
        }
        setStudentMarks(marksData);
        
      } catch (err) {
        console.error('Error fetching student marks:', err);
        setError('Failed to load student marks');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchStudentMarks();
  }, [selectedClass]);

  const handleClassSelect = async (className) => {
    setSelectedClass(className);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ui.selectedClass', className);
    }
  };

  const handlePreviewMarksheet = (student) => {
    if (!student) return;
    
    try {
      setIsGenerating(true);
      setSelectedStudent(student);
      
      // Use the student's marks directly from the student object
      // If marks is not available, use an empty object
      const marksData = student.marks || {};
      setSelectedStudentMarks(marksData);
      
      // Open the preview modal with the student data
      setIsPreviewOpen(true);
    } catch (error) {
      console.error('Error preparing marksheet preview:', error);
      setError('Failed to prepare marksheet preview. Please try again.');
      setSelectedStudentMarks({});
    } finally {
      setIsGenerating(false);
    }
  };
  
  const printRef = useRef();
  const [printData, setPrintData] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Handle print with react-to-print
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    pageStyle: `
      @page { 
        size: A4;
        margin: 10mm 15mm;
      }
      @media print {
        body { 
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
        }
      }
    `,
    onBeforeGetContent: () => {
      setIsPrinting(true);
      return Promise.resolve();
    },
    onAfterPrint: () => {
      setIsPrinting(false);
      setPrintData(null);
    },
    removeAfterPrint: true,
  
  });

  const handlePrintMarksheet = async (student) => {
    try {
      setIsGenerating(true);
      setError('');
      
      // Set the selected student and marks to open the preview modal
      setSelectedStudent({
        ...student,
        name: student.studentName || student.name || '',
        className: selectedClass,
        rollNumber: student.rollNumber || student.roll || '',
      });
      
      // Set the student marks for the preview
      setSelectedStudentMarks(studentMarks[student._id] || {});
      
      // Open the preview modal
      setIsPreviewOpen(true);
      
    } catch (error) {
      console.error('Error preparing marksheet preview:', error);
      setError('Failed to prepare marksheet preview. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const renderStudentRow = (student) => {
    const marks = studentMarks[student._id] || {};
    const totalMarks = Object.values(marks).reduce((sum, exam) => {
      const examTotal = Object.values(exam.subjects || {}).reduce((examSum, subject) => {
        return examSum + (parseFloat(subject.obtainedMarks) || 0);
      }, 0);
      return sum + examTotal;
    }, 0);
    
    const examCount = Object.keys(marks).length;
    const avgMarks = examCount > 0 ? (totalMarks / examCount).toFixed(2) : 0;
    
    return (
      <div 
        key={student._id}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 transition-all duration-200 ease-in-out transform hover:scale-[1.02] hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-500/50"
      >
        {/* Student Header */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-3 relative rounded-t-2xl">
          <div className="absolute top-0 right-0 w-16 h-16 -mr-4 -mt-4 bg-white/10 rounded-full"></div>
          <div className="relative z-10 flex items-center space-x-3">
            <div className="flex-shrink-0 relative">
              {student.photoUrl ? (
                <>
                  <img
                    src={student.photoUrl}
                    alt={student.studentName || student.name || 'Student'}
                    className="h-10 w-10 rounded-md object-cover border-2 border-white/30"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.style.display = 'none';
                      const fallback = e.target.nextElementSibling;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="h-10 w-10 rounded-md border-2 border-white/30 flex items-center justify-center bg-white/20 text-white font-bold text-sm hidden">
                    {(student.studentName || student.name || 'N').charAt(0).toUpperCase()}
                  </div>
                </>
              ) : (
                <div className="h-10 w-10 rounded-md border-2 border-white/30 flex items-center justify-center bg-white/20 text-white font-bold text-sm">
                  {(student.studentName || student.name || 'N').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-white truncate">
                {student.studentName || student.name || 'No Name'}
              </h3>
              <div className="flex items-center space-x-1.5">
                <span className="text-xs text-blue-100">
                  Roll: {student.rollNumber || student.roll || 'N/A'}
                </span>
                <span className="text-blue-200">•</span>
                <span className="text-xs text-blue-100">
                  {selectedClass || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Marks Summary */}
        <div className="p-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800/30">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Exams</p>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{examCount}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Avg. Marks</p>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{avgMarks}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintMarksheet(student);
            }}
            disabled={isGenerating || isPrinting}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPrinting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Preparing Print Preview...
              </>
            ) : (
              <>
                <PrinterIcon className="h-4 w-4 mr-2" />
                Print Preview
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Print Component (hidden from view) */}
      <div style={{ display: 'none' }}>
        {printData && (
          <div ref={printRef}>
            <MarksheetPrintPage 
              student={printData.student}
              examResults={printData.marks}
              academicYear={printData.academicYear}
            />
          </div>
        )}
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Marksheets</h1>
        <p className="text-gray-600 dark:text-gray-300">Generate and print student marksheets</p>
      </div>
      
      <div className="space-y-6">
        {/* Class Selection Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ExamDependentClassSelectorCard
            onSelect={handleClassSelect}
            selectedClass={selectedClass}
          />
        </div>

        {/* Students List */}
        {isLoading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Error loading students
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          </div>
        ) : students.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {students.map(renderStudentRow)}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
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
                d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5.04 16.21a2.25 2.25 0 00-.33.255 2.25 2.25 0 00-.33.255l-1.384 1.383a2.25 2.25 0 01-1.59.66H2.25A2.25 2.25 0 010 19.5V4.5A2.25 2.25 0 012.25 2.25h13.5a2.25 2.25 0 011.591.659l1.16 1.16a2.25 2.25 0 00.33.255l1.384-1.383a2.25 2.25 0 00.33-.255 2.25 2.25 0 00.33-.255l1.16-1.16a2.25 2.25 0 011.59-.66h.75a2.25 2.25 0 012.25 2.25v15a2.25 2.25 0 01-2.25 2.25H9.75a2.25 2.25 0 01-2.25-2.25V8.25a2.25 2.25 0 01.659-1.591l5.714-5.714a2.25 2.25 0 013.182 0l5.714 5.714a2.25 2.25 0 01.659 1.591v9a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75a2.25 2.25 0 01.66-1.59l1.383-1.384a2.25 2.25 0 00.255-.33 2.25 2.25 0 01.255-.33l1.16-1.16a2.25 2.25 0 011.591-.66h.75a2.25 2.25 0 012.25 2.25v15z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No students found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              There are no students in {selectedClass || 'the selected class'}.
            </p>
          </div>
        )}
</div>
      
      {/* Preview Modal */}
      <MarksheetPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        student={selectedStudent}
        marks={selectedStudentMarks}
        className={selectedClass}
        academicYear={String(new Date().getFullYear() + 1)} // Default to next year
      />
    </div>
  );
};

export default MarksheetsPanel;
