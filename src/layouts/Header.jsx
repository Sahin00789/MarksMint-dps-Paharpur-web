import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiMenu, 
  FiX, 
  FiSun, 
  FiMoon, 
  FiLogIn, 
  FiLogOut, 
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiAward,
  FiSettings,
  FiHome,
  FiUsers,
  FiBookOpen
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { schoolinfo } from '../shared/schoolInformation';

// Animation variants
const mobileMenuVariants = {
  hidden: { opacity: 0, y: -20, height: 0 },
  visible: { 
    opacity: 1, 
    y: 0, 
    height: 'auto',
    transition: { 
      duration: 0.3,
      ease: 'easeInOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: -20, 
    height: 0,
    transition: {
      duration: 0.2,
      ease: 'easeInOut'
    }
  }
};

const userMenuVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      duration: 0.15,
      ease: 'easeOut'
    }
  },
  exit: { 
    opacity: 0, 
    y: 10, 
    scale: 0.95,
    transition: {
      duration: 0.1,
      ease: 'easeIn'
    }
  }
};

const Navbar = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout, loading: authLoading } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  
  // Only show auth state after initial render to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
      if (mobileMenuRef.current && 
          !mobileMenuRef.current.contains(event.target) && 
          !event.target.closest('button[aria-label^="Toggle"]')) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [userMenuRef, mobileMenuRef]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Show loading state for user profile
  const renderUserProfile = () => {
    if (authLoading || !mounted) {
      return (
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
          <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      );
    }
    
    if (isAuthenticated) {
      return (
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={toggleUserDropdown}
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-full"
            aria-expanded={userDropdownOpen}
            aria-haspopup="true"
          >
            <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-primary-700 dark:text-primary-200 font-medium">
              {getInitials(user?.name)}
            </div>
            <span className="hidden md:inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-200">
              {user?.name?.split(' ')[0]}
              {userDropdownOpen ? (
                <FiChevronUp className="ml-1 h-4 w-4" />
              ) : (
                <FiChevronDown className="ml-1 h-4 w-4" />
              )}
            </span>
          </button>

          <AnimatePresence>
            {userDropdownOpen && (
              <motion.div
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={userMenuVariants}
                className="absolute right-0 mt-2 w-56 rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50 overflow-hidden"
                role="menu"
                aria-orientation="vertical"
                aria-labelledby="user-menu-button"
                tabIndex="-1"
              >
                <div className="py-1" role="none">
                  <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {user?.email || ''}
                    </p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors flex items-center space-x-2"
                    role="menuitem"
                    tabIndex="-1"
                  >
                    <FiLogOut className="h-4 w-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }
    
    return (
      <Link
        to="/login"
        className="hidden md:flex items-center space-x-1 px-3 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:focus:ring-offset-gray-900"
      >
        <FiUser className="h-4 w-4" />
        <span>Admin Login</span>
      </Link>
    );
  };

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-lg' 
          : 'bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left section - School name and branch */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="group flex flex-col"
              aria-label="Home"
            >
              <h1 className="text-xl font-bold text-gray-900 dark:text-white transition-colors duration-200 group-hover:text-primary-600 dark:group-hover:text-primary-400 text-center">
                {schoolinfo.name}
              </h1>
              <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-sm transform transition-all duration-200 group-hover:scale-105 group-hover:shadow-md mx-auto">
                Paharpur Branch
              </span>
            </Link>
          </div>

          {/* Right section - Navigation and user controls */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {isAuthenticated && (
                <Link 
                  to="/dashboard/students" 
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    location.pathname.startsWith('/dashboard')
                      ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' 
                      : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800/50'
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </nav>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="hidden md:flex items-center justify-center p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? (
                <FiSun className="h-5 w-5" />
              ) : (
                <FiMoon className="h-5 w-5" />
              )}
            </button>

            {/* User Profile or Login Button */}
            {renderUserProfile()}

            

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 transition-colors"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
            >
              {mobileMenuOpen ? (
                <FiX className="h-6 w-6" aria-hidden="true" />
              ) : (
                <FiMenu className="h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            ref={mobileMenuRef}
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuVariants}
            className="md:hidden bg-white dark:bg-gray-800 shadow-xl border-t border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Dina Public School Paharpur
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.email || ''}
              </p>
            </div>
            
            <nav className="py-2">
              <Link
                to="/dashboard/students"
                className="block px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                <div className="flex items-center space-x-3">
                  <FiHome className="h-5 w-5 text-primary-500" />
                  <span>Dashboard</span>
                </div>
              </Link>
              
             
              
          
              
              <div className="px-4 py-3 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                </span>
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors"
                  aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
                >
                  {theme === 'dark' ? (
                    <FiSun className="h-5 w-5" />
                  ) : (
                    <FiMoon className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {isAuthenticated && (
                <>
                  <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-3"
                  >
                    <FiLogOut className="h-5 w-5" />
                    <span>Sign out</span>
                  </button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
