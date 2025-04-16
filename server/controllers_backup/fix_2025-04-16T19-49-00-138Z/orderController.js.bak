import pool from '../config/database.js';

export const orderController = {
  // Get all orders
  getAllOrders: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT o.*, c.Cust_name 
        FROM Orders o
        JOIN Customer c ON o.Cust_id = c.Cust_id
        ORDER BY o.Order_id DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error getting all orders:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get order by ID
  getOrderById: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT o.*, c.Cust_name 
        FROM Orders o
        JOIN Customer c ON o.Cust_id = c.Cust_id
        WHERE o.Order_id = ?
      `, [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Get order details
      const [details] = await pool.query(`
        SELECT od.*, j.Type, j.Description 
        FROM Order_Details od
        JOIN Jewellery j ON od.Jewellery_id = j.Jewellery_id
        WHERE od.Order_id = ?
      `, [req.params.id]);
      
      const order = rows[0];
      order.details = details;
      
      res.json(order);
    } catch (error) {
      console.error('Error getting order by ID:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get next order ID
  getNextOrderId: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT MAX(Order_id) as maxId FROM Orders');
      const nextId = rows[0].maxId ? parseInt(rows[0].maxId) + 1 : 1;
      res.json({ nextId });
    } catch (error) {
      console.error('Error getting next order ID:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Add new order
  addOrder: async (req, res) => {
    const { Order_id, Cust_id, Order_date, Total_price, details } = req.body;
    
    try {
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      // Insert the order
      const [orderResult] = await pool.query(
        'INSERT INTO Orders (Order_id, Cust_id, Order_date, Total_price) VALUES (?, ?, ?, ?)',
        [Order_id, Cust_id, Order_date || new Date(), Total_price]
      );
      
      // If details are provided, insert them
      if (details && Array.isArray(details) && details.length > 0) {
        for (const detail of details) {
          // Insert order detail
          await pool.query(
            'INSERT INTO Order_Details (Order_id, Jewellery_id, Quantity, Date, Amount, Model_No, Unit_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              Order_id, 
              detail.Jewellery_id, 
              detail.Quantity, 
              Order_date || new Date(), 
              detail.Amount,
              detail.Model_No,
              detail.Unit_id
            ]
          );
          
          // Get current stock quantity
          const [stockItem] = await pool.query(
            'SELECT Quantity FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
            [detail.Jewellery_id, detail.Model_No, detail.Unit_id]
          );
          
          if (stockItem.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ 
              message: `Stock item not found for Jewellery ID: ${detail.Jewellery_id}, Model: ${detail.Model_No}, Unit: ${detail.Unit_id}` 
            });
          }
          
          const currentQuantity = Number(stockItem[0].Quantity);
          const newQuantity = currentQuantity - Number(detail.Quantity);
          
          // Determine status based on new quantity
          const newStatus = newQuantity <= 0 ? 'Sold' : 'Available';
          
          // Update linked stock quantity and status in a single query
          await pool.query(
            'UPDATE Linked_Stock SET Quantity = ?, Status = ? WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
            [newQuantity, newStatus, detail.Jewellery_id, detail.Model_No, detail.Unit_id]
          );
          
          console.log(`Updated linked stock: Jewellery ID ${detail.Jewellery_id}, Model ${detail.Model_No}, Unit ${detail.Unit_id}, New Quantity: ${newQuantity}, Status: ${newStatus}`);
          
          // Update jewellery quantity
          await pool.query(
            'UPDATE Jewellery SET Quantity = Quantity - ? WHERE Jewellery_id = ?',
            [detail.Quantity, detail.Jewellery_id]
          );
        }
      }
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      res.status(201).json({ 
        id: Order_id, 
        message: 'Order added successfully' 
      });
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error adding order:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update order
  updateOrder: async (req, res) => {
    const { Cust_id, Order_date, Total_price, details } = req.body;
    const Order_id = req.params.id;
    
    try {
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      // Get existing order details to restore stock
      const [existingDetails] = await pool.query(
        'SELECT * FROM Order_Details WHERE Order_id = ?',
        [Order_id]
      );
      
      // Restore stock for existing items
      for (const oldDetail of existingDetails) {
        // Get current stock quantity
        const [stockItem] = await pool.query(
          'SELECT Quantity FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
          [oldDetail.Jewellery_id, oldDetail.Model_No, oldDetail.Unit_id]
        );
        
        if (stockItem.length > 0) {
          const currentQuantity = Number(stockItem[0].Quantity);
          const newQuantity = currentQuantity + Number(oldDetail.Quantity);
          
          // Update linked stock quantity and status
          await pool.query(
            'UPDATE Linked_Stock SET Quantity = ?, Status = ? WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
            [newQuantity, 'Available', oldDetail.Jewellery_id, oldDetail.Model_No, oldDetail.Unit_id]
          );
          
          // Update jewellery quantity
          await pool.query(
            'UPDATE Jewellery SET Quantity = Quantity + ? WHERE Jewellery_id = ?',
            [oldDetail.Quantity, oldDetail.Jewellery_id]
          );
        }
      }
      
      // Delete existing order details
      await pool.query('DELETE FROM Order_Details WHERE Order_id = ?', [Order_id]);
      
      // Update order
      await pool.query(
        'UPDATE Orders SET Cust_id = ?, Order_date = ?, Total_price = ? WHERE Order_id = ?',
        [Cust_id, Order_date, Total_price, Order_id]
      );
      
      // Insert new order details
      if (details && Array.isArray(details) && details.length > 0) {
        for (const detail of details) {
          // Insert order detail
          await pool.query(
            'INSERT INTO Order_Details (Order_id, Jewellery_id, Quantity, Date, Amount, Model_No, Unit_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
              Order_id, 
              detail.Jewellery_id, 
              detail.Quantity, 
              Order_date, 
              detail.Amount,
              detail.Model_No,
              detail.Unit_id
            ]
          );
          
          // Get current stock quantity
          const [stockItem] = await pool.query(
            'SELECT Quantity FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
            [detail.Jewellery_id, detail.Model_No, detail.Unit_id]
          );
          
          if (stockItem.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ 
              message: `Stock item not found for Jewellery ID: ${detail.Jewellery_id}, Model: ${detail.Model_No}, Unit: ${detail.Unit_id}` 
            });
          }
          
          const currentQuantity = Number(stockItem[0].Quantity);
          const newQuantity = currentQuantity - Number(detail.Quantity);
          
          // Determine status based on new quantity
          const newStatus = newQuantity <= 0 ? 'Sold' : 'Available';
          
          // Update linked stock quantity
          await pool.query(
            'UPDATE Linked_Stock SET Quantity = ?, Status = ? WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
            [newQuantity, newStatus, detail.Jewellery_id, detail.Model_No, detail.Unit_id]
          );
          
          // Update jewellery quantity
          await pool.query(
            'UPDATE Jewellery SET Quantity = Quantity - ? WHERE Jewellery_id = ?',
            [detail.Quantity, detail.Jewellery_id]
          );
        }
      }
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      res.json({ message: 'Order updated successfully' });
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error updating order:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete order
  deleteOrder: async (req, res) => {
    const Order_id = req.params.id;
    
    try {
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      // Get order details to restore stock
      const [details] = await pool.query(
        'SELECT * FROM Order_Details WHERE Order_id = ?',
        [Order_id]
      );
      
      // Restore stock for each item
      for (const detail of details) {
        // Get current stock quantity
        const [stockItem] = await pool.query(
          'SELECT Quantity FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
          [detail.Jewellery_id, detail.Model_No, detail.Unit_id]
        );
        
        if (stockItem.length > 0) {
          const currentQuantity = Number(stockItem[0].Quantity);
          const newQuantity = currentQuantity + Number(detail.Quantity);
          
          // Update linked stock quantity and status
          await pool.query(
            'UPDATE Linked_Stock SET Quantity = ?, Status = ? WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
            [newQuantity, 'Available', detail.Jewellery_id, detail.Model_No, detail.Unit_id]
          );
          
          // Update jewellery quantity
          await pool.query(
            'UPDATE Jewellery SET Quantity = Quantity + ? WHERE Jewellery_id = ?',
            [detail.Quantity, detail.Jewellery_id]
          );
        }
      }
      
      // Delete order details
      await pool.query('DELETE FROM Order_Details WHERE Order_id = ?', [Order_id]);
      
      // Delete order
      const [result] = await pool.query('DELETE FROM Orders WHERE Order_id = ?', [Order_id]);
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      res.json({ message: 'Order deleted successfully' });
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error deleting order:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

export default orderController;
