import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { Save, ArrowLeft } from 'lucide-react';
import axios from 'axios';

function LinkedStockForm() {
  const { jewellery_id, model_no, unit_id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(jewellery_id && model_no && unit_id);

  const [formData, setFormData] = useState({
    Jewellery_id: 0,
    Model_No: '',
    Unit_id: '',
    Weight: 0,
    Size: '',
    Status: 'Available',
    Sold_at: 0,
    Quantity: 1
  });

  // Fetch jewellery for dropdown
  const { data: jewelleryItems } = useQuery({
    queryKey: ['jewellery'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/jewellery');
      return response.data;
    },
  });

  // Fetch linked stock data if editing
  const { data: linkedStockData, isLoading } = useQuery({
    queryKey: ['linked_stock', jewellery_id, model_no, unit_id],
    queryFn: async () => {
      if (!isEditMode) return null;
      const response = await axios.get(`http://localhost:5000/api/linked_stock/${jewellery_id}/${model_no}/${unit_id}`);
      return response.data;
    },
    enabled: isEditMode
  });

  // Update form data when linked stock data is loaded
  useEffect(() => {
    if (linkedStockData) {
      setFormData(linkedStockData);
    }
  }, [linkedStockData]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditMode) {
        const response = await axios.put(
          `http://localhost:5000/api/linked_stock/${jewellery_id}/${model_no}/${unit_id}`,
          data
        );
        return response.data;
      } else {
        const response = await axios.post('http://localhost:5000/api/linked_stock', {
          jewellery_id: data.Jewellery_id,
          model_no: data.Model_No,
          unit_id: data.Unit_id,
          weight: data.Weight,
          size: data.Size,
          status: data.Status,
          sold_at: data.Sold_at,
          quantity: data.Quantity
        });
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['linked_stock'] });
      toast.success(`Linked stock ${isEditMode ? 'updated' : 'created'} successfully`);
      navigate('/linked-stock');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    }
  });

  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? Number(value) : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">
          {isEditMode ? 'Edit Linked Stock' : 'Add New Linked Stock'}
        </h2>
        <button
          onClick={() => navigate('/linked-stock')}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          Back to Linked Stock List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="Jewellery_id" className="block text-sm font-medium text-gray-700">
            Jewellery
          </label>
          <select
            id="Jewellery_id"
            name="Jewellery_id"
            value={formData.Jewellery_id}
            onChange={handleChange}
            required
            disabled={isEditMode}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="">Select a jewellery item</option>
            {jewelleryItems?.map((item) => (
              <option key={item.Jewellery_id} value={item.Jewellery_id}>
                {item.Type} - {item.Description}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="Model_No" className="block text-sm font-medium text-gray-700">
            Model Number
          </label>
          <input
            type="text"
            id="Model_No"
            name="Model_No"
            value={formData.Model_No}
            onChange={handleChange}
            required
            disabled={isEditMode}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="Unit_id" className="block text-sm font-medium text-gray-700">
            Unit ID
          </label>
          <input
            type="text"
            id="Unit_id"
            name="Unit_id"
            value={formData.Unit_id}
            onChange={handleChange}
            required
            disabled={isEditMode}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="Weight" className="block text-sm font-medium text-gray-700">
            Weight (g)
          </label>
          <input
            type="number"
            id="Weight"
            name="Weight"
            value={formData.Weight}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="Size" className="block text-sm font-medium text-gray-700">
            Size
          </label>
          <input
            type="text"
            id="Size"
            name="Size"
            value={formData.Size}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="Quantity" className="block text-sm font-medium text-gray-700">
            Quantity
          </label>
          <input
            type="number"
            id="Quantity"
            name="Quantity"
            value={formData.Quantity}
            onChange={handleChange}
            required
            min="1"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="Sold_at" className="block text-sm font-medium text-gray-700">
            Price (₹)
          </label>
          <input
            type="number"
            id="Sold_at"
            name="Sold_at"
            value={formData.Sold_at}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="Status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            id="Status"
            name="Status"
            value={formData.Status}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="Available">Available</option>
            <option value="Sold">Sold</option>
            <option value="Reserved">Reserved</option>
            <option value="Damaged">Damaged</option>
          </select>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={mutation.isPending}
          >
            <Save className="w-5 h-5 mr-2" />
            {mutation.isPending ? 'Saving...' : 'Save Linked Stock'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default LinkedStockForm;
