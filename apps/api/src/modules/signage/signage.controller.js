const { query } = require('../../config/db');

// ── Signage Templates ─────────────────────────────────────────

exports.listTemplates = async (req, res) => {
  try {
    const { category } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE st.brand_id=$1 AND st.is_active=true';
    if (category) { params.push(category); where += ` AND st.category=$${params.length}`; }
    const { rows } = await query(
      `SELECT st.*, u.name as created_by_name
       FROM signage_templates st
       LEFT JOIN users u ON u.id = st.created_by
       ${where}
       ORDER BY st.category, st.title`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list signage templates' }); }
};

exports.createTemplate = async (req, res) => {
  try {
    const { title, description, category, dimensions, file_url, thumbnail_url, is_active } = req.body;
    const { rows } = await query(
      `INSERT INTO signage_templates(brand_id, title, description, category, dimensions,
         file_url, thumbnail_url, is_active, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.brand_id, title, description || null, category, dimensions || null,
       file_url || null, thumbnail_url || null,
       is_active !== undefined ? is_active : true, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create signage template' }); }
};

exports.getTemplate = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT st.*, u.name as created_by_name
       FROM signage_templates st
       LEFT JOIN users u ON u.id = st.created_by
       WHERE st.id=$1 AND st.brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Signage template not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get signage template' }); }
};

// ── Print Requests ────────────────────────────────────────────

exports.listPrintRequests = async (req, res) => {
  try {
    const { store_id, status } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE pr.brand_id=$1';
    if (store_id) { params.push(store_id); where += ` AND pr.store_id=$${params.length}`; }
    if (status)   { params.push(status);   where += ` AND pr.status=$${params.length}`; }
    const { rows } = await query(
      `SELECT pr.*, s.name as store_name, st.title as template_title,
              u.name as requested_by_name
       FROM print_requests pr
       JOIN stores s ON s.id = pr.store_id
       LEFT JOIN signage_templates st ON st.id = pr.template_id
       LEFT JOIN users u ON u.id = pr.requested_by
       ${where}
       ORDER BY pr.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list print requests' }); }
};

exports.createPrintRequest = async (req, res) => {
  try {
    const { store_id, template_id, quantity, special_instructions } = req.body;
    const { rows } = await query(
      `INSERT INTO print_requests(brand_id, store_id, template_id, requested_by, quantity,
         special_instructions)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.brand_id, store_id, template_id || null, req.user.id,
       quantity || 1, special_instructions || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create print request' }); }
};

exports.updatePrintRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['pending','approved','in_production','delivered','cancelled'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${allowed.join(', ')}` });
    }
    const { rows } = await query(
      `UPDATE print_requests SET status=$1, updated_at=NOW()
       WHERE id=$2 AND brand_id=$3 RETURNING *`,
      [status, req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Print request not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update print request status' }); }
};

// ── Signage Installations (GPS required) ─────────────────────

exports.confirmInstallation = async (req, res) => {
  try {
    const { store_id, template_id, photo_url, placement_zone, notes, gps } = req.body;
    // Verify store belongs to this brand
    const { rows: storeCheck } = await query(
      `SELECT id FROM stores WHERE id=$1 AND brand_id=$2`,
      [store_id, req.user.brand_id]
    );
    if (!storeCheck.length) return res.status(404).json({ error: 'Store not found' });
    // Verify template belongs to this brand if provided
    if (template_id) {
      const { rows: tmplCheck } = await query(
        `SELECT id FROM signage_templates WHERE id=$1 AND brand_id=$2`,
        [template_id, req.user.brand_id]
      );
      if (!tmplCheck.length) return res.status(404).json({ error: 'Template not found' });
    }
    const { rows } = await query(
      `INSERT INTO signage_installations
         (store_id, template_id, installed_by, photo_url, placement_zone,
          gps_lat, gps_lng, gps_verified, notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [store_id, template_id || null, req.user.id, photo_url || null,
       placement_zone || null, gps.lat, gps.lng, req.gpsVerified, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to confirm installation' }); }
};

// ── Compliance Report ─────────────────────────────────────────

exports.getCompliance = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.id, s.name as store_name,
              COUNT(si.id)::int                                               AS total_installations,
              COUNT(CASE WHEN si.gps_verified THEN 1 END)::int               AS gps_verified_count,
              COUNT(DISTINCT si.template_id)::int                            AS unique_templates,
              MAX(si.installed_at)                                           AS last_installation_at
       FROM stores s
       LEFT JOIN signage_installations si ON si.store_id = s.id
       WHERE s.brand_id=$1
       GROUP BY s.id
       ORDER BY total_installations DESC`,
      [req.user.brand_id]
    );

    const { rows: summary } = await query(
      `SELECT
         COUNT(DISTINCT s.id)::int   AS total_stores,
         COUNT(si.id)::int           AS total_installations,
         COUNT(CASE WHEN si.gps_verified THEN 1 END)::int AS verified_installations
       FROM stores s
       LEFT JOIN signage_installations si ON si.store_id = s.id
       WHERE s.brand_id=$1`,
      [req.user.brand_id]
    );

    res.json({ summary: summary[0], stores: rows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get signage compliance' }); }
};
