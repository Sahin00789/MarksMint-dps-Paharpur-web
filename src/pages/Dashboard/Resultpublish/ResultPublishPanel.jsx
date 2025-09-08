import React, { useEffect, useState } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { FiChevronDown, FiChevronUp, FiCalendar, FiUsers, FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '@/services/api';

const ResultPublishPanel = () => {
  const [results, setResults] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [publishing, setPublishing] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [passwordInput, setPasswordInput] = useState({});
  const [expandedCard, setExpandedCard] = useState(null);
  const { theme } = useTheme();

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.3
      }
    })
  };

  useEffect(() => {
    fetchResultsStatus();
    fetchAvailableClasses();
  }, []);

  const fetchAvailableClasses = async () => {
    try {
      setLoadingClasses(true);
      const { data } = await api.get('/configs');
      // Extract unique class names from configs
      const classes = [...new Set(data.items?.map(config => config.class).filter(Boolean) || [])];
      setAvailableClasses(classes);
    } catch (error) {
      console.error('Error fetching available classes:', error);
      // toast.error('Failed to load available classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchResultsStatus = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/results');
      console.log('Results data:', data); // Debug log
      setResults(data.items || []);
    } catch (error) {
      console.error('Error fetching results status:', error);
      // toast.error('Failed to load results status');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async (term, currentStatus) => {
    if (publishing[term]) return;

    try {
      setPublishing(prev => ({ ...prev, [term]: true }));
      const adminPassword = passwordInput[term] || '';
      
      await api.post('/results', {
        term,
        isPublished: !currentStatus,
        adminPassword,
        publishedAt: new Date().toISOString()
      });

      // toast.success(`Results ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      await fetchResultsStatus();
    } catch (error) {
      console.error('Error updating publish status:', error);
      const message = error.response?.data?.message || 'Failed to update publish status';
      // toast.error(message);
    } finally {
      setPublishing(prev => ({ ...prev, [term]: false }));
      setPasswordInput(prev => ({ ...prev, [term]: '' }));
      setShowPassword(prev => ({ ...prev, [term]: false }));
    }
  };

  const handleCardClick = (term, e) => {
    // Don't toggle if the click was on a button or input
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT' || e.target.closest('button, input')) {
      return;
    }
    setExpandedCard(expandedCard === term ? null : term);
  };

  if (loading || loadingClasses) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Result Publication</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Publish or unpublish results for each term. Published results will be visible to students.
        </p>
      </div>
      
      {availableClasses.length === 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-500 p-4 rounded-r-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">No classes found</h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                Please add classes and configure results before publishing.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result, index) => (
            <motion.div
              key={result.term}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${
                expandedCard === result.term ? 'ring-2 ring-indigo-500/20' : ''
              }`}
              onClick={(e) => handleCardClick(result.term, e)}
            >
              <div className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{result.term}</h3>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        result.isPublished 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                          : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                      }`}>
                        {result.isPublished ? 'Published' : 'Not Published'}
                      </div>
                    </div>
                    
                    <div className="mt-2 flex flex-wrap gap-4 text-sm">
                      <div className="flex items-center text-gray-600 dark:text-gray-300">
                        <FiCalendar className="mr-1.5 h-4 w-4 text-gray-400" />
                        <span>Last Updated: {result.stats?.lastUpdated ? formatDate(result.stats.lastUpdated) : 'N/A'}</span>
                      </div>
                      {result.stats && (
                        <>
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <FiCheckCircle className="mr-1.5 h-4 w-4 text-green-500" />
                            <span>{result.stats.updated || 0} Updated</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <FiXCircle className="mr-1.5 h-4 w-4 text-yellow-500" />
                            <span>{result.stats.pendingUpdates || 0} Pending</span>
                          </div>
                          <div className="flex items-center text-gray-600 dark:text-gray-300">
                            <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1.5"></span>
                            <span>{result.stats.totalStudents || 0} Total</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <button 
                    className="ml-4 p-1.5 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCard(expandedCard === result.term ? null : result.term);
                    }}
                  >
                    {expandedCard === result.term ? (
                      <FiChevronUp className="h-5 w-5" />
                    ) : (
                      <FiChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedCard === result.term && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/30">
                      {/* Progress Bar */}
                      {result.stats && (
                        <div className="mt-4 mb-6">
                          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                            <span>Progress: {result.stats.updated || 0} / {result.stats.totalStudents || 0}</span>
                            <span>{result.stats.completionPercentage || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                            <div 
                              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
                              style={{ width: `${result.stats.completionPercentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Class-wise Stats */}
                      {result.stats?.perClass && Object.keys(result.stats.perClass).length > 0 && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Class-wise Status</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Updated</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Pending</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Total</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {Object.entries(result.stats.perClass).map(([className, stats]) => (
                                  <tr key={className} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{className}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">{stats.updated}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-yellow-600 dark:text-yellow-400">{stats.pending}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{stats.total}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      <div className="mb-6">
                        <div className="relative group">
                          <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg opacity-0 group-hover:opacity-100 blur transition duration-300"></div>
                          <div className="relative bg-white dark:bg-gray-800 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center px-4 py-3">
                              <div className="flex-1">
                                <label 
                                  htmlFor={`password-${result.term}`}
                                  className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1"
                                >
                                  Admin Authentication Required
                                </label>
                                <div className="relative mt-1">
                                  <input
                                    type={showPassword[result.term] ? 'text' : 'password'}
                                    id={`password-${result.term}`}
                                    className="block w-full pr-10 py-2 border-0 bg-transparent text-gray-900 dark:text-white placeholder-gray-400 focus:ring-0 sm:text-sm"
                                    placeholder="••••••••"
                                    value={passwordInput[result.term] || ''}
                                    onChange={(e) => setPasswordInput(prev => ({
                                      ...prev,
                                      [result.term]: e.target.value
                                    }))}
                                    onClick={(e) => e.stopPropagation()}
                                    autoComplete="current-password"
                                  />
                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                                    <button
                                      type="button"
                                      className="text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 focus:outline-none"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setShowPassword(prev => ({
                                          ...prev,
                                          [result.term]: !prev[result.term]
                                        }));
                                      }}
                                      aria-label={showPassword[result.term] ? 'Hide password' : 'Show password'}
                                    >
                                      {showPassword[result.term] ? (
                                        <FiEyeOff className="h-5 w-5" />
                                      ) : (
                                        <FiEye className="h-5 w-5" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400">
                              Administrator privileges required to publish/unpublish results
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublishToggle(result.term, result.isPublished);
                          }}
                          disabled={publishing[result.term] || (!result.isPublished && result.stats?.pendingUpdates !== 0)}
                          className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                            result.isPublished
                              ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 focus:ring-red-500'
                              : result.stats?.pendingUpdates === 0
                                ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:ring-indigo-500'
                                : 'bg-gray-400 cursor-not-allowed dark:bg-gray-600'
                          } focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors`}
                        >
                          {publishing[result.term] ? (
                            <>
                              <FaSpinner className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" />
                              Processing...
                            </>
                          ) : result.isPublished ? (
                            <>
                              <FiXCircle className="-ml-0.5 mr-2 h-4 w-4" />
                              Unpublish Results
                            </>
                          ) : (
                            <>
                              <FiCheckCircle className="-ml-0.5 mr-2 h-4 w-4" />
                              Publish Results
                            </>
                          )}
                        </button>
                        
                        {result.publishedAt && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Last {result.isPublished ? 'published' : 'unpublished'}: {result.publishedAt ? new Date(result.publishedAt).toLocaleString() : 'Never'}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper function to format date safely
const formatDate = (dateString) => {
  console.log('Formatting date:', dateString); // Debug log
  if (!dateString) return 'N/A';
  
  try {
    // Handle both string and Date objects
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString);
      return 'N/A';
    }
    
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'Input:', dateString);
    return 'N/A';
  }
};

export default ResultPublishPanel;
