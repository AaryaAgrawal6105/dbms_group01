/**
 * This script updates the linked_stock and order controllers to fix quantity and status issues
 * 
 * It will:
 * 1. Backup the original controllers
 * 2. Copy the updated controllers to the correct location
 * 3. Restart the server
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Get current file directory (ES modules don't have __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const serverDir = path.join(__dirname, 'server');
const controllersDir = path.join(serverDir, 'controllers');
const backupDir = path.join(serverDir, 'controllers_backup');

// Create backup directory if it doesn't exist
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

// Backup and update linked_stock controller
try {
  // Backup original file
  const linkedStockControllerPath = path.join(controllersDir, 'linked_stockController.js');
  const linkedStockBackupPath = path.join(backupDir, 'linked_stockController.js.bak');
  
  if (fs.existsSync(linkedStockControllerPath)) {
    fs.copyFileSync(linkedStockControllerPath, linkedStockBackupPath);
    console.log(`✅ Backed up linked_stockController.js to ${linkedStockBackupPath}`);
  }
  
  // Copy updated file
  const updatedLinkedStockPath = path.join(controllersDir, 'linked_stockController_updated.js');
  
  if (fs.existsSync(updatedLinkedStockPath)) {
    fs.copyFileSync(updatedLinkedStockPath, linkedStockControllerPath);
    console.log(`✅ Updated linked_stockController.js with fixed version`);
  } else {
    console.error('❌ Updated linked_stockController_updated.js not found');
  }
} catch (error) {
  console.error('❌ Error updating linked_stockController.js:', error.message);
}

// Backup and update order controller
try {
  // Backup original file
  const orderControllerPath = path.join(controllersDir, 'orderController.js');
  const orderBackupPath = path.join(backupDir, 'orderController.js.bak');
  
  if (fs.existsSync(orderControllerPath)) {
    fs.copyFileSync(orderControllerPath, orderBackupPath);
    console.log(`✅ Backed up orderController.js to ${orderBackupPath}`);
  }
  
  // Copy updated file
  const updatedOrderPath = path.join(controllersDir, 'orderController_updated.js');
  
  if (fs.existsSync(updatedOrderPath)) {
    fs.copyFileSync(updatedOrderPath, orderControllerPath);
    console.log(`✅ Updated orderController.js with fixed version`);
  } else {
    console.error('❌ Updated orderController_updated.js not found');
  }
} catch (error) {
  console.error('❌ Error updating orderController.js:', error.message);
}

console.log('\n✅ Controller updates completed');
console.log('\nTo apply these changes, restart the server with:');
console.log('cd server && npm start');
