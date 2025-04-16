import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';

const OrderForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  // Form state
  const [formData, setFormData] = useState({
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
  
  // Fetch available stock with prices
  const { data: availableStock } = useQuery({
    queryKey: ['availableStock'],
    queryFn: async () => {
      const response = await axios.get('http://localhost:5000/api/linked_stock/available');
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
    mutationFn: async (data) => {
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
    onError: (error) => {
      toast.error(error.message || 'Failed to save order');
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
        { Jewellery_id: 0, Quantity: 1, Amount: 0, Model_No: '', Unit_id: '' }
      ]
    }));
  };

  // Get available stock items for a specific jewellery ID
  const getStockItemsForJewellery = (jewelleryId) => {
    if (!availableStock) return [];
    return availableStock.filter(item => 
      item.Jewellery_id === jewelleryId && 
      item.Status === 'Available'
    );
  };

  // Get price for a specific stock item
  const getPriceForStockItem = (jewelleryId, modelNo, unitId) => {
    if (!availableStock) return 0;
    if (!jewelleryId || !modelNo || !unitId) return 0;
    
    // Convert parameters to the correct types
    const jId = Number(jewelleryId);
    const uId = Number(unitId);
    
    console.log('Looking for price with:', { jId, modelNo, uId });
    console.log('Available stock items:', availableStock.length);
    
    const stockItem = availableStock.find(item => 
      Number(item.Jewellery_id) === jId && 
      String(item.Model_No).trim() === String(modelNo).trim() && 
      Number(item.Unit_id) === uId
    );
    
    console.log('Found stock item:', stockItem);
    
    if (stockItem) {
      console.log('Price from stock item:', stockItem.Sold_at);
      return Number(stockItem.Sold_at) || 0;
    }
    
    return 0;
  };

  // Update a detail item
  const updateDetailItem = (index, field, value) => {
    const updatedDetails = [...(formData.details || [])];
    
    console.log(`Updating detail item at index ${index}, field ${field}, value ${value}`);
    
    // If updating Jewellery_id, reset model and unit
    if (field === 'Jewellery_id') {
      updatedDetails[index] = {
        ...updatedDetails[index],
        Jewellery_id: Number(value),
        Model_No: '',
        Unit_id: '',
        Amount: 0
      };
      console.log('Updated after Jewellery_id change:', updatedDetails[index]);
    } 
    // If updating Model_No or Unit_id, update the price based on stock
    else if (field === 'Model_No') {
      updatedDetails[index] = {
        ...updatedDetails[index],
        Model_No: value,
        Unit_id: '',
        Amount: 0
      };
      console.log('Updated after Model_No change:', updatedDetails[index]);
    }
    // If updating Unit_id, update the price based on stock
    else if (field === 'Unit_id') {
      const jewelleryId = updatedDetails[index].Jewellery_id;
      const modelNo = updatedDetails[index].Model_No;
      const unitId = Number(value);
      const price = getPriceForStockItem(jewelleryId, modelNo, unitId);
      
      console.log('Price calculation for Unit_id change:', { jewelleryId, modelNo, unitId, price });
      
      updatedDetails[index] = {
        ...updatedDetails[index],
        Unit_id: Number(value),
        Amount: price * Number(updatedDetails[index].Quantity || 1)
      };
      console.log('Updated after Unit_id change:', updatedDetails[index]);
    }
    // If updating Quantity, recalculate the amount
    else if (field === 'Quantity') {
      const jewelleryId = updatedDetails[index].Jewellery_id;
      const modelNo = updatedDetails[index].Model_No;
      const unitId = updatedDetails[index].Unit_id;
      const price = getPriceForStockItem(jewelleryId, modelNo, unitId);
      
      console.log('Price calculation for Quantity change:', { jewelleryId, modelNo, unitId, price, quantity: value });
      
      updatedDetails[index] = {
        ...updatedDetails[index],
        Quantity: Number(value),
        Amount: price * Number(value)
      };
      console.log('Updated after Quantity change:', updatedDetails[index]);
    }
    // For other fields, just update normally
    else {
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: field === 'Quantity' || field === 'Amount' 
          ? Number(value) 
          : value
      };
    }

    // Calculate total price
    const totalPrice = updatedDetails.reduce((sum, item) => sum + (item.Amount || 0), 0);

    setFormData(prev => ({
      ...prev,
      details: updatedDetails,
      Total_price: totalPrice
    }));
  };

  // Remove a detail item
  const removeDetailItem = (index) => {
    const updatedDetails = [...(formData.details || [])];
    updatedDetails.splice(index, 1);
    
    // Calculate total price
    const totalPrice = updatedDetails.reduce((sum, item) => sum + (item.Amount || 0), 0);

    setFormData(prev => ({
      ...prev,
      details: updatedDetails,
      Total_price: totalPrice
    }));
  };

  if (isLoadingOrder) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">
        {isEditing ? 'Edit Order' : 'Create New Order'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="Order_id" className="block text-sm font-medium text-gray-700">
              Order ID
            </label>
            <input
              type="number"
              id="Order_id"
              name="Order_id"
              value={formData.Order_id}
              onChange={handleChange}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="Cust_id" className="block text-sm font-medium text-gray-700">
              Customer
            </label>
            <select
              id="Cust_id"
              name="Cust_id"
              value={formData.Cust_id}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select a customer</option>
              {customers?.map((customer) => (
                <option key={customer.Cust_id} value={customer.Cust_id}>
                  {customer.Cust_name} ({customer.Cust_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="Order_date" className="block text-sm font-medium text-gray-700">
              Order Date
            </label>
            <input
              type="date"
              id="Order_date"
              name="Order_date"
              value={formData.Order_date}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label htmlFor="Total_price" className="block text-sm font-medium text-gray-700">
              Total Price
            </label>
            <input
              type="number"
              id="Total_price"
              name="Total_price"
              value={formData.Total_price}
              onChange={handleChange}
              required
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Order Items</h3>
            <button
              type="button"
              onClick={addDetailItem}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Add Item
            </button>
          </div>

          {formData.details && formData.details.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jewellery
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {formData.details.map((detail, index) => {
                    const stockItems = getStockItemsForJewellery(detail.Jewellery_id);
                    const modelNumbers = [...new Set(stockItems.map(item => item.Model_No))];
                    const unitIds = stockItems
                      .filter(item => item.Model_No === detail.Model_No)
                      .map(item => item.Unit_id);
                    
                    return (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={detail.Jewellery_id}
                            onChange={(e) => updateDetailItem(index, 'Jewellery_id', e.target.value)}
                            required
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="">Select jewellery</option>
                            {jewellery?.map((item) => (
                              <option key={item.Jewellery_id} value={item.Jewellery_id}>
                                {item.Type} - {item.Description}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={detail.Model_No}
                            onChange={(e) => updateDetailItem(index, 'Model_No', e.target.value)}
                            required
                            disabled={!detail.Jewellery_id || modelNumbers.length === 0}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="">Select model</option>
                            {modelNumbers.map((modelNo) => (
                              <option key={modelNo} value={modelNo}>
                                {modelNo}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={detail.Unit_id}
                            onChange={(e) => updateDetailItem(index, 'Unit_id', e.target.value)}
                            required
                            disabled={!detail.Model_No || unitIds.length === 0}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          >
                            <option value="">Select unit</option>
                            {unitIds.map((unitId) => (
                              <option key={unitId} value={unitId}>
                                {unitId}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={detail.Quantity}
                            onChange={(e) => updateDetailItem(index, 'Quantity', e.target.value)}
                            required
                            min="1"
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="number"
                            value={detail.Amount}
                            disabled
                            className="block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
              No items added to this order yet. Click "Add Item" to add jewellery items.
            </div>
          )}
        </div>

        <div className="flex justify-end pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/orders')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 mr-4"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            disabled={mutation.isPending || formData.details.length === 0}
          >
            {mutation.isPending ? 'Saving...' : 'Save Order'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default OrderForm;
