import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { X } from 'lucide-react';

const StaffForm = ({ staff, isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const isEditMode = Boolean(staff);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    full_name: '',
    email: '',
    phone: '',
    role: 'staff'
  });
  
  const [errors, setErrors] = useState({});
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Configure axios headers with token
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };
  
  // Set form data if editing existing staff
  useEffect(() => {
    if (staff) {
      setFormData({
        username: staff.Username || '',
        password: '',
        confirm_password: '',
        full_name: staff.Full_name || '',
        email: staff.Email || '',
        phone: staff.Phone || '',
        role: staff.Role || 'staff'
      });
    }
  }, [staff]);
  
  // Create/update staff mutation
  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditMode) {
        // When editing, we don't send the username and password fields
        const { username, password, confirm_password, ...updateData } = data;
        await axios.put(`http://localhost:5000/api/auth/staff/${staff.Staff_id}`, updateData, axiosConfig);
      } else {
        await axios.post('http://localhost:5000/api/auth/register', data, axiosConfig);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success(isEditMode ? 'Staff updated successfully' : 'Staff added successfully');
      onClose();
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to save staff member';
      toast.error(errorMessage);
      
      // Set field-specific errors if available
      if (error.response?.data?.error) {
        const errorMsg = error.response.data.error;
        if (errorMsg.includes('Username already exists')) {
          setErrors(prev => ({ ...prev, username: 'Username already exists' }));
        } else if (errorMsg.includes('Email already exists')) {
          setErrors(prev => ({ ...prev, email: 'Email already exists' }));
        } else {
          setErrors(prev => ({ ...prev, general: errorMsg }));
        }
      }
    }
  });
  
  // Password change mutation (only for edit mode)
  const passwordMutation = useMutation({
    mutationFn: async (data) => {
      await axios.put(`http://localhost:5000/api/auth/staff/${staff.Staff_id}/change-password`, data, axiosConfig);
    },
    onSuccess: () => {
      toast.success('Password changed successfully');
      setFormData(prev => ({ ...prev, password: '', confirm_password: '' }));
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to change password';
      toast.error(errorMessage);
      setErrors(prev => ({ ...prev, password: errorMessage }));
    }
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (!isEditMode) {
      // Username validation (only for new staff)
      if (!formData.username.trim()) {
        newErrors.username = 'Username is required';
      } else if (formData.username.length < 3) {
        newErrors.username = 'Username must be at least 3 characters';
      }
      
      // Password validation (only for new staff)
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }
      
      if (formData.password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }
    
    // Common validations for both create and update
    if (!formData.full_name.trim()) {
      newErrors.full_name = 'Full name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (formData.phone && !/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validatePasswordChange = () => {
    const newErrors = {};
    
    if (!formData.password) {
      newErrors.password = 'New password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      mutation.mutate(formData);
    }
  };
  
  const handlePasswordChange = (e) => {
    e.preventDefault();
    
    if (validatePasswordChange()) {
      passwordMutation.mutate({
        new_password: formData.password
      });
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditMode ? 'Edit Staff Member' : 'Add New Staff Member'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-300 text-red-700 rounded-md">
            {errors.general}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {!isEditMode && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    errors.username ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isEditMode}
                />
                {errors.username && (
                  <p className="mt-1 text-sm text-red-600">{errors.username}</p>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Full Name</label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.full_name ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Phone</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                  errors.phone ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            {!isEditMode && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                      errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                  )}
                </div>
              </>
            )}
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="mr-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </form>
        
        {isEditMode && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h4 className="text-md font-medium text-gray-900 mb-4">Change Password</h4>
            <form onSubmit={handlePasswordChange}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    name="confirm_password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                      errors.confirm_password ? 'border-red-300' : 'border-gray-300'
                    }`}
                  />
                  {errors.confirm_password && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirm_password}</p>
                  )}
                </div>
                
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    disabled={passwordMutation.isPending}
                  >
                    {passwordMutation.isPending ? 'Changing...' : 'Change Password'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffForm;
