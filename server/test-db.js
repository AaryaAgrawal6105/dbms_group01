import pool from './config/database.js';

async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    const [rows] = await pool.query('SELECT 1 as test');
    console.log('Database connection successful:', rows);
    
    // Test Customer table
    console.log('\nTesting Customer table...');
    try {
      const [customers] = await pool.query('SELECT * FROM Customer LIMIT 1');
      console.log('Customer table query successful:', customers);
    } catch (error) {
      console.error('Error querying Customer table:', error.message);
    }
    
    // Test stored procedure
    console.log('\nTesting AddCustomer stored procedure...');
    try {
      await pool.query('CALL AddCustomer(?, ?, ?, ?)', [999, 'Test User', '9999999999', 'test@example.com']);
      console.log('AddCustomer stored procedure executed successfully');
    } catch (error) {
      console.error('Error executing AddCustomer stored procedure:', error.message);
    }
    
    // Test database name
    console.log('\nChecking current database...');
    const [dbResult] = await pool.query('SELECT DATABASE() as current_db');
    console.log('Current database:', dbResult[0].current_db);
    
    // List all tables
    console.log('\nListing all tables...');
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables in database:', tables.map(t => Object.values(t)[0]));
    
  } catch (error) {
    console.error('Database connection error:', error);
  } finally {
    await pool.end();
    console.log('Connection pool closed');
  }
}

testDatabaseConnection();
