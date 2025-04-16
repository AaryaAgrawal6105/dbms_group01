import pool from './config/database.js';
import bcrypt from 'bcrypt';

async function testAuth() {
  try {
    console.log('Testing database connection...');
    const [tables] = await pool.query('SHOW TABLES');
    console.log('Tables in database:', tables.map(t => Object.values(t)[0]));
    
    console.log('\nTesting Staff table...');
    const [staffTable] = await pool.query('DESCRIBE Staff');
    console.log('Staff table structure:', staffTable.map(col => col.Field));
    
    console.log('\nChecking admin user...');
    const [adminUser] = await pool.query('SELECT * FROM Staff WHERE Username = ?', ['admin']);
    
    if (adminUser.length === 0) {
      console.log('Admin user not found! Creating default admin user...');
      
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(`
        INSERT INTO Staff (Username, Password, Full_name, Email, Role)
        VALUES ('admin', ?, 'Admin User', 'admin@jewellery.com', 'admin')
      `, [hashedPassword]);
      
      console.log('Default admin user created successfully!');
    } else {
      console.log('Admin user found:', {
        id: adminUser[0].Staff_id,
        username: adminUser[0].Username,
        role: adminUser[0].Role,
        passwordHash: adminUser[0].Password.substring(0, 20) + '...'
      });
      
      // Test password verification
      console.log('\nTesting password verification...');
      const correctPassword = 'admin123';
      const wrongPassword = 'wrongpassword';
      
      const correctResult = await bcrypt.compare(correctPassword, adminUser[0].Password);
      const wrongResult = await bcrypt.compare(wrongPassword, adminUser[0].Password);
      
      console.log('Correct password verification result:', correctResult);
      console.log('Wrong password verification result:', wrongResult);
      
      // Update admin password if needed
      if (!correctResult) {
        console.log('\nAdmin password verification failed! Updating admin password...');
        const newHashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query('UPDATE Staff SET Password = ? WHERE Username = ?', [newHashedPassword, 'admin']);
        console.log('Admin password updated successfully!');
      }
    }
    
    console.log('\nAuth testing completed successfully!');
  } catch (error) {
    console.error('Error during auth testing:', error);
  } finally {
    process.exit(0);
  }
}

testAuth();
