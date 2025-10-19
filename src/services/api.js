import axios from 'axios';
import { toast } from 'react-toastify';

// Use environment variables if available, otherwise fallback to defaults
const API_URL = 'https://marksmint-dps-paharpur-server.onrender.com/api';
const API_URL2 = "http://localhost:5000/api";

// Request timeout helper
const TIMEOUT_ERROR_MESSAGE = 'Request took too long. Please check your connection and try again.';
const NETWORK_ERROR_MESSAGE = 'Network error. Please check your internet connection.';

// Flag to prevent multiple token refresh attempts
let isRefreshing = false;
let failedQueue = [];

/**
 * Process the queue of requests waiting for token refresh
 */
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

/**
 * Handle unauthorized errors by attempting to refresh the token
 */
const handleUnauthorizedError = async (error) => {
  const originalRequest = error.config;
  
  // If error response doesn't exist or the request was already retried, reject
  if (!error.response || originalRequest._retry) {
    return Promise.reject(error);
  }

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
   
    
    return Promise.reject(refreshError);
    
  } finally {
    isRefreshing = false;
  }
};

// Create axios instance with default config
// Regular API client for normal requests
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  }
});

// Dedicated API client for file uploads with longer timeout
const uploadApi = axios.create({
  baseURL: API_URL,
  withCredentials: true,   
  headers: {
    'Content-Type': 'multipart/form-data',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest'
  },
  timeout: 600000, // 10 minutes for file uploads
  validateStatus: function (status) {
    return status >= 200 && status < 500;
  }
});

// Request interceptor to include auth token and handle logging
// Helper to check if endpoint is public or auth-related
const isPublicEndpoint = (url) => {
  const publicPaths = [
    '/publicresults/',
    '/auth/verify',
    '/health',
    '/auth/login',
    '/auth/refresh-token',
    '/api/publicresults/status/term/',
    '/api/publicresults/getresult'
  ];
  return publicPaths.some(path => url.startsWith(path) || url.endsWith(path));
};

// Helper to check if endpoint is an auth endpoint
const isAuthEndpoint = (url) => {
  return url.includes('/auth/');
};

api.interceptors.request.use(
  (config) => {
    // Skip auth for public endpoints or when skipAuth is explicitly set
    if (isPublicEndpoint(config.url) || config.skipAuth) {
      // For login requests, make sure we don't add any auth headers
      delete config.headers.Authorization;
      return config;
    }
    if (!config.url.includes('/health')) {
      const logData = {};
      
      // Only add data/params to log if they exist
      if (config.data) logData.data = config.data;
      if (config.params) logData.params = config.params;
      
      // Only log if we have something to show
      if (Object.keys(logData).length > 0) {
        console.log(`[API] ${config.method?.toUpperCase() || 'GET'} ${config.url}`, logData);
      } else {
        console.log(`[API] ${config.method?.toUpperCase() || 'GET'} ${config.url}`);
      }
    }
    
    return config;
  },
  (error) => {
    // Only log actual errors, not aborted requests
    if (!axios.isCancel(error)) {
      console.error('[API] Request interceptor error:', error);
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to handle caching
api.interceptors.response.use(
  (response) => {
    // For public GET requests, add cache timestamp
    if (response.config.method?.toLowerCase() === 'get' && isPublicEndpoint(response.config.url)) {
      response.cachedAt = Date.now();
    }
    return response;
  },
  (error) => {
    // Don't log 401 errors for public endpoints
    if (error.response?.status === 401 && isPublicEndpoint(error.config.url)) {
      return Promise.resolve({ data: { items: [] } });
    }
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
  handleUnauthorizedError
);

// Apply the same interceptors to uploadApi
uploadApi.interceptors.response.use(
  (response) => response,
  handleUnauthorizedError
);

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
    const isPublicEndpoint = config.url.includes('/publicresults/') || 
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
    
    // Handle server errors - don't attempt token refresh
    if (error.response?.status >= 500) {
      console.error('[API] Server error:', error.response.data);
      error.message = 'Server error. Please try again later.';
      toast.error('Server error. Please try again later.');
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized errors - but not for auth endpoints
    if (error.response?.status === 401 && !isAuthEndpoint(error.config?.url)) {
      // If we're already refreshing, don't try again
      if (isRefreshing) {
        return Promise.reject(error);
      }
      
      console.log('[API] Handling 401 Unauthorized for non-auth endpoint');
      return handleUnauthorizedError(error);
    }
    
    // Handle other error statuses
    if (error.response?.status) {
      const { status, data } = error.response;
      
      if (status === 404) {
        toast.error('The requested resource was not found.');
      } else if (status === 403) {
        toast.error('You do not have permission to perform this action.');
      } else if (data?.message && status !== 401) {
        // Only show message if it's not an auth error
        toast.error(data.message);
      }
    } else if (error.code === 'ECONNABORTED') {
      toast.error('Request timed out. Please check your connection.');
    } else if (!window.navigator.onLine) {
      toast.error('No internet connection. Please check your network settings.');
    } else {
      toast.error(error.message || 'An unexpected error occurred');
    }
    
    return Promise.reject(error);
  }
);

// ... (rest of the code remains the same)
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
