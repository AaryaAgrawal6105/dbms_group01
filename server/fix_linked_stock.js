/**
 * This script directly updates the linked_stockController.js file
 * to ensure proper quantity and status handling
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
const backupPath = path.join(controllersDir, 'linked_stockController.js.bak.fix');

// Create backup
try {
  fs.copyFileSync(linkedStockPath, backupPath);
  console.log(`✅ Created backup at ${backupPath}`);
} catch (error) {
  console.error(`❌ Error creating backup: ${error.message}`);
  process.exit(1);
}

// Read the file
let content;
try {
  content = fs.readFileSync(linkedStockPath, 'utf8');
  console.log('✅ Read linked_stockController.js');
} catch (error) {
  console.error(`❌ Error reading file: ${error.message}`);
  process.exit(1);
}

// Fix the updatelinked_stock function
const updatedContent = content.replace(
  /updatelinked_stock: async \(req, res\) => {[\s\S]*?\/\/ 6\. Verify the update was successful/m,
  `updatelinked_stock: async (req, res) => {
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
      
      // 6. Verify the update was successful`
);

// Write the updated content
try {
  fs.writeFileSync(linkedStockPath, updatedContent);
  console.log('✅ Updated linked_stockController.js with fixed code');
} catch (error) {
  console.error(`❌ Error writing file: ${error.message}`);
  process.exit(1);
}

console.log('✅ Fix completed successfully');
console.log('To apply the changes, restart the server');
