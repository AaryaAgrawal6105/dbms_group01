import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';

interface Jewellery {
  Jewellery_id: string;
  Type: string;
  Description: string;
  HSN: string;
  Quantity: number;
}

function JewelleryList() {
  const { data: jewellery, isLoading, error } = useQuery<Jewellery[]>({
    queryKey: ['jewellery'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5000/api/jewellery');
      if (!response.ok) {
        throw new Error('Failed to fetch jewellery');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        Error loading jewellery: {error instanceof Error ? error.message : 'Unknown error'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Jewellery Inventory</h1>
        <Link
          to="/add-jewellery"
          className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Add New Jewellery
        </Link>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">HSN</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {jewellery?.map((item) => (
              <tr key={item.Jewellery_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{item.Type}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.HSN}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.Quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Link
                    to={`/edit-jewellery/${item.Jewellery_id}`}
                    className="text-blue-600 hover:text-blue-900 mr-4"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default JewelleryList;