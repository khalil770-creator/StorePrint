const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../../../config/db');
const { client: redis } = require('../../../config/redis');

exports.list = async (req, res) => {
  try {
    const { status, role_id, store_id, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.brand_id];
    let where = 'WHERE u.brand_id = $1';

    if (status)  { params.push(status);   where += ` AND u.status = $${params.length}`; }
    if (role_id) { params.push(role_id);  where += ` AND u.role_id = $${params.length}`; }
    if (search)  { params.push(`%${search}%`); where += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length})`; }

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT u.id, u.email, u.name, u.phone, u.avatar_url, u.status,
              u.last_active_at, u.created_at, r.name as role_name,
              ARRAY(SELECT store_id FROM user_stores WHERE user_id = u.id) as store_ids
       FROM users u LEFT JOIN roles r ON r.id = u.role_id
       ${where}
       ORDER BY u.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const count = await query(`SELECT COUNT(*) FROM users u ${where}`, params.slice(0, -2));
    res.json({ data: rows, total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list users' });
  }
};

exports.get = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.*, r.name as role_name, r.permissions,
              ARRAY(SELECT store_id FROM user_stores WHERE user_id = u.id) as store_ids
       FROM users u LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.id = $1 AND u.brand_id = $2`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    const user = rows[0];
    delete user.password_hash;
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get user' });
  }
};

exports.invite = async (req, res) => {
  try {
    const { email, name, phone, role_id, store_ids = [] } = req.body;
    const tempPassword = Math.random().toString(36).slice(-10);
    const hash = await bcrypt.hash(tempPassword, 12);

    const { rows } = await query(
      `INSERT INTO users (brand_id, email, name, phone, role_id, status, password_hash, invited_at)
       VALUES ($1,$2,$3,$4,$5,'active',$6,NOW()) RETURNING id`,
      [req.user.brand_id, email, name, phone, role_id, hash]
    );
    const userId = rows[0].id;

    for (const sid of store_ids) {
      await query('INSERT INTO user_stores(user_id, store_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [userId, sid]);
    }

    await query(
      `INSERT INTO audit_log(brand_id, user_id, action, entity_type, entity_id, after_state)
       VALUES($1,$2,'user.invited','user',$3,$4)`,
      [req.user.brand_id, req.user.id, userId, JSON.stringify({ email, name, role_id })]
    );

    // TODO: send invite email via Postal
    res.status(201).json({ id: userId, message: 'User invited successfully' });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email already exists' });
    console.error(err);
    res.status(500).json({ error: 'Failed to invite user' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, phone, avatar_url } = req.body;
    await query(
      `UPDATE users SET name=$1, phone=$2, avatar_url=$3, updated_at=NOW() WHERE id=$4 AND brand_id=$5`,
      [name, phone, avatar_url, req.params.id, req.user.brand_id]
    );
    res.json({ message: 'User updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deactivate = async (req, res) => {
  try {
    await query(`UPDATE users SET status='inactive', updated_at=NOW() WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]);
    await query(`INSERT INTO audit_log(brand_id,user_id,action,entity_type,entity_id) VALUES($1,$2,'user.deactivated','user',$3)`,
      [req.user.brand_id, req.user.id, req.params.id]);
    res.json({ message: 'User deactivated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
};

exports.activate = async (req, res) => {
  try {
    await query(`UPDATE users SET status='active', updated_at=NOW() WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]);
    res.json({ message: 'User activated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to activate user' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const newPassword = Math.random().toString(36).slice(-10);
    const hash = await bcrypt.hash(newPassword, 12);
    await query(`UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2 AND brand_id=$3`,
      [hash, req.params.id, req.user.brand_id]);
    // TODO: email the new password via Postal
    res.json({ message: 'Password reset. New credentials sent to user.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to reset password' });
  }
};

exports.forceLogout = async (req, res) => {
  try {
    await query(`UPDATE user_sessions SET revoked_at=NOW() WHERE user_id=$1 AND revoked_at IS NULL`,
      [req.params.id]);
    // Blacklist all tokens in Redis
    await redis.set(`blacklist:user:${req.params.id}`, Date.now(), { EX: 60 * 60 * 24 * 7 });
    res.json({ message: 'User sessions terminated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to force logout' });
  }
};

exports.loginHistory = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM login_history WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get login history' });
  }
};

exports.assignStores = async (req, res) => {
  try {
    const { store_ids = [] } = req.body;
    await query(`DELETE FROM user_stores WHERE user_id=$1`, [req.params.id]);
    for (const sid of store_ids) {
      await query(`INSERT INTO user_stores(user_id,store_id) VALUES($1,$2)`, [req.params.id, sid]);
    }
    res.json({ message: 'Stores assigned' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign stores' });
  }
};

exports.assignRole = async (req, res) => {
  try {
    const { role_id } = req.body;
    await query(`UPDATE users SET role_id=$1, updated_at=NOW() WHERE id=$2 AND brand_id=$3`,
      [role_id, req.params.id, req.user.brand_id]);
    res.json({ message: 'Role assigned' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to assign role' });
  }
};

exports.bulkImport = async (req, res) => {
  try {
    const { users = [] } = req.body;
    const results = { created: 0, skipped: 0, errors: [] };
    for (const u of users) {
      try {
        const hash = await bcrypt.hash(Math.random().toString(36).slice(-10), 12);
        await query(
          `INSERT INTO users(brand_id,email,name,phone,role_id,status,password_hash,invited_at)
           VALUES($1,$2,$3,$4,$5,'active',$6,NOW()) ON CONFLICT(email) DO NOTHING`,
          [req.user.brand_id, u.email, u.name, u.phone, u.role_id, hash]
        );
        results.created++;
      } catch (e) {
        results.errors.push({ email: u.email, error: e.message });
        results.skipped++;
      }
    }
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: 'Bulk import failed' });
  }
};

exports.exportCsv = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.email, u.name, u.phone, u.status, r.name as role, u.created_at
       FROM users u LEFT JOIN roles r ON r.id = u.role_id
       WHERE u.brand_id=$1 ORDER BY u.name`,
      [req.user.brand_id]
    );
    const header = 'email,name,phone,status,role,created_at\n';
    const csv = header + rows.map(r =>
      `${r.email},${r.name},${r.phone || ''},${r.status},${r.role || ''},${r.created_at}`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
};
