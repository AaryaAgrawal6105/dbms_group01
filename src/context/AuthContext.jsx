import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';

// Create context
const AuthContext = createContext();

// Custom hook to use the auth context
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Configure axios defaults
  axios.defaults.baseURL = 'http://localhost:5000';
  
  // Add request interceptor to include token in all requests
  useEffect(() => {
    const interceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    return () => {
      axios.interceptors.request.eject(interceptor);
    };
  }, []);

  // Check if user is logged in on initial load
  const checkLoggedIn = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (!token || !userStr) {
        setIsAuthenticated(false);
        setCurrentUser(null);
        setIsLoading(false);
        
        // Only redirect to login if not already on login page and not loading
        if (location.pathname !== '/login' && !isLoading) {
          navigate('/login', { replace: true });
        }
        return;
      }
      
      // Parse user data
      const user = JSON.parse(userStr);
      
      // Verify token with backend
      try {
        const response = await axios.get('/api/auth/me');
        
        // Update user data with latest from server
        setCurrentUser({
          ...user,
          ...response.data
        });
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Token verification error:', error);
        // Token is invalid or expired
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setIsAuthenticated(false);
        setCurrentUser(null);
        
        // Only redirect to login if not already on login page
        if (location.pathname !== '/login') {
          navigate('/login', { replace: true });
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, location.pathname, isLoading]);
  
  useEffect(() => {
    checkLoggedIn();
  }, [checkLoggedIn]);

  // Login function
  const login = async (username, password) => {
    try {
      console.log('Attempting login with:', { username, password });
      const response = await axios.post('/api/auth/login', {
        username,
        password
      });
      
      console.log('Login response:', response.data);
      const { token, ...userData } = response.data;
      
      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id: userData.Staff_id,
        username: userData.Username,
        role: userData.Role,
        fullName: userData.Full_name
      }));
      
      setCurrentUser(userData);
      setIsAuthenticated(true);
      
      // Show success message
      toast.success('Login successful!');
      
      // Navigate to dashboard after successful login
      navigate('/dashboard', { replace: true });
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Show error message
      const errorMessage = error.response?.data?.error || 'Login failed. Please check your credentials.';
      toast.error(errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  // Check if user has admin role
  const isAdmin = () => {
    return currentUser?.role === 'admin';
  };

  // Value object to be provided to consumers
  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
