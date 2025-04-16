import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { BarChart2, TrendingUp, Package, CreditCard } from 'lucide-react';

const Dashboard = () => {
  const { data: salesByDate, isLoading: isLoadingSales, error: salesError } = useQuery({
    queryKey: ['salesByDate'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/reports/sales-by-date');
      return response.data;
    },
  });

  const { data: availableJewellery, isLoading: isLoadingJewellery, error: jewelleryError } = useQuery({
    queryKey: ['availableJewellery'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/reports/available-jewellery');
      return response.data;
    },
  });

  // Loading state
  if (isLoadingSales || isLoadingJewellery) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Error state
  if (salesError || jewelleryError) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {salesError?.message || jewelleryError?.message || 'Failed to load dashboard data'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-semibold text-gray-900">₹{salesByDate?.totalSales || 0}</p>
            </div>
            <BarChart2 className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today's Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{salesByDate?.todayOrders || 0}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Available Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{availableJewellery?.count || 0}</p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending payment</p>
              <p className="text-2xl font-semibold text-gray-900">₹{salesByDate?.pendingpayment || 0}</p>
            </div>
            <CreditCard className="h-8 w-8 text-red-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {salesByDate?.recentSales?.map((sale, index) => (
                  <tr key={`sale-${sale.date}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{sale.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Available jewellery</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {availableJewellery?.items?.map((item, index) => (
                  <tr key={`jewellery-${item.type}-${index}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
