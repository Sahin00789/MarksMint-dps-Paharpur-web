import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  FiAlertCircle, 
  FiCalendar, 
  FiHash, 
  FiLoader, 
  FiArrowRight, 
  FiAward, 
  FiPercent, 
  FiUser, 
  FiBook, 
  FiHome,
  FiPhone,
  FiMail,
  FiHelpCircle,
  FiSearch,
  FiInfo,
  FiArrowUp
} from 'react-icons/fi';
import { FaSchool, FaUserGraduate, FaFilePdf } from 'react-icons/fa';
import { FiPrinter } from 'react-icons/fi';
import html2pdf from 'html2pdf.js';
import api from '../services/api';
import { toast } from 'react-toastify';
import PrintResultModal from '../components/PrintResultModal/PrintResultModal';
import { schoolinfo } from '../shared/schoolInformation';
import { getPublishedStatuses, getPublishedStatus } from '../services/resultsService';

// Helper function to get grade description
const getGradeDescription = (grade) => {
  const gradeDescriptions = {
    'A+': 'Outstanding',
    'A': 'Excellent',
    'B+': 'Very Good',
    'B': 'Good',
    'C+': 'Satisfactory',
    'C': 'Average',
    'D': 'Below Average',
    'E': 'Needs Improvement',
    'F': 'Fail',
    'AB': 'Absent',
    'NA': 'Not Applicable'
  };
  return gradeDescriptions[grade] || 'Not Graded';
};

