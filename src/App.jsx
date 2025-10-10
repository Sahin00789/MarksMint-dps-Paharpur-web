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

  // Show loading state for initial load or route changes
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 300); // Small delay to prevent flash
    return () => clearTimeout(timer);
  }, [location.key, authLoading]);

  return (
    <>
      {isLoading && <FullPageLoader />}
      {children}
    </>
  );
};

// Protected Route Component
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <FullPageLoader />;
  }

  if (!user) {
    const from = location.pathname !== "/login" ? location.pathname + location.search : "/dashboard";
    return <Navigate to="/login" state={{ from }} replace />;
  }

  return <Outlet />;
};

const AppContent = () => {
  const { loading: authLoading } = useAuth();
  
  return (
    <Suspense fallback={<FullPageLoader />}>
      <RouteLoader>
        <>
          {authLoading ? (
            <FullPageLoader />
          ) : (
            <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/results" element={<PublicResultsPage />}>
          <Route path="term/:term" element={<PublicResultsPage />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route
            path="/dashboard"
            element={
              <DashboardLayout>
                <Outlet />
              </DashboardLayout>
            }
          >
            <Route index element={<DashboardHome />} />
            <Route path="students" element={<StudentsPanel />} />
            <Route path="attendance" element={<AttendancePanel />} />
            
            {/* Academics Routes */}
            <Route path="academics" element={<AcademicsLayout />}>
              <Route index element={<Navigate to="exams" replace />} />
              <Route path="exams" element={<ExamsPanel />} />
              <Route path="admit-cards" element={<AdmitCardPanel />}>
                <Route path="generate" element={<AdmitCardPanel initialTab="generate" />} />
              </Route>
              <Route path="marks" element={<MarksPanel />} />
              <Route path="results-publish" element={<ResultPublishPanel />} />
              <Route path="co-scholastic-grades" element={<CoScholasticGradesPanel />} />
              <Route path="marksheets">
                <Route index element={<MarksheetsPanel />} />
                <Route path="print" element={<MarksheetPrintPage />} />
              </Route>
              <Route path="*" element={<Navigate to="exams" replace />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          )}
          
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
        </>
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
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
};

export default App;
