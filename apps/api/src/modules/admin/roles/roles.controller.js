const { query } = require('../../../config/db');

// All available modules and their actions — drives the permission matrix UI
const MODULE_ACTIONS = {
  admin:          ['create', 'read', 'update', 'delete', 'export'],
  brand_hub:      ['create', 'read', 'update', 'delete', 'export'],
  auditing:       ['create', 'read', 'update', 'delete', 'export'],
  field_presence: ['create', 'read', 'update', 'delete', 'export'],
  vm:             ['create', 'read', 'update', 'delete', 'export'],
  signage:        ['create', 'read', 'update', 'delete', 'export'],
  campaigns:      ['create', 'read', 'update', 'delete', 'export'],
  training:       ['create', 'read', 'update', 'delete', 'export'],
  environment:    ['create', 'read', 'update', 'delete', 'export'],
  cx_feedback:    ['create', 'read', 'update', 'delete', 'export'],
  analytics:      ['read', 'export'],
};

exports.permissionMatrix = (req, res) => res.json(MODULE_ACTIONS);

exports.list = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT r.*, COUNT(u.id) as user_count
       FROM roles r LEFT JOIN users u ON u.role_id = r.id
       WHERE r.brand_id=$1 GROUP BY r.id ORDER BY r.is_system DESC, r.name`,
      [req.user.brand_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to list roles' });
  }
};

exports.get = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM roles WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Role not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get role' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, description, permissions = {} } = req.body;
    const { rows } = await query(
      `INSERT INTO roles(brand_id, name, description, permissions) VALUES($1,$2,$3,$4) RETURNING *`,
      [req.user.brand_id, name, description, JSON.stringify(permissions)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Role name already exists' });
    res.status(500).json({ error: 'Failed to create role' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;
    const { rows } = await query(
      `UPDATE roles SET name=$1, description=$2, permissions=$3, updated_at=NOW()
       WHERE id=$4 AND brand_id=$5 AND is_system=FALSE RETURNING *`,
      [name, description, JSON.stringify(permissions), req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Role not found or is a system role' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update role' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { rows } = await query(
      `DELETE FROM roles WHERE id=$1 AND brand_id=$2 AND is_system=FALSE RETURNING id`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Role not found or is a system role' });
    res.json({ message: 'Role deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete role' });
  }
};

exports.clone = async (req, res) => {
  try {
    const { rows: source } = await query(
      `SELECT * FROM roles WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!source.length) return res.status(404).json({ error: 'Role not found' });
    const { name = `${source[0].name} (copy)` } = req.body;
    const { rows } = await query(
      `INSERT INTO roles(brand_id, name, description, permissions) VALUES($1,$2,$3,$4) RETURNING *`,
      [req.user.brand_id, name, source[0].description, source[0].permissions]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to clone role' });
  }
};