function PublicResultsPage() {
  const { term } = useParams();
  
  const [formData, setFormData] = useState({
    class: '',
    roll: '',
    dob: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableExams, setAvailableExams] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [classConfigs, setClassConfigs] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [result, setResult] = useState(null);
  const [examStats, setExamStats] = useState(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const printRef = useRef();
  const navigate = useNavigate();
  const [maxMarks, setMaxMarks] = useState(100); // Default to 100 if not found
  
  // Fetch available exams on component mount
  useEffect(() => {
    const fetchAvailableExams = async () => {
      try {
        setIsLoading(true);
        const response = await getPublishedStatuses();
        if (response.success) {
          setAvailableExams(response.data || []);
          
          // If a term is specified in the URL, load its data
          if (term) {
            loadExamData(term);
          }
        } else {
          setError('Failed to load available exams');
          toast.error('Failed to load available exams');
        }
      } catch (err) {
        console.error('Error fetching exams:', err);
        setError('Failed to load available exams');
        toast.error('Failed to load available exams');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableExams();
  }, [term]);

  // Load exam data for a specific term
  const loadExamData = async (examTerm) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await getPublishedStatus(examTerm);
      if (response.success) {
        setExamStats(response.data);
        
        // Extract available classes from the response
        if (response.data.stats?.perClass) {
          const classes = Object.keys(response.data.stats.perClass);
          setAvailableClasses(classes);
          
          // If there's only one class, pre-select it
          if (classes.length === 1 && !formData.class) {
            setFormData(prev => ({
              ...prev,
              class: classes[0]
            }));
          }
        }
        
        // If we have form data, try to fetch the result
        if (formData.class && formData.roll && formData.dob) {
          await fetchResult(examTerm);
        }
      } else {
        setError('Failed to load exam data');
        toast.error('Failed to load exam data');
      }
    } catch (err) {
      console.error('Error loading exam data:', err);
      setError('Failed to load exam data');
      toast.error('Failed to load exam data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch result for the selected student
  const fetchResult = async (examTerm) => {
    try {
      setLoading(true);
      setError('');
      
      // Format the date for the API
      const formattedDob = formatDateForBackend(formData.dob);
      
      console.log('Fetching result with params:', {
        class: formData.class,
        roll: formData.roll,
        dob: formattedDob,
        term: examTerm
      });
      
      const response = await api.get('/public/results', {
        params: {
          class: formData.class,
          roll: formData.roll,
          dob: formattedDob,
          term: examTerm
        }
      });
      
      console.log('Raw API response:', response);
      
      if (response.data) {
        console.log('Response data structure:', {
          keys: Object.keys(response.data),
          hasSubjectDetails: 'subjectDetails' in response.data,
          hasSubjects: 'subjects' in response.data
        });
        setResult(response.data);
      } else {
        throw new Error('No data received from server');
      }
    } catch (err) {
      console.error('Error fetching result:', err);
      const errorMessage = err.response?.data?.message || 'Failed to fetch result. Please check your details and try again.';
      setError(errorMessage);
      setResult(null);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!term) {
      toast.error('No exam term specified');
      return;
    }
    if (!formData.class || !formData.roll || !formData.dob) {
      toast.error('Please fill in all fields');
      return;
    }
    await fetchResult(term);
  };

  // Log result structure when it changes
  useEffect(() => {
    console.log('Result object:', result);
    
    if (result) {
      console.log('Result keys:', Object.keys(result));
      
      // Check if subjectDetails exists in the result
      if (result.subjectDetails) {
        console.log('Subject Details found:', result.subjectDetails);
        console.log('Subject Details type:', typeof result.subjectDetails);
        
        if (Array.isArray(result.subjectDetails)) {
          console.log('Subject Details is an array with length:', result.subjectDetails.length);
          
          if (result.subjectDetails.length > 0) {
            console.log('First subject:', result.subjectDetails[0]);
            console.log('Subject names:', result.subjectDetails.map(s => s.subject || s.name || 'No subject name'));
          } else {
            console.log('Subject Details array is empty');
          }
        }
      } else if (result.subjects) {
        // Check if subjects might be under a different property name
        console.log('Found subjects under result.subjects:', result.subjects);
        console.log('Subjects type:', typeof result.subjects);
      } else {
        console.log('No subjectDetails or subjects found in result');
      }
    }
  }, [result]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) {
      setError('');
    }
  };


  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const response = await api.get('/configs');
        const configs = response.data.items || [];
        const classes = configs.map(config => config.class);
        setAvailableClasses(classes);
        console.log(response.data);
        
        // Store configs for max marks lookup
        const configsMap = {};
        configs.forEach(config => {
          if (config.class && config.fullMarks) {
            configsMap[config.class] = config.fullMarks;
          }
        });
        setClassConfigs(configsMap);
      } catch (error) {
        console.error('Error fetching classes:', error);
        toast.error('Failed to load classes');
      } finally {
        setIsLoadingClasses(false);
      }
    };
    
    fetchClasses();
  }, []);

  const formatDateForBackend = (dateString) => {
    try {
      // Convert from YYYY-MM-DD to MM/DD/YYYY
      const [year, month, day] = dateString.split('-');
      return `${month}/${day}/${year}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString; // Return as is if formatting fails
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Handle different date formats
      let date;
      if (dateString.includes('-')) {
        // Handle YYYY-MM-DD format
        const [year, month, day] = dateString.split('-');
        date = new Date(year, month - 1, day);
      } else if (dateString.includes('/')) {
        // Handle MM/DD/YYYY format
        const [month, day, year] = dateString.split('/');
        date = new Date(year, month - 1, day);
      } else {
        // Try direct date parsing
        date = new Date(dateString);
      }
      
      if (isNaN(date.getTime())) return dateString; // Return original if invalid
      
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return date.toLocaleDateString(undefined, options);
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString; // Return original if there's an error
    }
  };

  const safeRender = (value, fallback = 'N/A') => {
    if (value === null || value === undefined) return fallback;
    if (typeof value === 'object') {
      if (value.total !== undefined && value.maxTotal !== undefined) {
        return value.percentage !== undefined ? 
          `${value.percentage}%` : 
          `${value.total} / ${value.maxTotal}`;
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  const defaultMetrics = {
    totalMarks: 0,
    maxMarks: 0,
    percentage: '0.00',
    grade: 'N/A'
  };

  // Update maxMarks when result or term changes
  useEffect(() => {
    console.log('=== UPDATING MAX MARKS ===');
    console.log('Current term:', term);
    console.log('Result exam configs:', result?.examConfigs);
    
    if (!result?.examConfigs?.[term]) {
      console.log('No exam config found for term, using default max marks');
      setMaxMarks(100);
      return;
    }
    
    // Calculate max marks from exam config for the current term
    const termConfig = result.examConfigs[term];
    const calculatedMax = termConfig.reduce((sum, config) => {
      return sum + (parseInt(config.marks) || 0);
    }, 0);
    
    console.log('Calculated max marks from exam config:', calculatedMax);
    setMaxMarks(calculatedMax || 100);
    
  }, [result?.examConfigs, term]);

  // Helper function to get grade from percentage
  const getGrade = (percentage) => {
    if (percentage >= 80) return 'A+';
    if (percentage >= 70) return 'A';
    if (percentage >= 60) return 'A-';
    if (percentage >= 50) return 'B';
    if (percentage >= 40) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  };

  const calculateMetrics = () => {
    const defaultMetrics = {
      totalMarks: 0,
      maxMarks: 0,
      percentage: 0,
      grade: 'N/A',
      subjectDetails: {},
      isAbsent: false,
      passedIn: 0,
      failedIn: 0,
      absentIn: 0,
      totalSubjects: 0
    };

    try {
      if (!result) {
        return { ...defaultMetrics };
      }

      // If we have subjectDetails in the result, use them directly
      if (result.subjectDetails && typeof result.subjectDetails === 'object') {
        console.log('Using direct subject details from result:', result.subjectDetails);
        
        const subjectDetails = {};
        let totalObtained = 0;
        let totalMax = 0;
        let passedSubjects = 0;
        let failedSubjects = 0;
        let absentSubjects = 0;
        
        // Process each subject from subjectDetails
        Object.entries(result.subjectDetails).forEach(([subject, data]) => {
          if (!data) return;
          
          const obtainedMarks = parseFloat(data.total) || 0;
          const maxMarks = parseFloat(data.max) || 0;
          const percentage = parseFloat(data.percentage) || 0;
          const grade = data.grade || getGrade(percentage);
          const isAbsent = data.isAbsent || false;
          
          // Update subject status counters
          if (isAbsent) {
            absentSubjects++;
          } else if (grade === 'F') {
            failedSubjects++;
          } else {
            passedSubjects++;
          }
          
          // Process evaluations if they exist
          let evaluations = [];
          if (data.evaluations && Array.isArray(data.evaluations)) {
            evaluations = data.evaluations.map(evalItem => ({
              type: evalItem.type || 'written',
              name: evalItem.name || 'Evaluation',
              marks: parseFloat(evalItem.marks) || 0,
              maxMarks: parseFloat(evalItem.maxMarks) || 0,
              isAbsent: evalItem.isAbsent || false,
              status: evalItem.status || 'Graded'
            }));
          }
          
          // Store subject details
          subjectDetails[subject] = {
            subject,
            total: obtainedMarks,
            max: maxMarks,
            percentage: percentage.toFixed(2),
            grade: grade,
            isAbsent: isAbsent,
            evaluations: evaluations
          };
          
          // Update totals
          if (!isAbsent) {
            totalObtained += obtainedMarks;
            totalMax += maxMarks;
          }
        });
        
        // Calculate overall percentage and grade
        const overallPercentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
        const overallGrade = getGrade(overallPercentage);
        
        return {
          totalMarks: totalObtained,
          maxMarks: totalMax,
          percentage: overallPercentage.toFixed(2),
          grade: overallGrade,
          subjectDetails,
          isAbsent: absentSubjects === Object.keys(subjectDetails).length,
          passedIn: passedSubjects,
          failedIn: failedSubjects,
          absentIn: absentSubjects,
          totalSubjects: Object.keys(subjectDetails).length
        };
      }
      
      // Fallback to legacy format if needed
      if (result.marks && typeof result.marks === 'object') {
        return calculateLegacyMetrics();
      }
      
      return { ...defaultMetrics };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return { ...defaultMetrics };
    }
  };
  
  // Helper function to handle legacy format (kept for backward compatibility)
  const calculateLegacyMetrics = () => {
    try {
      if (!result || !result.marks || typeof result.marks !== 'object') {
        return { ...defaultMetrics };
      }
      
      const termMarks = result.marks || {};
      let totalMarks = 0;
      let maxPossibleMarks = 0;
      const subjectDetails = {};
      
      // Process each subject
      Object.entries(termMarks).forEach(([subject, data]) => {
        if (typeof data !== 'object' || data === null) return;
        
        const obtainedMarks = parseFloat(data.obtainedMarks) || 0;
        const totalMarksForSubject = parseFloat(data.totalMarks) || 0;
        const isAbsent = data.isAbsent || false;
        
        // Calculate percentage if max is valid
        const percentage = totalMarksForSubject > 0 ? (obtainedMarks / totalMarksForSubject) * 100 : 0;
        const grade = isAbsent ? 'AB' : getGrade(percentage);
        
        // Store subject details
        subjectDetails[subject] = {
          total: obtainedMarks,
          max: totalMarksForSubject,
          percentage: percentage.toFixed(2),
          grade: grade,
          isAbsent: isAbsent,
          evaluations: []
        };
        
        // Update totals
        totalMarks += obtainedMarks;
        maxPossibleMarks += totalMarksForSubject;
      });
      
      // Calculate overall percentage and grade
      const overallPercentage = maxPossibleMarks > 0 ? (totalMarks / maxPossibleMarks) * 100 : 0;
      const overallGrade = getGrade(overallPercentage);
      
      return {
        totalMarks: totalMarks,
        maxMarks: maxPossibleMarks,
        percentage: overallPercentage.toFixed(2),
        grade: overallGrade,
        subjectDetails,
        isAbsent: false
      };
    } catch (error) {
      console.error('Error calculating legacy metrics:', error);
      return { ...defaultMetrics };
    }
  };


  if (isLoadingClasses) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FiLoader className="animate-spin h-8 w-8 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  const handleBackToResults = () => {
    setResult(null);
  };

  // Render the result section if we have a result
  const renderResult = () => {
    if (!result) return null;

    const metrics = calculateMetrics();
    const { student, summary = {} } = result;
    const displayMetrics = { ...metrics, ...summary };
    const { totalMarks = 0, maxMarks = 0, percentage = 0, grade = 'N/A' } = displayMetrics;
    
    // Get subject details from the result
    const subjectDetails = metrics.subjectDetails || {};

    console.log("metrics in render result",metrics);
    

    if (isPrinting) {
      return (
        <div className="fixed inset-0 bg-white z-50 overflow-auto">
          <PrintableResult 
            ref={printRef} 
            result={result} 
            term={term} 
            onBack={handleBackToResults}
            onPrint={handlePrint}
          />
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-6">
              <div className="flex flex-col items-center sm:flex-row sm:items-center sm:justify-center gap-4">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white text-center">
                  {schoolinfo.name || result?.student?.schoolName || 'School Name'}
                </h1>
                {schoolinfo.branch && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                    {schoolinfo.branch}
                  </span>
                )}
              </div>
              <div className="mt-2 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {schoolinfo.Address && `${schoolinfo.Address} | `}
                  Academic Session: {result?.student?.session || '2024-2025'}
                </p>
              </div>
              <h2 className="text-xl text-blue-600 dark:text-blue-400 font-medium mt-3 text-center">
                {term} Examination Result
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 mb-6">
            {/* Enhanced Student Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl w-full">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FiUser className="h-5 w-5 text-white mr-2" />
                    <h2 className="text-lg font-bold text-white">
                      Student Information
                    </h2>
                  </div>
                  <div className="bg-white/20 px-3 py-1 rounded-full">
                    <span className="text-sm font-medium text-white">
                      {result?.student?.session || '2024-25'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Full Name</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {result?.student?.name || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Father's Name</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {result?.student?.fatherName || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Academic Details</p>
                      <div className="mt-2 grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Class</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {result?.student?.class || formData.class} {result?.student?.section ? `- ${result.student.section}` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Roll No</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {result?.student?.rollNo || formData.roll}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">DOB</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(result?.student?.dob) || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Term</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {term || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Overview Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl w-full">
              <div className="bg-gradient-to-r from-pink-600 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <FiAward className="mr-2" /> Performance Overview
                </h3>
              </div>
              
              {/* Performance Stats - Responsive Grid */}
              <div className="px-4 pb-2 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
                  {/* Total Marks */}
                  <div className="bg-white dark:bg-gray-800/90 p-3 rounded-xl border border-gray-100/80 dark:border-gray-700/80 hover:shadow-sm transition-shadow duration-200 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 to-transparent dark:from-blue-900/5 dark:to-transparent group-hover:opacity-30 opacity-20 transition-opacity duration-200"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-blue-600/90 dark:text-blue-400/90">Total Marks</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50/50 text-blue-700/80 dark:bg-blue-900/20 dark:text-blue-300/90">
                          Max: {summary.totalMarks}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <p className="text-2xl font-bold text-gray-800 dark:text-white/95">
                          {summary.obtainedMarks || 0}
                        </p>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          / {summary.totalMarks}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100/80 dark:bg-gray-700/80 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-700"
                          style={{ width: `${Math.min(100, ((summary.obtainedMarks || 0) / (result?.exam?.fullMarks || maxMarks)) * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-right">
                        {Math.round(((summary.obtainedMarks || 0) / (result?.exam?.fullMarks || maxMarks)) * 100)}% of total
                      </p>
                    </div>
                  </div>

                  {/* Percentage */}
                  <div className="bg-white dark:bg-gray-800/90 p-3 rounded-xl border border-gray-100/80 dark:border-gray-700/80 hover:shadow-sm transition-shadow duration-200 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-green-50/80 to-transparent dark:from-green-900/5 dark:to-transparent group-hover:opacity-30 opacity-20 transition-opacity duration-200"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-green-600/90 dark:text-green-400/90">Percentage</p>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-50/50 text-green-700/80 dark:bg-green-900/20 dark:text-green-300/90">
                          {percentage >= 75 ? 'Excellent' : percentage >= 40 ? 'Good' : 'Needs Improvement'}
                        </span>
                      </div>
                      <p className="text-xl font-bold text-gray-800 dark:text-white/95 mb-1.5">
                        {typeof percentage === 'number' ? percentage.toFixed(1) : percentage}%
                      </p>
                      <div className="w-full bg-gray-100/80 dark:bg-gray-700/80 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-700"
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Grade */}
                  <div className="bg-white dark:bg-gray-800/90 p-3 rounded-xl border border-gray-100/80 dark:border-gray-700/80 hover:shadow-sm transition-shadow duration-200 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-50/80 to-transparent dark:from-purple-900/5 dark:to-transparent group-hover:opacity-30 opacity-20 transition-opacity duration-200"></div>
                    <div className="relative">
                      <p className="text-xs font-medium text-purple-600/90 dark:text-purple-400/90 mb-1">Grade</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-gray-800 dark:text-white/95">
                            {grade}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50/70 text-purple-700/90 dark:bg-purple-900/20 dark:text-purple-300/90">
                            {getGradeDescription(grade)}
                          </span>
                        </div>
                        {grade === 'A+' || grade === 'A' ? '🏆' : 
                         grade === 'B+' || grade === 'B' ? '👍' : 
                         grade === 'F' || grade === 'AB' ? '⚠️' : '📊'}
                      </div>
                      <div className="w-full bg-gray-100/80 dark:bg-gray-700/80 rounded-full h-1.5 mt-2.5 overflow-hidden">
                        <div 
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                          style={{ width: '100%' }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Rank */}
                  <div className="bg-white dark:bg-gray-800/90 p-3 rounded-xl border border-gray-100/80 dark:border-gray-700/80 hover:shadow-sm transition-shadow duration-200 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-amber-50/80 to-transparent dark:from-amber-900/5 dark:to-transparent group-hover:opacity-30 opacity-20 transition-opacity duration-200"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-amber-600/90 dark:text-amber-400/90">Class Rank</p>
                        {summary.rank && summary.totalStudents && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50/50 text-amber-700/80 dark:bg-amber-900/20 dark:text-amber-300/90">
                            Top {Math.round((summary.rank / summary.totalStudents) * 100)}%
                          </span>
                        )}
                      </div>
                      <div className="flex items-baseline gap-1.5 mb-1.5">
                        <p className="text-xl font-bold text-gray-800 dark:text-white/95">
                          {summary.rank ? `#${summary.rank}` : 'N/A'}
                        </p>
                        {summary.totalStudents && (
                          <span className="text-xs text-gray-500/90 dark:text-gray-400/90">
                            of {summary.totalStudents} students
                          </span>
                        )}
                      </div>
                      <div className="w-full bg-gray-100/80 dark:bg-gray-700/80 rounded-full h-1.5 overflow-hidden">
                        {summary.rank && summary.totalStudents && (
                          <div 
                            className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                            style={{ width: `${100 - Math.min(100, (summary.rank / summary.totalStudents) * 100)}%` }}
                          ></div>
                        )}
                      </div>
                      {summary.rank && (
                        <p className="text-[11px] mt-1.5 text-amber-500/90 dark:text-amber-400/90 font-medium">
                          {summary.rank === 1 ? '🥇 Top of the class!' : 
                           summary.rank <= 3 ? '🏆 Excellent performance!' : 
                           summary.rank <= 10 ? '✨ Great job!' : 'Keep it up!'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Subject-wise Marks - Cards Layout */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                  <FiBook className="mr-2" /> Subject-wise Performance
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(subjectDetails).map(([subjectName, subject], index) => {
                    const { total, max, percentage, grade, isAbsent, evaluations = [] } = subject;
                    const numericPercentage = parseFloat(percentage) || 0;
                    const numericTotal = parseFloat(total) || 0;
                    const numericMax = parseFloat(max) || 0;
                    
                    // Determine card color based on grade (lemon theme)
                    const cardColor = isAbsent 
                      ? 'bg-gray-50 dark:bg-gray-800/50' 
                      : numericPercentage >= 80 
                        ? 'bg-amber-50 dark:bg-amber-900/10' 
                        : numericPercentage >= 60 
                          ? 'bg-yellow-50 dark:bg-yellow-900/10' 
                          : numericPercentage >= 40 
                            ? 'bg-amber-50 dark:bg-amber-900/10' 
                            : 'bg-rose-50/80 dark:bg-rose-900/20';
                    
                    return (
                      <div key={index} className={`rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700 transition-all duration-300 hover:shadow-lg ${cardColor}`}>
                        {/* Card Header */}
                        <div className="p-4 border-b border-amber-100 dark:border-amber-800/30 bg-white/70 dark:bg-amber-900/10 backdrop-blur-sm">
                          <div className="flex items-center justify-between">
                            <h4 className="text-lg font-semibold text-gray-800 dark:text-white">
                              {subjectName}
                            </h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                              isAbsent ? 'bg-gray-100/80 text-gray-700 dark:bg-gray-700/50 dark:text-gray-200' :
                              grade === 'A+' ? 'bg-emerald-100/80 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 
                              grade === 'A' ? 'bg-amber-100/80 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' :
                              grade === 'B' ? 'bg-yellow-100/80 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200' : 
                              'bg-rose-100/80 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200'
                            }`}>
                              {grade}
                            </span>
                          </div>
                          {!isAbsent && (
                            <div className="mt-2">
                              <div className="w-full bg-amber-100 rounded-full h-2 dark:bg-amber-900/30">
                                <div 
                                  className={`h-2 rounded-full ${
                                    numericPercentage >= 80 ? 'bg-emerald-400' : 
                                    numericPercentage >= 60 ? 'bg-amber-400' : 
                                    numericPercentage >= 40 ? 'bg-yellow-400' : 'bg-rose-400'
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, numericPercentage))}%` }}
                                ></div>
                              </div>
                              <div className="text-center text-xs font-medium text-gray-500 dark:text-gray-400 mt-1">
                                {Math.round(numericPercentage)}%
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Card Body */}
                        <div className="p-4">
                          {/* Total Marks */}
                          <div className="mb-4">
                            <div className="flex justify-between items-center">
                              <span className="text-base font-semibold text-gray-700 dark:text-gray-200">Total Marks</span>
                              <span className="text-lg font-bold text-gray-900 dark:text-white bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-lg">
                                {isAbsent ? 'Absent' : (`${numericTotal} / ${numericMax}`)}
                              </span>
                            </div>
                          </div>
                          
                          {/* Evaluation Details */}
                          {evaluations.length > 0 && (
                            <div className="space-y-2 mt-4">
                              <h5 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2 border-b border-gray-200 dark:border-gray-700 pb-1">Evaluation Breakdown</h5>
                              <div className="space-y-3">
                                {evaluations.map((evalItem, evalIndex) => {
                                  const evalPercentage = evalItem.maxMarks > 0 
                                    ? (evalItem.marks / evalItem.maxMarks) * 100 
                                    : 0;
                                  const isPassing = evalPercentage >= 40;
                                  
                                  // Get the evaluation type, defaulting to 'written' for backward compatibility
                                  const evaluationType = evalItem.type || 'written';
                                  const displayName = evaluationType === 'written' ? 'Written' :
                                                    evaluationType === 'oral' ? 'Oral' :
                                                    'Evaluation';
                                  
                                  return (
                                    <div key={evalIndex} className="space-y-1.5">
                                      <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2">
                                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                            {displayName}:
                                          </span>
                                          <span className="font-mono text-sm font-bold text-gray-800 dark:text-white">
                                            {Math.round(evalItem.marks)} / {Math.round(evalItem.maxMarks)}
                                          </span>
                                        </div>
                                        {isPassing && (
                                          <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                            Passed
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center justify-between mt-1">
                                        <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{displayName}</span>
                                        <div className="relative w-10 h-10">
                                          <svg className="w-full h-full" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg">
                                            <circle
                                              cx="18"
                                              cy="18"
                                              r="15.9155"
                                              fill="none"
                                              className="stroke-gray-200 dark:stroke-gray-700"
                                              strokeWidth="3"
                                            />
                                            <circle
                                              cx="18"
                                              cy="18"
                                              r="15.9155"
                                              fill="none"
                                              className={isPassing ? 'stroke-green-500' : 'stroke-red-500'}
                                              strokeWidth="3"
                                              strokeDasharray={`${evalPercentage} ${100 - evalPercentage}`}
                                              strokeDashoffset="25"
                                              strokeLinecap="round"
                                              transform="rotate(-90 18 18)"
                                            />
                                            <text
                                              x="50%"
                                              y="50%"
                                              textAnchor="middle"
                                              dy=".3em"
                                              className="text-[8px] font-medium fill-gray-700 dark:fill-gray-300"
                                            >
                                              {Math.round(evalPercentage)}%
                                            </text>
                                          </svg>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button
              onClick={() => setPrintModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
              </svg>
              Print Result
            </button>
            <button
              onClick={() => setResult(null)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
              Check Another Result
            </button>
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FiHome className="-ml-1 mr-2 h-5 w-5" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper component for info rows
  const InfoRow = ({ label, value }) => (
    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-medium text-gray-700 dark:text-gray-200">{value || 'N/A'}</span>
    </div>
  );

  // If we have a result, show it
  if (result) {
    return (
      <div className="relative">
        <div ref={printRef}>
          {renderResult()}
        </div>
        
        {/* Print Result Modal */}
        <PrintResultModal
          open={printModalOpen}
          onClose={() => setPrintModalOpen(false)}
          studentData={{
            ...result.student,
            name: result.student?.name || 'N/A',
            class: result.student?.class || 'N/A',
            section: result.student?.section,
            roll: result.student?.roll || 'N/A',
            fatherName: result.student?.fatherName || 'N/A',
            motherName: result.student?.motherName || 'N/A',
            dob: result.student?.dob
          }}
          resultData={result}
        />
      </div>
    );
  }

  // Otherwise, show the search form
  return (
    <div className="min-h-screen w-full bg-gray-50 dark:bg-gray-900 p-4 sm:p-6 flex flex-col">
      {/* School Card */}
      <div className="w-full max-w-6xl mx-auto mb-6">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl">
          <div className="p-6">
            <div className="flex flex-col items-center text-center">
              <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
                {schoolinfo.name}
                {schoolinfo.branch && (
                  <span className="ml-3 inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white transform transition-transform hover:scale-105">
                    {schoolinfo.branch}
                  </span>
                )}
              </h1>
              {schoolinfo.Address && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  {schoolinfo.Address}
                </p>
              )}
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Academic Session: {result?.student?.session || '2024-2025'}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Background pattern */}
        <div className="hidden lg:block fixed inset-0 -z-10 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Main Form Container */}
        <div className="w-full">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 hover:shadow-2xl transition-all duration-300">
            <div className="p-6 sm:p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check Your Results</h2>
                <p className="text-gray-600 dark:text-gray-300">
                  View your <span className="font-semibold text-blue-600 dark:text-blue-400">{term}</span> results
                </p>
              </div>
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded">
                <div className="flex items-start">
                  <div className="flex-shrink-0 pt-0.5">
                    <FiAlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 animate-fade-in">
              <style jsx>{`
                @keyframes fadeIn {
                  from { opacity: 0; transform: translateY(10px); }
                  to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                  animation: fadeIn 0.3s ease-out forwards;
                }
              `}</style>
              <div>
                <label htmlFor="class" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Class
                </label>
                <select
                  id="class"
                  name="class"
                  value={formData.class}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-colors"
                  required
                >
                  <option value="">Select Class</option>
                  {availableClasses.map((cls, index) => (
                    <option key={index} value={cls}>
                      {cls}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="roll" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Roll Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiHash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    id="roll"
                    name="roll"
                    value={formData.roll}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-colors"
                    placeholder="Enter your roll number"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date of Birth
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    className="w-full pl-10 px-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 dark:text-white transition-colors"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                        Loading...
                      </>
                    ) : (
                      <>
                        <FiSearch className="mr-2" />
                        View Results
                        <FiArrowRight className="ml-2 -mr-1 h-5 w-5 transition-transform" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

    
        </div>
        
        {/* Right Column - Instructions */}
        <div className="w-full flex flex-col">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 flex-1 flex flex-col">
            <div className="p-6 sm:p-8 flex-1">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
                <FiInfo className="mr-2 text-blue-500" />
                How to Check Results
              </h2>
              <div className="space-y-5">
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg mr-4 mt-0.5">1</div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-200 text-base">Enter Your Details</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Fill in your class, roll number, and other required information.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg mr-4 mt-0.5">2</div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-200 text-base">Submit the Form</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Click the 'Get Result' button to view your results.</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg mr-4 mt-0.5">3</div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-gray-200 text-base">View & Download</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">View your detailed results and download or print if needed.</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <h3 className="font-medium text-blue-800 dark:text-blue-300 text-sm flex items-center">
                  <FiHelpCircle className="mr-2 h-4 w-4" /> Need Help?
                </h3>
                <div className="mt-3 space-y-3">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                    <a 
                      href={`mailto:${schoolinfo.contact?.email || 'admin@school.edu'}`}
                      className="text-sm text-blue-600 dark:text-blue-300 hover:underline font-medium"
                    >
                      {schoolinfo.contact?.email || 'admin@school.edu'}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.5 2h-11C4 2 2 4 2 6.5v11C2 19.5 4 22 6.5 22h11c2.5 0 4.5-2.5 4.5-4.5v-11C22 4 20 2 17.5 2zm-11 2h11c.8 0 1.5.7 1.5 1.5v.9l-7 4.2-7-4.2v-.9c0-.8.7-1.5 1.5-1.5zm11 16h-11c-.8 0-1.5-.7-1.5-1.5V8.4l6.5 3.9c.2.1.4.2.6.2.2 0 .4-.1.6-.2l6.5-3.9v10.1c0 .8-.7 1.5-1.5 1.5z"/>
                      <path d="M12 11c1.7 0 3-1.3 3-3s-1.3-3-3-3-3 1.3-3 3 1.3 3 3 3zm0-4c.6 0 1 .4 1 1s-.4 1-1 1-1-.4-1-1 .4-1 1-1z"/>
                    </svg>
                    <a 
                      href={`https://wa.me/916295884463`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-green-600 dark:text-green-400 hover:underline font-medium flex items-center"
                    >
                      +91 6295884463
                      <span className="ml-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-0.5 rounded-full">
                        WhatsApp
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="px-6 pb-6 sm:px-8 pt-4 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={() => navigate('/')}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-[1.02]"
              >
                <FiHome className="mr-2 h-4 w-4" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PublicResultsPage;
