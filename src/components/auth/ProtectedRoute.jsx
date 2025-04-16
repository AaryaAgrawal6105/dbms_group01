import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// Component to protect routes that require authentication
const ProtectedRoute = ({ requireAdmin = false }) => {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If admin access is required but user is not admin, redirect to dashboard
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and passes role check, render the protected content
  return <Outlet />;
};

export default ProtectedRoute;
