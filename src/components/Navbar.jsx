import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Diamond, Users, ShoppingBag, CreditCard, BarChart2, Package, LogOut, User, UserCog } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const { isAuthenticated, currentUser, logout, isAdmin } = useAuth();

  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'bg-purple-700' : '';
  };

  if (!isAuthenticated) {
    return null; // Don't render navbar if not authenticated
  }

  return (
    <nav className="bg-purple-600 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <Diamond className="h-8 w-8 text-white" />
            <span className="text-xl font-bold text-white">Jewellery Management</span>
          </Link>
          <div className="flex space-x-4">
            <Link
              to="/dashboard"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/dashboard')}`}
            >
              <BarChart2 className="h-4 w-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/customers"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/customers')}`}
            >
              <Users className="h-4 w-4" />
              <span>Customers</span>
            </Link>
            <Link
              to="/orders"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/orders')}`}
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Orders</span>
            </Link>
            <Link
              to="/jewellery"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/jewellery')}`}
            >
              <Diamond className="h-4 w-4" />
              <span>Jewellery</span>
            </Link>
            <Link
              to="/payment"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/payment')}`}
            >
              <CreditCard className="h-4 w-4" />
              <span>Payment</span>
            </Link>
            <Link
              to="/linked-stock"
              className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/linked-stock')}`}
            >
              <Package className="h-4 w-4" />
              <span>Stock</span>
            </Link>
            
            {/* Only show Reports link to admin users */}
            {isAdmin() && (
              <Link
                to="/reports"
                className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/reports')}`}
              >
                <BarChart2 className="h-4 w-4" />
                <span>Reports</span>
              </Link>
            )}
            
            {/* Only show Staff Management link to admin users */}
            {isAdmin() && (
              <Link
                to="/staff"
                className={`flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors ${isActive('/staff')}`}
              >
                <UserCog className="h-4 w-4" />
                <span>Staff</span>
              </Link>
            )}
          </div>
          
          {/* User profile and logout */}
          <div className="flex items-center space-x-4">
            <div className="text-white text-sm">
              <span className="font-medium">{currentUser?.fullName || currentUser?.Username}</span>
              <span className="ml-1 text-xs bg-indigo-800 px-2 py-1 rounded-full">
                {currentUser?.role === 'admin' ? 'Admin' : 'Staff'}
              </span>
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-1 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
