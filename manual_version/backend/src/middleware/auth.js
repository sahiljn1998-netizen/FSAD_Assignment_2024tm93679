const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * auth middleware — verifies JWT and attaches user (without password) to req.user
 */
const auth = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '') || req.query?.token;
  if (!token) return res.status(401).json({ error: 'No token, authorization denied' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const user = await User.findById(decoded.user.id).select('-password');
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err.message || err);
    return res.status(401).json({ error: 'Token is not valid' });
  }
};

/**
 * authorize roles — returns middleware that ensures req.user.role is in allowedRoles
 */
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: 'Not authenticated' });
  if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
  next();
};

module.exports = { auth, authorize };
