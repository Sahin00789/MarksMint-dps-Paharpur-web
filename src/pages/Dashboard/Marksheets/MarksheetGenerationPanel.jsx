import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaSpinner, FaSearch } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import { getClassConfig } from '../../services/classConfig';
import api from '../../services/api';
import ClassSelectorCard from '../common/ClassSelectorCard';

const CLASS_OPTIONS = [
  'Nursery', 'LKG', 'UKG', '1', '2', '3', '4', '5', 
  '6', '7', '8', '9', '10', '11', '12'
];

const MarksheetGenerationPanel = ({ selectedClass: propSelectedClass }) => {
  const { currentUser } = useAuth();
  const [selectedClass, setSelectedClass] = useState(propSelectedClass || '');
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [classConfig, setClassConfig] = useState(null);

  // Fetch class configuration with subjects and terms
  const fetchClassConfig = useCallback(async (className) => {
    if (!className) return null;
    
    try {
      const response = await getClassConfig(className);
      if (response) {
        setClassConfig(prev => {
          // Only update if the config has actually changed
          return JSON.stringify(prev) === JSON.stringify(response) ? prev : response;
        });
        return response;
      }
      throw new Error('No configuration found');
    } catch (error) {
      console.error('Error fetching class config:', error);
      setError(`Failed to load configuration for ${className}`);
      return null;
    }
  }, []);

  // Fetch students with their marks
  const fetchStudentsWithMarks = useCallback(async (className) => {
    if (!className) return;
    
    setLoading(true);
    setError('');
    console.log(`Fetching students for class: ${className}`);
    
    try {
      // First ensure the class name is properly formatted
      const formattedClassName = className.trim();
      console.log(`Formatted class name: ${formattedClassName}`);
      
      // Make API call with debug logging
      const response = await api.get(`/api/students?class=${encodeURIComponent(formattedClassName)}`);
      console.log('API Response:', response);
      
      // Check response structure
      if (response.status === 200 && response.data) {
        // Handle both array and object responses
        let studentsData = [];
        
        if (Array.isArray(response.data)) {
          studentsData = response.data; // Direct array response
        } else if (response.data.students) {
          studentsData = Array.isArray(response.data.students) 
            ? response.data.students 
            : [response.data.students];
        } else if (typeof response.data === 'object') {
          // Handle case where response.data is a single student object
          studentsData = [response.data];
        }
        
        console.log(`Found ${studentsData.length} students for class ${formattedClassName}`);
        
        if (studentsData.length === 0) {
          setError(`No students found in class ${formattedClassName}`);
          setStudents([]);
          return;
        }
        
        // Transform student data to match our frontend structure
        const processedStudents = studentsData.map((student, index) => ({
          _id: student._id || student.id || `temp-${index}`,
          rollNumber: student.roll || student.rollNumber || 'N/A',
          section: student.section || 'A',
          name: student.studentName || student.name || 'Unnamed Student',
          fatherName: student.fatherName || 'N/A',
          marks: student.marks || {},
          attendance: student.attendance || '95%',
          dob: student.dob || 'N/A',
          address: student.address || '',
          session: student.session || '2024-2025',
          photoUrl: student.photoUrl || ''
        }));
        setStudents(processedStudents);
        setError('');
      } else {
        console.error('Invalid response format:', response);
        setError('Invalid data format received from server');
        setStudents([]);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
      setError('Failed to load students. Please try again.');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle class selection
  const handleClassSelect = async (className) => {
    if (className === selectedClass) return;
    
    setSelectedClass(className);
    setStudents([]);
    
    if (className) {
      try {
        console.log(`Selected class: ${className}`);
        await fetchStudentsWithMarks(className);
      } catch (error) {
        console.error('Error in class selection:', error);
        setError(`Failed to load students for ${className}. Please check the console for details.`);
      } finally {
        setLoading(false);
      }
    }
  };

  // Handle preview button click
  const handlePreview = async (student) => {
    if (!student || !selectedClass) {
      setError('Please select a class first');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get(`/api/students/${student._id}`);
      let studentData = response.data;
      
      // Handle different response structures
      if (response.data && response.data.student) {
        studentData = response.data.student;
      }
      
      if (!studentData) {
        throw new Error('Failed to load student data');
      }
      
      // If we don't have class config, fetch it
      if (!classConfig) {
        const configResponse = await getClassConfig(selectedClass);
        if (configResponse) {
          setClassConfig(configResponse);
        } else {
          console.warn('Using default class config');
          // Provide a default config if not found
          setClassConfig({
            terms: ['Term 1', 'Term 2', 'Term 3'],
            subjects: []
          });
        }
      }
      
      const studentInfo = {
        ...studentData,
        studentName: studentData.studentName || 'N/A',
        Roll: studentData.roll || studentData.rollNumber || 'N/A',
        Class: selectedClass,
        section: studentData.section || 'A',
        Attendence: studentData.attendance || '95',
        DOB: studentData.dob || 'N/A',
        Adress: studentData.address || 'N/A',
        fatherName: studentData.fatherName || 'N/A',
        Session: studentData.session || '2024-2025',
        photoUrl: studentData.photoUrl || ''
      };
      
      const examResults = [];
      const terms = classConfig.terms || [];
      
      if (terms.length === 0) {
        throw new Error('No terms found in class configuration');
      }
      
      terms.forEach(term => {
        const termMarks = studentData.marks?.[term] || {};
        const subjects = [];
        let totalMarks = 0;
        let maxMarks = 0;
        
        Object.entries(termMarks).forEach(([subject, mark]) => {
          const subjectConfig = classConfig.subjects?.find(s => s.id === subject);
        if (!subjectConfig) {
          console.warn(`Subject config not found for: ${subject}`);
          return; // Skip subjects not in config
        }
          if (subjectConfig) {
            const markValue = mark === 'AB' ? 0 : Number(mark) || 0;
            const subjectMaxMarks = subjectConfig.maxMarks || 100;
            
            subjects.push({
              name: subjectConfig.name || subject,
              maxMarks: subjectMaxMarks,
              obtainedMarks: markValue
            });
            
            totalMarks += markValue;
            maxMarks += subjectMaxMarks;
          }
        });
        
        if (subjects.length > 0) {
          const percentage = maxMarks > 0 ? (totalMarks / maxMarks) * 100 : 0;
          
          examResults.push({
            examName: term,
            subjects: subjects,
            totalMarks: totalMarks,
            maxTotalMarks: maxMarks,
            percentage: percentage.toFixed(2)
          });
        }
      });
      
      setPreviewData({
        student: studentInfo,
        examResults: examResults,
        onClose: () => setShowPreview(false)
      });
      
      setShowPreview(true);
    } catch (error) {
      console.error('Error generating preview:', error);
      setError('Failed to generate preview. ' + (error.message || 'Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Render the preview modal
  const renderPreviewModal = () => {
    if (!showPreview || !previewData) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-auto">
          <div className="p-4 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Marksheet Preview</h3>
            <button
              onClick={() => setShowPreview(false)}
              className="text-gray-400 hover:text-gray-500"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4">
            <MarksheetViewer
              student={previewData.student}
              examResults={previewData.examResults}
              onClose={() => setShowPreview(false)}
            />
          </div>
        </div>
      </div>
    );
  };

  // Render student cards with preview buttons
  const renderStudentCards = () => {
    if (!selectedClass) {
      return (
        <div className="text-center p-12 text-gray-400">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No class selected</h3>
          <p className="text-sm">Select a class to view students and generate marksheets</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="col-span-full py-12 flex justify-center">
          <div className="flex flex-col items-center">
            <FaSpinner className="animate-spin text-2xl text-blue-500 mb-2" />
            <span className="text-sm text-gray-600">Loading students...</span>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="col-span-full">
          <div className="bg-red-50 border-l-4 border-red-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={() => fetchStudentsWithMarks(selectedClass)}
                  className="mt-2 text-sm font-medium text-red-700 hover:text-red-600 focus:outline-none"
                >
                  Try again <span aria-hidden="true">&rarr;</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    if (filteredStudents.length === 0) {
      return (
        <div className="col-span-full text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm 
              ? 'No students match your search. Try a different term.'
              : 'No students are enrolled in this class yet.'}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="mt-4 text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Clear search
            </button>
          )}
        </div>
      );
    }
    
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map((student) => (
          <div 
            key={student._id} 
            className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
          >
            <div className="flex justify-between items-start">
              <div className="min-w-0">
                <h3 className="font-medium text-gray-900 truncate">{student.name}</h3>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-sm">
                  <span className="text-gray-600">
                    <span className="font-medium">Roll:</span> {student.rollNumber}
                  </span>
                  <span className="text-gray-600">
                    <span className="font-medium">Sec:</span> {student.section}
                  </span>
                </div>
                {student.fatherName && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    <span className="font-medium">Father:</span> {student.fatherName}
                  </p>
                )}
              </div>
              <button
                onClick={() => handlePreview(student)}
                className="flex-shrink-0 ml-2 inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={loading}
              >
                <FaEye className="mr-1.5 h-3.5 w-3.5" />
                Preview
              </button>
            </div>
            
            {student.marks && Object.keys(student.marks).length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <FaFilter className="mr-1.5 h-3.5 w-3.5 flex-shrink-0" />
                  <span>Marks available for:</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {Object.keys(student.marks).map((term) => (
                    <span 
                      key={term}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {term}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Load data when component mounts with prop
  useEffect(() => {
    const init = async () => {
      try {
        if (propSelectedClass && !selectedClass) {
          await handleClassSelect(propSelectedClass);
        }
      } catch (error) {
        console.error('Error initializing component:', error);
        setError('Failed to initialize component. Please refresh the page.');
      }
    };
    
    init();
    
    // Cleanup function
    return () => {
      // Any cleanup if needed
    };
  }, [propSelectedClass]); // Only run when prop changes

  // Search term for filtering students
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(student => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      student.name?.toLowerCase().includes(search) ||
      student.rollNumber?.toString().includes(search) ||
      student.fatherName?.toLowerCase().includes(search)
    );
  });

  return (
    <div className="space-y-6 p-4">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Marksheet Generation</h2>
          <p className="mt-1 text-sm text-gray-500">
            Select a class to view and generate marksheets
          </p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 gap-6">
            <ClassSelectorCard 
              selected={selectedClass}
              onSelect={handleClassSelect}
            />
            
            {/* Search Box */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Search Students</label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaSearch className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-3 py-2 sm:text-sm border border-gray-300 rounded-md"
                  placeholder="Search by name or roll..."
                  disabled={!selectedClass || loading}
                />
              </div>
            </div>
          </div>
          
          {/* Status Bar */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="text-sm text-gray-600">
                {selectedClass ? (
                  <>
                    Showing <span className="font-medium">{filteredStudents.length}</span> of <span className="font-medium">{students.length}</span> students
                    {searchTerm && ` matching "${searchTerm}"`}
                  </>
                ) : (
                  'Select a class to view students'
                )}
              </div>
              
              {loading && (
                <div className="flex items-center text-sm text-blue-600 mt-2 sm:mt-0">
                  <FaSpinner className="animate-spin mr-2" />
                  <span>Loading data...</span>
                </div>
              )}
              
              {error && (
                <div className="text-sm text-red-600 mt-2 sm:mt-0">
                  {error}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {selectedClass && (
        <div className="w-full max-w-4xl mx-auto">
          <div className="bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Students in {CLASS_OPTIONS.includes(selectedClass) && selectedClass.length <= 2 ? `Class ${selectedClass}` : selectedClass}
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Click on Preview to view individual marksheets
              </p>
            </div>
            {renderStudentCards()}
          </div>
        </div>
      )}

      {renderPreviewModal()}
    </div>
  );
};

export default MarksheetGenerationPanel;