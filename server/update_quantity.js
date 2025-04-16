import pool from './config/database.js';

// This script directly updates the quantity in the Linked_Stock table
// Usage: node update_quantity.js

async function updateQuantity() {
  try {
    // Parameters for the update
    const jewellery_id = 1; // Replace with your jewellery_id
    const model_no = ' MODEL004'; // Replace with your model_no
    const unit_id = 1; // Replace with your unit_id
    const newQuantity = 5; // Replace with your desired quantity
    
    console.log(`Attempting to update quantity to ${newQuantity} for item:`, { jewellery_id, model_no, unit_id });
    
    // Start a transaction
    await pool.query('START TRANSACTION');
    
    // Get current quantity
    const [currentRows] = await pool.query(
      'SELECT Quantity FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
      [jewellery_id, model_no, unit_id]
    );
    
    if (currentRows.length === 0) {
      console.error('Item not found in database');
      await pool.query('ROLLBACK');
      return;
    }
    
    const oldQuantity = Number(currentRows[0].Quantity);
    console.log(`Current quantity in database: ${oldQuantity}`);
    
    // Update the quantity directly
    const [updateResult] = await pool.query(
      'UPDATE Linked_Stock SET Quantity = ? WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
      [newQuantity, jewellery_id, model_no, unit_id]
    );
    
    console.log('Update result:', updateResult);
    
    // Update the jewellery quantity
    const quantityDifference = newQuantity - oldQuantity;
    if (quantityDifference !== 0) {
      await pool.query(
        'UPDATE Jewellery SET Quantity = Quantity + ? WHERE Jewellery_id = ?',
        [quantityDifference, jewellery_id]
      );
    }
    
    // Verify the update
    const [verifyRows] = await pool.query(
      'SELECT * FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
      [jewellery_id, model_no, unit_id]
    );
    
    console.log('Values after update:', verifyRows[0]);
    
    // Commit the transaction
    await pool.query('COMMIT');
    console.log('Update committed successfully');
    
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error updating quantity:', error);
  } finally {
    // Close the connection
    process.exit(0);
  }
}

// Run the update function
updateQuantity();
