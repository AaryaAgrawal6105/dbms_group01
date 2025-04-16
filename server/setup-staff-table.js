import pool from './config/database.js';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function setupStaffTable() {
  try {
    console.log('Checking if Staff table exists...');
    
    // Check if Staff table exists
    const [tables] = await pool.query(`
      SELECT TABLE_NAME 
      FROM information_schema.TABLES 
      WHERE TABLE_SCHEMA = 'jewellery_db' AND TABLE_NAME = 'Staff'
    `);
    
    if (tables.length === 0) {
      console.log('Staff table does not exist. Creating it...');
      
      // Read SQL file
      const sqlFilePath = path.join(__dirname, 'sql', 'staff_table.sql');
      const sql = fs.readFileSync(sqlFilePath, 'utf8');
      
      // Split SQL statements
      const statements = sql.split(';').filter(statement => statement.trim() !== '');
      
      // Execute each statement
      for (const statement of statements) {
        await pool.query(statement);
      }
      
      console.log('Staff table created successfully!');
    } else {
      console.log('Staff table already exists.');
      
      // Check if admin user exists
      const [adminUsers] = await pool.query(`
        SELECT * FROM Staff WHERE Username = 'admin'
      `);
      
      if (adminUsers.length === 0) {
        console.log('Admin user does not exist. Creating default admin user...');
        
        // Create default admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(`
          INSERT INTO Staff (Username, Password, Full_name, Email, Role)
          VALUES ('admin', ?, 'Admin User', 'admin@jewellery.com', 'admin')
        `, [hashedPassword]);
        
        console.log('Default admin user created successfully!');
      } else {
        console.log('Admin user already exists.');
      }
    }
    
    console.log('Staff table setup completed successfully!');
  } catch (error) {
    console.error('Error setting up Staff table:', error);
  } finally {
    // Close the connection pool
    process.exit(0);
  }
}

setupStaffTable();
