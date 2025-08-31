import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiMenu, 
  FiX, 
  FiSun, 
  FiMoon, 
  FiHome, 
  FiLogIn, 
  FiLogOut, 
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiAward
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { schoolinfo } from '../shared/schoolInformation'

const Navbar = ({ toggleSidebar }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  }, [location]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuRef]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleUserDropdown = () => {
    setUserDropdownOpen(!userDropdownOpen);
  };

console.log(user, isAuthenticated);


  return (
    <header 
      className={` z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md' 
          : 'bg-white dark:bg-gray-900 shadow-sm'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left section - Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2 group">
              <div className="bg-primary-600 dark:bg-primary-500 p-2 rounded-lg group-hover:scale-105 transition-transform">
                <FiHome className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-800 dark:text-white">{schoolinfo.name}</span>
                <span className="text-xs text-center px-2 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full font-medium">
                  {schoolinfo.branch}
                </span>
              </div>
            </Link>
          </div>

          

          {/* Right section - Theme toggle and auth */}
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="hidden md:block p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <FiSun className="h-5 w-5" /> : <FiMoon className="h-5 w-5" />}
            </button>
            <nav className=" md:hidden items-center space-x-8">
            {isAuthenticated && (
              <Link 
                to="/dashboard/students" 
                className={`px-3 py-2 text-sm font-medium ${
                  location.pathname.startsWith('/dashboard/')
                    ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500' 
                    : 'text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400'
                }`}
              >
                Dashboard
              </Link>
            )}
          </nav>

            {isAuthenticated ? (
              <div className="hidden md:flex items-center space-x-4">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user.role || 'User'}
                </span>
                <Link
                to="/dashboard/students"
                className="block px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
                onClick={() => setMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
             
                <button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700"
                >
                  <FiLogOut className="mr-2" /> Logout
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="hidden md:flex items-center px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 focus:outline-none"
              >
                <FiLogIn className="mr-1.5 h-5 w-5" />
                Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            >
              {mobileMenuOpen ? <FiX className="h-6 w-6" /> : <FiMenu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 shadow-lg border-t border-gray-100 dark:border-gray-700 animate-fade-in origin-top">
          <div className="px-3 pt-3 pb-4 space-y-3">
            {isAuthenticated ? (
              <>
                <div className="px-2 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <FiUser className="h-4 w-4" /> {user}
                  </div>
                  <button
                    onClick={toggleTheme}
                    className="p-2 rounded-full text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none"
                    aria-label="Toggle theme"
                  >
                    {theme === 'dark' ? <FiSun className="
                    5 w-5" /> : <FiMoon className="h-5 w-5" />}
                  </button>
                </div>

                {/* Dashboard panel links (mirror sidebar) */}
                <div className="grid grid-cols-2 gap-2">
                  {['Students','Marks','Attendance','Co-Scholastic','Configuration'].map((item) => (
                    <Link
                      key={item}
                      to={`/dashboard#${item}`}
                      className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      {item}
                    </Link>
                  ))}
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <Link
                to="/login"
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-white bg-primary-600 hover:bg-primary-700"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
