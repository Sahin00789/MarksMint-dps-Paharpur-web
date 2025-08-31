import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Create a div for modals
const ModalRoot = () => {
  useEffect(() => {
    // Create the modal root element if it doesn't exist
    if (!document.getElementById('modal-root')) {
      const modalRoot = document.createElement('div');
      modalRoot.id = 'modal-root';
      modalRoot.style.position = 'relative';
      modalRoot.style.zIndex = '9999';
      document.body.appendChild(modalRoot);
    }
    
    return () => {
      // Clean up the modal root when the component unmounts
      const modalRoot = document.getElementById('modal-root');
      if (modalRoot) {
        document.body.removeChild(modalRoot);
      }
    };
  }, []);

  return null;
};

// Pages
import Home from './pages/Home';
import Login from './pages/Login';

import PublicResultsPage from './pages/PublicResultsPage';
import { useTheme } from './contexts/ThemeContext';
import Sidebar from './layouts/Sidebar';
import Navbar from './layouts/Navbar';

// Import Panel Components
import StudentsPanel from './components/DashboardPanels/StudentsPanel';
import MarksPanel from './components/DashboardPanels/MarksPanel';
import AttendancePanel from './components/DashboardPanels/AttendancePanel';
import CoScholasticPanel from './components/DashboardPanels/CoScholasticPanel';
import MarksheetsPanel from './components/DashboardPanels/MarksheetGenerationPanel';
import ResultsPublishPanel from './components/DashboardPanels/ResultPublishPanel';
import ConfigurationPanel from './components/DashboardPanels/ConfigurationPanel';

// Protected Route Component
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
};

// Main App Component
const AppContent = () => {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          {/* Public Routes */}
          <Route path="/results" element={<PublicResultsPage />}>
            <Route path="term/:term" element={<PublicResultsPage />} />
          </Route>
          
     
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
          
            <Route path="/dashboard" element={
              <div className='flex min-h-screen bg-gray-50 dark:bg-gray-900'>
                <Sidebar />
                <div className='flex-1 flex flex-col overflow-hidden'>
                  <Navbar />
                  <main className='flex-1 overflow-y-auto p-6 bg-gray-50 dark:bg-gray-900"'>
                    <Outlet />
                  </main>
                </div>
              </div>
            }>
              <Route path="students" element={<StudentsPanel/>} />
              <Route path="marks" element={<MarksPanel/>} />
              <Route path="attendance" element={<AttendancePanel/>} />
              <Route path="co-scholastic" element={<CoScholasticPanel/>} />
               <Route path="Marksheets" element={<MarksheetsPanel/>} />
                <Route path="co-scholastic" element={<CoScholasticPanel/>} />
                 <Route path="Resultspublish" element={<ResultsPublishPanel/>} />
                  <Route path="config" element={<ConfigurationPanel/>} />
            </Route>
            
            {/* Catch-all for other protected routes */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
        <ModalRoot />
      </div>
    </div>
  );
};

// Wrap the app with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
