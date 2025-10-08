import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon, ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { schoolinfo } from '@/shared/schoolInformation';
import MarksheetPrintPage from '../MarksheetPage/MarksheetPrintPage';

const MarksheetPreviewModal = ({ 
  isOpen, 
  onClose, 
  student: propStudent, 
  marks: propMarks = [],
  className: propClassName,
  academicYear = '2024-2025' 
}) => {
  const componentRef = useRef();
  const navigate = useNavigate();
  // Initialize state with props
  const [studentData, setStudentData] = useState(propStudent);
  const [examConfig, setExamConfig] = useState([]);
  const [attendanceConfig, setAttendanceConfig] = useState({});
  const [className, setClassName] = useState(propClassName);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [marksheetData, setMarksheetData] = useState(null);
  
  console.log('Preview Modal - Initial props:', { propStudent, propMarks, propClassName });
  
  const schoolInfo = {
    name: schoolinfo.name,
    branch: schoolinfo.branch || '',
    address: schoolinfo.address,
    regNumber: schoolinfo.regNumber,
    runBy: schoolinfo.runBy || 'M.M.D.C.T.',
    estd: schoolinfo.estd,
    contact: schoolinfo.contact
  };
  // Process marks from student data
  const processMarksheetData = useCallback(() => {
    if (!propStudent) {
      console.error('No student data provided to MarksheetPreviewModal');
      return null;
    }
    
    console.log('[MarksheetPreview] Processing student data:', propStudent);
    console.log('[MarksheetPreview] Processing marks from student data:', propMarks);
    
    // Ensure we have a clean student object with all required fields
    const student = {
      ...propStudent,
      name: propStudent.name || propStudent.studentName || '',
      studentName: propStudent.studentName || propStudent.name || '',
      rollNumber: propStudent.rollNumber || propStudent.roll || '',
      className: propClassName || propStudent.className || propStudent.class || '',
      class: propClassName || propStudent.className || propStudent.class || '',
      admissionNo: propStudent.admissionNo || '',
      fatherName: propStudent.fatherName || '',
      motherName: propStudent.motherName || '',
      dob: propStudent.dob || '',
      marks: propMarks || {}
    };
    
    setStudentData(student);
    
    // Process marks for each exam term
    const results = [];
    const examTerms = Object.keys(propStudent.marks || {});
    
    examTerms.forEach(examTerm => {
      const examMarks = propStudent.marks[examTerm];
      if (!examMarks) return;
      
      const examResult = {
        examName: examTerm,
        className: student.className,
        studentId: student._id,
        studentName: student.studentName,
        rollNumber: student.rollNumber,
        subjects: {}
      };
      
      // Process each subject's marks
      Object.entries(examMarks).forEach(([subject, marks]) => {
        if (marks && typeof marks === 'object') {
          // Calculate total marks if not already provided
          let totalMarks = marks.SubjectTotal;
          if (totalMarks === undefined) {
            totalMarks = Object.entries(marks).reduce((sum, [key, value]) => {
              return key !== 'SubjectTotal' ? sum + (parseFloat(value) || 0) : sum;
            }, 0);
          }
          
          examResult.subjects[subject] = {
            ...marks,
            obtainedMarks: totalMarks,
            maxMarks: marks.SubjectTotal || 100, // Default max marks
            percentage: Math.round((totalMarks / marks.SubjectTotal || 100) * 100),
            grade: calculateGrade(totalMarks, marks.SubjectTotal || 100)
          };
        } else if (typeof marks === 'number' || !isNaN(parseFloat(marks))) {
          // Handle case where marks is just a number
          const markValue = typeof marks === 'number' ? marks : parseFloat(marks);
          examResult.subjects[subject] = {
            obtainedMarks: markValue,
            maxMarks: 100,
            percentage: markValue,
            grade: calculateGrade(markValue, 100)
          };
        }
      });
      
      results.push(examResult);
    });
    
    return {
      success: true,
      data: {
        student,
        examConfig: null,
        attendanceConfig: null,
        results: results
      }
    };
  }, [propStudent, propClassName]);
  
  // Calculate grade helper function
  const calculateGrade = (obtained, max) => {
    if (!obtained || !max) return 'N/A';
    const percentage = (obtained / max) * 100;
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  // Process marks when component mounts or when student data changes
  useEffect(() => {
    if (isOpen && propStudent) {
      console.log('[MarksheetPreview] Processing student data:', propStudent);
      
      // First, ensure we have the basic student data
      const studentClass = propClassName || propStudent.class || propStudent.className || '';
      setClassName(studentClass);
      
      // Update student data with all required fields
      const updatedStudent = {
        ...propStudent,
        name: propStudent.name || propStudent.studentName || '',
        studentName: propStudent.studentName || propStudent.name || '',
        rollNumber: propStudent.rollNumber || propStudent.roll || '',
        className: studentClass,
        class: studentClass,
        admissionNo: propStudent.admissionNo || '',
        fatherName: propStudent.fatherName || '',
        motherName: propStudent.motherName || '',
        dob: propStudent.dob || '',
        marks: propMarks || {}
      };
      
      setStudentData(updatedStudent);
      
      // Process exam config from marks
      const examTerms = Object.keys(propMarks || {});
      if (examTerms.length > 0) {
        const results = examTerms.map(term => ({
          examName: term,
          subjects: propMarks[term] || {}
        }));
        setExamConfig(results);
      }
      
      setIsLoading(false);
    }
  }, [isOpen, propStudent, propMarks, propClassName]);

  // Handle print functionality
  const handlePrint = useReactToPrint({
    content: () => {
      // Find the print container
      const printContainer = document.getElementById('marksheet-print-container');
      if (!printContainer) {
        console.error('Print container not found');
        return null;
      }
      
      // Create a clone of the print container
      const content = printContainer.cloneNode(true);
      
      // Create a temporary container
      const tempContainer = document.createElement('div');
      tempContainer.appendChild(content);
      
      return tempContainer;
    },
    documentTitle: `${studentData?.studentName || studentData?.name || 'Marksheet'}-${className || studentData?.class || 'Class'}-${academicYear}`,
    removeAfterPrint: true,
    onBeforeGetContent: () => {
      // Ensure all data is loaded before printing
      if (isLoading) {
        console.warn('Data still loading when trying to print');
        return Promise.reject('Data still loading');
      }
      return Promise.resolve();
    },
    onPrintError: (error) => {
      console.error('Print error:', error);
      setError('Failed to generate print preview. Please try again.');
    },
    pageStyle: `
      @page { size: A4; margin: 0; }
      @media print { 
        body { -webkit-print-color-adjust: exact; } 
        .print-actions { display: none; }
      }
    `
  });

  // Handle download functionality
  const handleDownload = useCallback(() => {
    handlePrint();
  }, [handlePrint]);

  // Close modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

console.log("studentData",studentData,"examConfig",examConfig,"className",className,"academicYear",academicYear);
    

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Loading Marksheet
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Please wait while we load {studentData?.name ? `${studentData.name}'s` : 'the student\'s'} data...
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !studentData) {
    const errorMessage = error?.message || 'Failed to load student data. Please try again.';
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
              <XMarkIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
              Error Loading Data
            </h3>
            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 p-3 rounded-md text-sm mb-6 text-left">
              {errorMessage}
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                onClick={onClose}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 flex-1 sm:flex-none"
              >
                Close
              </button>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex-1 sm:flex-none"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      className="p-1 rounded-md text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
                      onClick={onClose}
                    >
                      <ArrowLeftIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                        {studentData.name}'s Marksheet
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {className} • {academicYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                      Download PDF
                    </button>
                    <button
                      type="button"
                      onClick={handlePrint}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Print
                    </button>
                    <button
                      type="button"
                      className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500 focus:outline-none"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close</span>
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                
                {/* Content */}
                <div className="flex-1 overflow-auto p-4">
                  <div className="bg-white dark:bg-gray-700 shadow-lg rounded-lg overflow-hidden">
                    <div className="w-full h-full overflow-auto">
                      <div className="bg-white p-6 print:p-0 print:shadow-none print:bg-transparent">
                        <style dangerouslySetInnerHTML={{
                          __html: `
                            @media print {
                              body * {
                                visibility: hidden;
                              }
                              #marksheet-print-container, #marksheet-print-container * {
                                visibility: visible;
                              }
                              #marksheet-print-container {
                                position: absolute;
                                left: 0;
                                top: 0;
                                width: 100%;
                                padding: 0;
                                margin: 0;
                              }
                            }
                          `
                        }} />
                        <div id="marksheet-print-container" className="w-full">
                          {examConfig?.length > 0 && propStudent ? (
                            <MarksheetPrintPage 
                              student={{
                                ...propStudent,
                                name: propStudent?.name || propStudent?.studentName || 'Student Name',
                                studentName: propStudent?.studentName || propStudent?.name || 'Student Name',
                                rollNumber: propStudent?.rollNumber || propStudent?.roll || 'N/A',
                                Class: className || propStudent?.className || propStudent?.class || 'N/A',
                                className: className || propStudent?.className || propStudent?.class || 'N/A',
                                admissionNo: propStudent?.admissionNo || 'N/A',
                                fatherName: propStudent?.fatherName || 'N/A',
                                motherName: propStudent?.motherName || 'N/A',
                              }}
                              marks={propMarks || []}
                              examConfig={examConfig}
                              academicYear={academicYear || '2024-2025'}
                              className={className}
                              coScholastic={propStudent?.coScholastic || {}}
                              attendanceConfig={attendanceConfig || {}}
                              calculateMarks={(subjectMarks) => {
                                let obtainedMarks = 0;
                                if (typeof subjectMarks === 'object' && subjectMarks !== null) {
                                  obtainedMarks = subjectMarks.SubjectTotal || 
                                    Object.values(subjectMarks).reduce((sum, val) => 
                                      typeof val === 'number' ? sum + val : sum, 0);
                                } else {
                                  obtainedMarks = parseFloat(subjectMarks) || 0;
                                }
                                
                                const maxMarks = subjectMarks?.maxMarks || 100;
                                const percentage = maxMarks > 0 ? (obtainedMarks / maxMarks) * 100 : 0;
                                const grade = calculateGrade(obtainedMarks, maxMarks);
                                
                                return {
                                  subject: subjectMarks?.subject || 'Subject',
                                  obtainedMarks: Number(obtainedMarks.toFixed(2)),
                                  maxMarks: Number(maxMarks.toFixed(2)),
                                  percentage: Math.round(percentage),
                                  grade: grade || 'N/A'
                                };
                              }}
                            />
                          ) : (
                            <div className="text-center py-10">
                              <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
                                No exam data available for this student.
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
  );
};

export default MarksheetPreviewModal;
