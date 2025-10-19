import { Suspense, lazy, useEffect, useState } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ThemeProvider } from "@contexts/ThemeContext";
import { AuthProvider, useAuth } from "@contexts/AuthContext";
import Loader from "@components/common/Loader";

// Lazy load pages
const Home = lazy(() => import("@pages/Home"));
const Login = lazy(() => import("@pages/Auth/Login"));
const PublicResultsPage = lazy(() => import("@pages/PublicResultsPage"));

// Lazy load dashboard components
const DashboardHome = lazy(() => import("@pages/Dashboard/DashboardHome"));
const StudentsPanel = lazy(() => import("@pages/Dashboard/Students/StudentsPanel"));
const AttendancePanel = lazy(() => import("./pages/Dashboard/Attendance/AttendancePanel"));
const DashboardLayout = lazy(() => import("@/layouts/DashboardLayout"));

// Lazy load academics components
const AcademicsLayout = lazy(() => import("@/pages/Dashboard/Academics/AcademicsLayout"));
const MarksPanel = lazy(() => import("./pages/Dashboard/Academics/Marks/MarksPanel"));
import ExamsPanel from "./pages/Dashboard/Academics/ExamsConfiguration/ExamsConfigurationPanel";
const ResultPublishPanel = lazy(() => import("./pages/Dashboard/Academics/Resultpublish/ResultPublishPanel"));
const AdmitCardPanel = lazy(() => import("./pages/Dashboard/Academics/AdmitCard/AdmitCardPanel"));
const CoScholasticGradesPanel = lazy(() => import("@/pages/Dashboard/Academics/CoScholasticGrades/CoScholasticGradesPanel"));
const MarksheetsPanel = lazy(() => import("@/pages/Dashboard/Academics/Marksheets/MarksheetsPanel"));
const MarksheetPrintPage = lazy(() => import("@/pages/Dashboard/Academics/Marksheets/MarksheetPage/MarksheetPrintPage"));

// Full page loading component
const FullPageLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
    <Loader size="xl" />
  </div>
);

// Route loading wrapper
const RouteLoader = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const { loading: authLoading } = useAuth();

  // Define public routes that don't require auth loading
  const publicRoutes = ['/', '/login', '/results'];

  // Check if current path is public
  const isPublicRoute = publicRoutes.some(route => location.pathname.startsWith(route));

  // Only show loading for path changes, not for search/hash changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 100); // Reduced delay
    return () => clearTimeout(timer);
  }, [location.pathname]); // Only run on pathname changes

  // For public routes, don't wait for authLoading
  if (isPublicRoute) {
    if (isLoading) {
      return <FullPageLoader />;
    }
    return children;
  }

  // For protected routes, wait for both page loading and auth loading
  if (isLoading || authLoading) {
    return <FullPageLoader />;
  }

  return children;
};

// Error boundary component for catching navigation errors
const ErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const errorHandler = (error) => {
      console.error('Navigation error:', error);
      setHasError(true);
    };

    window.addEventListener('error', errorHandler);
    return () => window.removeEventListener('error', errorHandler);
  }, []);

  if (hasError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 bg-white rounded-lg shadow-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
          <p className="mb-4">There was an issue with page navigation. Please try again.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return children;
};

// Protected Route Component - Only used for dashboard routes
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    if (!loading && !user && !isNavigating) {
      setIsNavigating(true);
    }
  }, [user, loading, isNavigating]);

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user && isNavigating) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!user) {
    return null; // or a loading state
  }

  return <ErrorBoundary>{children || <Outlet />}</ErrorBoundary>;
};

// Public Route Component - For public pages
const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  // If user is logged in and tries to access login page, redirect to dashboard
  if (user && window.location.pathname === '/login') {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

const AppContent = () => {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <RouteLoader>
        <Routes>
          {/* Home page - always accessible */}
          <Route path="/" element={<Home />} />
          
          {/* Public routes */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/results" element={<PublicResultsPage />} />

          {/* Dashboard Routes - Protected */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Outlet />
                </DashboardLayout>
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="students" element={<StudentsPanel />} />
            <Route path="attendance" element={<AttendancePanel />} />
            <Route path="academics" element={<AcademicsLayout />}>
              <Route index element={<Navigate to="exams" replace />} />
              <Route path="exams" element={<ExamsPanel />}>
                <Route path="*" element={<Navigate to="" replace />} />
              </Route>
              <Route path="marks" element={<MarksPanel />} />
              <Route path="results-publish">
                <Route index element={<ResultPublishPanel />} />
                <Route path="*" element={<Navigate to="" replace />} />
              </Route>
              <Route path="result-publish" element={<Navigate to="../results-publish" replace />} />
              <Route path="admit-cards" element={<AdmitCardPanel />} />
              <Route path="co-scholastic-grades" element={<CoScholasticGradesPanel />} />
              <Route path="marksheets">
                <Route index element={<MarksheetsPanel />} />
                <Route path="print" element={<MarksheetPrintPage />} />
                <Route path="*" element={<Navigate to="" replace />} />
              </Route>
              <Route path="*" element={<Navigate to="exams" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>

          {/* Catch-all route - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </RouteLoader>
    </Suspense>
  );
};

// Main App component with providers
const App = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) {
    return <FullPageLoader />;
  }

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
