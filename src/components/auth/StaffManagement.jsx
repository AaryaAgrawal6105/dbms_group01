import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Edit2, Trash2, UserPlus, User } from 'lucide-react';
import StaffForm from './StaffForm';

const StaffManagement = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentStaff, setCurrentStaff] = useState(null);
  
  // Get token from localStorage
  const token = localStorage.getItem('token');
  
  // Configure axios headers with token
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  // Fetch staff list
  const { data: staffList, isLoading, error } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/auth/staff', axiosConfig);
      return response.data;
    }
  });

  // Delete staff mutation
  const deleteMutation = useMutation({
    mutationFn: async (staffId) => {
      await axios.delete(`http://localhost:5000/api/auth/staff/${staffId}`, axiosConfig);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      toast.success('Staff member deleted successfully');
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.error || 'Failed to delete staff member';
      toast.error(errorMessage);
    }
  });

  const handleEdit = (staff) => {
    setCurrentStaff(staff);
    setIsModalOpen(true);
  };

  const handleDelete = (staffId) => {
    if (window.confirm('Are you sure you want to delete this staff member?')) {
      deleteMutation.mutate(staffId);
    }
  };

  const handleAddNew = () => {
    setCurrentStaff(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentStaff(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
        Error loading staff members: {error.message}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-800">Staff Management</h2>
        <button
          onClick={handleAddNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition-colors flex items-center"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Add New Staff
        </button>
      </div>
      
      <div className="border-t border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Username
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Last Login
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staffList && staffList.map((staff) => (
              <tr key={staff.Staff_id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">{staff.Full_name}</div>
                      <div className="text-sm text-gray-500">ID: {staff.Staff_id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {staff.Username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {staff.Email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    staff.Role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {staff.Role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {staff.Last_login ? new Date(staff.Last_login).toLocaleString() : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(staff)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      <Edit2 className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(staff.Staff_id)}
                      className="text-red-600 hover:text-red-900"
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {isModalOpen && (
        <StaffForm 
          staff={currentStaff} 
          isOpen={isModalOpen} 
          onClose={closeModal} 
        />
      )}
    </div>
  );
};

export default StaffManagement;
