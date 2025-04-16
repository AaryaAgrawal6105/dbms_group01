import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import { generateToken } from '../middleware/authMiddleware.js';

export const authController = {
  // Login user
  login: async (req, res) => {
    console.log('Login attempt with body:', req.body);
    const { username, password } = req.body;
    
    if (!username || !password) {
      console.log('Missing username or password');
      return res.status(400).json({ error: 'Username and password are required' });
    }
    
    try {
      console.log('Querying database for user:', username);
      // Find user by username
      const [users] = await pool.query('SELECT * FROM Staff WHERE Username = ?', [username]);
      
      console.log('Users found:', users.length);
      if (users.length === 0) {
        console.log('No user found with username:', username);
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      const user = users[0];
      console.log('User found:', { id: user.Staff_id, username: user.Username, role: user.Role });
      
      // Check password
      console.log('Comparing passwords...');
      const validPassword = await bcrypt.compare(password, user.Password);
      console.log('Password valid:', validPassword);
      
      if (!validPassword) {
        console.log('Invalid password for user:', username);
        return res.status(401).json({ error: 'Invalid username or password' });
      }
      
      // Update last login timestamp
      console.log('Updating last login timestamp...');
      await pool.query('UPDATE Staff SET Last_login = NOW() WHERE Staff_id = ?', [user.Staff_id]);
      
      // Generate JWT token
      console.log('Generating JWT token...');
      const token = generateToken(user);
      
      // Return user info and token (excluding password)
      const { Password, ...userWithoutPassword } = user;
      console.log('Login successful for user:', username);
      res.json({
        ...userWithoutPassword,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'An error occurred during login' });
    }
  },
  
  // Register new staff (admin only)
  register: async (req, res) => {
    const { username, password, full_name, email, phone, role } = req.body;
    
    try {
      // Check if user is admin (this should be verified by middleware before reaching here)
      if (req.user.role !== 'admin' && role === 'admin') {
        return res.status(403).json({ error: 'Only admins can create admin accounts' });
      }
      
      // Check if username or email already exists
      const [existingUsers] = await pool.query(
        'SELECT * FROM Staff WHERE Username = ? OR Email = ?', 
        [username, email]
      );
      
      if (existingUsers.length > 0) {
        const existingUser = existingUsers[0];
        if (existingUser.Username === username) {
          return res.status(400).json({ error: 'Username already exists' });
        }
        if (existingUser.Email === email) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      
      // Insert new user
      const [result] = await pool.query(
        'INSERT INTO Staff (Username, Password, Full_name, Email, Phone, Role) VALUES (?, ?, ?, ?, ?, ?)',
        [username, hashedPassword, full_name, email, phone, role || 'staff']
      );
      
      res.status(201).json({ 
        message: 'Staff member registered successfully',
        staff_id: result.insertId
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'An error occurred during registration' });
    }
  },
  
  // Get all staff (admin only)
  getAllStaff: async (req, res) => {
    try {
      // Get all staff members (excluding passwords)
      const [rows] = await pool.query('SELECT Staff_id, Username, Full_name, Email, Phone, Role, Created_at, Last_login FROM Staff');
      res.json(rows);
    } catch (error) {
      console.error('Error getting staff list:', error);
      res.status(500).json({ error: 'Failed to retrieve staff list' });
    }
  },
  
  // Get staff by ID (admin only or own profile)
  getStaffById: async (req, res) => {
    try {
      const staffId = req.params.id;
      
      // Check if user is requesting their own profile or is admin
      if (req.user.role !== 'admin' && req.user.id !== parseInt(staffId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Get staff member (excluding password)
      const [rows] = await pool.query(
        'SELECT Staff_id, Username, Full_name, Email, Phone, Role, Created_at, Last_login FROM Staff WHERE Staff_id = ?',
        [staffId]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting staff member:', error);
      res.status(500).json({ error: 'Failed to retrieve staff member' });
    }
  },
  
  // Update staff (admin only or own profile)
  updateStaff: async (req, res) => {
    const { full_name, email, phone, role } = req.body;
    const staffId = req.params.id;
    
    try {
      // Check if user is updating their own profile or is admin
      if (req.user.role !== 'admin' && req.user.id !== parseInt(staffId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Regular staff can't change roles
      if (req.user.role !== 'admin' && role) {
        return res.status(403).json({ error: 'Only admins can change roles' });
      }
      
      // Get current staff data
      const [currentStaff] = await pool.query('SELECT * FROM Staff WHERE Staff_id = ?', [staffId]);
      
      if (currentStaff.length === 0) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      
      // Check if email already exists (if changing email)
      if (email && email !== currentStaff[0].Email) {
        const [existingEmail] = await pool.query('SELECT * FROM Staff WHERE Email = ? AND Staff_id != ?', [email, staffId]);
        if (existingEmail.length > 0) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }
      
      // Update staff data
      const updateFields = [];
      const updateValues = [];
      
      if (full_name) {
        updateFields.push('Full_name = ?');
        updateValues.push(full_name);
      }
      
      if (email) {
        updateFields.push('Email = ?');
        updateValues.push(email);
      }
      
      if (phone) {
        updateFields.push('Phone = ?');
        updateValues.push(phone);
      }
      
      if (role && req.user.role === 'admin') {
        updateFields.push('Role = ?');
        updateValues.push(role);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }
      
      // Add staff ID to values array
      updateValues.push(staffId);
      
      // Execute update query
      const [result] = await pool.query(
        `UPDATE Staff SET ${updateFields.join(', ')} WHERE Staff_id = ?`,
        updateValues
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      
      res.json({ message: 'Staff member updated successfully' });
    } catch (error) {
      console.error('Error updating staff member:', error);
      res.status(500).json({ error: 'Failed to update staff member' });
    }
  },
  
  // Change password
  changePassword: async (req, res) => {
    const { current_password, new_password } = req.body;
    const staffId = req.params.id;
    
    try {
      // Check if user is changing their own password or is admin
      if (req.user.role !== 'admin' && req.user.id !== parseInt(staffId)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      
      // Get current staff data
      const [currentStaff] = await pool.query('SELECT * FROM Staff WHERE Staff_id = ?', [staffId]);
      
      if (currentStaff.length === 0) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      
      // If not admin, verify current password
      if (req.user.role !== 'admin' || req.user.id === parseInt(staffId)) {
        const validPassword = await bcrypt.compare(current_password, currentStaff[0].Password);
        if (!validPassword) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }
      }
      
      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(new_password, salt);
      
      // Update password
      const [result] = await pool.query(
        'UPDATE Staff SET Password = ? WHERE Staff_id = ?',
        [hashedPassword, staffId]
      );
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      
      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ error: 'Failed to change password' });
    }
  },
  
  // Delete staff (admin only)
  deleteStaff: async (req, res) => {
    try {
      const staffId = req.params.id;
      
      // Prevent deleting yourself
      if (req.user.id === parseInt(staffId)) {
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }
      
      // Delete staff member
      const [result] = await pool.query('DELETE FROM Staff WHERE Staff_id = ?', [staffId]);
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Staff member not found' });
      }
      
      res.json({ message: 'Staff member deleted successfully' });
    } catch (error) {
      console.error('Error deleting staff member:', error);
      res.status(500).json({ error: 'Failed to delete staff member' });
    }
  },
  
  // Get current user profile
  getCurrentUser: async (req, res) => {
    try {
      const [rows] = await pool.query(
        'SELECT Staff_id, Username, Full_name, Email, Phone, Role, Created_at, Last_login FROM Staff WHERE Staff_id = ?',
        [req.user.id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(rows[0]);
    } catch (error) {
      console.error('Error getting current user:', error);
      res.status(500).json({ error: 'Failed to retrieve user profile' });
    }
  }
};
