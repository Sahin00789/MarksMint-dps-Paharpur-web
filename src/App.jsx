import { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider, useTheme } from '@contexts/ThemeContext';
import { AuthProvider, useAuth } from '@contexts/AuthContext';

// Pages
import Home from '@pages/Home';
import Login from '@pages/Login';
import PublicResultsPage from '@pages/PublicResultsPage';

// Import Layouts
import DashboardLayout from '@pages/Dashboard/DashboardLayout';

// Import Student Panel Component
import StudentsPanel from '@pages/Dashboard/Students/StudentsPanel';
import MarksPanel from './pages/Dashboard/Marks/MarksPanel';
import ConfigurationPanel from './pages/Dashboard/Configuaration/ConfigurationPanel';
import ResultPublishPanel from './pages/Dashboard/Resultpublish/ResultPublishPanel';

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
          <Route index element={<Home />} />
          <Route path="/login" element={<Login />} />
          {/* Public Routes */}
          <Route path="/results" element={<PublicResultsPage />}>
            <Route path="term/:term" element={<PublicResultsPage />} />
          </Route>
          
     
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={
              <DashboardLayout>
                <Outlet />
              </DashboardLayout>
            }>
              <Route path="students" element={<StudentsPanel />} />
              <Route path="marks" element={<MarksPanel />} />
              <Route path="config" element={<ConfigurationPanel />} />
                <Route path="results-publish" element={<ResultPublishPanel />} />
            </Route>
            
            {/* Catch-all for other protected routes */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
};

// Wrap the app with ThemeProvider and AuthProvider
const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
