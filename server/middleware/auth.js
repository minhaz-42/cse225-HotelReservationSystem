/**
 * @module middleware/auth
 * JWT verification and role-based access control.
 */
const jwt = require('jsonwebtoken');
const env = require('../config/env');

/**
 * Verify the Bearer token and attach `req.user`.
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const token = header.split(' ')[1];
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = payload;          // { id, username, role }
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * Restrict access to one or more roles.
 * @param  {...string} roles  e.g. 'admin'
 */
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    next();
  };
}

module.exports = { authenticate, authorize };
