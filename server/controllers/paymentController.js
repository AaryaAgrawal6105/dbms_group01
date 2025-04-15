import pool from '../config/database.js';

export const paymentController = {
  // Get all payments
  getAllpayment: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, o.Cust_id, c.Cust_name
        FROM Payment p
        JOIN Orders o ON p.Order_id = o.Order_id
        JOIN Customer c ON o.Cust_id = c.Cust_id
        ORDER BY p.Payment_id DESC
      `);
      res.json(rows);
    } catch (error) {
      console.error('Error getting all payments:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get payment by ID
  getPaymentById: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT p.*, o.Cust_id, c.Cust_name
        FROM Payment p
        JOIN Orders o ON p.Order_id = o.Order_id
        JOIN Customer c ON o.Cust_id = c.Cust_id
        WHERE p.Payment_id = ?
      `, [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Payment not found' });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting payment by ID:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get next payment ID
  getNextPaymentId: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT MAX(Payment_id) as maxId FROM Payment');
      const nextId = rows[0].maxId ? parseInt(rows[0].maxId) + 1 : 1;
      res.json({ nextId });
    } catch (error) {
      console.error('Error getting next payment ID:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Add new payment
  addPayment: async (req, res) => {
    try {
      console.log('Request body:', req.body);
      const { Order_id, Payment_mode, Amount, Payment_date, Payment_time } = req.body;
      
      // Validate required fields
      if (!Order_id) {
        return res.status(400).json({ error: 'Order ID is required' });
      }
      
      // Get next payment ID
      const [rows] = await pool.query('SELECT MAX(Payment_id) as maxId FROM Payment');
      const Payment_id = rows[0].maxId ? parseInt(rows[0].maxId) + 1 : 1;
      
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      // Insert the payment
      const [result] = await pool.query(
        'INSERT INTO Payment (Payment_id, Order_id, Payment_mode, Amount, Payment_date, Payment_time) VALUES (?, ?, ?, ?, ?, ?)',
        [
          Payment_id, 
          Order_id, 
          Payment_mode || 'Cash', 
          Amount || 0, 
          Payment_date || new Date().toISOString().split('T')[0],
          Payment_time || new Date().toTimeString().split(' ')[0]
        ]
      );
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      res.status(201).json({ 
        id: Payment_id, 
        message: 'Payment added successfully' 
      });
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error adding payment:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update payment
  updatePayment: async (req, res) => {
    const { Payment_mode, Amount, Payment_date, Payment_time } = req.body;
    const Payment_id = req.params.id;
    
    try {
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      // Update the payment
      const [result] = await pool.query(
        'UPDATE Payment SET Payment_mode = ?, Amount = ?, Payment_date = ?, Payment_time = ? WHERE Payment_id = ?',
        [Payment_mode, Amount, Payment_date, Payment_time, Payment_id]
      );
      
      if (result.affectedRows === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      res.json({ message: 'Payment updated successfully' });
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error updating payment:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete payment
  deletePayment: async (req, res) => {
    try {
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      // Delete the payment
      const [result] = await pool.query('DELETE FROM Payment WHERE Payment_id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      res.json({ message: 'Payment deleted successfully' });
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error deleting payment:', error);
      res.status(500).json({ error: error.message });
    }
  }
};