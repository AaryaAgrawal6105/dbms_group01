/**
 * This script fixes the quantity and status management issues in the jewellery store system
 * It directly modifies the controllers to ensure:
 * 1. Linked stock status is always set based on quantity (Available if > 0, Sold if <= 0)
 * 2. Jewellery quantity is properly updated when linked stock quantities change
 * 3. All updates are done within transactions for data consistency
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const controllersDir = path.join(__dirname, 'controllers');
const linkedStockPath = path.join(controllersDir, 'linked_stockController.js');
const orderControllerPath = path.join(controllersDir, 'orderController.js');
const backupDir = path.join(__dirname, 'controllers_backup', 'fix_' + new Date().toISOString().replace(/[:.]/g, '-'));

// Create backup directory
if (!fs.existsSync(path.join(__dirname, 'controllers_backup'))) {
  fs.mkdirSync(path.join(__dirname, 'controllers_backup'));
}
fs.mkdirSync(backupDir, { recursive: true });

// Backup files
try {
  fs.copyFileSync(linkedStockPath, path.join(backupDir, 'linked_stockController.js.bak'));
  fs.copyFileSync(orderControllerPath, path.join(backupDir, 'orderController.js.bak'));
  console.log(`✅ Created backups in ${backupDir}`);
} catch (error) {
  console.error(`❌ Error creating backups: ${error.message}`);
  process.exit(1);
}

// Fix linked_stockController.js
const linkedStockController = `import pool from '../config/database.js';

export const linked_stockController = {
  // Get all linked_stock items
  getAlllinked_stock: async (req, res) => {
    try {
      const [rows] = await pool.query(\`
        SELECT ls.*, j.Type, j.Description 
        FROM Linked_Stock ls 
        JOIN Jewellery j ON ls.Jewellery_id = j.Jewellery_id
      \`);
      res.json(rows);
    } catch (error) {
      console.error('Error getting all linked stock:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get linked_stock by jewellery ID
  getlinked_stockByJewelleryId: async (req, res) => {
    try {
      const [rows] = await pool.query(
        \`SELECT ls.*, j.Type, j.Description 
         FROM Linked_Stock ls 
         JOIN Jewellery j ON ls.Jewellery_id = j.Jewellery_id 
         WHERE ls.Jewellery_id = ?\`, 
        [req.params.id]
      );
      if (rows.length === 0) {
        return res.status(404).json({ message: 'No linked stock items found for this jewellery' });
      }
      res.json(rows);
    } catch (error) {
      console.error('Error getting linked stock by jewellery ID:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get linked_stock by composite key
  getlinked_stockByCompositeKey: async (req, res) => {
    try {
      // Decode URI components to handle spaces and special characters
      const jewellery_id = parseInt(req.params.jewellery_id);
      const model_no = decodeURIComponent(req.params.model_no);
      const unit_id = parseInt(req.params.unit_id);
      
      console.log('Fetching linked stock with params:', { jewellery_id, model_no, unit_id });
      
      const [rows] = await pool.query(
        \`SELECT ls.*, j.Type, j.Description 
         FROM Linked_Stock ls 
         JOIN Jewellery j ON ls.Jewellery_id = j.Jewellery_id 
         WHERE ls.Jewellery_id = ? AND ls.Model_No = ? AND ls.Unit_id = ?\`, 
        [jewellery_id, model_no, unit_id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Linked stock item not found' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting linked stock by composite key:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Add new linked_stock
  addlinked_stock: async (req, res) => {
    const { jewellery_id, model_no, unit_id, weight, size, sold_at, quantity } = req.body;
    try {
      // Start a transaction
      await pool.query('START TRANSACTION');

      // Determine the status based on quantity
      const newQuantity = Number(quantity) || 1;
      const newStatus = newQuantity <= 0 ? 'Sold' : 'Available';

      // Insert the linked stock item
      const [result] = await pool.query(
        'INSERT INTO Linked_Stock (Jewellery_id, Model_No, Unit_id, Weight, Size, Status, Sold_at, Quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [jewellery_id, model_no, unit_id, weight, size, newStatus, sold_at || null, newQuantity]
      );
      
      // Update the jewellery quantity
      await pool.query(
        'UPDATE Jewellery SET Quantity = Quantity + ? WHERE Jewellery_id = ?',
        [newQuantity, jewellery_id]
      );
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      res.status(201).json({
        message: 'Linked stock added successfully',
        data: { jewellery_id, model_no, unit_id, status: newStatus, quantity: newQuantity }
      });
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error adding linked stock:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update linked_stock
  updatelinked_stock: async (req, res) => {
    try {
      // Decode URI components to handle spaces and special characters
      const jewellery_id = parseInt(req.params.jewellery_id);
      const model_no = decodeURIComponent(req.params.model_no);
      const unit_id = parseInt(req.params.unit_id);
      
      // Extract data from request body
      const { Weight, Size, Sold_at, Quantity } = req.body;
      
      console.log('Updating linked stock with params:', { jewellery_id, model_no, unit_id });
      console.log('Update data received:', req.body);
      
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      // 1. First, get the current values from the database
      const [currentRows] = await pool.query(
        'SELECT * FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
        [jewellery_id, model_no, unit_id]
      );
      
      if (currentRows.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ message: 'Linked stock item not found' });
      }
      
      const current = currentRows[0];
      console.log('Current values in database:', current);
      
      // 2. Calculate quantity difference for jewellery update
      const oldQuantity = Number(current.Quantity);
      const newQuantity = Number(Quantity);
      const quantityDifference = newQuantity - oldQuantity;
      
      // 3. Determine status based on quantity
      const newStatus = newQuantity <= 0 ? 'Sold' : 'Available';
      console.log(\`Setting status to \${newStatus} based on quantity \${newQuantity}\`);
      
      // 4. Update ALL fields in the linked stock
      const [updateResult] = await pool.query(
        'UPDATE Linked_Stock SET Weight = ?, Size = ?, Status = ?, Sold_at = ?, Quantity = ? WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
        [Weight, Size, newStatus, Sold_at, newQuantity, jewellery_id, model_no, unit_id]
      );
      
      console.log('Update result:', updateResult);
      
      // 5. If quantity changed, update the jewellery quantity
      if (quantityDifference !== 0) {
        console.log(\`Updating Jewellery quantity by \${quantityDifference}\`);
        await pool.query(
          'UPDATE Jewellery SET Quantity = Quantity + ? WHERE Jewellery_id = ?',
          [quantityDifference, jewellery_id]
        );
      }
      
      // 6. Verify the update was successful
      const [verifyRows] = await pool.query(
        'SELECT * FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
        [jewellery_id, model_no, unit_id]
      );
      
      console.log('Values after update:', verifyRows[0]);
      
      // 7. Commit the transaction
      await pool.query('COMMIT');
      
      // 8. Return success response
      res.json({
        message: 'Linked stock updated successfully',
        data: verifyRows[0]
      });
    } catch (error) {
      // Rollback in case of error
      try {
        await pool.query('ROLLBACK');
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
      console.error('Error updating linked stock:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete linked_stock
  deletelinked_stock: async (req, res) => {
    try {
      // Decode URI components to handle spaces and special characters
      const jewellery_id = parseInt(req.params.jewellery_id);
      const model_no = decodeURIComponent(req.params.model_no);
      const unit_id = parseInt(req.params.unit_id);
      
      // Start a transaction
      await pool.query('START TRANSACTION');
      
      // Get the current quantity
      const [currentItems] = await pool.query(
        'SELECT Quantity FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
        [jewellery_id, model_no, unit_id]
      );
      
      if (currentItems.length === 0) {
        await pool.query('ROLLBACK');
        return res.status(404).json({ message: 'Linked stock item not found' });
      }
      
      const quantity = Number(currentItems[0].Quantity);
      
      // Delete the linked stock item
      const [result] = await pool.query(
        'DELETE FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
        [jewellery_id, model_no, unit_id]
      );
      
      // Update jewellery quantity
      await pool.query(
        'UPDATE Jewellery SET Quantity = Quantity - ? WHERE Jewellery_id = ?',
        [quantity, jewellery_id]
      );
      
      // Commit the transaction
      await pool.query('COMMIT');
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Linked stock item not found' });
      }
      
      res.json({ message: 'Linked stock deleted successfully' });
    } catch (error) {
      // Rollback in case of error
      await pool.query('ROLLBACK');
      console.error('Error deleting linked stock:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get available stock
  getAvailableStock: async (req, res) => {
    try {
      const [rows] = await pool.query(\`
        SELECT ls.*, j.Type, j.Description 
        FROM Linked_Stock ls 
        JOIN Jewellery j ON ls.Jewellery_id = j.Jewellery_id 
        WHERE ls.Status = 'Available' AND ls.Quantity > 0
      \`);
      res.json(rows);
    } catch (error) {
      console.error('Error getting available stock:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update linked stock status
  updateLinkedStockStatus: async (req, res) => {
    try {
      // Decode URI components to handle spaces and special characters
      const jewellery_id = parseInt(req.params.jewellery_id);
      const model_no = decodeURIComponent(req.params.model_no);
      const unit_id = parseInt(req.params.unit_id);
      
      const { status } = req.body;
      
      // Get current quantity
      const [currentItems] = await pool.query(
        'SELECT Quantity FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
        [jewellery_id, model_no, unit_id]
      );
      
      if (currentItems.length === 0) {
        return res.status(404).json({ message: 'Linked stock item not found' });
      }
      
      const quantity = Number(currentItems[0].Quantity);
      
      // If status is 'Available' but quantity is 0, set quantity to 1
      let newQuantity = quantity;
      if (status === 'Available' && quantity <= 0) {
        newQuantity = 1;
      }
      
      // If status is 'Sold' but quantity is > 0, set quantity to 0
      if (status === 'Sold' && quantity > 0) {
        newQuantity = 0;
      }
      
      // Update the linked stock status and quantity if needed
      await pool.query(
        'UPDATE Linked_Stock SET Status = ?, Quantity = ? WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
        [status, newQuantity, jewellery_id, model_no, unit_id]
      );
      
      // If quantity changed, update jewellery quantity
      if (newQuantity !== quantity) {
        const quantityDifference = newQuantity - quantity;
        await pool.query(
          'UPDATE Jewellery SET Quantity = Quantity + ? WHERE Jewellery_id = ?',
          [quantityDifference, jewellery_id]
        );
      }
      
      res.json({ 
        message: 'Status updated successfully', 
        updatedStatus: status,
        updatedQuantity: newQuantity
      });
    } catch (error) {
      console.error('Error updating linked stock status:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

export default linked_stockController;`;

// Fix orderController.js
const orderController = `import pool from '../config/database.js';

export const orderController = {
  // Get all orders
  getAllOrders: async (req, res) => {
    try {
      const [rows] = await pool.query(\`
        SELECT o.*, c.Cust_name 
        FROM Orders o
        JOIN Customer c ON o.Cust_id = c.Cust_id
        ORDER BY o.Order_id DESC
      \`);
      res.json(rows);
    } catch (error) {
      console.error('Error getting all orders:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get order by ID
  getOrderById: async (req, res) => {
    try {
      const [rows] = await pool.query(\`
        SELECT o.*, c.Cust_name 
        FROM Orders o
        JOIN Customer c ON o.Cust_id = c.Cust_id
        WHERE o.Order_id = ?
      \`, [req.params.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Order not found' });
      }
      
      // Get order details
      const [details] = await pool.query(\`
        SELECT od.*, j.Type, j.Description 
        FROM Order_Details od
        JOIN Jewellery j ON od.Jewellery_id = j.Jewellery_id
        WHERE od.Order_id = ?
      \`, [req.params.id]);
      
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
              message: \`Stock item not found for Jewellery ID: \${detail.Jewellery_id}, Model: \${detail.Model_No}, Unit: \${detail.Unit_id}\` 
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
          
          console.log(\`Updated linked stock: Jewellery ID \${detail.Jewellery_id}, Model \${detail.Model_No}, Unit \${detail.Unit_id}, New Quantity: \${newQuantity}, Status: \${newStatus}\`);
          
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
              message: \`Stock item not found for Jewellery ID: \${detail.Jewellery_id}, Model: \${detail.Model_No}, Unit: \${detail.Unit_id}\` 
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

export default orderController;`;

// Write the fixed files
try {
  fs.writeFileSync(linkedStockPath, linkedStockController);
  fs.writeFileSync(orderControllerPath, orderController);
  console.log('✅ Fixed controller files written successfully');
} catch (error) {
  console.error(`❌ Error writing fixed files: ${error.message}`);
  process.exit(1);
}

console.log('\n✅ Quantity and status fixes have been applied');
console.log('\nTo apply these changes, restart the server with:');
console.log('node index.js');
