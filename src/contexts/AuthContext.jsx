import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
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
    setUser(null);
  };

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const navigate = useNavigate();
  
  // Make currentUser available for backward compatibility
  const currentUser = user;
  
  // Initialize auth state from localStorage and verify with server
  const initializeAuth = useCallback(async () => {
    try {
      const storedUser = safeGetItem('user');
      const token = safeGetItem('token');
      
      if (!storedUser || !token) {
        setLoading(false);
        setInitialized(true);
        return;
      }
      
      // Set auth header for subsequent requests
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token with server in the background
      try {
        const response = await api.get('/auth/verify');
        if (response.data && response.data.user) {
          const userData = response.data.user;
          safeSetItem('user', JSON.stringify(userData));
          setUser(userData);
        } else {
          clearAuthData();
        }
      } catch (error) {
        console.warn('Token verification failed, clearing auth data:', error);
        clearAuthData();
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      clearAuthData();
    } finally {
      setInitialized(true);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        await initializeAuth();
      } catch (error) {
        console.error('Auth initialization failed:', error);
        if (error.response?.status !== 401) {
          console.error('Auth check failed:', error);
        }
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [initializeAuth]);

  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('[Auth] Attempting login with:', credentials);
      
      // Make actual API call to login
      const response = await api.post('/auth/login', credentials);
      
      if (response.data && response.data.token) {
        const { token, refreshToken, user: userData } = response.data;
        
        if (!userData || !userData.id) {
          throw new Error('Invalid user data received from server');
        }
        
        // Store user data in localStorage safely
        if (!safeSetItem('token', token) || 
            !safeSetItem('refreshToken', refreshToken) || 
            !safeSetItem('user', JSON.stringify(userData))) {
          throw new Error('Failed to store authentication data');
        }
        
        // Set the default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[Auth] Login successful for user:', userData.username);
        
        // Update state with the user data
        setUser(userData);
        
        // Navigate to dashboard after successful login
        navigate('/dashboard', { replace: true });
        
        return { success: true, user: userData };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login failed:', error);
      safeRemoveItem('token');
      safeRemoveItem('user');
      safeRemoveItem('refreshToken');
      setUser(null);
      
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Login failed. Please try again.' 
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
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
