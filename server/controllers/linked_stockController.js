import pool from '../config/database.js';

export const linked_stockController = {
  // Get all linked_stock items
  getAlllinked_stock: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT ls.*, j.Type, j.Description 
        FROM Linked_Stock ls 
        JOIN Jewellery j ON ls.Jewellery_id = j.Jewellery_id
      `);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get linked_stock by jewellery ID
  getlinked_stockByJewelleryId: async (req, res) => {
    try {
      const [rows] = await pool.query(
        `SELECT ls.*, j.Type, j.Description 
         FROM Linked_Stock ls 
         JOIN Jewellery j ON ls.Jewellery_id = j.Jewellery_id 
         WHERE ls.Jewellery_id = ?`, 
        [req.params.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'No linked stock items found for this jewellery' });
      }
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Get linked_stock by composite key
  getlinked_stockByCompositeKey: async (req, res) => {
    try {
      const { jewellery_id, model_no, unit_id } = req.params;
      const [rows] = await pool.query(
        `SELECT ls.*, j.Type, j.Description 
         FROM Linked_Stock ls 
         JOIN Jewellery j ON ls.Jewellery_id = j.Jewellery_id 
         WHERE ls.Jewellery_id = ? AND ls.Model_No = ? AND ls.Unit_id = ?`, 
        [jewellery_id, model_no, unit_id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Linked stock item not found' });
      }
      res.json(rows[0]);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Add new linked_stock
  addlinked_stock: async (req, res) => {
    const { jewellery_id, model_no, unit_id, weight, size, status, sold_at } = req.body;
    try {
      const [result] = await pool.query(
        'INSERT INTO Linked_Stock (Jewellery_id, Model_No, Unit_id, Weight, Size, Status, Sold_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [jewellery_id, model_no, unit_id, weight, size, status || 'Available', sold_at || null]
      );
      res.status(201).json({
        message: 'Linked stock added successfully',
        data: { jewellery_id, model_no, unit_id }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Update linked_stock
  updatelinked_stock: async (req, res) => {
    const { jewellery_id, model_no, unit_id } = req.params;
    const { weight, size, status, sold_at } = req.body;
    try {
      const [result] = await pool.query(
        'UPDATE Linked_Stock SET Weight = ?, Size = ?, Status = ?, Sold_at = ? WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
        [weight, size, status, sold_at, jewellery_id, model_no, unit_id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Linked stock item not found' });
      }
      res.json({ message: 'Linked stock updated successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Delete linked_stock
  deletelinked_stock: async (req, res) => {
    const { jewellery_id, model_no, unit_id } = req.params;
    try {
      const [result] = await pool.query(
        'DELETE FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
        [jewellery_id, model_no, unit_id]
      );
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Linked stock item not found' });
      }
      res.json({ message: 'Linked stock deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Update linked stock status
  updateLinkedStockStatus: async (req, res) => {
    const { jewellery_id, model_no, unit_id } = req.params;
    const { status } = req.body;
    try {
      // Set the output parameter
      await pool.query(`SET @status = '${status}'`);
      
      // Call the stored procedure
      await pool.query(
        'CALL UpdateLinkedStockStatus(?, ?, ?, @status)',
        [jewellery_id, model_no, unit_id]
      );
      
      // Get the output parameter value
      const [result] = await pool.query('SELECT @status as updatedStatus');
      
      res.json({ 
        message: 'Status updated successfully', 
        updatedStatus: result[0].updatedStatus 
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
  
  // Get available stock
  getAvailableStock: async (req, res) => {
    try {
      const [rows] = await pool.query(`
        SELECT ls.*, j.Type, j.Description 
        FROM Linked_Stock ls 
        JOIN Jewellery j ON ls.Jewellery_id = j.Jewellery_id 
        WHERE ls.Status = 'Available'
      `);
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};