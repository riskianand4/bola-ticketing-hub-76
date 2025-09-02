const jwt = require('jsonwebtoken');
const { getDB } = require('../config/database');

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const db = getDB();
    const result = await db.query(
      'SELECT u.*, p.full_name, p.avatar_url, ur.role FROM users u LEFT JOIN profiles p ON u.id = p.user_id LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.id = $1 AND u.deleted_at IS NULL',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

const requireAdmin = requireRole(['admin', 'super_admin']);
const requireSuperAdmin = requireRole(['super_admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireSuperAdmin
};