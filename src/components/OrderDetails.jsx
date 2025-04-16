import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { X, Package, ShoppingBag } from 'lucide-react';

const OrderDetails = ({ orderId, onClose }) => {
  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const response = await axios.get(`http://localhost:5000/api/orders/${orderId}`);
      return response.data;
    },
    enabled: !!orderId,
  });

  if (!orderId) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <ShoppingBag className="mr-2 h-5 w-5 text-purple-600" />
            Order Details {orderId && `#${orderId}`}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              Error loading order details
            </div>
          ) : order ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Order Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-gray-500">Order ID:</div>
                    <div className="text-sm font-medium">{order.Order_id}</div>
                    
                    <div className="text-sm text-gray-500">Date:</div>
                    <div className="text-sm font-medium">
                      {new Date(order.Order_date).toLocaleDateString()}
                    </div>
                    
                    <div className="text-sm text-gray-500">Total Price:</div>
                    <div className="text-sm font-medium">₹{Number(order.Total_price).toFixed(2)}</div>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Information</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-sm text-gray-500">Customer ID:</div>
                    <div className="text-sm font-medium">{order.Cust_id}</div>
                    
                    <div className="text-sm text-gray-500">Name:</div>
                    <div className="text-sm font-medium">{order.Cust_name || 'Unknown'}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Order Items</h3>
                {order.details && order.details.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Item
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Model
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unit ID
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Quantity
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {order.details.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <Package className="h-5 w-5 text-gray-400 mr-3" />
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {item.Type}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {item.Description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.Model_No || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.Unit_id || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {item.Quantity}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              ₹{Number(item.Amount).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan="4" className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                            Total:
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            ₹{Number(order.Total_price).toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
                    No items found for this order.
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
