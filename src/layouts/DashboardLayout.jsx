import { useState, useEffect, useRef } from "react";
import {
  Menu,
  X,
  Home,
  Settings,
  Users,
  BookOpen,
  Award,
  FileText,
  Bell,
  LogOut,
  ChevronDown,
  Book,
  GraduationCap,
  FileCheck,
  ClipboardList,
  BookMarked,
  FileSpreadsheet,
  Calendar
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@contexts/AuthContext";
import { useTheme } from "@contexts/ThemeContext";
import schoolInformation from "@/shared/schoolInformation";

const NavItem = ({ to, icon: Icon, label, onClick, isCollapsed, color = "indigo", iconColor = "text-gray-500" }) => {
  const { pathname } = useLocation();
  // Only match exact paths for active state
  const isActive = pathname === to;
  
  const colorClasses = {
    blue: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
    green: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-200",
    amber: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
    purple: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-200",
    indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200",
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-200"
  };

  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-lg transition-all duration-200
        ${
          isActive
            ? colorClasses[color] || colorClasses.blue
            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
        }
        ${isCollapsed ? "justify-center" : ""}
      `}
      title={isCollapsed ? label : ""}
    >
      <div className={`p-2 rounded-lg ${
        isActive 
          ? 'bg-white/20' 
          : `bg-${color}-100 text-${color}-600 dark:bg-${color}-900/50 dark:text-${color}-300`
      }`}>
        <Icon size={18} className="flex-shrink-0" />
      </div>
      {!isCollapsed && <span className="text-base font-medium">{label}</span>}
    </NavLink>
  );
};

export default function DashboardLayout({ children }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState({ 
    date: '', 
    time: '' 
  });
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Update current date and time every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      const dateOptions = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric'
      };
      const timeOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      };
      setCurrentDateTime({
        date: now.toLocaleDateString('en-US', dateOptions),
        time: now.toLocaleTimeString('en-US', timeOptions)
      });
    };
    
    updateDateTime();
    const intervalId = setInterval(updateDateTime, 60000); // Update every minute
    return () => clearInterval(intervalId);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    navigate("/login");
  };

  // Update mobile state on resize
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = window.innerWidth < 1024;
      setIsMobile(isMobileView);
      if (!isMobileView) {
        setMobileOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className={`flex h-screen bg-gray-100 dark:bg-gray-900 overflow-hidden ${theme === 'dark' ? 'dark' : ''}`}>
      {/* ===== Sidebar ===== */}
      <div
        className={`
          fixed lg:static z-50 inset-y-0 left-0 bg-white dark:bg-gray-800 shadow-lg
          transition-all duration-300 flex flex-col
          ${isMobile ? "w-64" : isCollapsed ? "w-20" : "w-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Sidebar Header */}
        <div className="p-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between w-full">
              <div className={`flex items-center gap-2 ${isCollapsed ? "hidden" : "block"}`}>
                <div className="h-8 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                <div className="whitespace-nowrap">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                    MarksMint
                  </h1>
                  {!isCollapsed && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      School Management System
                    </p>
                  )}
                </div>
              </div>
              {isCollapsed && <div className="h-8 w-8"></div>}

              <div className="flex items-center justify-center gap-2">
                {/* Desktop collapse button */}
                <button
                  className="hidden lg:flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  {isCollapsed ? <Menu size={18} /> : <X size={18} />}
                </button>

                {/* Mobile close button */}
                <button
                  className="lg:hidden hover:bg-gray-100 dark:hover:bg-gray-700 p-1.5 rounded-full"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Close sidebar"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Main Navigation */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <NavItem
              to="/dashboard"
              icon={Home}
              label="Dashboard"
              isCollapsed={!isMobile && isCollapsed}
              onClick={() => isMobile && setMobileOpen(false)}
              color="indigo"
              iconColor="text-indigo-500"
            />
            <NavItem
              to="/dashboard/students"
              icon={Users}
              label="Students"
              isCollapsed={!isMobile && isCollapsed}
              onClick={() => isMobile && setMobileOpen(false)}
              color="blue"
              iconColor="text-blue-500"
            />
            <NavItem
              to="/dashboard/academics"
              icon={Book}
              label="Academics"
              isCollapsed={!isMobile && isCollapsed}
              onClick={() => isMobile && setMobileOpen(false)}
              color="indigo"
              iconColor="text-indigo-500"
            />
            <NavItem
              to="/dashboard/attendance"
              icon={Calendar}
              label="Attendance"
              isCollapsed={!isMobile && isCollapsed}
              onClick={() => isMobile && setMobileOpen(false)}
              color="teal"
              iconColor="text-teal-500"
            />
          </div>

          {/* Bottom Navigation */}
          <div className="p-2 border-t border-gray-200 dark:border-gray-700">
            <NavItem
              to="/"
              icon={Home}
              label="Back To Home"
              isCollapsed={!isMobile && isCollapsed}
              onClick={() => isMobile && setMobileOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* ===== Main Content Area ===== */}
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Navbar - Fixed */}
        <nav className="flex items-center justify-between bg-white shadow px-4 py-3 dark:bg-gray-800 z-10">
          {/* Left side - Menu and School Info */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden  text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-4">
              {/* Show MarksMint when sidebar is collapsed on desktop */}
              <div className={isCollapsed ? 'hidden md:block' : 'hidden'}>
                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-1 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                    <div className="whitespace-nowrap">
                      <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">
                        MarksMint
                      </h1>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                        School Management System
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* School Info - always shown */}
              <div className=" md:block">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 px-4 py-2 rounded-lg shadow-sm border border-gray-100 dark:border-gray-700">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Dina Public School
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Paharpur Branch</p>
                </div>
              </div>
            </div>
          </div>

          {/* Center - Date and Time Cards */}
          <div className="hidden md:flex items-center gap-3">
            {/* Date Card */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentDateTime.date}
              </span>
            </div>
            
            {/* Time Card */}
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {currentDateTime.time}
              </span>
            </div>
          </div>

          {/* Right side - Theme Toggle and User Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
            <div className="flex items-center gap-4 relative" ref={dropdownRef}>
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-200 font-medium">
                  {currentUser?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                {!isMobile && !isCollapsed && (
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200">
                    {currentUser?.email || 'Admin'}
                  </span>
                )}
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-md shadow-lg py-1 z-50 dark:bg-gray-800">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b dark:text-gray-300">
                    <p className="font-medium">Admin User</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">admin@school.edu</p>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    <LogOut size={16} className="mr-2" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto">
          <main className="px-0 py-4 md:p-6">{children}</main>
        </div>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}
    </div>
  );
}