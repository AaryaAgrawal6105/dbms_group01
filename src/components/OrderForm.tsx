import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';

interface OrderFormData {
  Order_id: number;
  Cust_id: number;
  Order_date: string;
  Total_price: number;
  details?: OrderDetailItem[];
}

interface OrderDetailItem {
  Jewellery_id: number;
  Quantity: number;
  Amount: number;
}

interface Customer {
  Cust_id: number;
  Cust_name: string;
}

interface Jewellery {
  Jewellery_id: number;
  Type: string;
  Description: string;
  HSN: string;
  Quantity: number;
}

const OrderForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  // Form state
  const [formData, setFormData] = useState<OrderFormData>({
    Order_id: 0,
    Cust_id: 0,
    Order_date: new Date().toISOString().split('T')[0],
    Total_price: 0,
    details: []
  });

  // Get next order ID
  const { data: nextIdData } = useQuery({
    queryKey: ['nextOrderId'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/orders/next-id');
      return response.data;
    },
    enabled: !isEditing,
  });

  // Fetch customers for dropdown
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/customers');
      return response.data;
    },
  });

  // Fetch jewellery for dropdown
  const { data: jewellery } = useQuery({
    queryKey: ['jewellery'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/jewellery');
      return response.data;
    },
  });

  // Fetch order data if editing
  const { data: orderData, isLoading: isLoadingOrder } = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) return null;
      const response = await axios.get(`http://localhost:5000/api/orders/${id}`);
      return response.data;
    },
    enabled: isEditing,
  });

  // Set next order ID when available
  useEffect(() => {
    if (nextIdData && !isEditing) {
      setFormData(prev => ({ ...prev, Order_id: nextIdData.nextId }));
    }
  }, [nextIdData, isEditing]);

  // Update form data when order data is loaded
  useEffect(() => {
    if (orderData) {
      setFormData(orderData);
    }
  }, [orderData]);

  // Handle form submission
  const mutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      const url = isEditing ? `http://localhost:5000/api/orders/${id}` : 'http://localhost:5000/api/orders';
      const method = isEditing ? 'PUT' : 'POST';
      
      const response = await axios({
        method,
        url,
        data,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success(isEditing ? 'Order updated successfully' : 'Order created successfully');
      navigate('/orders');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to save order');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'Total_price' || name === 'Cust_id' || name === 'Order_id' 
        ? Number(value) 
        : value
    }));
  };

  // Add a new detail item
  const addDetailItem = () => {
    setFormData(prev => ({
      ...prev,
      details: [
        ...(prev.details || []),
        { Jewellery_id: 0, Quantity: 1, Amount: 0 }
      ]
    }));
  };

  // Update a detail item
  const updateDetailItem = (index: number, field: keyof OrderDetailItem, value: any) => {
    const updatedDetails = [...(formData.details || [])];
    updatedDetails[index] = {
      ...updatedDetails[index],
      [field]: field === 'Jewellery_id' || field === 'Quantity' || field === 'Amount' 
        ? Number(value) 
        : value
    };

    // If jewellery item or quantity changed, update the amount
    if (field === 'Jewellery_id' || field === 'Quantity') {
      const jewelleryItem = jewellery?.find((j: Jewellery) => j.Jewellery_id === Number(value));
      if (jewelleryItem && field === 'Jewellery_id') {
        // Set a default price based on jewellery type
        const basePrice = jewelleryItem.Type.includes('Gold') ? 5000 :
                         jewelleryItem.Type.includes('Silver') ? 2000 :
                         jewelleryItem.Type.includes('Diamond') ? 10000 : 1000;
        updatedDetails[index].Amount = basePrice * updatedDetails[index].Quantity;
      } else if (field === 'Quantity') {
        const jewelleryId = updatedDetails[index].Jewellery_id;
        const jewelleryItem = jewellery?.find((j: Jewellery) => j.Jewellery_id === jewelleryId);
        if (jewelleryItem) {
          const basePrice = jewelleryItem.Type.includes('Gold') ? 5000 :
                          jewelleryItem.Type.includes('Silver') ? 2000 :
                          jewelleryItem.Type.includes('Diamond') ? 10000 : 1000;
          updatedDetails[index].Amount = basePrice * Number(value);
        }
      }
    }

    // Update total price
    const totalPrice = updatedDetails.reduce((sum, item) => sum + item.Amount, 0);

    setFormData(prev => ({
      ...prev,
      details: updatedDetails,
      Total_price: totalPrice
    }));
  };

  // Remove a detail item
  const removeDetailItem = (index: number) => {
    const updatedDetails = [...(formData.details || [])];
    updatedDetails.splice(index, 1);
    
    // Update total price
    const totalPrice = updatedDetails.reduce((sum, item) => sum + item.Amount, 0);

    setFormData(prev => ({
      ...prev,
      details: updatedDetails,
      Total_price: totalPrice
    }));
  };

  if (isEditing && isLoadingOrder) {
    return <div className="flex justify-center items-center">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Order' : 'Create New Order'}
      </h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Order ID</label>
            <input
              type="number"
              name="Order_id"
              value={formData.Order_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              readOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <select
              name="Cust_id"
              value={formData.Cust_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            >
              <option value="">Select a customer</option>
              {customers?.map((customer: Customer) => (
                <option key={customer.Cust_id} value={customer.Cust_id}>
                  {customer.Cust_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Order Date</label>
            <input
              type="date"
              name="Order_date"
              value={formData.Order_date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Total Amount</label>
            <input
              type="number"
              name="Total_price"
              value={formData.Total_price}
              onChange={handleChange}
              min="0"
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
              readOnly
            />
          </div>
        </div>

        <div className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Order Details</h3>
            <button
              type="button"
              onClick={addDetailItem}
              className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Add Item
            </button>
          </div>

          {formData.details && formData.details.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jewellery</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.details.map((detail, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={detail.Jewellery_id}
                          onChange={(e) => updateDetailItem(index, 'Jewellery_id', e.target.value)}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        >
                          <option value="">Select jewellery</option>
                          {jewellery?.map((item: Jewellery) => (
                            <option key={item.Jewellery_id} value={item.Jewellery_id}>
                              {item.Type} - {item.Description}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={detail.Quantity}
                          onChange={(e) => updateDetailItem(index, 'Quantity', e.target.value)}
                          min="1"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={detail.Amount}
                          onChange={(e) => updateDetailItem(index, 'Amount', e.target.value)}
                          min="0"
                          step="0.01"
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          required
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => removeDetailItem(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No items added yet. Click "Add Item" to add jewellery to this order.
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Saving...' : isEditing ? 'Update Order' : 'Create Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;