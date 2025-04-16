import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { Users, ShoppingBag, CreditCard, Package, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { currentUser, isAdmin } = useAuth();
  const token = localStorage.getItem('token');
  
  // Configure axios headers with token
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // Fetch dashboard data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/reports/dashboard', axiosConfig);
      return response.data;
    },
    // Handle errors gracefully
    onError: (error) => {
      console.error('Error fetching dashboard data:', error);
      return {
        customerCount: 0,
        orderCount: 0,
        totalSales: 0,
        recentOrders: []
      };
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Default values if data is not available
  const {
    customerCount = 0,
    orderCount = 0,
    totalSales = 0,
    recentOrders = [],
    stockCount = 0
  } = dashboardData || {};

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {currentUser?.fullName || currentUser?.Username}!
        </h1>
        <p className="text-gray-600">
          {currentUser?.role === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'} | {new Date().toLocaleDateString()}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex items-start space-x-4">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Customers</p>
            <h3 className="text-2xl font-bold text-gray-800">{customerCount}</h3>
            <Link to="/customers" className="text-blue-600 text-sm hover:underline">View all</Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex items-start space-x-4">
          <div className="p-3 rounded-full bg-green-100 text-green-600">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Orders</p>
            <h3 className="text-2xl font-bold text-gray-800">{orderCount}</h3>
            <Link to="/orders" className="text-green-600 text-sm hover:underline">View all</Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex items-start space-x-4">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Total Sales</p>
            <h3 className="text-2xl font-bold text-gray-800">₹{totalSales.toLocaleString()}</h3>
            <Link to="/payment" className="text-purple-600 text-sm hover:underline">View payments</Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 flex items-start space-x-4">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">Stock Items</p>
            <h3 className="text-2xl font-bold text-gray-800">{stockCount}</h3>
            <Link to="/linked-stock" className="text-yellow-600 text-sm hover:underline">View inventory</Link>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Recent Orders</h2>
          <Link to="/orders" className="text-indigo-600 hover:text-indigo-800 text-sm font-medium">View All</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <tr key={order.Order_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{order.Order_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{order.Cust_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.Order_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{Number(order.Total_price).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        order.Payment_id ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {order.Payment_id ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                    No recent orders found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sales Trend - Only visible to admin */}
      {isAdmin() && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">Sales Trend</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-center h-64 bg-gray-50 rounded">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                <p className="text-gray-600">
                  View detailed sales reports and analytics
                </p>
                <Link
                  to="/reports"
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  View Reports
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
