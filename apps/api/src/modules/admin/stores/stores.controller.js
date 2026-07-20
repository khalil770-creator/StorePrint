const { query } = require('../../../config/db');

exports.listBasic = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id, name, format, status FROM stores WHERE brand_id=$1 AND status='active' ORDER BY name`,
      [req.user.brand_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to list stores' }); }
};

exports.list = async (req, res) => {
  try {
    const { status, format, region_id, area_id, search, tags, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.brand_id];
    let where = 'WHERE s.brand_id=$1';

    if (status)    { params.push(status);       where += ` AND s.status=$${params.length}`; }
    if (format)    { params.push(format);        where += ` AND s.format=$${params.length}`; }
    if (area_id)   { params.push(area_id);       where += ` AND s.area_id=$${params.length}`; }
    if (search)    { params.push(`%${search}%`); where += ` AND s.name ILIKE $${params.length}`; }
    if (tags)      { params.push(tags.split(',')); where += ` AND s.tags && $${params.length}`; }

    params.push(limit, offset);
    const { rows } = await query(
      `SELECT s.*, a.name as area_name, r.name as region_name, co.name as country_name
       FROM stores s
       LEFT JOIN areas a ON a.id = s.area_id
       LEFT JOIN regions r ON r.id = a.region_id
       LEFT JOIN countries co ON co.id = r.country_id
       ${where}
       ORDER BY s.name
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const count = await query(`SELECT COUNT(*) FROM stores s ${where}`, params.slice(0, -2));
    res.json({ data: rows, total: parseInt(count.rows[0].count), page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to list stores' });
  }
};

exports.get = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.*, a.name as area_name, r.name as region_name
       FROM stores s
       LEFT JOIN areas a ON a.id = s.area_id
       LEFT JOIN regions r ON r.id = a.region_id
       WHERE s.id=$1 AND s.brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Store not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get store' });
  }
};

exports.create = async (req, res) => {
  try {
    const { name, code, format, address, city, country, lat, lng,
            geofence_radius, opening_hours, photos, status, tags, area_id,
            phone, contact_person, contact_cell } = req.body;
    const { rows } = await query(
      `INSERT INTO stores
        (brand_id, name, code, format, address, city, country, lat, lng,
         geofence_radius, opening_hours, photos, status, tags, area_id,
         phone, contact_person, contact_cell)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [req.user.brand_id, name, code, format, address, city, country,
       lat, lng, geofence_radius || 100, JSON.stringify(opening_hours || {}),
       photos || [], status || 'active', tags || [], area_id,
       phone || null, contact_person || null, contact_cell || null]
    );
    await query(
      `INSERT INTO audit_log(brand_id,user_id,action,entity_type,entity_id,after_state)
       VALUES($1,$2,'store.created','store',$3,$4)`,
      [req.user.brand_id, req.user.id, rows[0].id, JSON.stringify({ name, code })]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Store code already exists' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create store' });
  }
};

exports.update = async (req, res) => {
  try {
    const { name, code, format, address, city, country, lat, lng,
            geofence_radius, opening_hours, photos, tags, area_id,
            phone, contact_person, contact_cell } = req.body;
    const { rows } = await query(
      `UPDATE stores SET name=$1,code=$2,format=$3,address=$4,city=$5,country=$6,
         lat=$7,lng=$8,geofence_radius=$9,opening_hours=$10,photos=$11,tags=$12,
         area_id=$13,phone=$14,contact_person=$15,contact_cell=$16,updated_at=NOW()
       WHERE id=$17 AND brand_id=$18 RETURNING *`,
      [name, code, format, address, city, country, lat, lng, geofence_radius,
       JSON.stringify(opening_hours || {}), photos, tags, area_id,
       phone || null, contact_person || null, contact_cell || null,
       req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Store not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update store' });
  }
};

exports.setStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['active', 'inactive', 'renovating'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }
    await query(`UPDATE stores SET status=$1, updated_at=NOW() WHERE id=$2 AND brand_id=$3`,
      [status, req.params.id, req.user.brand_id]);
    res.json({ message: `Store status set to ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update store status' });
  }
};

exports.setGeofence = async (req, res) => {
  try {
    const { geofence_radius } = req.body;
    await query(`UPDATE stores SET geofence_radius=$1, updated_at=NOW() WHERE id=$2 AND brand_id=$3`,
      [geofence_radius, req.params.id, req.user.brand_id]);
    res.json({ message: `Geo-fence radius set to ${geofence_radius}m` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update geofence' });
  }
};

exports.getStaff = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, u.phone, u.status, r.name as role
       FROM users u
       JOIN user_stores us ON us.user_id = u.id
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE us.store_id=$1 AND u.brand_id=$2
       ORDER BY u.name`,
      [req.params.id, req.user.brand_id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to get store staff' });
  }
};

exports.hierarchy = async (req, res) => {
  try {
    const { rows: countries } = await query(`SELECT * FROM countries WHERE brand_id=$1`, [req.user.brand_id]);
    const { rows: regions }   = await query(`SELECT * FROM regions WHERE country_id IN (SELECT id FROM countries WHERE brand_id=$1)`, [req.user.brand_id]);
    const { rows: areas }     = await query(`SELECT * FROM areas WHERE region_id IN (SELECT id FROM regions WHERE country_id IN (SELECT id FROM countries WHERE brand_id=$1))`, [req.user.brand_id]);
    const { rows: stores }    = await query(`SELECT id,name,code,status,format,area_id FROM stores WHERE brand_id=$1`, [req.user.brand_id]);

    const build = (countries) => countries.map(c => ({
      ...c,
      regions: regions.filter(r => r.country_id === c.id).map(r => ({
        ...r,
        areas: areas.filter(a => a.region_id === r.id).map(a => ({
          ...a,
          stores: stores.filter(s => s.area_id === a.id)
        }))
      }))
    }));

    res.json(build(countries));
  } catch (err) {
    res.status(500).json({ error: 'Failed to get hierarchy' });
  }
};

exports.exportCsv = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.name,s.code,s.format,s.address,s.city,s.country,s.status,s.lat,s.lng
       FROM stores s WHERE s.brand_id=$1 ORDER BY s.name`,
      [req.user.brand_id]
    );
    const header = 'name,code,format,address,city,country,status,lat,lng\n';
    const csv = header + rows.map(r =>
      `"${r.name}","${r.code||''}","${r.format||''}","${r.address||''}","${r.city||''}","${r.country||''}","${r.status}","${r.lat||''}","${r.lng||''}"`
    ).join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=stores.csv');
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: 'Export failed' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { rows } = await query(
      `DELETE FROM stores WHERE id=$1 AND brand_id=$2 RETURNING id, name`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Store not found' });
    await query(
      `INSERT INTO audit_log(brand_id,user_id,action,entity_type,entity_id,after_state)
       VALUES($1,$2,'store.deleted','store',$3,$4)`,
      [req.user.brand_id, req.user.id, rows[0].id, JSON.stringify({ name: rows[0].name })]
    );
    res.json({ message: `Store "${rows[0].name}" deleted.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete store' });
  }
};
