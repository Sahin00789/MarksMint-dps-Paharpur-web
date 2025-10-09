import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  BookOpen, 
  FileText, 
  Award, 
  GraduationCap, 
  FileSpreadsheet,
  ClipboardList
} from 'lucide-react';

const AcademicsLayout = () => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const navItems = [
    { 
      label: 'Exams', 
      path: 'exams',
      icon: <ClipboardList size={18} className="mr-2" />,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/30',
      hoverBgColor: 'hover:bg-indigo-50/70 dark:hover:bg-indigo-900/40',
      borderColor: 'border-indigo-200 dark:border-indigo-700',
      activeBgColor: 'bg-indigo-100 dark:bg-indigo-800/50'
    },
    { 
      label: 'Admit Cards', 
      path: 'admit-cards',
      icon: <FileText size={18} className="mr-2" />,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      hoverBgColor: 'hover:bg-green-50/70 dark:hover:bg-green-900/30',
      borderColor: 'border-green-200 dark:border-green-700',
      activeBgColor: 'bg-green-100 dark:bg-green-800/30'
    },
    { 
      label: 'Marks', 
      path: 'marks',
      icon: <BookOpen size={18} className="mr-2" />,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      hoverBgColor: 'hover:bg-purple-50/70 dark:hover:bg-purple-900/30',
      borderColor: 'border-purple-200 dark:border-purple-700',
      activeBgColor: 'bg-purple-100 dark:bg-purple-800/30'
    },
    { 
      label: 'Result Publish', 
      path: 'results-publish',
      icon: <Award size={18} className="mr-2" />,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      hoverBgColor: 'hover:bg-amber-50/70 dark:hover:bg-amber-900/30',
      borderColor: 'border-amber-200 dark:border-amber-700',
      activeBgColor: 'bg-amber-100 dark:bg-amber-800/30'
    },
    { 
      label: 'Co-Scholastic', 
      path: 'co-scholastic-grades',
      icon: <GraduationCap size={18} className="mr-2" />,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-50 dark:bg-teal-900/20',
      hoverBgColor: 'hover:bg-teal-50/70 dark:hover:bg-teal-900/30',
      borderColor: 'border-teal-200 dark:border-teal-700',
      activeBgColor: 'bg-teal-100 dark:bg-teal-800/30'
    },
    { 
      label: 'Marksheets', 
      path: 'marksheets',
      icon: <FileSpreadsheet size={18} className="mr-2" />,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      hoverBgColor: 'hover:bg-blue-50/70 dark:hover:bg-blue-900/30',
      borderColor: 'border-blue-200 dark:border-blue-700',
      activeBgColor: 'bg-blue-100 dark:bg-blue-800/30'
    },
  ];

  const isActive = (path) => {
    const currentPath = location.pathname;
    
    // Special handling for marks and marksheets
    if (path === 'marks') {
      return currentPath.endsWith('/marks') || 
             currentPath.includes('/marks/') ||
             currentPath.includes('/marks?') ;
    }
    
    if (path === 'marksheets') {
      return currentPath.endsWith('/marksheets') || 
             currentPath.includes('/marksheets/') ||
             currentPath.includes('/marksheets?');
    }
    
    // For all other paths
    return currentPath.endsWith(`/${path}`) || 
           currentPath.includes(`/${path}/`) ||
           currentPath.includes(`/${path}?`);
  };

  return (
    <div className="px-0 py-2 sm:py-4 md:px-4 lg:px-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Academics Management</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage all academic activities in one place</p>
        </div>
        
        {/* Mobile menu button */}
        <button 
          className="md:hidden mt-2 p-2 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
        >
          <span className="sr-only">Toggle menu</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            )}
          </svg>
        </button>
      </div>
      
      {/* Desktop Navigation */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 overflow-hidden">
        <nav className="flex overflow-x-auto">
          <ul className="flex flex-1">
            {navItems.map(({ label, path, icon, color, bgColor, borderColor, hoverBgColor }, index) => (
              <li key={index} className="flex-1">
                <Link
                  to={path}
                  className={`flex items-center justify-center px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive(path)
                      ? `${color} ${bgColor} border-b-2 ${borderColor} font-semibold`
                      : `text-gray-600 dark:text-gray-300 hover:${hoverBgColor} dark:hover:bg-gray-700/50`
                  }`}
                >
                  {React.cloneElement(icon, { 
                    className: `mr-2 ${isActive(path) ? '' : 'opacity-70'}`
                  })}
                  <span>{label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Mobile Navigation */}
      <div className={`md:hidden mb-6 transition-all duration-200 ${mobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {navItems.map(({ label, path, icon, color, bgColor, activeBgColor }, index) => (
              <li key={index}>
                <Link
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center px-4 py-3.5 text-sm font-medium transition-colors ${
                    isActive(path)
                      ? `${color} ${activeBgColor} font-semibold`
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <span className={`p-1.5 rounded-md mr-3 ${isActive(path) ? 'bg-white/10' : bgColor}`}>
                    {React.cloneElement(icon, { 
                      size: 18,
                      className: isActive(path) ? color : 'opacity-80'
                    })}
                  </span>
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-none sm:rounded-lg shadow-sm border-0 sm:border border-gray-200 dark:border-gray-700 p-0 sm:p-4 md:p-5 lg:p-6 transition-colors duration-200">
        <Outlet />
      </div>
    </div>
  );
};

export default AcademicsLayout;
