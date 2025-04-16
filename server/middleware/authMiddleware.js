import jwt from 'jsonwebtoken';

// Secret key for JWT
const JWT_SECRET = process.env.JWT_SECRET || 'jewellery-management-secret-key';

// Middleware to verify JWT token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN format
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token.' });
  }
};

// Middleware to check if user is admin
export const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }

  next();
};

// Middleware to generate JWT token
export const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.Staff_id, 
      username: user.Username, 
      role: user.Role 
    }, 
    JWT_SECRET, 
    { expiresIn: '24h' }
  );
};
