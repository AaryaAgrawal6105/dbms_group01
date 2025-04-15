import pool from '../config/database.js';

export const jewelleryController = {
  // Get all jewellery
  getAlljewellery: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM Jewellery');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  },

  // Add new jewellery
  addjewellery: async (req, res) => {
    const { jewellery_id, type, description, hsn, quantity } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO Jewellery (Jewellery_id, Type, Description, HSN, Quantity) VALUES (?, ?, ?, ?, ?)',
        [jewellery_id, type, description, hsn, quantity]
      );
      res.status(201).json({ 
        id: jewellery_id, 
        message: 'Jewellery added successfully' 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update jewellery
  updatejewellery: async (req, res) => {
    const { type, description, hsn, quantity } = req.body;
    try {
      const [result] = await pool.query(
        'UPDATE Jewellery SET Type = ?, Description = ?, HSN = ?, Quantity = ? WHERE Jewellery_id = ?',
        [type, description, hsn, quantity, req.params.id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Jewellery not found' });
      }
      res.json({ message: 'Jewellery updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  },

  // Get available jewellery
  getAvailableJewellery: async (req, res) => {
    try {
      const [rows] = await pool.query('SELECT * FROM vw_available_jewellery');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
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
      res.status(500).json({ error: error.message });
    }
  }
};