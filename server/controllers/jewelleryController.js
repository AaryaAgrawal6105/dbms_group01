import pool from '../config/database.js';

export const jewelleryController = {
  // Get all jewellery
  getAlljewellery: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM Jewellery');
      res.json(rows);
    } catch (error) {
      console.error('Error getting all jewellery:', error);
      res.status(500).json({ error: 'Failed to retrieve jewellery data' });
    }
  },

  // Get jewellery by ID
  getjewelleryById: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM Jewellery WHERE Jewellery_id = ?', [req.params.id]);
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Jewellery not found' });
      }
      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting jewellery by ID:', error);
      res.status(500).json({ error: 'Failed to retrieve jewellery details' });
    }
  },

  // Get next jewellery ID
  getNextJewelleryId: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT MAX(Jewellery_id) as maxId FROM Jewellery');
      const nextId = rows[0].maxId ? parseInt(rows[0].maxId) + 1 : 1;
      res.json({ nextId });
    } catch (error) {
      console.error('Error getting next jewellery ID:', error);
      res.status(500).json({ error: 'Failed to generate next jewellery ID' });
    }
  },

  // Add new jewellery
  addjewellery: async (req, res) => {
    const { type, description, hsn, quantity } = req.body;
    try {
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      try {
        // Get next jewellery ID
        const [rows] = await pool.query('SELECT MAX(Jewellery_id) as maxId FROM Jewellery');
        const jewellery_id = rows[0].maxId ? parseInt(rows[0].maxId) + 1 : 1;
        
        // Insert the jewellery with the auto-generated ID
        await pool.query(
          'INSERT INTO Jewellery (Jewellery_id, Type, Description, HSN, Quantity) VALUES (?, ?, ?, ?, ?)',
          [jewellery_id, type, description, hsn, quantity]
        );
        
        // Commit the transaction
        await pool.query('COMMIT');
        
        res.status(201).json({ 
          id: jewellery_id, 
          message: 'Jewellery added successfully' 
        });
      } catch (insertError) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        
        if (insertError.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Duplicate entry found. This jewellery ID already exists.' });
        }
        
        console.error('Error adding jewellery:', insertError);
        res.status(500).json({ error: 'Failed to add jewellery. Please try again.' });
      }
    } catch (error) {
      console.error('Error in jewellery creation process:', error);
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  },

  // Update jewellery
  updatejewellery: async (req, res) => {
    const { type, description, hsn, quantity } = req.body;
    try {
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      try {
        const [result] = await pool.query(
          'UPDATE Jewellery SET Type = ?, Description = ?, HSN = ?, Quantity = ? WHERE Jewellery_id = ?',
          [type, description, hsn, quantity, req.params.id]
        );
        
        if (result.affectedRows === 0) {
          await pool.query('ROLLBACK');
          return res.status(404).json({ message: 'Jewellery not found' });
        }
        
        // Commit the transaction
        await pool.query('COMMIT');
        
        res.json({ message: 'Jewellery updated successfully' });
      } catch (updateError) {
        // Rollback in case of error
        await pool.query('ROLLBACK');
        
        if (updateError.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'Duplicate entry found. Please check your input.' });
        }
        
        console.error('Error updating jewellery:', updateError);
        res.status(500).json({ error: 'Failed to update jewellery. Please try again.' });
      }
    } catch (error) {
      console.error('Error in jewellery update process:', error);
      res.status(500).json({ error: 'An unexpected error occurred' });
    }
  },

  // Delete jewellery
  deletejewellery: async (req, res) => {
    try {
      const [result] = await pool.query('DELETE FROM Jewellery WHERE Jewellery_id = ?', [req.params.id]);
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Jewellery not found' });
      }
      res.json({ message: 'Jewellery deleted successfully' });
    } catch (error) {
      console.error('Error deleting jewellery:', error);
      res.status(500).json({ error: 'Failed to delete jewellery' });
    }
  },

  // Get available jewellery
  getAvailableJewellery: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM vw_available_jewellery');
      res.json(rows);
    } catch (error) {
      console.error('Error getting available jewellery:', error);
      res.status(500).json({ error: 'Failed to retrieve available jewellery' });
    }
  },

  // Get jewellery stock
  getJewelleryStock: async (req, res) => {
    try {
      const jewelleryId = req.params.id;
      
      // First, set the output parameter
      await pool.query('SET @availableStock = 0');
      
      // Call the stored procedure
      await pool.query('CALL GetJewelleryStock(?, @availableStock)', [jewelleryId]);
      
      // Get the output parameter value
      const [result] = await pool.query('SELECT @availableStock as availableStock');
      
      res.json({ availableStock: result[0].availableStock || 0 });
    } catch (error) {
      console.error('Error getting jewellery stock:', error);
      res.status(500).json({ error: 'Failed to retrieve jewellery stock' });
    }
  }
};