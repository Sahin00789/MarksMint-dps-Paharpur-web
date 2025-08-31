import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { 
  FaSpinner, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaEye, 
  FaEyeSlash, 
  FaCalendarAlt,
  FaChevronDown,
  FaChevronUp,
  FaUsers
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import './ResultPublishPanel.css';

const ResultPublishPanel = () => {
  const [results, setResults] = useState([]);
  const [availableClasses, setAvailableClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [publishing, setPublishing] = useState({});
  const [showPassword, setShowPassword] = useState({});
  const [passwordInput, setPasswordInput] = useState({});
  const [expandedCard, setExpandedCard] = useState(null);

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
      const { data } = await api.get('/classes');
      setAvailableClasses(data.items || []);
    } catch (error) {
      console.error('Error fetching available classes:', error);
      toast.error('Failed to load available classes');
    } finally {
      setLoadingClasses(false);
    }
  };

  const fetchResultsStatus = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/results');
      setResults(data.items || []);
    } catch (error) {
      console.error('Error fetching results status:', error);
      toast.error('Failed to load results status');
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

      toast.success(`Results ${!currentStatus ? 'published' : 'unpublished'} successfully`);
      await fetchResultsStatus();
    } catch (error) {
      console.error('Error updating publish status:', error);
      const message = error.response?.data?.message || 'Failed to update publish status';
      toast.error(message);
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="flex items-center space-x-4 mb-4">
          <FaSpinner className="animate-spin text-3xl text-blue-500" />
          <h2 className="text-xl font-semibold text-gray-700">Loading Results Dashboard</h2>
        </div>
        <p className="text-gray-500">Fetching the latest result publication status...</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Results Publication Dashboard</h2>
        <p className="text-gray-600">Manage and monitor result publication status for all exam terms</p>
        
        {!loadingClasses && availableClasses.length > 0 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <h3 className="text-md font-medium text-gray-800 flex items-center mb-2">
              <FaUsers className="mr-2 text-blue-500" />
              Available Classes
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableClasses.map(cls => (
                <span 
                  key={cls._id}
                  className="px-3 py-1 bg-white text-sm font-medium text-gray-700 border border-gray-200 rounded-full"
                >
                  {cls.class}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-4xl text-gray-300 mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-800">No Exam Terms Found</h3>
          <p className="text-gray-500 mt-2">There are no exam terms available to display.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result, index) => (
            <motion.div
              key={result.term}
              className={`result-card bg-white rounded-xl shadow-sm overflow-hidden border ${
                result.isPublished ? 'published border-green-100' : 'border-gray-100'
              }`}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={index}
              onClick={(e) => handleCardClick(result.term, e)}
            >
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <FaCalendarAlt className="mr-2 text-blue-500" />
                      {result.term}
                    </h3>
                    <div className="mt-1 flex items-center">
                      <span className={`status-badge ${
                        result.isPublished ? 'status-published' : 'status-draft'
                      }`}>
                        {result.isPublished ? (
                          <>
                            <FaCheckCircle className="inline mr-1" /> Published
                          </>
                        ) : (
                          <>
                            <FaTimesCircle className="inline mr-1" /> Draft
                          </>
                        )}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {result.publishedAt ? 
                          new Date(result.publishedAt).toLocaleDateString() : 
                          'Never published'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {result.stats?.completionPercentage || 0}%
                    </div>
                    <div className="text-xs text-gray-500">Complete</div>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>{result.stats?.updatedCount || 0} of {result.stats?.totalStudents || 0} students</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="progress-bar"
                      style={{ width: `${result.stats?.completionPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedCard === result.term && (
                    <motion.div 
                      className="mt-4 pt-4 border-t border-gray-100"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="stats-grid">
                        <div className="stat-item">
                          <div className="stat-value">{result.stats?.totalStudents || 0}</div>
                          <div className="stat-label">Total Students</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-value">{result.stats?.updatedCount || 0}</div>
                          <div className="stat-label">Results Updated</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-value">{result.stats?.pendingCount || 0}</div>
                          <div className="stat-label">Pending Updates</div>
                        </div>
                        <div className="stat-item">
                          <div className="stat-value">
                            {result.stats?.completionPercentage || 0}%
                          </div>
                          <div className="stat-label">Completion Rate</div>
                        </div>
                      </div>

                      <div className="mt-4">
                        <div className="relative">
                          <input
                            type={showPassword[result.term] ? 'text' : 'password'}
                            value={passwordInput[result.term] || ''}
                            onChange={(e) => setPasswordInput(prev => ({
                              ...prev,
                              [result.term]: e.target.value
                            }))}
                            placeholder="Admin password"
                            className="password-input pr-10 w-full"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowPassword(prev => ({
                                ...prev,
                                [result.term]: !prev[result.term]
                              }));
                            }}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            type="button"
                          >
                            {showPassword[result.term] ? <FaEyeSlash /> : <FaEye />}
                          </button>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePublishToggle(result.term, result.isPublished);
                          }}
                          disabled={publishing[result.term] || !passwordInput[result.term]}
                          className={`action-button w-full mt-3 justify-center ${
                            result.isPublished ? 'unpublish-button' : 'publish-button'
                          }`}
                        >
                          {publishing[result.term] ? (
                            <>
                              <FaSpinner className="animate-spin mr-1" />
                              {result.isPublished ? 'Unpublishing...' : 'Publishing...'}
                            </>
                          ) : result.isPublished ? (
                            <>
                              <FaTimesCircle className="mr-1" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <FaCheckCircle className="mr-1" />
                              Publish
                            </>
                          )}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="mt-3 flex justify-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCard(expandedCard === result.term ? null : result.term);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    {expandedCard === result.term ? (
                      <>
                        <span>Show less</span>
                        <FaChevronUp className="ml-1" />
                      </>
                    ) : (
                      <>
                        <span>Show details</span>
                        <FaChevronDown className="ml-1" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResultPublishPanel;
