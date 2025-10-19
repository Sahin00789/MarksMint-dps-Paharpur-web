import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

// Create a named function for better debugging
export function AuthProvider({ children }) {
  // Safe localStorage operations with enhanced error handling
  const safeGetItem = (key) => {
    try {
      if (typeof window === 'undefined') {
        console.warn('localStorage not available (server-side rendering)');
        return null;
      }
      const value = localStorage.getItem(key);
      console.debug(`[Auth] Get ${key}:`, value ? '(exists)' : 'null');
      return value;
    } catch (error) {
      console.error(`[Auth] Error accessing localStorage key '${key}':`, error);
      return null;
    }
  };

  const safeSetItem = (key, value) => {
    try {
      if (typeof window === 'undefined') return false;
      console.debug(`[Auth] Set ${key}:`, value);
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.error(`[Auth] Error setting localStorage key '${key}':`, error);
      return false;
    }
  };

  const safeRemoveItem = (key) => {
    try {
      if (typeof window === 'undefined') return false;
      console.debug(`[Auth] Remove ${key}`);
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error(`[Auth] Error removing localStorage key '${key}':`, error);
      return false;
    }
  };
  
  // Clear all auth-related data
  const clearAuthData = () => {
    console.log('[Auth] Clearing authentication data');
    safeRemoveItem('user');
    safeRemoveItem('token');
    safeRemoveItem('lastVerified');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Make currentUser available for backward compatibility
  const currentUser = user;
  
  // Initialize auth state from localStorage and verify with server
  const initializeAuth = useCallback(async () => {
    try {
      const storedUser = safeGetItem('user');
      const token = safeGetItem('token');

      if (!storedUser || !token) {
        setUser(null);
        setLoading(false);
        return;
      }

      // Set auth header for subsequent requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Check if we've verified recently (within 5 minutes)
      const lastVerified = safeGetItem('lastVerified');
      const now = new Date().getTime();

      // If verified recently, just use the stored user data
      if (lastVerified && (now - parseInt(lastVerified, 10)) < 5 * 60 * 1000) {
        setUser(JSON.parse(storedUser));
        setLoading(false);
        return;
      }

      // Verify token with server - with retry logic
      try {
        const response = await api.get('/auth/verify');
        if (response.data?.user) {
          const userData = response.data.user;
          safeSetItem('user', JSON.stringify(userData));
          safeSetItem('lastVerified', now.toString());
          setUser(userData);
        } else {
          // Server responded but no user data - token might be invalid
          console.warn('Token verification: No user data in response');
          clearAuthData();
        }
      } catch (error) {
        // Check if it's a network error (server down) vs auth error (invalid token)
        if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR' || !navigator.onLine) {
          // Server is down or network issue - keep user logged in with stored data
          console.warn('Server unavailable, keeping user logged in with stored data');
          setUser(JSON.parse(storedUser));
        } else if (error.response?.status === 401) {
          // Authentication error - clear auth data
          console.warn('Token verification failed (401), clearing auth data');
          clearAuthData();
        } else {
          // Other error - also clear auth data to be safe
          console.warn('Token verification failed, clearing auth data:', error.message);
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize auth state when component mounts
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('[Auth] Attempting login with:', credentials);
      
      // Create a minimal axios instance for login to avoid any interceptors
    
      
      // Make direct login request without using the interceptors
      const response = await api.post('/auth/login', credentials);
      
      // Check for successful response with token
      if (response.data?.token) {
        const { token, refreshToken, user: userData } = response.data;
        
        if (!userData?.id) {
          throw new Error('Invalid user data received from server');
        }
        
        // Store authentication data
        const storageSuccess = [
          safeSetItem('token', token),
          refreshToken && safeSetItem('refreshToken', refreshToken),
          safeSetItem('user', JSON.stringify(userData)),
          safeSetItem('lastVerified', Date.now().toString())
        ].every(Boolean);
        
        if (!storageSuccess) {
          throw new Error('Failed to store authentication data');
        }
        
        // Update API defaults
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[Auth] Login successful for user:', userData.username);
        
        // Update state
        setUser(userData);
        
        // Navigate to dashboard
        navigate('/dashboard', { replace: true });
        
        return { 
          success: true, 
          user: userData,
          message: 'Login successful!'
        };
      } else {
        throw new Error(response.data?.message || 'Invalid response from server');
      }
    } catch (error) {
      console.error('Login failed:', error);
      
      // Clear any partial auth data
      clearAuthData();
      
      // Handle different types of errors
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response) {
        // Server responded with an error status code
        if (error.response.status === 401) {
          errorMessage = 'Invalid username or password';
        } else if (error.response.status >= 500) {
          errorMessage = 'Server error. Please try again later.';
          console.error('Server error details:', error.response.data);
        } else if (error.response.data?.message) {
          errorMessage = error.response.data.message;
        }
      } else if (error.request) {
        // Request was made but no response received
        errorMessage = 'Unable to connect to the server. Please check your connection.';
      } else if (error.message) {
        // Other errors
        errorMessage = error.message;
      }
      
      // Show error toast
      toast.error(errorMessage);
      
      return { 
        success: false, 
        error: errorMessage,
        status: error.response?.status,
        data: error.response?.data
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('[Auth] Logging out user:', user?.username);
      // Call logout API if available
      await api.post('/auth/logout');
    } catch (error) {
      console.error('[Auth] Logout API error (proceeding with local cleanup):', error);
    } finally {
      // Clean up local storage and state
      clearAuthData();
      delete api.defaults.headers.common['Authorization'];
      navigate('/login', { replace: true });
    }
  };

  const value = {
    user,
    currentUser, // for backward compatibility
    loading,
    isAuthenticated: !!user,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Export the hook with a display name for better debugging
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Add display names for better debugging in React DevTools
AuthProvider.displayName = 'AuthProvider';
useAuth.displayName = 'useAuth';
