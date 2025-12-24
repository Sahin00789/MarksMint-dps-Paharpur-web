import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PrinterIcon, EyeIcon } from '@heroicons/react/24/outline';
import ExamDependentClassSelectorCard from '@/components/common/ExamDependentClassSelectorCard';
import api from '@/services/api';
import { fetchExamConfig } from '@/services/examConfig';
import { getAttendanceConfig } from '@/services/attendanceConfig';
import MarksheetPreviewModal from './Modals/MarksheetPreviewModal';
import MarksheetPrintAllPreviewModal from './Modals/MarksheetPrintAllPreviewModal';

const MarksheetsPanel = () => {
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [studentMarks, setStudentMarks] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentMarks, setSelectedStudentMarks] = useState([]);
  const [isAllPreviewOpen, setIsAllPreviewOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedClass = localStorage.getItem('ui.selectedClass');
      if (savedClass) setSelectedClass(savedClass);
    }
  }, []);

  // Function to process students data for selected class
  const processStudentsData = async (className) => {
    if (!className) return [];

    try {
      // Step 1: Load students of selected class
      const studentsRes = await api.get(`/students?class=${className}`);
      const students = studentsRes.data;

      // Step 2: Load exam configuration for the class using the exam config service
      let examConfig = {};
      try {
        const configData = await fetchExamConfig(className);
        const examConfigData = configData?.data?.examConfig || {};
        
        // Transform the exam config to our required format
        Object.entries(examConfigData).forEach(([examName, examData]) => {
          if (!examData || typeof examData !== 'object') return;
          
          examConfig[examName] = {};
          
          // Process each subject and its evaluation types
          examData.subjects?.forEach(subjectName => {
            if (examData.fullMarks?.[subjectName]) {
              // Use the fullMarks from the config
              examConfig[examName][subjectName] = { ...examData.fullMarks[subjectName] };
            } else {
              // Fallback to default evaluation types if no specific marks are defined
              const defaultEvals = {
                'Written': 0,
                'Oral': 0,
                'Practical': 0
              };
              
              if (examData.evaluationTypes?.length > 0) {
                examConfig[examName][subjectName] = {};
                examData.evaluationTypes.forEach(evalType => {
                  examConfig[examName][subjectName][evalType] = 0;
                });
              } else {
                examConfig[examName][subjectName] = { ...defaultEvals };
              }
            }
          });
        });
      } catch (error) {
        console.error('Failed to load exam config, using default config', error);
        // Fallback to a default config if the API call fails
        examConfig = {
          'First Summative Evaluation': {
            'Bengali': { 'Written': 10 },
            'English': { 'Written': 10 },
            'Math': { 'Written': 10 },
            'G_K': { 'Written': 10 }
          },
          'Second Summative Evaluation': {
            'Bengali': { 'Written': 20 },
            'English': { 'Written': 20 },
            'Math': { 'Written': 20 },
            'G_K': { 'Written': 20 }
          },
          'Third Summative Evaluation': {
            'Bengali': { 'Written': 40, 'Oral': 10 },
            'English': { 'Written': 40, 'Oral': 10 },
            'Math': { 'Written': 40, 'Oral': 10 },
            'G_K': { 'Written': 40, 'Oral': 10 }
          }
        };
      }
      // Fetch attendance configuration to get school working days using the service
      let attendanceConfig = { schoolWorkingDays: 0 }; 
      try {
        const configData = await getAttendanceConfig(className, '2024-2025');
        if (configData && configData.schoolWorkingDays) {
          attendanceConfig = configData;
        } else {
          // If no config found, try to get from any student in that class
          const studentsWithAttendance = students.find(s => s.attendance && typeof s.attendance === 'string' && s.attendance.includes('/'));
          if (studentsWithAttendance) {
            const parts = studentsWithAttendance.attendance.split('/');
            attendanceConfig.schoolWorkingDays = parseInt(parts[1], 10) || 260;
          } else {
            attendanceConfig.schoolWorkingDays = 260; // Final fallback
          }
        }
      } catch (error) {
        console.error('Failed to load attendance config, using default values', error);
        attendanceConfig.schoolWorkingDays = 260;
      }

      const processedStudents = [];

      for (const student of students) {
        const studentMarks = student.marks || {};

        // Create processed student data in the required format
        const processedStudent = {
          student: {
            name: student.studentName || student.name || '',
            class: student.class || className,
            rollNo: student.rollNumber || student.roll || '',
            fatherName: student.fatherName || '',
            dob: student.dob || '',
            address: student.address || '',
            session: student.session || '',
            photoUrl: student.photoUrl || '',
            religion: (student.religion || '').trim()
          },
          // Add attendance data
          attendance: student.attendance || 0,
          schoolWorkingDays: attendanceConfig.schoolWorkingDays || 260,
          marks: {}, // Exam-wise data with subjectDetails
          subjectwiseSummary: {}, // Subject totals across all exams
          coScholastic: {
            workEducation: { grade: student.coscholastic?.workEd || student.coScholastic?.workEducation?.grade || 'N/A' },
            artEducation: { grade: student.coscholastic?.artEd || student.coScholastic?.artEducation?.grade || 'N/A' },
            healthAndPhysical: { grade: student.coscholastic?.phyEd || student.coScholastic?.healthAndPhysical?.grade || 'N/A' },
            discipline: { grade: student.coscholastic?.discipline || student.coScholastic?.discipline?.grade || 'N/A' }
          },
          attendanceSummary: student.attendanceSummary || {
            totalDays: 0,
            presentDays: 0,
            absentDays: 0,
            attendancePercentage: 0,
            workingDays: 0
          },
          overallSummary: {
            totalMarks: 0,
            obtainedMarks: 0,
            percentage: 0,
            grade: 'N/A',
            rank: 0,
            totalStudents: students.length,
            resultStatus: 'Pass'
          }
        };

        // Handle the case where marks is an object with success/message or direct marks
        let marksData = {};
        
        // First, check if we have direct marks in the expected format
        if (studentMarks && typeof studentMarks === 'object') {
          // Copy all exam marks, excluding any non-exam properties
          Object.entries(studentMarks).forEach(([examName, subjects]) => {
            if (examName !== 'success' && examName !== 'message' && subjects && typeof subjects === 'object') {
              marksData[examName] = {};
              
              // Process each subject and its evaluations
              Object.entries(subjects).forEach(([subjectName, evaluations]) => {
                if (evaluations && typeof evaluations === 'object') {
                  marksData[examName][subjectName] = {};
                  
                  // Process each evaluation type
                  Object.entries(evaluations).forEach(([evalType, mark]) => {
                    // Convert mark to number and handle different string formats
                    const numericMark = typeof mark === 'string' ? 
                      parseFloat(mark.replace(',', '.')) : 
                      Number(mark);
                      
                    if (!isNaN(numericMark)) {
                      // Convert evaluation type to title case to match config
                      const formattedEvalType = evalType.charAt(0).toUpperCase() + evalType.slice(1).toLowerCase();
                      marksData[examName][subjectName][formattedEvalType] = numericMark;
                    }
                  });
                }
              });
            }
          });
        }
        
        // Process each exam in the configuration
        for (const [examName, subjects] of Object.entries(examConfig)) {
          // Check if this exam has any marks entered for this student
          const examMarks = marksData[examName];
          const hasMarksForExam = examMarks && Object.keys(examMarks).length > 0;

          // Initialize exam entry if it doesn't exist
          if (!processedStudent.marks[examName]) {
            processedStudent.marks[examName] = {
              subjectDetails: {}
            };
          }

          // Process each subject in the exam config
          for (const [subjectName, evaluations] of Object.entries(subjects)) {
            // Apply religion-based filtering
            const studentReligion = (student.religion || '').toLowerCase().trim();
            const isMuslim = studentReligion === 'islam';
            const subjectNameLower = subjectName.toLowerCase();

            // Logic: 
            // - If Muslim: Skip 'Hindi' (keep 'Arabic-Hindi')
            // - If NOT Muslim: Skip 'Arabic-Hindi' (keep 'Hindi')
            if (isMuslim && subjectNameLower === 'hindi') continue;
            if (!isMuslim && subjectNameLower.includes('arabic-hindi')) continue;

            // Initialize subject details if they don't exist
            if (!processedStudent.marks[examName].subjectDetails[subjectName]) {
              processedStudent.marks[examName].subjectDetails[subjectName] = {
                total: 0,
                max: 0,
                percentage: 0,
                grade: 'N/A',
                evaluations: []
              };
            }

            // Get the student's marks for this exam and subject, if any
            let studentSubjectMarks = {};
            
            // Find marks for this exam and subject
            if (examMarks) {
              // Try exact match first
              if (examMarks[subjectName]) {
                studentSubjectMarks = examMarks[subjectName];
              } else {
                // Try case-insensitive match
                const subjectKey = Object.keys(examMarks).find(
                  key => key.toLowerCase() === subjectName.toLowerCase()
                );
                if (subjectKey) {
                  studentSubjectMarks = examMarks[subjectKey];
                }
              }
            }
            
            // Initialize variables at the start of the evaluation loop
            const evalTypes = Object.entries(evaluations);
            for (const [evalType, maxMarks] of evalTypes) {
              let obtainedMarks = 0;
              const evalMaxMarks = typeof maxMarks === 'number' ? maxMarks : 100;
              
              // Handle different mark structures
              if (studentSubjectMarks.marks !== undefined) {
                // If marks is directly in the subject object
                obtainedMarks = parseFloat(studentSubjectMarks.marks) || 0;
              } else if (studentSubjectMarks[evalType] !== undefined) {
                // If marks are in an evaluation type property
                obtainedMarks = parseFloat(studentSubjectMarks[evalType]) || 0;
              } else if (typeof studentSubjectMarks === 'number') {
                // If subject marks is a direct number
                obtainedMarks = studentSubjectMarks;
              }

              // Initialize subject data if it doesn't exist
              if (!processedStudent.marks[examName].subjectDetails[subjectName]) {
                processedStudent.marks[examName].subjectDetails[subjectName] = {
                  total: 0,
                  max: 0,
                  percentage: 0,
                  grade: 'N/A',
                  evaluations: []
                };
              }
              
              const subjectData = processedStudent.marks[examName].subjectDetails[subjectName];
              
              // Update subject totals
              subjectData.total += obtainedMarks;
              subjectData.max += evalMaxMarks;

              if (hasMarksForExam) {
                // Initialize subjectwiseSummary for this subject if it doesn't exist
                if (!processedStudent.subjectwiseSummary[subjectName]) {
                  processedStudent.subjectwiseSummary[subjectName] = {
                    obtainedTotal: 0,
                    maxTotal: 0,
                    percentage: 0,
                    grade: 'N/A',
                    evaluations: []
                  };
                }
                
                // Add to the subjectwise summary
                const subjectSummary = processedStudent.subjectwiseSummary[subjectName];
                subjectSummary.obtainedTotal = (subjectSummary.obtainedTotal || 0) + obtainedMarks;
                subjectSummary.maxTotal = (subjectSummary.maxTotal || 0) + evalMaxMarks;
                
                // Add evaluation to the summary
                subjectSummary.evaluations.push({
                  type: evalType,
                  name: evalType,
                  marks: obtainedMarks,
                  maxMarks: evalMaxMarks,
                  isAbsent: obtainedMarks === 0 && studentSubjectMarks && studentSubjectMarks[evalType] === undefined,
                  status: obtainedMarks > 0 ? 'Graded' : 'Not Taken'
                });
              }

              // Add evaluation details to subject data
              subjectData.evaluations.push({
                type: evalType,
                name: evalType,
                marks: obtainedMarks,
                maxMarks: evalMaxMarks,
                isAbsent: obtainedMarks === 0 && studentSubjectMarks[evalType] === undefined,
                status: obtainedMarks > 0 ? 'Graded' : 'Not Taken'
              });
            }

            // Calculate percentage and grade for this subject in this exam
            const subjectData = processedStudent.marks[examName].subjectDetails[subjectName];
            subjectData.percentage = subjectData.max > 0 ? (subjectData.total / subjectData.max) * 100 : 0;
            subjectData.grade = calculateGrade(subjectData.percentage);
          }
        }

        // Calculate subjectwiseSummary percentages and grades
        for (const [subjectName, summary] of Object.entries(processedStudent.subjectwiseSummary)) {
          // Recalculate totals from evaluations to ensure accuracy
          if (summary.evaluations && summary.evaluations.length > 0) {
            summary.obtainedTotal = summary.evaluations.reduce((sum, evalItem) => sum + (evalItem.marks || 0), 0);
            summary.maxTotal = summary.evaluations.reduce((sum, evalItem) => sum + (evalItem.maxMarks || 0), 0);
          }
          summary.percentage = summary.maxTotal > 0 ? (summary.obtainedTotal / summary.maxTotal) * 100 : 0;
          summary.grade = calculateGrade(summary.percentage);
        }

        // Calculate overall summary
        const totalObtained = Object.values(processedStudent.subjectwiseSummary).reduce((sum, subject) => sum + subject.obtainedTotal, 0);
        const totalMax = Object.values(processedStudent.subjectwiseSummary).reduce((sum, subject) => sum + subject.maxTotal, 0);
        const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;

        processedStudent.overallSummary = {
          totalMarks: totalMax,
          obtainedMarks: totalObtained,
          percentage: percentage,
          grade: calculateGrade(percentage),
          rank: 0, // Will be calculated after processing all students
          totalStudents: students.length,
          resultStatus: percentage >= 35 ? 'Pass' : 'Fail' // Assuming 35% pass criteria
        };

        processedStudents.push(processedStudent);
      }

      // Calculate ranks
      processedStudents.sort((a, b) => b.overallSummary.obtainedMarks - a.overallSummary.obtainedMarks);
      processedStudents.forEach((student, index) => {
        student.overallSummary.rank = index + 1;
      });

      // Log final results summary
      if (processedStudents.length > 0) {
        console.log(`Successfully processed ${processedStudents.length} students`);
        console.log('Sample student summary:', {
          name: processedStudents[0].student.name,
          totalMarks: processedStudents[0].overallSummary.obtainedMarks,
          percentage: processedStudents[0].overallSummary.percentage,
          rank: processedStudents[0].overallSummary.rank,
          coScholastic: processedStudents[0].coScholastic,
          attendance: processedStudents[0].attendanceSummary
        });
      }

      return processedStudents;

    } catch (error) {
      console.error('Error processing students data:', error);
      setError('Failed to process students data');
      return [];
    }
  };

  // Helper function to calculate grade from percentage
  const calculateGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C+';
    if (percentage >= 40) return 'C';
    if (percentage >= 35) return 'D';
    return 'F';
  };

  useEffect(() => {
    const fetchStudentMarks = async () => {
      if (!selectedClass) return;

      setIsLoading(true);
      setError('');

      try {
        // Use the new processStudentsData function instead of old logic
        const processedData = await processStudentsData(selectedClass);

        // Set students for display
        setStudents(processedData.map(p => p.student));

        // Set processed data for marksheet generation
        const marksData = {};
        for (const processedStudent of processedData) {
          marksData[processedStudent.student.rollNo] = processedStudent;
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

  const handlePrintMarksheet = async (student) => {
    try {
      // Get the processed student data from studentMarks
      const processedStudent = studentMarks[student.rollNumber || student.roll || student.rollNo];

      if (!processedStudent) {
        throw new Error('Processed student data not found');
      }

      // Set the selected student and processed marks to open the preview modal
      setSelectedStudent({
        ...student,
        name: student.studentName || student.name || '',
        className: selectedClass,
        rollNumber: student.rollNumber || student.roll || '',
      });

      // Set the processed marks data for the preview
      setSelectedStudentMarks(processedStudent);

      // Open the preview modal
      setIsPreviewOpen(true);

    } catch (error) {
      console.error('Error preparing marksheet preview:', error);
      setError('Failed to prepare marksheet preview. Please try again.');
    }
  };

  const handlePreviewMarksheet = (student) => {
    if (!student) return;
    
    try {
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
    }
  };
  


 


  const renderStudentRow = (student) => {
    const processedStudent = studentMarks[student.rollNumber || student.roll || student.rollNo];
    const overallSummary = processedStudent?.overallSummary || {};
    const totalMarks = overallSummary.obtainedMarks || 0;
    const maxMarks = overallSummary.totalMarks || 0;
    const percentage = overallSummary.percentage || 0;
    const grade = overallSummary.grade || 'N/A';
    const rank = overallSummary.rank || 0;
    const resultStatus = overallSummary.resultStatus || 'N/A';

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
                  Roll: {student.rollNo || student.roll || 'N/A'}
                </span>
                <span className="text-blue-200">•</span>
                <span className="text-xs text-blue-100">
                  {selectedClass || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Overall Summary Display */}
        <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-blue-100 dark:border-blue-800/30">
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Marks</p>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                {totalMarks.toFixed(1)} / {maxMarks.toFixed(1)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Percentage</p>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{percentage.toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Grade</p>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">{grade}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Rank</p>
              <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">#{rank}</p>
            </div>
          </div>

          {/* Result Status Badge */}
          <div className="mt-2 flex justify-center">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              resultStatus === 'Pass'
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
              {resultStatus}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrintMarksheet(student);
            }}
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <PrinterIcon className="h-4 w-4 mr-2" />
            Print Preview
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Marksheets</h1>
          <p className="text-gray-600 dark:text-gray-300">Generate and print student marksheets</p>
        </div>
        
        {selectedClass && students.length > 0 && (
          <button
            onClick={() => setIsAllPreviewOpen(true)}
            className="inline-flex items-center px-5 py-3 border border-transparent text-sm font-bold rounded-xl shadow-lg shadow-blue-200 text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-[1.02] active:scale-95"
          >
            <PrinterIcon className="h-5 w-5 mr-2" />
            Print All Marksheets ({students.length})
          </button>
        )}
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
        processedStudent={selectedStudentMarks}
        academicYear="2025"
      />
      {/* Bulk Preview Modal */}
      <MarksheetPrintAllPreviewModal
        isOpen={isAllPreviewOpen}
        onClose={() => setIsAllPreviewOpen(false)}
        studentMarks={studentMarks}
        selectedClass={selectedClass}
        academicYear="2025"
      />
    </div>
  );
};

export default MarksheetsPanel;
