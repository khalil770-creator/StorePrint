const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const authenticate = async (req, res, next) => {
  try {
    // Also accept token as ?token= query param for browser download links
    const header = req.headers.authorization;
    const token = (header && header.startsWith('Bearer '))
      ? header.split(' ')[1]
      : req.query.token;
    if (!token) return res.status(401).json({ error: 'Unauthorised' });
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
  const perms = req.user?.permissions;

  // No permissions object at all → super admin (system account)
  if (!perms || Object.keys(perms).length === 0) return next();

  // Wildcard permission
  if (perms['*']?.['*']) return next();

  // Admin module grants full access everywhere
  const adminPerms = perms['admin'];
  if (adminPerms && (adminPerms === true || Object.values(adminPerms).some(Boolean))) return next();

  // Module-level check
  const modPerms = perms[module];
  if (!modPerms) return res.status(403).json({ error: 'Forbidden' });

  // modPerms can be true (full access to module) or { action: bool }
  if (modPerms === true) return next();
  if (typeof modPerms === 'object' && modPerms[action]) return next();

  return res.status(403).json({ error: 'Forbidden' });
};

module.exports = { authenticate, requirePermission };
