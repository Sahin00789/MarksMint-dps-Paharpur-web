import { useEffect } from "react";
import { Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ThemeProvider, useTheme } from "@contexts/ThemeContext";
import { AuthProvider, useAuth } from "@contexts/AuthContext";

// Pages
import Home from "@pages/Home";
import Login from "@pages/Auth/Login";
import PublicResultsPage from "@pages/PublicResultsPage";

// Import Dashboard Components
import DashboardHome from "@pages/Dashboard/DashboardHome";
import StudentsPanel from "@pages/Dashboard/Students/StudentsPanel";
import AttendancePanel from "./pages/Dashboard/Attendance/AttendancePanel";
import DashboardLayout from "@/layouts/DashboardLayout";

// Academics Components
import AcademicsLayout from "@/pages/Dashboard/Academics/AcademicsLayout";
import MarksPanel from "./pages/Dashboard/Academics/Marks/MarksPanel";
import ExamsPanel from "./pages/Dashboard/Academics/ExamsConfiguration/ExamsConfigurationPanel";
import ResultPublishPanel from "./pages/Dashboard/Academics/Resultpublish/ResultPublishPanel";
import AdmitCardPanel from "./pages/Dashboard/Academics/AdmitCard/AdmitCardPanel";
import CoScholasticGradesPanel from "@/pages/Dashboard/Academics/CoScholasticGrades/CoScholasticGradesPanel";
import MarksheetsPanel from "@/pages/Dashboard/Academics/Marksheets/MarksheetsPanel";
import MarksheetPrintPage from "@/pages/Dashboard/Academics/Marksheets/MarksheetPage/MarksheetPrintPage";

// Protected Route Component
const ProtectedRoute = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Store the attempted URL for redirecting after login
    const from =
      location.pathname !== "/login"
        ? location.pathname + location.search
        : "/dashboard";
    return <Navigate to="/login" state={{ from }} replace />;
  }

  // Render the protected route
  return <Outlet />;
};

// Main App Component
const AppContent = () => {
  const { theme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme}
      />
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route
            path="/login"
            element={user ? <Navigate to="/dashboard" replace /> : <Login />}
          />

          {/* Public Routes */}
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
                  <Route
                    path="generate"
                    element={<AdmitCardPanel initialTab="generate" />}
                  />
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

              {/* Catch-all for other protected dashboard routes */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
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
