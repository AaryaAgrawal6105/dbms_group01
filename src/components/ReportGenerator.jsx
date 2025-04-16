import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Download, Printer, FileText } from 'lucide-react';
import { toast } from 'react-hot-toast';

const ReportGenerator = ({ isOpen, onClose }) => {
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('week');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Fetch sales data
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['salesReport', dateRange, startDate, endDate],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/reports/sales-by-date');
      return response.data;
    },
    enabled: isOpen && reportType === 'sales',
  });

  // Fetch jewellery data
  const { data: jewelleryData, isLoading: jewelleryLoading } = useQuery({
    queryKey: ['jewelleryReport'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/reports/available-jewellery');
      return response.data;
    },
    enabled: isOpen && reportType === 'inventory',
  });

  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['dashboardReport'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/reports/dashboard');
      return response.data;
    },
    enabled: isOpen && reportType === 'summary',
  });

  const isLoading = salesLoading || jewelleryLoading || dashboardLoading;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a printable version of the report
    const reportContent = document.getElementById('report-content').innerHTML;
    const reportTitle = getReportTitle();
    
    // Create a blob with the report content
    const blob = new Blob([`
      <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1, h2 { color: #333; }
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          ${reportContent}
        </body>
      </html>
    `], { type: 'text/html' });
    
    // Create a download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportTitle.replace(/\s+/g, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('Report downloaded successfully');
  };

  const getReportTitle = () => {
    switch (reportType) {
      case 'sales':
        return 'Sales Report';
      case 'inventory':
        return 'Inventory Report';
      case 'summary':
        return 'Summary Report';
      default:
        return 'Report';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-auto">
        <div className="p-6 border-b print:hidden">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">{getReportTitle()}</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="sales">Sales Report</option>
                <option value="inventory">Inventory Report</option>
                <option value="summary">Summary Report</option>
              </select>
            </div>

            {reportType === 'sales' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>

                {dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                      />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-4 flex space-x-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </button>
          </div>
        </div>

        <div className="p-6" id="report-content">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              {reportType === 'sales' && salesData && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Sales Report</h3>
                  <p className="mb-4">
                    <strong>Total Sales:</strong> ₹{salesData.totalSales || 0}
                    <br />
                    <strong>Today's Orders:</strong> {salesData.todayOrders || 0}
                    <br />
                    <strong>Pending Payments:</strong> ₹{salesData.pendingpayment || 0}
                  </p>

                  <h4 className="text-md font-semibold mb-2">Sales by Date</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orders</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Sales</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {salesData.recentSales?.map((sale, index) => (
                          <tr key={`sale-${sale.date}-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.date}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{sale.order_count}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{sale.total_sales}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportType === 'inventory' && jewelleryData && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Inventory Report</h3>
                  <p className="mb-4">
                    <strong>Total Jewellery Items:</strong> {jewelleryData.totalCount || 0}
                  </p>

                  <h4 className="text-md font-semibold mb-2">Available Jewellery</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantity</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {jewelleryData.jewellery?.map((item, index) => (
                          <tr key={`jewellery-${item.Jewellery_id}-${index}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Type}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Description}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.Quantity}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {reportType === 'summary' && dashboardData && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Summary Report</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="border rounded-lg p-4">
                      <h4 className="text-md font-semibold mb-2">Sales Summary</h4>
                      <p>
                        <strong>Total Sales:</strong> ₹{dashboardData.totalSales || 0}
                        <br />
                        <strong>Total Orders:</strong> {dashboardData.orderCount || 0}
                      </p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <h4 className="text-md font-semibold mb-2">Inventory Summary</h4>
                      <p>
                        <strong>Total Stock Items:</strong> {dashboardData.stockCount || 0}
                        <br />
                        <strong>Total Customers:</strong> {dashboardData.customerCount || 0}
                      </p>
                    </div>
                  </div>

                  <h4 className="text-md font-semibold mb-2">Recent Orders</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {dashboardData.recentOrders?.map((order) => (
                          <tr key={`order-${order.Order_id}`}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.Order_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(order.Order_date).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.Cust_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{order.Total_price}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {order.Payment_id ? 'Paid' : 'Pending'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;
