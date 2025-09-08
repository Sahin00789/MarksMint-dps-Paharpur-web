import React, { useState, useEffect } from 'react';
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
  FiClock
} from 'react-icons/fi';
import { FaSchool } from 'react-icons/fa';
import api from '../services/api';
import { toast } from 'react-toastify';
import { schoolinfo } from '../shared/schoolInformation';

function PublicResultsPage() {
  const { term } = useParams();
 
  
  const [formData, setFormData] = useState({
    class: '',
    roll: '',
    dob: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [availableClasses, setAvailableClasses] = useState([]);
  const [classConfigs, setClassConfigs] = useState({});
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [result, setResult] = useState(null);
  const [maxMarks, setMaxMarks] = useState(100); // Default to 100 if not found

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

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
    
    console.log('=== FETCHING RESULTS ===');
    console.log('Searching with params:', {
      class: formData.class,
      roll: formData.roll,
      dob: formData.dob,
      term: term
    });
    
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.get('/public/results', {
        params: {
          class: formData.class,
          roll: formData.roll,
          dob: formData.dob,
          term: term
        }
      });
      
      console.log('=== API RESPONSE ===');
      console.log('Status:', response.status);
      console.log('Response data:', response.data);
      
      if (response.data?.marks) {
        console.log('Marks data received:', response.data.marks);
      } else {
        console.log('No marks data in response');
      }
      
      setResult(response.data);
    } catch (err) {
      console.error('=== ERROR FETCHING RESULTS ===');
      console.error('Error details:', {
        message: err.message,
        response: {
          status: err.response?.status,
          data: err.response?.data,
          headers: err.response?.headers
        },
        request: err.request,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          params: err.config?.params,
          headers: err.config?.headers
        }
      });
      
      const errorMessage = err.response?.data?.message || 'Failed to fetch result. Please check your details and try again.';
      console.error('Error message to display:', errorMessage);
      setError(errorMessage);
      toast.error('Failed to fetch results. Please check your details and try again.');
    } finally {
      setLoading(false);
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
      if (value.name) return value.name;
      if (value.value) return value.value;
      if (value.toString) return value.toString();
      return fallback;
    }
    return String(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    try {
      const options = { year: 'numeric', month: 'long', day: 'numeric' };
      return new Date(dateString).toLocaleDateString(undefined, options);
    } catch (e) {
      return '';
    }
  };

  const defaultMetrics = {
    totalMarks: 0,
    maxMarks: 0,
    percentage: '0.00',
    grade: 'N/A'
  };

  // Update maxMarks when class, term, or configs change
  useEffect(() => {
    console.log('=== UPDATING MAX MARKS ===');
    console.log('Current form data:', formData);
    console.log('Current term:', term);
    console.log('Class configs:', classConfigs);
    
    if (formData.class && term && classConfigs[formData.class]?.[term]) {
      const classFullMarks = classConfigs[formData.class][term];
      console.log('Found full marks for class/term:', classFullMarks);
      setMaxMarks(parseInt(classFullMarks) || 100);
    } else if (result?.fullMarks) {
      setMaxMarks(parseInt(result.fullMarks) || 100);
    }
  }, [formData.class, term, classConfigs, result?.fullMarks]);

  const calculateMetrics = () => {
    try {
      if (!result || !result.marks || typeof result.marks !== 'object') {
        return { ...defaultMetrics };
      }
      
      const marks = result.marks || {};
      const subjects = Array.isArray(result.subjects) ? result.subjects : [];
      const totalMarks = Object.values(marks).reduce((sum, mark) => sum + (parseInt(mark) || 0), 0);
      const totalSubjects = Math.max(subjects.length, 1);
      
      const percentage = totalSubjects > 0 ? (totalMarks / (maxMarks * totalSubjects)) * 100 : 0;
      
      return {
        totalMarks,
        maxMarks: maxMarks * totalSubjects,
        percentage: percentage.toFixed(2),
        grade: getGrade(percentage)
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      return { ...defaultMetrics };
    }
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
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

  if (result) {
    const metrics = calculateMetrics() || defaultMetrics;
    const safeResult = result || {};

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Card */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
            <div className="p-6 text-center">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {schoolinfo.name || safeResult.student?.schoolName || 'School Name'}
              </h1>
              <h2 className="text-xl text-blue-600 dark:text-blue-400 font-medium mb-2">
                {term} Examination Result
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {schoolinfo.branch && `${schoolinfo.branch} | `}
                {schoolinfo.Address && `${schoolinfo.Address} | `}
                Academic Session: {safeResult.student?.session || '2024-2025'}
              </p>
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
                      {safeResult.student?.session || '2024-25'}
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
                        {safeResult.student?.studentName || 'N/A'}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Father's Name</p>
                      <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
                        {safeResult.student?.fatherName || 'N/A'}
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
                            {safeResult.student?.class || formData.class} {safeResult.student?.section ? `- ${safeResult.student.section}` : ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Roll No</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {safeResult.student?.rollNo || formData.roll}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">DOB</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatDate(safeResult.student?.dob) || 'N/A'}
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

            {/* Merged Performance and Subject Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-2xl w-full">
              <div className="bg-gradient-to-r from-green-600 to-purple-600 px-6 py-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <FiAward className="mr-2" /> Performance Overview
                </h3>
              </div>
              
              {/* Performance Summary */}
              <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl text-center border border-blue-100 dark:border-blue-800/50">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">Total Marks</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {metrics.totalMarks}
                    </p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-300/70 mt-1">
                      out of {metrics.maxMarks}
                    </p>
                  </div>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl text-center border border-green-100 dark:border-green-800/50">
                    <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Percentage</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {metrics.percentage}%
                    </p>
                    <p className="text-xs text-green-600/70 dark:text-green-300/70 mt-1">
                      Overall Score
                    </p>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-center border border-purple-100 dark:border-purple-800/50">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">Grade</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {getGrade(parseFloat(metrics.percentage))}
                    </p>
                    <p className="text-xs text-purple-600/70 dark:text-purple-300/70 mt-1">
                      Performance
                    </p>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl text-center border border-amber-100 dark:border-amber-800/50">
                    <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-1">Rank</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                      {safeResult.rank || 'N/A'}
                      {safeResult.totalStudents && ` / ${safeResult.totalStudents}`}
                    </p>
                    <p className="text-xs text-amber-600/70 dark:text-amber-300/70 mt-1">
                      Class Position
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Subject-wise Marks */}
              <div className="p-1">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Subject
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Marks
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          %
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {safeResult.subjects?.map((subject, index) => {
                        const marks = safeResult.marks?.[subject.key];
                        const isAbsent = marks === 'AB';
                        const numericMarks = isAbsent ? 0 : (Number(marks) || 0);
                        const maxMarks = classConfigs[formData.class]?.[term] || safeResult.fullMarks || 100;
                        const percentage = isAbsent ? 0 : Math.round((numericMarks / maxMarks) * 100);
                        const grade = isAbsent ? 'AB' : getGrade(percentage);
                        
                        return (
                          <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-8 w-8 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 mr-3">
                                  <span className="text-sm font-medium">{index + 1}</span>
                                </div>
                                <span className="text-base font-medium text-gray-900 dark:text-white">
                                  {subject.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className="text-lg font-bold text-gray-900 dark:text-white">
                                {isAbsent ? 'Absent' : numericMarks}
                                <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-1">/ {maxMarks}</span>
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className={`text-base font-semibold ${
                                isAbsent ? 'text-gray-500 dark:text-gray-400' :
                                percentage >= 80 ? 'text-green-600 dark:text-green-400' : 
                                percentage >= 60 ? 'text-blue-600 dark:text-blue-400' : 
                                percentage >= 40 ? 'text-yellow-600 dark:text-yellow-400' : 
                                'text-red-600 dark:text-red-400'
                              }`}>
                                {percentage}%
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full 
                                ${grade === 'A+' ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200' : 
                                   grade === 'A' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200' :
                                   grade === 'B' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200' : 
                                   'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'}`}>
                                {grade}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>


          <div className="flex justify-center">
            <button
              onClick={() => setResult(null)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
            >
              Check Another Result
            </button>
          </div>
        </div>
      </div>
    );
  }

  // If no result, show the search form
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {schoolinfo.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Enter your details to view your {term} results
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-8">
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

            <form onSubmit={handleSubmit} className="space-y-6">
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
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-[1.02] ${
                    loading ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? (
                    <>
                      <FiLoader className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                      Loading...
                    </>
                  ) : (
                    <>
                      View Results
                      <FiArrowRight className="ml-2 -mr-1 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Need help? Contact your school administration.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PublicResultsPage;
