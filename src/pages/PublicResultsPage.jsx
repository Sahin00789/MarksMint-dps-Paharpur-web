import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiAlertCircle, FiCalendar, FiHash, FiLoader, FiArrowRight } from 'react-icons/fi';
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
      
      setResult(response.data);
    } catch (err) {
      console.error('Error fetching result:', err);
      setError(err.response?.data?.message || 'Failed to fetch result. Please check your details and try again.');
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
    if (formData.class && term && classConfigs[formData.class]?.[term]) {
      const classFullMarks = classConfigs[formData.class][term];
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
        <div className="max-w-4xl mx-auto">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Student Info Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="bg-blue-600 dark:bg-blue-700 px-4 py-3">
                <h3 className="text-lg font-semibold text-white">Student Details</h3>
              </div>
              <div className="p-5">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {safeResult.student?.studentName || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Father's Name</p>
                    <p className="font-medium text-gray-800 dark:text-white">
                      {safeResult.student?.fatherName || 'N/A'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Class</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {safeResult.student?.class || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Roll No</p>
                      <p className="font-medium text-gray-800 dark:text-white">
                        {safeResult.student?.rollNo || formData.roll}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Performance Summary Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="bg-green-600 dark:bg-green-700 px-4 py-3">
                <h3 className="text-lg font-semibold text-white">Performance Summary</h3>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total Marks</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {metrics.totalMarks}
                    </p>
                    <p className="text-xs text-gray-500">/ {metrics.maxMarks}</p>
                  </div>
                  <div className="bg-green-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Percentage</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {metrics.percentage}%
                    </p>
                  </div>
                  <div className="bg-purple-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Grade</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {metrics.grade}
                    </p>
                  </div>
                  <div className="bg-yellow-50 dark:bg-gray-700 p-3 rounded-lg text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Rank</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                      {safeResult.rank || 'N/A'}
                      {safeResult.totalStudents && ` / ${safeResult.totalStudents}`}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subject Stats Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
              <div className="bg-purple-600 dark:bg-purple-700 px-4 py-3">
                <h3 className="text-lg font-semibold text-white">Subject Stats</h3>
              </div>
              <div className="p-5">
                {safeResult.subjects?.slice(0, 4).map((subject, index) => {
                  const marks = safeResult.marks?.[subject.key] || 0;
                  const maxMarks = classConfigs[formData.class]?.[term] || safeResult.fullMarks || 100;
                  const percentage = Math.round((marks / maxMarks) * 100);
                  const grade = getGrade(percentage);
                  
                  return (
                    <div key={index} className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700 dark:text-gray-200">
                          {subject.name}
                        </span>
                        <span className="font-medium">{marks}/{maxMarks}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div 
                          className={`h-2.5 rounded-full ${
                            percentage >= 80 ? 'bg-green-500' :
                            percentage >= 60 ? 'bg-blue-500' :
                            percentage >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Subject-wise Marks */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden mb-6">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Subject-wise Marks
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Subject
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Marks Obtained
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Max Marks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Grade
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {safeResult.subjects?.map((subject, index) => {
                    const marks = safeResult.marks?.[subject.key] || 0;
                    const maxMarks = classConfigs[formData.class]?.[term] || safeResult.fullMarks || 100;
                    const percentage = (marks / maxMarks) * 100;
                    const grade = getGrade(percentage);
                    
                    return (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          {subject.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900 dark:text-white">
                          {marks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500 dark:text-gray-300">
                          {maxMarks}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${grade === 'A+' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 
                               grade === 'A' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                               grade === 'B' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                               'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
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

          <div className="flex justify-center">
            <button
              onClick={() => setResult(null)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Check Another Result
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show the search form if no result is available
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Check Your Results
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
