import pool from '../config/database.js';

/**
 * Updates the linked stock quantity and status based on the new quantity
 * @param {number} jewellery_id - The jewellery ID
 * @param {string} model_no - The model number
 * @param {number} unit_id - The unit ID
 * @param {number} newQuantity - The new quantity
 * @returns {Promise} - The result of the update query
 */
export const updateLinkedStockQuantity = async (jewellery_id, model_no, unit_id, newQuantity) => {
  // Determine the status based on quantity
  const status = newQuantity <= 0 ? 'Sold' : 'Available';
  
  // Update linked stock quantity and status in a single query
  const [result] = await pool.query(
    'UPDATE Linked_Stock SET Quantity = ?, Status = ? WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
    [newQuantity, status, jewellery_id, model_no, unit_id]
  );
  
  console.log(`Updated linked stock: Jewellery ID ${jewellery_id}, Model ${model_no}, Unit ${unit_id}, New Quantity: ${newQuantity}, Status: ${status}`);
  
  return result;
};

/**
 * Updates the jewellery quantity based on the quantity change
 * @param {number} jewellery_id - The jewellery ID
 * @param {number} quantityChange - The quantity change (positive or negative)
 * @returns {Promise} - The result of the update query
 */
export const updateJewelleryQuantity = async (jewellery_id, quantityChange) => {
  const [result] = await pool.query(
    'UPDATE Jewellery SET Quantity = Quantity + ? WHERE Jewellery_id = ?',
    [quantityChange, jewellery_id]
  );
  
  console.log(`Updated jewellery quantity: Jewellery ID ${jewellery_id}, Quantity change: ${quantityChange}`);
  
  return result;
};

/**
 * Gets the current quantity of a linked stock item
 * @param {number} jewellery_id - The jewellery ID
 * @param {string} model_no - The model number
 * @param {number} unit_id - The unit ID
 * @returns {Promise<number>} - The current quantity
 */
export const getLinkedStockQuantity = async (jewellery_id, model_no, unit_id) => {
  const [rows] = await pool.query(
    'SELECT Quantity FROM Linked_Stock WHERE Jewellery_id = ? AND Model_No = ? AND Unit_id = ?',
    [jewellery_id, model_no, unit_id]
  );
  
  if (rows.length === 0) {
    throw new Error(`Stock item not found for Jewellery ID: ${jewellery_id}, Model: ${model_no}, Unit: ${unit_id}`);
  }
  
  return Number(rows[0].Quantity);
};

/**
 * Updates the stock when an order is placed
 * @param {Object} detail - The order detail
 * @returns {Promise} - The result of the update
 */
export const updateStockForOrder = async (detail) => {
  // Get current stock quantity
  const currentQuantity = await getLinkedStockQuantity(
    detail.Jewellery_id, 
    detail.Model_No, 
    detail.Unit_id
  );
  
  // Calculate new quantity
  const newQuantity = currentQuantity - detail.Quantity;
  
  // Update linked stock
  await updateLinkedStockQuantity(
    detail.Jewellery_id, 
    detail.Model_No, 
    detail.Unit_id, 
    newQuantity
  );
  
  // Update jewellery quantity
  await updateJewelleryQuantity(detail.Jewellery_id, -detail.Quantity);
  
  return { currentQuantity, newQuantity };
};

/**
 * Updates the stock when an order is cancelled or an item is removed
 * @param {Object} detail - The order detail
 * @returns {Promise} - The result of the update
 */
export const restoreStockForOrder = async (detail) => {
  // Get current stock quantity
  const currentQuantity = await getLinkedStockQuantity(
    detail.Jewellery_id, 
    detail.Model_No, 
    detail.Unit_id
  );
  
  // Calculate new quantity
  const newQuantity = currentQuantity + detail.Quantity;
  
  // Update linked stock
  await updateLinkedStockQuantity(
    detail.Jewellery_id, 
    detail.Model_No, 
    detail.Unit_id, 
    newQuantity
  );
  
  // Update jewellery quantity
  await updateJewelleryQuantity(detail.Jewellery_id, detail.Quantity);
  
  return { currentQuantity, newQuantity };
};
