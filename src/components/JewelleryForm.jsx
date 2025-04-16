import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';

function JewelleryForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    jewellery_id: '',
    type: '',
    description: '',
    hsn: '',
    quantity: 0
  });

  const { isLoading: isLoadingJewellery, data: jewelleryData } = useQuery({
    queryKey: ['jewellery', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await fetch(`http://localhost:5000/api/jewellery/${id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch jewellery');
      }
      return response.json();
    },
    enabled: isEditMode
  });

  // Update form data when jewellery data is loaded
  useEffect(() => {
    if (jewelleryData) {
      setFormData({
        jewellery_id: jewelleryData.Jewellery_id,
        type: jewelleryData.Type,
        description: jewelleryData.Description,
        hsn: jewelleryData.HSN,
        quantity: jewelleryData.Quantity
      });
    }
  }, [jewelleryData]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      const url = isEditMode ? `http://localhost:5000/api/jewellery/${id}` : 'http://localhost:5000/api/jewellery';
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save jewellery');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jewellery'] });
      toast.success(isEditMode ? 'Jewellery updated successfully' : 'Jewellery added successfully');
      navigate('/jewellery');
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'quantity' ? parseFloat(value) || 0 : value
    }));
  };

  if (isLoadingJewellery) {
    return <div className="flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold mb-6">{isEditMode ? 'Edit Jewellery' : 'Add New Jewellery'}</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="jewellery_id" className="block text-sm font-medium text-gray-700">Jewellery ID</label>
          <input
            type="text"
            id="jewellery_id"
            name="jewellery_id"
            value={formData.jewellery_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">Type</label>
          <input
            type="text"
            id="type"
            name="type"
            value={formData.type}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="hsn" className="block text-sm font-medium text-gray-700">HSN</label>
          <input
            type="text"
            id="hsn"
            name="hsn"
            value={formData.hsn}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Quantity</label>
          <input
            type="number"
            id="quantity"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            step="1"
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/jewellery')}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            {mutation.isPending ? 'Saving...' : isEditMode ? 'Update Jewellery' : 'Add Jewellery'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default JewelleryForm;
