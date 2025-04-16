import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const CustomerForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);
  
  const [formData, setFormData] = useState({
    Cust_id: 0,
    Cust_name: '',
    Phone_no: '',
    Email: '',
  });

  // Get next customer ID
  const { data: nextIdData } = useQuery({
    queryKey: ['nextCustomerId'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/customers/next-id');
      return response.data;
    },
    enabled: !isEditMode,
  });

  // Fetch customer data if editing
  const { data: customer } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => {
      if (id) {
        const response = await axios.get(`http://localhost:5000/api/customers/${id}`);
        return response.data;
      }
      return null;
    },
    enabled: !!id,
  });

  // Set next customer ID when available
  useEffect(() => {
    if (nextIdData && !isEditMode) {
      setFormData(prev => ({ ...prev, Cust_id: nextIdData.nextId }));
    }
  }, [nextIdData, isEditMode]);

  // Update form data when customer data is loaded
  useEffect(() => {
    if (customer) {
      setFormData(customer);
    }
  }, [customer]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditMode) {
        const response = await axios.put(`http://localhost:5000/api/customers/${id}`, data);
        return response.data;
      } else {
        const response = await axios.post('http://localhost:5000/api/customers', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEditMode ? 'Customer updated successfully' : 'Customer added successfully');
      navigate('/customers');
    },
    onError: (error) => {
      toast.error(`Failed to save customer: ${error.message}`);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    try {
      // Validate form data
      if (!formData.Cust_name || !formData.Phone_no || !formData.Email) {
        toast.error('Please fill in all required fields');
        return;
      }
      
      mutation.mutate(formData);
    } catch (error) {
      toast.error(`An error occurred: ${error.message}`);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'Cust_id' ? Number(value) : value
    }));
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {isEditMode ? 'Edit Customer' : 'Add New Customer'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Customer ID</label>
          <input
            type="number"
            name="Cust_id"
            value={formData.Cust_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
            readOnly
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="Cust_name"
            value={formData.Cust_name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            name="Phone_no"
            value={formData.Phone_no}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="Email"
            value={formData.Email}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
            required
          />
        </div>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : (isEditMode ? 'Update' : 'Add')} Customer
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
