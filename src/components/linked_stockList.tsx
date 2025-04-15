import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle, Package, Edit2, Trash2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface LinkedStockItem {
  Jewellery_id: number;
  Model_No: string;
  Unit_id: string;
  Weight: number;
  Size: string;
  Status: string;
  Sold_at: string | null;
  Type?: string;
  Description?: string;
}

function LinkedStockList() {
  const queryClient = useQueryClient();

  const { data: linkedStockItems, isLoading, error } = useQuery<LinkedStockItem[]>({
    queryKey: ['linked_stock'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/linked_stock');
      return response.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (keys: { jewellery_id: number, model_no: string, unit_id: string }) => {
      await axios.delete(`http://localhost:5000/api/linked_stock/${keys.jewellery_id}/${keys.model_no}/${keys.unit_id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked_stock'] });
      toast.success('Linked stock item deleted successfully');
    },
    onError: (error: any) => {
      toast.error(`Failed to delete linked stock item: ${error.message}`);
    },
  });

  const handleDelete = (jewellery_id: number, model_no: string, unit_id: string) => {
    if (window.confirm('Are you sure you want to delete this linked stock item?')) {
      deleteMutation.mutate({ jewellery_id, model_no, unit_id });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <p className="text-red-800">Error loading linked stock items. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Linked Stock Management</h1>
        <Link
          to="/add-linked-stock"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <PlusCircle className="w-5 h-5 mr-2" />
          Add Linked Stock
        </Link>
      </div>

      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Jewellery Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Weight
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Size
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {linkedStockItems?.map((item) => (
              <tr key={`${item.Jewellery_id}-${item.Model_No}-${item.Unit_id}`} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Package className="w-5 h-5 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">{item.Type}</div>
                      <div className="text-sm text-gray-500">{item.Description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.Model_No}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.Unit_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.Weight}g
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {item.Size}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${item.Status === 'Available' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {item.Status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex space-x-2">
                    <Link
                      to={`/edit-linked-stock/${item.Jewellery_id}/${item.Model_No}/${item.Unit_id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="h-5 w-5" />
                    </Link>
                    <button
                      onClick={() => handleDelete(item.Jewellery_id, item.Model_No, item.Unit_id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!linkedStockItems?.length && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  No linked stock items found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default LinkedStockList;