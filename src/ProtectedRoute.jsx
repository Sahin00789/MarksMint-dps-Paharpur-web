import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

export const ProtectedRoute = ({ children, roles = [] }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect them to the /login page, but save the current location they were trying to go to
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if user has required role
  if (roles.length > 0 && (!user.role || !roles.includes(user.role))) {
    // User doesn't have required role, redirect to home
    return <Navigate to="/" replace />;
  }

  return children;
};
