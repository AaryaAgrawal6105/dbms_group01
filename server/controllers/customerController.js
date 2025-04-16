import pool from '../config/database.js';

export const customerController = {
  // Get all customers
  getAllCustomers: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM Customer ORDER BY Cust_id DESC');
      res.json(rows);
    } catch (error) {
      console.error('Error getting all customers:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get customer by ID
  getCustomerById: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM Customer WHERE Cust_id = ?', [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Customer not found' });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting customer by ID:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get next customer ID
  getNextCustomerId: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT MAX(Cust_id) as maxId FROM Customer');
      const nextId = rows[0].maxId ? parseInt(rows[0].maxId) + 1 : 1;
      res.json({ nextId });
    } catch (error) {
      console.error('Error getting next customer ID:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Add new customer
  addCustomer: async (req, res) => {
    const { Cust_name, Phone_no, Email } = req.body;
    try {
      // Get next customer ID
      const [rows] = await pool.query('SELECT MAX(Cust_id) as maxId FROM Customer');
      const Cust_id = rows[0].maxId ? parseInt(rows[0].maxId) + 1 : 1;

      // Start a transaction
      await pool.query('START TRANSACTION');
      
      try {
        // Insert directly instead of using stored procedure
        await pool.query(
          'INSERT INTO Customer (Cust_id, Cust_name, Phone_no, Email) VALUES (?, ?, ?, ?)',
          [Cust_id, Cust_name, Phone_no, Email]
        );
        
        // Commit the transaction
        await pool.query('COMMIT');
        
        res.status(201).json({ 
          id: Cust_id,
          message: 'Customer added successfully' 
        });
      } catch (insertError) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        
        if (insertError.code === 'ER_DUP_ENTRY') {
          if (insertError.message.includes('Email')) {
            return res.status(400).json({ error: 'Email already exists' });
          } else if (insertError.message.includes('Phone_no')) {
            return res.status(400).json({ error: 'Phone number already exists' });
          }
        }
        
        console.error('Error adding customer:', insertError);
        res.status(500).json({ error: insertError.message });
      }
    } catch (error) {
      console.error('Error in customer creation process:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update customer
  updateCustomer: async (req, res) => {
    const { Cust_name, Phone_no, Email } = req.body;
    try {
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      const [result] = await pool.query(
        'UPDATE Customer SET Cust_name = ?, Phone_no = ?, Email = ? WHERE Cust_id = ?',
        [Cust_name, Phone_no, Email, req.params.id]
      );
      
      if (result.affectedRows === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      res.json({ message: 'Customer updated successfully' });
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error updating customer:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete customer
  deleteCustomer: async (req, res) => {
    try {
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      // Check if customer has orders
      const [orders] = await pool.query('SELECT COUNT(*) as count FROM Orders WHERE Cust_id = ?', [req.params.id]);
      
      if (orders[0].count > 0) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ message: 'Cannot delete customer with existing orders' });
      }
      
      const [result] = await pool.query('DELETE FROM Customer WHERE Cust_id = ?', [req.params.id]);
      
      if (result.affectedRows === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ message: 'Customer not found' });
      }
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      res.json({ message: 'Customer deleted successfully' });
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error deleting customer:', error);
      res.status(500).json({ error: error.message });
    }
  }
};