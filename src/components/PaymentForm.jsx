import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const PaymentForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditMode = Boolean(id);

  const [formData, setFormData] = useState({
    Payment_id: 0,
    Order_id: 0,
    Amount: 0,
    Payment_date: new Date().toISOString().split('T')[0],
    Payment_time: new Date().toTimeString().split(' ')[0],
    Payment_mode: 'Cash'
  });

  // Get next payment ID
  const { data: nextIdData } = useQuery({
    queryKey: ['nextPaymentId'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/payment/next-id');
      return response.data;
    },
    enabled: !isEditMode,
  });

  // Fetch orders for dropdown
  const { data: orders } = useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/orders');
      return response.data;
    },
  });

  // Fetch payment data if editing
  const { data: payment, isLoading } = useQuery({
    queryKey: ['payment', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(`http://localhost:5000/api/payment/${id}`);
      return response.data;
    },
    enabled: isEditMode
  });

  // Set next payment ID when available
  useEffect(() => {
    if (nextIdData && !isEditMode) {
      setFormData(prev => ({ ...prev, Payment_id: nextIdData.nextId }));
    }
  }, [nextIdData, isEditMode]);

  // Update form data when payment data is loaded
  useEffect(() => {
    if (payment) {
      setFormData(payment);
    }
  }, [payment]);

  // Set default amount based on selected order
  useEffect(() => {
    if (formData.Order_id && orders) {
      const selectedOrder = orders.find(order => order.Order_id === formData.Order_id);
      if (selectedOrder) {
        setFormData(prev => ({ ...prev, Amount: selectedOrder.Total_price }));
      }
    }
  }, [formData.Order_id, orders]);

  const mutation = useMutation({
    mutationFn: async (data) => {
      if (isEditMode) {
        const response = await axios.put(`http://localhost:5000/api/payment/${id}`, data);
        return response.data;
      } else {
        const response = await axios.post('http://localhost:5000/api/payment', data);
        return response.data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment'] });
      toast.success(`Payment ${isEditMode ? 'updated' : 'added'} successfully`);
      navigate('/payment');
    },
    onError: (error) => {
      toast.error(`Failed to ${isEditMode ? 'update' : 'add'} payment: ${error.message}`);
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
      [name]: name === 'Amount' || name === 'Order_id' || name === 'Payment_id' 
        ? Number(value) 
        : value
    }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">
        {isEditMode ? 'Edit Payment' : 'Record New Payment'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Payment ID</label>
          <input
            type="number"
            name="Payment_id"
            value={formData.Payment_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
            readOnly
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Order</label>
          <select
            name="Order_id"
            value={formData.Order_id}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
            disabled={isEditMode}
          >
            <option value="">Select an order</option>
            {orders?.map(order => (
              <option key={order.Order_id} value={order.Order_id}>
                Order #{order.Order_id} - {order.Cust_name || 'Unknown'} (₹{order.Total_price})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Amount</label>
          <input
            type="number"
            name="Amount"
            value={formData.Amount}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Date</label>
          <input
            type="date"
            name="Payment_date"
            value={formData.Payment_date}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Time</label>
          <input
            type="time"
            name="Payment_time"
            value={formData.Payment_time}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Payment Method</label>
          <select
            name="Payment_mode"
            value={formData.Payment_mode}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          >
            <option value="Cash">Cash</option>
            <option value="Card">Card</option>
            <option value="UPI">UPI</option>
          </select>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => navigate('/payment')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : (isEditMode ? 'Update' : 'Record Payment')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;
