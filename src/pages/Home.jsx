import React, { useState, useEffect, Fragment } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  FaCode, 
  FaEnvelope, 
  FaGithub, 
  FaLinkedin, 
  FaUserTie, 
  FaSchool, 
  FaMapMarkerAlt, 
  FaIdCard, 
  FaPhone,
  FaExternalLinkAlt as FiExternalLink,
  FaCheckCircle as FiCheckCircle,
} from 'react-icons/fa';
import { FiClock, FiAlertCircle } from 'react-icons/fi';
import api from '../services/api';
import Navbar from "../layouts/Header";
import { schoolinfo } from "@/shared/schoolInformation";

function Home() {
  const [publicResultStatuses, setPublicResultStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Scroll to results section if there's a hash in the URL
  useEffect(() => {
    if (window.location.hash === '#results') {
      const element = document.getElementById('results');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }

    const fetchPublicStatuses = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/public/results/status');
        // Only show published results
        const publishedResults = data.items ? data.items.filter(item => item.isPublished) : [];
        setPublicResultStatuses(publishedResults);
      } catch (error) {
        console.error('Error fetching public statuses:', error);
        setError('Failed to load published results. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPublicStatuses();
  }, []);

  return (
    <div className="min-h-[calc(100vh-4rem)] w-full bg-gray-100 dark:bg-gray-900  overflow-x-hidden">
     <div className="fixed w-full z-50">
      <Navbar/></div>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto mt-14 w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
       
        {/* Exam Results Section */}
        <section id="results" className="py-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <FiCheckCircle className="mr-2 text-blue-500" />
            Published Results
          </h2>
          <PublicResultsCard 
            publicResultStatuses={publicResultStatuses}
            loading={loading}
            error={error}
          />
        </section>
         {/* School Info Card */}
        <SchoolInfoCard />
        
        {/* Developer Info */}
        <DeveloperCard />
      </div>
    </div>
  );
}

const DeveloperCard = () => {
  return (
    <motion.div 
      className="w-full"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700">
        {/* App Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
          <h2 className="text-2xl font-bold">
            <span className="text-blue-100">Marks</span>
            <span className="text-purple-100">Mint</span>
            <span className="text-sm font-normal ml-2 opacity-90">Student Management System</span>
          </h2>
        </div>
        
        <div className="p-5">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Developer Avatar */}
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 p-1">
                <div className="w-full h-full rounded-full bg-white dark:bg-gray-700 flex items-center justify-center">
                  <FaUserTie className="h-10 w-10 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-gray-800 p-1.5 rounded-full shadow-md">
                <FaCode className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            
            {/* Developer Info */}
            <div className="flex-1 text-center md:text-left">
              <div className="mb-2">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sahin Arman</h2>
                <p className="text-blue-600 dark:text-blue-400 font-medium">Full Stack Developer & Creator</p>
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                <a 
                  href="mailto:sahin401099@gmail.com"
                  className="flex items-center text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  <FaEnvelope className="mr-1.5" /> Email
                </a>
                <a 
                  href="https://github.com/sahin-arman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
                >
                  <FaGithub className="mr-1.5" /> GitHub
                </a>
                <a 
                  href="https://linkedin.com/in/sahin-arman"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-gray-600 hover:text-blue-700 dark:text-gray-300 dark:hover:text-blue-400 transition-colors"
                >
                  <FaLinkedin className="mr-1.5" /> LinkedIn
                </a>
              </div>
            </div>
          </div>
          
          {/* Tech Stack */}
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Built With</h4>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full font-medium">
                React.js
              </span>
              <span className="px-3 py-1.5 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-sm rounded-full font-medium">
                Node.js
              </span>
              <span className="px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm rounded-full font-medium">
                MongoDB
              </span>
              <span className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm rounded-full font-medium">
                Tailwind CSS
              </span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};


const examCardGradients = [
  'bg-gradient-to-br from-blue-600 to-cyan-500',
  'bg-gradient-to-br from-purple-600 to-pink-500',
  'bg-gradient-to-br from-amber-600 to-orange-500',
  'bg-gradient-to-br from-emerald-500 to-teal-500',
  'bg-gradient-to-br from-rose-500 to-pink-500',
  'bg-gradient-to-br from-indigo-500 to-violet-500'
];

function PublicResultsCard({ publicResultStatuses = [], loading, error }) {
  const navigate = useNavigate();
  
  // Generate gradient colors for cards
  const cardColors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-pink-500',
    'from-green-500 to-teal-500',
    'from-yellow-500 to-orange-500',
    'from-red-500 to-pink-600',
    'from-indigo-500 to-purple-600'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <FiAlertCircle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Published Results Section */}
      {publicResultStatuses.length > 0 && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicResultStatuses.length > 0 ? (
              publicResultStatuses.map((exam, index) => {
                const colorIndex = index % cardColors.length;
                return (
                  <motion.div
                    key={exam.term}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    className="cursor-pointer"
                    onClick={() => navigate(`/results/term/${exam.term}`)}
                  >
                    <div className={`bg-gradient-to-r ${cardColors[colorIndex]} rounded-xl shadow-lg overflow-hidden h-full transform transition-all duration-300 hover:shadow-xl`}>
                      <div className="p-6 text-white">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold">{exam.term}</h3>
                            <p className="text-white/80 text-sm mt-1">
                              {exam.stats?.totalStudents || 0} students
                            </p>
                          </div>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20">
                            <FiCheckCircle className="mr-1" /> Published
                          </span>
                        </div>
                        <div className="mt-6">
                        </div>
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
              })
            ) : (
              <div className="col-span-full text-center py-8">
                <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No published results</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Check back later for updates.</p>
              </div>
            )}
          </div>
        </div>
      )}

        {/* Removed upcoming exams section as it's not part of the current API */}
  
    </div>
  );
}




const SchoolInfoCard = () => {
  // Use the imported schoolinfo object with default values for missing properties
  const schoolData = {
    name: schoolinfo?.name || 'Dina Public School',
    branch: schoolinfo?.branch || 'Paharpur',
    address: schoolinfo?.Address || 'Paharpur, Banshihari, Dakshin Dinajpur, 733125',
    regNumber: schoolinfo?.regNumber || 'IV006608/IV',
    mobileNumber: schoolinfo?.mobileNumber ,
    email: schoolinfo?.email ,
    runBy: schoolinfo?.runBy || 'M.M.D.C.T.'
  };

  return (
    <div className="relative w-full bg-white/70 dark:bg-gray-800/60 backdrop-blur rounded-2xl shadow-sm ring-1 ring-gray-200 dark:ring-gray-700 overflow-hidden transition-all duration-300 hover:shadow-md">
      {/* Header */}
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

      {/* Body */}
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
          <div className="flex items-center">
            <FaPhone className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
            <a href={`tel:${schoolData.mobileNumber}`} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {schoolData.mobileNumber}
            </a>
          </div>
          <div className="flex items-center">
            <FaEnvelope className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-3 flex-shrink-0" />
            <a href={`mailto:${schoolData.email}`} className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              {schoolData.email}
            </a>
          </div>
        
        
        </div>

      
       
      </div>
    </div>
  );
};


export default Home;
