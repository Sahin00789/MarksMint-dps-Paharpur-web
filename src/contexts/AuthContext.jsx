import React,{ createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

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

  const [user, setUser] = useState(() => {
    // Initialize user from localStorage if available
    try {
      const storedUser = safeGetItem('user');
      if (!storedUser) return null;
      
      // Basic validation of stored user data
      const parsedUser = JSON.parse(storedUser);
      if (typeof parsedUser !== 'object' || parsedUser === null) {
        throw new Error('Invalid user data format');
      }
      
      // Ensure required fields exist
      if (!parsedUser.id || !parsedUser.username) {
        throw new Error('Invalid user data: missing required fields');
      }
      
      return parsedUser;
    } catch (error) {
      console.error('Error initializing user:', error);
      // Clean up any invalid data
      safeRemoveItem('user');
      safeRemoveItem('token');
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Make currentUser available for backward compatibility
  const currentUser = user;

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const token = safeGetItem('token');
      if (token) {
        try {
          // Verify token with backend
          const response = await api.get('/auth/verify');
          
          if (response.data && response.data.user) {
            // Update user data from the verify endpoint
            safeSetItem('user', JSON.stringify(response.data.user));
            setUser(response.data.user);
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          } else {
            throw new Error('Invalid response from server');
          }
        } catch (error) {
          console.error('Token verification failed:', error);
          // Clear invalid token and show error to user
          clearAuthData();
          if (error.response?.status !== 401) {
            // Only show error if it's not an auth error (which is expected when not logged in)
            console.error('Auth check failed:', new Error('Session expired. Please log in again.'));
          }
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('[Auth] Attempting login with:', credentials);
      
      // Make actual API call to login
      const response = await api.post('/auth/login', credentials);
      
      if (response.data && response.data.token) {
        const { token, user } = response.data;
        
        // Store user data in localStorage safely
        if (!safeSetItem('token', token) || !safeSetItem('user', JSON.stringify(user))) {
          throw new Error('Failed to store authentication data');
        }
        
        // Set the default authorization header
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        console.log('[Auth] Login successful for user:', user.username);
        
        // Update state and wait for it to complete
        await new Promise(resolve => {
          setUser(user);
          // Small delay to ensure state is updated
          setTimeout(resolve, 50);
        });
        
        return { success: true, user };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login failed:', error);
      safeRemoveItem('token');
      safeRemoveItem('user');
      localStorage.removeItem('user');
      setUser(null);
      
      return { 
        success: false, 
        error: error.message || 'Login failed. Please try again.' 
      };
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
