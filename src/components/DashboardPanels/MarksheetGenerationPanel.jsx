import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FaFilePdf, FaPrint, FaDownload, FaEye, FaTimes } from 'react-icons/fa';
import ClassSelecorCard from '../common/ClassSelectorCard';
import MarksheetPrintView from '../Marksheet/MarksheetPrintView';
import { useAuth } from '../../contexts/AuthContext';
import { getClassExamResults } from '../../shared/MarksCalculation';

const MarksheetGenerationPanel = ({ selectedClass: propSelectedClass }) => {
  const { currentUser } = useAuth();
  const marksheetRef = useRef();
  const [selectedClass, setSelectedClass] = useState(propSelectedClass || null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState(new Set());

  // Mock function to fetch class config - replace with actual API call
  const fetchClassConfig = useCallback(async (className) => {
    // This is a mock - replace with actual API call
    return {
      examsFullMarks: {
        'Mid Term': {
          'Mathematics': 100,
          'Science': 100,
          'English': 100,
          'Social Studies': 100,
          'Computer Science': 100
        },
        'Final Term': {
          'Mathematics': 100,
          'Science': 100,
          'English': 100,
          'Social Studies': 100,
          'Computer Science': 100
        }
      },
      subjects: ['Mathematics', 'Science', 'English', 'Social Studies', 'Computer Science']
    };
  }, []);

  // Load class and student data
  useEffect(() => {
    const loadData = async () => {
      if (!selectedClass) return;
      
      setLoading(true);
      setError(null);
      
      try {
        // Mock student data - replace with actual API call
        const mockStudents = Array(5).fill().map((_, i) => ({
          id: i + 1,
          roll: i + 1,
          name: `Student ${i + 1}`,
          fatherName: `Father ${i + 1}`,
          motherName: `Mother ${i + 1}`,
          class: selectedClass,
          section: String.fromCharCode(65 + (i % 3)), // A, B, or C
          exams: {
            'Mid Term': {
              'Mathematics': 85 + i,
              'Science': 90 - i,
              'English': 88 + (i % 3),
              'Social Studies': 82 + i,
              'Computer Science': 95 - (i % 2)
            },
            'Final Term': {
              'Mathematics': 88 + i,
              'Science': 92 - i,
              'English': 85 + (i % 3),
              'Social Studies': 85 + i,
              'Computer Science': 97 - (i % 2)
            }
          }
        }));

        const classConfig = await fetchClassConfig(selectedClass);
        setExams(Object.keys(classConfig.examsFullMarks));
        
        if (mockStudents.length > 0) {
          const results = await getClassExamResults(
            'Mid Term', // Default to first exam
            selectedClass,
            mockStudents,
            fetchClassConfig
          );
          
          // Merge student data with calculated results
          const processedStudents = mockStudents.map(student => ({
            ...student,
            results: results.find(r => r.studentId === student.id)?.subjectWise || {}
          }));
          
          setStudents(processedStudents);
        }
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load student data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedClass, fetchClassConfig]);

  const toggleStudentSelection = (studentId) => {
    const newSelection = new Set(selectedStudents);
    if (newSelection.has(studentId)) {
      newSelection.delete(studentId);
    } else {
      newSelection.add(studentId);
    }
    setSelectedStudents(newSelection);
  };

  const handlePreview = async () => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student');
      return;
    }
    
    try {
      setLoading(true);
      const studentId = Array.from(selectedStudents)[0];
      const student = students.find(s => s.id === studentId);
      
      if (!selectedExam) {
        alert('Please select an exam');
        return;
      }
      
      // Calculate results for the selected exam
      const results = await getClassExamResults(
        selectedExam,
        selectedClass,
        [student],
        fetchClassConfig
      );
      
      if (results && results[0]) {
        setPreviewData({
          student: {
            ...student,
            ...results[0]
          },
          exam: selectedExam
        });
        setShowPreview(true);
      }
    } catch (err) {
      console.error('Error generating preview:', err);
      setError('Failed to generate marksheet preview');
    } finally {
      setLoading(false);
    }
    const student = students.find(s => s._id === studentId);
    
    if (student) {
      // Transform student results into the format expected by MarksheetPrintView
      const examResults = Object.entries(student.results || {}).map(([examName, result]) => ({
        examName,
        examDate: result.examDate || new Date().toISOString(),
        subjects: result.subjects.map(subject => ({
          name: subject.name,
          maxMarks: subject.maxMarks,
          obtainedMarks: subject.obtainedMarks,
          grade: subject.grade
        })),
        totalMarks: result.totalMarks || result.subjects.reduce((sum, sub) => sum + (parseFloat(sub.obtainedMarks) || 0), 0),
        maxTotalMarks: result.maxTotalMarks || result.subjects.reduce((sum, sub) => sum + (parseFloat(sub.maxMarks) || 0), 0),
        percentage: result.percentage || (result.totalMarks && result.maxTotalMarks 
          ? ((result.totalMarks / result.maxTotalMarks) * 100).toFixed(2)
          : 0),
        grade: result.grade,
        rank: result.rank || 'N/A',
        remarks: result.remarks || 'No remarks available.'
      }));
      
      setPreviewData({
        studentInfo: {
          name: student.studentName,
          rollNumber: student.roll,
          className: student.className,
          section: student.section,
          fatherName: student.fatherName,
          motherName: student.motherName,
          dob: student.dob,
          admissionNo: student.admissionNo
        },
        examResults,
        academicYear: '2024-2025',
        generatedOn: new Date().toISOString()
      });
      setShowPreview(true);
    }
  };

  const generateMarksheet = async (format) => {
    if (selectedStudents.size === 0) {
      alert('Please select at least one student');
      return;
    }
    
    if (format === 'Print') {
      handlePreview();
      return;
    }
    
    try {
      setLoading(true);
      
      if (format === 'PDF' || format === 'Download') {
        // For PDF/Download, we'll generate marksheets for all selected students
        const studentIds = Array.from(selectedStudents);
        
        // In a real app, this would be an API call to generate the PDF
        console.log(`Generating ${format} for students:`, studentIds);
        
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // For demo purposes, we'll just show an alert
        alert(`Successfully generated ${format} marksheets for ${studentIds.length} students.`);
        
        if (format === 'Download') {
          // In a real app, this would trigger a file download
          const link = document.createElement('a');
          link.href = '#'; // Replace with actual download URL
          link.download = `marksheets_${new Date().toISOString().split('T')[0]}.zip`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
    } catch (error) {
      console.error('Error generating marksheet:', error);
      alert(`Failed to generate ${format}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  const renderMarksheetPreview = () => {
    if (!selectedClass) return null;
    
    return (
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Marksheet Preview</h3>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-semibold">{selectedClass} - Academic Year 2024-2025</h4>
              <p className="text-sm text-gray-600">
                {selectedStudents.size} {selectedStudents.size === 1 ? 'student' : 'students'} selected
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handlePreview}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                title="Preview Marksheet"
              >
                <FaEye /> Preview
              </button>
              <button
                onClick={() => generateMarksheet('PDF')}
                className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                disabled={!currentUser}
                title={!currentUser ? 'Please log in to generate PDF' : 'Generate PDF'}
              >
                <FaFilePdf /> PDF
              </button>
              <button
                onClick={() => generateMarksheet('Print')}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                disabled={!currentUser}
                title={!currentUser ? 'Please log in to print' : 'Print Marksheet'}
              >
                <FaPrint /> Print
              </button>
              <button
                onClick={() => generateMarksheet('Download')}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                disabled={!currentUser}
                title={!currentUser ? 'Please log in to download' : 'Download All'}
              >
                <FaDownload /> Download All
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input 
                      type="checkbox" 
                      checked={selectedStudents.size === students.length && students.length > 0}
                      onChange={() => {
                        if (selectedStudents.size === students.length) {
                          setSelectedStudents(new Set());
                        } else {
                          setSelectedStudents(new Set(students.map(s => s._id)));
                        }
                      }}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Section</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.has(student._id)}
                        onChange={() => toggleStudentSelection(student._id)}
                        className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.roll}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.studentName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{student.section}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Generated
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // School information - replace with your actual school data
  const schoolInfo = {
    name: 'YOUR SCHOOL NAME',
    address: 'School Address, City, State, Pincode',
    phone: '+91 XXXXXXXXXX',
    email: 'school@example.com',
    principal: 'Principal Name',
    classTeacher: 'Class Teacher Name',
    logo: '' // Add path to school logo if available
  };

  return (
    <div>
    <div className="space-y-4 p-4 relative">
      <h2 className="text-2xl font-bold">Marksheet Generation</h2>
      
      {/* Preview Modal */}
      {showPreview && previewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center bg-gray-100 p-4 border-b">
              <h3 className="text-lg font-semibold">Marksheet Preview</h3>
              <button 
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="print-container">
                <MarksheetPrintView 
                  ref={marksheetRef}
                  studentInfo={previewData.studentInfo}
                  examResults={previewData.examResults}
                  academicYear={previewData.academicYear}
                  schoolInfo={schoolInfo}
                  generatedOn={previewData.generatedOn}
                />
                <style jsx global>{`
                  @media print {
                    @page {
                      size: A4 portrait;
                      margin: 0;
                    }
                    body {
                      margin: 0;
                      padding: 0;
                    }
                    .print-container {
                      transform: scale(0.9);
                      transform-origin: top center;
                      width: 100%;
                    }
                  }
                `}</style>
              </div>
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPreview(false);
                    setTimeout(() => window.print(), 100);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                >
                  <FaPrint /> Print Now
                </button>
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full ">
          <ClassSelecorCard 
            selectedClass={selectedClass}
            onSelectClass={setSelectedClass}
          />
            </div>
     
        </div>
        
        <div className="flex-1">
          {loading && <p>Loading...</p>}
          {error && <p className="text-red-600">{error}</p>}
          
          {!selectedClass ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600">Please select a class to generate marksheets</p>
            </div>
          ) : !selectedExam ? (
            <div className="bg-white rounded-lg shadow p-6 text-center">
              <p className="text-gray-600">Please select an exam to generate marksheets</p>
            </div>
          ) : (
            renderMarksheetPreview()
          )}
        </div>
      </div>
    </div>
  );
};

export default MarksheetGenerationPanel;
