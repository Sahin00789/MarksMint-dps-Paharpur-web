import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  FiHome,
  FiUsers,
  FiBookOpen,
  FiCalendar,
  FiAward,
  FiFileText,
  FiUploadCloud,
  FiSettings,
  FiLayers,
  FiCode,
  FiChevronLeft,
  FiChevronRight,
  FiMoon,
  FiSun,
  FiLogOut
} from 'react-icons/fi';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ collapsed: propCollapsed, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(propCollapsed);
  const [isHovered, setIsHovered] = useState(false);
  
  // Sync with parent's collapsed state
  useEffect(() => {
    setIsCollapsed(propCollapsed);
  }, [propCollapsed]);
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    if (onNavigate) onNavigate();
  };

  const navItems = [
   { name: 'Students', icon: <FiUsers className="h-5 w-5 flex-shrink-0" />, path: '/dashboard/students' },
    { name: 'Marks', icon: <FiBookOpen className="h-5 w-5 flex-shrink-0" />, path: '/dashboard/marks' },
    { name: 'Attendance', icon: <FiCalendar className="h-5 w-5 flex-shrink-0" />, path: '/dashboard/attendance' },
    { name: 'Co-Scholastic', icon: <FiAward className="h-5 w-5 flex-shrink-0" />, path: '/dashboard/co-scholastic' },
    { name: 'Marksheets', icon: <FiFileText className="h-5 w-5 flex-shrink-0" />, path: '/dashboard/marksheets' },
     { name: 'Results Publish', icon: <FiFileText className="h-5 w-5 flex-shrink-0" />, path: '/dashboard/resultspublish' },
    { name: 'Class Configuration', icon: <FiLayers className="h-5 w-5" />, path: '/dashboard/config/' },
  ];

  const isActive = (path) => {
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (e, path) => {
    e.preventDefault();
    if (onNavigate) onNavigate();
    navigate(path);
  };


  return (
    <div 
      className={` flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 ${
        isCollapsed ? 'w-16' : 'w-64'
      } transition-all duration-300 ease-in-out`}
      onMouseEnter={() => !isCollapsed && setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Logo and Toggle */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 h-16">
        {!isCollapsed ? (
          <NavLink to="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400 whitespace-nowrap">MarksMint</span>
          </NavLink>
        ) : (
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
            <span className="text-indigo-600 dark:text-indigo-300 font-bold"></span>
          </div>
        )}
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors duration-200"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <FiChevronRight className="h-5 w-5" />
          ) : (
            <FiChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.name}>
              <button
                onClick={(e) => handleNavigation(e, item.path)}
                className={`w-full text-left flex items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive(item.path)
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                    : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50'
                } ${isCollapsed ? 'justify-center' : 'space-x-3'}`}
                title={isCollapsed ? item.name : ''}
              >
                <span className={`flex-shrink-0 ${isActive(item.path) ? 'text-indigo-600 dark:text-indigo-300' : 'text-gray-500 dark:text-gray-400'}`}>
                  {item.icon}
                </span>
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </button>
            </li>
          ))}
        </ul>
      </nav>

     
    </div>
  );
};

export default Sidebar;
