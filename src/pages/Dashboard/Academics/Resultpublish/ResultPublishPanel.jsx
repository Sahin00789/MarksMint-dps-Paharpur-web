import React, { useEffect, useState, useCallback } from 'react';
import { useTheme } from '@contexts/ThemeContext';
import { FiChevronDown, FiChevronUp, FiCalendar, FiUsers, FiEye, FiEyeOff, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { examTermsInTheSchool } from '@/shared/schoolInformation';
import { getPublishedStatusForAdmin, publishResults, unpublishResults } from '@/services/resultsService';

const ResultPublishPanel = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [results, setResults] = useState([]);
  const [publishing, setPublishing] = useState({});
  const [uiState, setUiState] = useState({
    showPassword: {},
    passwordInput: {},
    expandedCard: null
  });
  
  const { showPassword, passwordInput, expandedCard } = uiState;
  const { theme } = useTheme();

  // Memoize filtered results to prevent unnecessary re-renders
  const filteredResults = React.useMemo(() => results, [results]);

  // Animation variants for the result cards
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
  

  const fetchResultsStatus = useCallback(async () => {
    let isMounted = true;
    try {
      setIsLoading(true);

      // Fetch publish status for each term
      const termsToShow = examTermsInTheSchool || [];
      const statusPromises = termsToShow.map(term =>
        getPublishedStatusForAdmin(term).catch(e => ({
          term,
          error: e.message,
          data: null
        }))
      );

      const statusResults = await Promise.all(statusPromises);

      if (!isMounted) return;

      // Process the results using the new data structure
      const processedResults = termsToShow.map((term, index) => {
        const statusData = statusResults[index];

        if (statusData?.error || !statusData?.data) {
          return {
            term,
            isPublished: false,
            publishedAt: null,
            stats: {
              totalStudents: 0,
              updated: 0,
              pendingUpdates: 0,
              completionPercentage: 0,
              lastUpdated: new Date(),
              perClass: {}
            },
            className: 'All Classes',
            error: statusData?.error || 'Failed to load data'
          };
        }

        const data = statusData.data;

        // If no students have marks for this term, return early with empty data
        if (data.totalStudents === 0) {
          return {
            term,
            isPublished: data.isPublished || false,
            publishedAt: data.publishedAt || null,
            stats: {
              totalStudents: 0,
              updated: 0,
              pendingUpdates: 0,
              completionPercentage: 0,
              lastUpdated: data.lastUpdated || new Date(),
              perClass: {}
            },
            className: 'All Classes',
            error: null
          };
        }

        // Calculate class-wise stats from the new structure
        const classStats = {};
        if (data.classAnalysis) {
          Object.entries(data.classAnalysis).forEach(([className, classData]) => {
            classStats[className] = {
              total: classData.totalStudents,
              updated: classData.completedCount,
              pending: classData.pendingCount,
              pendingStudents: classData.students?.filter(student => !student.hasMarks) || []
            };
          });
        }

        // Calculate overall stats
        const totalStudents = data.totalStudents || 0;
        const completedCount = data.completedCount || 0;
        const pendingCount = data.pendingCount || 0;
        const completionPercentage = totalStudents > 0 ? (completedCount / totalStudents) * 100 : 0;

        return {
          term,
          isPublished: data.isPublished || false,
          publishedAt: data.publishedAt || null,
          stats: {
            totalStudents,
            updated: completedCount,
            pendingUpdates: pendingCount,
            completionPercentage: Math.round(completionPercentage),
            lastUpdated: data.lastUpdated || new Date(),
            perClass: classStats
          },
          className: 'All Classes',
          error: null
        };
      });

      setResults(processedResults);
    } catch (error) {
      console.error('Error in fetchResultsStatus:', error);
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePublishToggle = async (term, currentStatus) => {
    if (!term || publishing[term]) return;
    
    setPublishing(prev => ({ ...prev, [term]: true }));
    
    try {
      const newStatus = !currentStatus;
      const password = uiState.passwordInput[term] || '';
      const result = results.find(r => r.term === term);
      
      let response;
      if (newStatus) {
        // Publishing results
        response = await publishResults(term, Object.keys(result?.stats?.perClass || []), password, result?.stats?.totalStudents || 0);
      } else {
        // Unpublishing results
        response = await unpublishResults(term, password);
      }
      
      if (response?.success) {
        // Update results with a single state update
        setResults(prevResults => 
          prevResults.map(result => 
            result.term === term 
              ? { 
                  ...result, 
                  isPublished: newStatus,
                  publishedAt: newStatus ? new Date().toISOString() : result.publishedAt
                } 
              : result
          )
        );
        
        // Update UI state with a single update
        setUiState(prev => ({
          ...prev,
          passwordInput: Object.fromEntries(
            Object.entries(prev.passwordInput).filter(([t]) => t !== term)
          ),
          expandedCard: null
        }));
      } else {
        console.error('Error toggling publish status:', response?.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Error in handlePublishToggle:', error);
    } finally {
      setPublishing(prev => ({
        ...prev,
        [term]: false
      }));
    }
  };

  const handleCardClick = (term, e) => {
    if (e.target.closest('button, input, a, [role="button"]')) {
      return;
    }
    setUiState(prev => ({
      ...prev,
      expandedCard: prev.expandedCard === term ? null : term
    }));
  };

  const handlePasswordChange = (term, value) => {
    setUiState(prev => ({
      ...prev,
      passwordInput: {
        ...prev.passwordInput,
        [term]: value
      }
    }));
  };

  const togglePasswordVisibility = (term) => {
    setUiState(prev => ({
      ...prev,
      showPassword: {
        ...prev.showPassword,
        [term]: !prev.showPassword[term]
      }
    }));
  };

  // Initial data loading with cleanup
  useEffect(() => {
    let isMounted = true;
    
    const fetchInitialData = async () => {
      try {
        await fetchResultsStatus();
      } catch (error) {
        console.error('Error in initial data fetch:', error);
      }
    };
    
    if (isMounted) {
      fetchInitialData();
    }
    
    return () => {
      isMounted = false;
    };
  }, [fetchResultsStatus]);

  // Memoize the loading spinner to prevent re-renders
  const loadingSpinner = React.useMemo(() => (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading results...</p>
      </div>
    </div>
  ), []);

  // Handle loading state
  if (isLoading) {
    return loadingSpinner;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Result Publication</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Publish or unpublish results for each term. Published results will be visible to students.
        </p>
      </div>
      
      
      {filteredResults.length === 0 && !isLoading ? (
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
          {filteredResults.map((result, index) => (
            <motion.div
              key={result.term}
              custom={index}
              initial="hidden"
              animate="visible"
              variants={cardVariants}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow ${
                uiState.expandedCard === result.term ? 'ring-2 ring-indigo-500/20' : ''
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
                      setUiState(prev => ({
                        ...prev,
                        expandedCard: prev.expandedCard === result.term ? null : result.term
                      }));
                    }}
                  >
                    {uiState.expandedCard === result.term ? (
                      <FiChevronUp className="h-5 w-5" />
                    ) : (
                      <FiChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {uiState.expandedCard === result.term && (
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

                      {/* Pending Students List */}
                      {result.stats?.perClass && Object.values(result.stats.perClass).some(cls => cls.pendingStudents?.length > 0) && (
                        <div className="mt-6">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Pending Students</h4>
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                              <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Class</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Roll No.</th>
                                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Name</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {Object.entries(result.stats.perClass)
                                  .filter(([_, cls]) => cls.pendingStudents?.length > 0)
                                  .flatMap(([className, cls]) =>
                                    cls.pendingStudents.map((student, idx) => (
                                      <tr key={`${className}-${student.roll}-${idx}`} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-white">{className}</td>
                                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{student.roll}</td>
                                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{student.name}</td>
                                      </tr>
                                    ))
                                  )}
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
                                    onChange={(e) => setUiState(prev => ({
                                      ...prev,
                                      passwordInput: {
                                        ...prev.passwordInput,
                                        [result.term]: e.target.value
                                      }
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
                                        setUiState(prev => ({
                                          ...prev,
                                          showPassword: {
                                            ...prev.showPassword,
                                            [result.term]: !prev.showPassword[result.term]
                                          }
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
                        {(() => {
                          const password = uiState.passwordInput[result.term] || '';
                          return (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublishToggle(result.term, result.isPublished);
                              }}
                              disabled={publishing[result.term] || (!result.isPublished && result.stats && result.stats.pendingUpdates !== 0) || (password.length < 6)}
                              className={`w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
                                result.isPublished
                                  ? 'bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 focus:ring-red-500'
                                  : (result.stats
                                      ? (result.stats.pendingUpdates === 0 && password.length >= 6
                                          ? 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:ring-indigo-500'
                                          : 'bg-gray-400 cursor-not-allowed dark:bg-gray-600')
                                      : 'bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 focus:ring-indigo-500')
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
                          );
                        })()}
                        
                        {result.publishedAt && (
                          <div className="text-center">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Last {result.isPublished ? 'published' : 'unpublished'}: {result.publishedAt ? formatDate(result.publishedAt) : 'Never'}
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
