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

  // Add state for field-specific errors
  const [errors, setErrors] = useState({
    Cust_name: '',
    Phone_no: '',
    Email: '',
    general: ''
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

  // Clear field error when user starts typing in that field
  const clearError = (field) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const mutation = useMutation({
    mutationFn: async (data) => {
      try {
        if (isEditMode) {
          const response = await axios.put(`http://localhost:5000/api/customers/${id}`, data);
          return response.data;
        } else {
          const response = await axios.post('http://localhost:5000/api/customers', data);
          return response.data;
        }
      } catch (error) {
        // Handle API errors with specific messages
        if (error.response) {
          // The server responded with a status code outside the 2xx range
          if (error.response.status === 400) {
            // Extract the error message from the response
            const errorMessage = error.response.data.error || 'Validation error';
            
            // Set field-specific errors
            if (errorMessage.includes('Email already exists')) {
              setErrors(prev => ({ ...prev, Email: 'This email is already in use' }));
            } else if (errorMessage.includes('Phone number already exists')) {
              setErrors(prev => ({ ...prev, Phone_no: 'This phone number is already in use' }));
            } else {
              setErrors(prev => ({ ...prev, general: errorMessage }));
            }
            
            throw new Error(errorMessage);
          }
        }
        // For other errors, throw a generic message
        throw new Error('Failed to save customer. Please try again later.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success(isEditMode ? 'Customer updated successfully' : 'Customer added successfully');
      navigate('/customers');
    },
    onError: (error) => {
      // Display the error message in a user-friendly way
      toast.error(error.message);
    },
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { Cust_name: '', Phone_no: '', Email: '', general: '' };
    
    // Validate name
    if (!formData.Cust_name.trim()) {
      newErrors.Cust_name = 'Name is required';
      isValid = false;
    }
    
    // Validate phone number
    if (!formData.Phone_no.trim()) {
      newErrors.Phone_no = 'Phone number is required';
      isValid = false;
    } else if (!/^\d{10}$/.test(formData.Phone_no.trim())) {
      newErrors.Phone_no = 'Please enter a valid 10-digit phone number';
      isValid = false;
    }
    
    // Validate email
    if (!formData.Email.trim()) {
      newErrors.Email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.Email.trim())) {
      newErrors.Email = 'Please enter a valid email address';
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Reset all errors
    setErrors({ Cust_name: '', Phone_no: '', Email: '', general: '' });
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    mutation.mutate(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'Cust_id' ? Number(value) : value
    }));
    
    // Clear error for the field being edited
    clearError(name);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {isEditMode ? 'Edit Customer' : 'Add New Customer'}
      </h2>
      
      {errors.general && (
        <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md">
          {errors.general}
        </div>
      )}
      
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
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
              errors.Cust_name ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {errors.Cust_name && (
            <p className="mt-1 text-sm text-red-600">{errors.Cust_name}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input
            type="tel"
            name="Phone_no"
            value={formData.Phone_no}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
              errors.Phone_no ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {errors.Phone_no && (
            <p className="mt-1 text-sm text-red-600">{errors.Phone_no}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="Email"
            value={formData.Email}
            onChange={handleChange}
            className={`mt-1 block w-full rounded-md shadow-sm focus:border-purple-500 focus:ring-purple-500 ${
              errors.Email ? 'border-red-300' : 'border-gray-300'
            }`}
            required
          />
          {errors.Email && (
            <p className="mt-1 text-sm text-red-600">{errors.Email}</p>
          )}
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
