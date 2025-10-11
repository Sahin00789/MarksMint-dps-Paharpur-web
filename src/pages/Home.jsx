import React, { useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { 
  FaUserTie, 
  FaSchool, 
  FaMapMarkerAlt, 
  FaIdCard, 
  FaPhone,
  FaEnvelope,
  FaCode,
  FaGithub,
  FaLinkedin,
  FaSignInAlt,
  FaUserPlus,
  FaTachometerAlt,
  FaBook,
  FaUserGraduate,
  FaChalkboardTeacher,
  FaExternalLinkAlt as FiExternalLink,
  FaCheckCircle as FiCheckCircle,
} from 'react-icons/fa';
import { FiAlertCircle, FiInfo } from 'react-icons/fi';
import { useAuth } from '@contexts/AuthContext';
import api from '../services/api';
import Navbar from '../layouts/Header';
import { schoolinfo } from '@/shared/schoolInformation';

// Loading skeleton component
const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6">
    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 h-48">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Custom hook for public results with optimized fetching
const usePublicResults = () => {
  return useQuery({
    queryKey: ['publicResults'],
    queryFn: async () => {
      try {
        const response = await api.get('/public/results/status', {
          skipAuth: true, // Skip auth for public endpoint
          headers: {
            'Cache-Control': 'public, max-age=300' // 5 minutes cache
          }
        });
        
        if (!response?.data) {
          console.warn('No data received from public results endpoint');
          return [];
        }
        
        // Only return published results
        return response.data.items?.filter(item => item?.isPublished) || [];
      } catch (error) {
        // Don't log 401 errors for public endpoints
        if (error?.response?.status !== 401) {
          console.error('Error fetching public results:', error);
        }
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes before refetching
    cacheTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: 'if-stale',
    retry: 1, // Only retry once on failure
    retryDelay: 1000,
    onError: (error) => {
      // Handle specific error cases if needed
      console.error('Public results fetch failed:', error);
    }
  });
};

// School Info Component
const SchoolInfoCard = React.memo(() => {
  const schoolData = useMemo(() => ({
    name: schoolinfo?.name || 'Dina Public School',
    branch: schoolinfo?.branch || 'Paharpur',
    address: schoolinfo?.Address || 'Paharpur, Banshihari, Dakshin Dinajpur, 733125',
    regNumber: schoolinfo?.regNumber || 'IV006608/IV',
    mobileNumber: schoolinfo?.contact?.phone || '',
    email: schoolinfo?.contact?.email || '',
    runBy: schoolinfo?.runBy || 'M.M.D.C.T.'
  }), []);

  return (
    <div className="relative w-full bg-white dark:bg-gray-800 rounded-2xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden transition-all duration-300 hover:shadow-md">
      <div className="flex items-center justify-between px-6 pt-6">
        <div className="flex items-center">
          <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mr-3">
            <FaSchool className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {schoolData.name}
            </h2>
            <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
              {schoolData.branch}
            </span>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex items-start">
          <FaMapMarkerAlt className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5 mr-3 flex-shrink-0" />
          <p className="text-gray-700 dark:text-gray-300">{schoolData.address}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center">
            <FaIdCard className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">Reg. No: {schoolData.regNumber}</span>
          </div>
          <div className="flex items-center">
            <FaPhone className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
            <a 
              href={`tel:${schoolData.mobileNumber}`}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
            >
              {schoolData.mobileNumber}
            </a>
          </div>
          <div className="flex items-center">
            <FaEnvelope className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
            <a 
              href={`mailto:${schoolData.email}`}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors break-all"
            >
              {schoolData.email}
            </a>
          </div>
          <div className="flex items-center">
            <FaUserTie className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
            <span className="text-gray-700 dark:text-gray-300">Run by: {schoolData.runBy}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

const DeveloperCard = React.memo(() => (
  <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
    <div className="p-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
            SA
          </div>
          <span className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-2 border-white dark:border-gray-800">
            <span className="sr-only">Online</span>
          </span>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sahin Arman</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Full Stack Developer</p>
        </div>
      </div>
      <p className="mt-4 text-gray-600 dark:text-gray-300">
        This application is developed and maintained by Sahin Arman. For any technical support or queries, please contact the developer.
      </p>
      <div className="mt-4 flex space-x-4">
        <a 
          href="https://github.com/sahin-arman" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          aria-label="GitHub"
        >
          <FaGithub className="h-5 w-5" />
        </a>
        <a 
          href="https://linkedin.com/in/sahin-arman" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors"
          aria-label="LinkedIn"
        >
          <FaLinkedin className="h-5 w-5" />
        </a>
      </div>
    </div>
  </div>
));

const PublicResultsCard = React.memo(({ publicResultStatuses = [], isLoading, isError, error }) => {
  const navigate = useNavigate();
  
  const cardColors = useMemo(() => [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600',
    'from-green-500 to-green-600',
    'from-yellow-500 to-yellow-600',
    'from-red-500 to-red-600',
    'from-pink-500 to-pink-600',
  ], []);

  // Show loading skeleton
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            aria-hidden="true"
          ></div>
        ))}
      </div>
    );
  }

  // Show error message
  if (isError) {
    // Don't show error for 401 (unauthorized) as it's expected for public endpoints
    if (error?.response?.status === 401) {
      return (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 text-center">
          <FiInfo className="h-8 w-8 text-blue-500 dark:text-blue-400 mx-auto mb-2" />
          <p className="text-blue-700 dark:text-blue-300">No published results available at this time.</p>
        </div>
      );
    }
    
    return (
      <div 
        className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center"
        role="alert"
        aria-live="assertive"
      >
        <FiAlertCircle className="h-8 w-8 text-red-500 dark:text-red-400 mx-auto mb-2" />
        <p className="text-red-700 dark:text-red-300">
          {error?.response?.status === 404 
            ? 'Results service is currently unavailable.'
            : 'Failed to load results. Please check your connection and try again.'
          }
        </p>
      </div>
    );
  }

  // Show empty state
  if (!publicResultStatuses || publicResultStatuses.length === 0) {
    return (
      <div 
        className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center"
        role="status"
        aria-live="polite"
      >
        <FiInfo className="h-8 w-8 text-yellow-500 dark:text-yellow-400 mx-auto mb-2" />
        <p className="text-yellow-700 dark:text-yellow-300">
          No published results available at the moment. Please check back later.
        </p>
      </div>
    );
  }

  // Show results
  return (
    <div className="space-y-4" role="list" aria-label="Published results">
      {publicResultStatuses.map((result, index) => (
        <button
          key={result._id || index}
          className={`w-full text-left bg-gradient-to-r ${cardColors[index % cardColors.length]} rounded-lg shadow-md overflow-hidden transform transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          onClick={() => navigate(`/results?class=${result.class}&term=${result.term}`)}
          aria-label={`View ${result.class} ${result.term} results`}
        >
          <div className="p-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">{result.class} Results</h3>
              <FiExternalLink className="h-5 w-5 opacity-75" aria-hidden="true" />
            </div>
            <p className="text-sm opacity-90 mt-1">
              {result.term} • {result.section || 'All Sections'}
            </p>
            {result.publishedAt && (
              <div className="mt-2 flex items-center text-xs opacity-80">
                <FiCheckCircle className="h-4 w-4 mr-1" aria-hidden="true" />
                <span>Published on {new Date(result.publishedAt).toLocaleDateString()}</span>
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <span className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors">
                <FiExternalLink className="mr-1.5 h-3.5 w-3.5" />
                View Results
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
});

// Main Home Component
function Home() {
  const { user } = useAuth();
  const { data: publicResultStatuses = [], isLoading, error } = usePublicResults();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar className="fixed top-0 left-0 right-0 z-50" />
      
      {/* Results Section */}
      <section id="results" className="pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Published Results
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              View and access all published examination results
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-800/30 rounded-2xl shadow-sm p-6 border border-gray-100 dark:border-gray-700">
            <PublicResultsCard 
              publicResultStatuses={publicResultStatuses}
              loading={isLoading}
              error={error}
            />
          </div>
        </div>
      </section>

      {/* School Info Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SchoolInfoCard />
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex flex-col sm:flex-row items-center justify-between text-center sm:text-left">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 p-0.5 flex-shrink-0">
                <div className="h-full w-full rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
                  <FaUserTie className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Sahin Arman</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Full Stack Developer</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mt-2 sm:mt-0">
              <a 
                href="https://github.com/sahin-arman" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                aria-label="GitHub"
              >
                <FaGithub className="h-4 w-4" />
              </a>
              <a 
                href="https://linkedin.com/in/sahin-arman" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="h-4 w-4" />
              </a>
              <span className="text-xs text-gray-400">
                &copy; {new Date().getFullYear()}
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
