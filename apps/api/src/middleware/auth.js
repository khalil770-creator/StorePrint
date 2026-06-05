const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorised' });
    }
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const { rows } = await query(
      `SELECT u.*, r.permissions FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1 AND u.status = 'active'`,
      [decoded.sub]
    );
    if (!rows.length) return res.status(401).json({ error: 'Unauthorised' });

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const requirePermission = (module, action) => (req, res, next) => {
  const perms = req.user?.permissions || {};
  if (perms[module]?.[action] || perms['*']?.['*']) return next();
  return res.status(403).json({ error: 'Forbidden' });
};

module.exports = { authenticate, requirePermission };
