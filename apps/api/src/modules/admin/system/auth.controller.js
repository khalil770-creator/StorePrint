const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../../config/db');
const { client: redis } = require('../../../config/redis');

const signTokens = (user) => {
  const access = jwt.sign(
    { sub: user.id, brand_id: user.brand_id, role_id: user.role_id },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
  const refresh = jwt.sign(
    { sub: user.id, type: 'refresh' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
  return { access, refresh };
};

exports.login = async (req, res) => {
  try {
    const { email, password, device_id, device_name } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const { rows } = await query(
      `SELECT u.*, r.permissions FROM users u
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.email=$1 AND u.status='active'`,
      [email.toLowerCase()]
    );

    if (!rows.length) {
      await query(
        `INSERT INTO login_history(user_id,ip_address,device_id,status) VALUES(NULL,$1,$2,'failed')`,
        [req.ip, device_id || null]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await query(
        `INSERT INTO login_history(user_id,ip_address,device_id,status) VALUES($1,$2,$3,'failed')`,
        [user.id, req.ip, device_id || null]
      );
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const tokens = signTokens(user);

    await query(
      `INSERT INTO user_sessions(user_id,device_id,device_name,ip_address,user_agent,expires_at)
       VALUES($1,$2,$3,$4,$5,NOW()+INTERVAL '30 days')`,
      [user.id, device_id || null, device_name || null, req.ip, req.headers['user-agent']]
    );
    await query(
      `INSERT INTO login_history(user_id,ip_address,device_id,status) VALUES($1,$2,$3,'success')`,
      [user.id, req.ip, device_id || null]
    );
    await query(`UPDATE users SET last_active_at=NOW() WHERE id=$1`, [user.id]);

    delete user.password_hash;
    res.json({ user, tokens });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
};

exports.refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const decoded = jwt.verify(refresh_token, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') return res.status(401).json({ error: 'Invalid token' });

    const blacklisted = await redis.get(`blacklist:user:${decoded.sub}`);
    if (blacklisted) return res.status(401).json({ error: 'Session terminated' });

    const { rows } = await query(
      `SELECT * FROM users WHERE id=$1 AND status='active'`, [decoded.sub]
    );
    if (!rows.length) return res.status(401).json({ error: 'User not found' });

    const tokens = signTokens(rows[0]);
    res.json({ tokens });
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
};

exports.logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
      const decoded = jwt.decode(token);
      const ttl = decoded?.exp ? decoded.exp - Math.floor(Date.now() / 1000) : 3600;
      if (ttl > 0) await redis.set(`blacklist:${token}`, '1', { EX: ttl });
    }
    res.json({ message: 'Logged out' });
  } catch (err) {
    res.status(500).json({ error: 'Logout failed' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = { ...req.user };
    delete user.password_hash;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const { rows } = await query(`SELECT password_hash FROM users WHERE id=$1`, [req.user.id]);
    const valid = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!valid) return res.status(400).json({ error: 'Current password is incorrect' });
    const hash = await bcrypt.hash(new_password, 12);
    await query(`UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2`, [hash, req.user.id]);
    res.json({ message: 'Password updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
};
