import axios from 'axios';
import { toast } from 'react-toastify';

// Use environment variables if available, otherwise fallback to defaults
const API_URL = 'https://marksmint-dps-paharpur-server.onrender.com/api';
const API_URL2 ="http://localhost:5000/api/"

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: 30000, // 30 seconds
  validateStatus: function (status) {
    return status >= 200 && status < 500; // Resolve only if the status code is less than 500
  }
});

// Request timeout helper
const TIMEOUT_ERROR_MESSAGE = 'Request took too long. Please check your connection and try again.';
const NETWORK_ERROR_MESSAGE = 'Network error. Please check your internet connection.';

// Flag to prevent multiple token refresh attempts
let isRefreshing = false;
let failedQueue = [];

/**
 * Handle unauthorized errors by attempting to refresh the token
 */
const handleUnauthorizedError = async (originalRequest, error) => {
  // Mark the request to prevent infinite retry loops
  originalRequest._retry = true;
  
  // If we're already refreshing the token, add the request to the queue
  if (isRefreshing) {
    console.log('[API] Token refresh already in progress, adding to queue');
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then((token) => {
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      })
      .catch((err) => {
        return Promise.reject(err);
      });
  }

  // Start the token refresh process
  isRefreshing = true;
  
  try {
    console.log('[API] Attempting to refresh token');
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      console.warn('[API] No refresh token available');
      throw new Error('No refresh token available');
    }
    
    // Call the refresh token endpoint
    const response = await axios.post(
      `${API_URL}/auth/refresh-token`,
      { refreshToken },
      { 
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }
    );

    console.log('[API] Token refresh successful');
    
    // Update tokens in localStorage
    const { token: newToken, refreshToken: newRefreshToken } = response.data;
    localStorage.setItem('token', newToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }
    
    // Update the Authorization header for the original request
    originalRequest.headers.Authorization = `Bearer ${newToken}`;
    
    // Process any queued requests
    processQueue(null, newToken);
    
    // Retry the original request
    return api(originalRequest);
    
  } catch (refreshError) {
    console.error('[API] Token refresh failed:', refreshError);
    
    // Clear tokens and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    
    // Process any queued requests with the error
    processQueue(refreshError, null);
    
    // Only redirect if we're not already on the login page
    if (window.location.pathname !== '/login') {
      console.log('[API] Redirecting to login after token refresh failure');
      window.location.href = '/login';
    }
    
    return Promise.reject(refreshError);
    
  } finally {
    isRefreshing = false;
  }
};

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    // Skip logging for health checks to reduce noise
    if (!config.url.includes('/health')) {
      console.log(`[API] ${config.method?.toUpperCase() || 'GET'} ${config.url}`, {
        data: config.data,
        params: config.params
      });
    }
    
    // Skip adding token for public and auth endpoints
    const isPublicEndpoint = config.url.includes('/public/') || 
                           config.url.includes('/auth/') ||
                           config.url === '/health';
    
    if (isPublicEndpoint && !config.url.includes('/auth/refresh-token')) {
      return config;
    }
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('[API] Added Authorization header');
    } else if (!config.url.includes('/auth/')) {
      console.warn('[API] No auth token found');
      // Only redirect if not on login page and not an auth request
      if (window.location.pathname !== '/login') {
        console.log('[API] Redirecting to login');
        window.location.href = '/login';
      }
      throw new Error('No authentication token found');
    }
    
    return config;
  },
  (error) => {
    console.error('[API] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle common errors and token refresh
api.interceptors.response.use(
  (response) => {
    // Skip logging for health checks to reduce noise
    if (!response.config.url.includes('/health')) {
      console.log(`[API] ${response.config.method?.toUpperCase() || 'GET'} ${response.config.url}`, {
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log detailed error information
    console.error('[API] Response error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      code: error.code,
      message: error.message
    });
    
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      const message = 'Request timed out. Please check your connection and try again.';
      console.error(message);
      error.message = message;
      return Promise.reject(error);
    }

    // Handle network connectivity issues
    if (!window.navigator.onLine) {
      const message = 'No internet connection. Please check your network settings.';
      console.error(message);
      error.message = message;
      return Promise.reject(error);
    }
    
    // Handle server errors
    if (error.response?.status >= 500) {
      console.error('[API] Server error:', error.response.data);
      error.message = 'Server error. Please try again later.';
      return Promise.reject(error);
    }
    
    // Handle unauthorized errors (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[API] Unauthorized - attempting token refresh');
      
      // If we're already refreshing the token, add the request to the queue
      if (isRefreshing) {
        console.log('[API] Token refresh already in progress, adding to queue');
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      // Mark that we're refreshing the token
      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Try to refresh the token
        const response = await api.post('/auth/refresh-token', { refreshToken });
        const { token: newToken, refreshToken: newRefreshToken } = response.data;
        
        // Store the new tokens
        localStorage.setItem('token', newToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        
        // Process any queued requests
        processQueue(null, newToken);
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, clear auth and redirect to login
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized errors
    if (status === 401) {
      // If this is a refresh token request or we're already refreshing, reject
      if (originalRequest.url.includes('/auth/refresh-token') || isRefreshing) {
        // If we're already refreshing, add the failed request to the queue
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch((err) => {
              return Promise.reject(err);
            });
        }
        
        // Clear auth data and redirect to login
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      // Try to refresh the token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        isRefreshing = true;
        
        try {
          const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
          const { token } = response.data;
          
          if (!token) {
            throw new Error('No token received');
          }
          
          // Store the new token
          localStorage.setItem('token', token);
          
          // Update the Authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          originalRequest.headers.Authorization = `Bearer ${token}`;
          
          // Process any queued requests
          processQueue(null, token);
          isRefreshing = false;
          
          // Retry the original request
          return api(originalRequest);
        } catch (refreshError) {
          // If refresh fails, clear auth and redirect to login
          processQueue(refreshError, null);
          clearAuthAndRedirect();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      } else {
        // No refresh token available, redirect to login
        clearAuthAndRedirect();
        return Promise.reject(new Error('Session expired. Please log in again.'));
      }
    }

    // Handle other error statuses
    if (status >= 500) {
      toast.error('Server error. Please try again later.');
    } else if (status === 404) {
      toast.error('The requested resource was not found.');
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (error.response?.data?.message) {
      // Only show error message if it's not an auth error
      if (status !== 401 && status !== 403) {
        toast.error(error.response.data.message);
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function to clear auth data and redirect to login
const clearAuthAndRedirect = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Only redirect if not already on the login page
  if (!window.location.pathname.includes('/login')) {
    // Store the current location to redirect back after login
    const returnTo = window.location.pathname + window.location.search;
    window.location.href = `/login?returnTo=${encodeURIComponent(returnTo)}`;
  }
};

export default api;
