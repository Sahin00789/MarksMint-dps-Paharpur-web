import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  FaExternalLinkAlt as FiExternalLink,
  FaCheckCircle as FiCheckCircle,
} from 'react-icons/fa';
import { FiAlertCircle } from 'react-icons/fi';
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

// Custom hook for public results
const usePublicResults = () => {
  return useQuery({
    queryKey: ['publicResults'],
    queryFn: async () => {
      try {
        const { data } = await api.get('/public/results/status');
        return data.items?.filter(item => item.isPublished) || [];
      } catch (error) {
        if (!error.message.includes('No authentication token found')) {
          console.error('Error fetching public statuses:', error);
          throw error;
        }
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
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
            <FiExternalLink className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
            <a 
              href="https://dpspaharpur.web.app/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center"
            >
              Visit School Website
              <FiExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center">
            <FaIdCard className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
            <p className="text-gray-700 dark:text-gray-300">Reg: {schoolData.regNumber}</p>
          </div>
          <div className="flex items-center">
            <FaUserTie className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
            <p className="text-gray-700 dark:text-gray-300">Run By: {schoolData.runBy}</p>
          </div>
          {schoolData.mobileNumber && (
            <div className="flex items-center">
              <FaPhone className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
              <a 
                href={`tel:${schoolData.mobileNumber}`} 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {schoolData.mobileNumber}
              </a>
            </div>
          )}
          {schoolData.email && (
            <div className="flex items-center">
              <FaEnvelope className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
              <a 
                href={`mailto:${schoolData.email}`} 
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                {schoolData.email}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// Developer Card Component
const DeveloperCard = React.memo(() => (
  <div className="w-full h-full bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg">
    <div className="p-6">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 p-1">
            <div className="w-full h-full rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
              <FaUserTie className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-md">
            <FaCode className="h-3 w-3 text-purple-600 dark:text-purple-400" />
          </div>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sahin Arman</h3>
          <p className="text-blue-600 dark:text-blue-400 text-sm">Full Stack Developer</p>
        </div>
      </div>
      
      <div className="mt-4 flex flex-wrap gap-2">
        <a 
          href="https://github.com/sahin-arman" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <FaGithub className="mr-1.5" /> GitHub
        </a>
        <a 
          href="https://linkedin.com/in/sahin-arman" 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          <FaLinkedin className="mr-1.5" /> LinkedIn
        </a>
        <a 
          href="mailto:sahin401099@gmail.com" 
          className="inline-flex items-center px-3 py-1.5 text-sm bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
        >
          <FaEnvelope className="mr-1.5" /> Email
        </a>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Built With</h4>
        <div className="flex flex-wrap gap-2">
          {['React.js', 'Node.js', 'MongoDB', 'Tailwind CSS'].map((tech) => (
            <span 
              key={tech}
              className="px-2.5 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  </div>
));

// Public Results Card Component
const PublicResultsCard = React.memo(({ publicResultStatuses = [], loading, error }) => {
  const navigate = useNavigate();
  
  const cardColors = useMemo(() => [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-pink-500',
    'from-green-500 to-teal-500',
    'from-amber-500 to-orange-500',
    'from-red-500 to-pink-600',
    'from-indigo-500 to-purple-600'
  ], []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700 dark:text-red-300">
              Failed to load results. Please try again later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (publicResultStatuses.length === 0) {
    return (
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 text-center">
        <div className="flex flex-col items-center justify-center">
          <div className="bg-white dark:bg-gray-800 rounded-full p-3 mb-4 shadow-sm">
            <FiAlertCircle className="h-8 w-8 text-blue-500 dark:text-blue-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Results Published Yet</h3>
          <p className="text-gray-600 dark:text-gray-300 max-w-md">
            There are no examination results available at the moment. Please check back later for updates.
          </p>
        </div>
      </div>
    );
  }

  // Sort results by publishedAt date, newest first
  const sortedResults = useMemo(() => {
    return [...publicResultStatuses].sort((a, b) => {
      const dateA = a.publishedAt ? new Date(a.publishedAt) : new Date(0);
      const dateB = b.publishedAt ? new Date(b.publishedAt) : new Date(0);
      return dateB - dateA; // Sort in descending order (newest first)
    });
  }, [publicResultStatuses]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {sortedResults.map((exam, index) => {
        const colorIndex = index % cardColors.length;
        return (
          <motion.div
            key={exam.term}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            className="cursor-pointer w-full h-full"
            onClick={() => navigate(`/results/term/${exam.term}`)}
          >
            <div className={`h-full w-full bg-gradient-to-br ${cardColors[colorIndex]} rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl`}>
              <div className="p-6 text-white">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold">{exam.term}</h3>
                    <p className="text-white/80 text-sm mt-1">
                    </p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20">
                    <FiCheckCircle className="mr-1" /> Published
                  </span>
                </div>
                <div className="mt-6"></div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm opacity-80">
                    {exam.publishedAt ? 
                      `Published ${new Date(exam.publishedAt).toLocaleDateString()}` : 
                      'Recently published'}
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1.5 border border-white/30 rounded-md text-xs font-medium text-white hover:bg-white/10 focus:outline-none"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/results/term/${exam.term}`);
                    }}
                  >
                    View Results
                    <FiExternalLink className="ml-1.5 h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
});

// Main Home Component
function Home() {
  const { data: publicResultStatuses = [], isLoading, error } = usePublicResults();

  // Scroll to results section if there's a hash in the URL
  useEffect(() => {
    if (window.location.hash === '#results') {
      const element = document.getElementById('results');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar className="fixed top-0 left-0 right-0 z-50" />
      
      <main className="pt-16">
        {/* Results Section */}
        <section id="results" className="py-8 bg-gradient-to-br from-blue-50 to-transparent dark:from-gray-800/50 dark:to-transparent">
          <div className="w-full bg-white dark:bg-gray-800/50 shadow-sm p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Published Results
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                View and access all published examination results
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800/30 rounded-xl p-6 border border-gray-100 dark:border-gray-700">
              <PublicResultsCard 
                publicResultStatuses={publicResultStatuses}
                loading={isLoading}
                error={error}
              />
            </div>
          </div>
        </section>

        {/* School Info Card */}
        <section className="w-full bg-white dark:bg-gray-900 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <SchoolInfoCard />
          </div>
        </section>
      </main>

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
