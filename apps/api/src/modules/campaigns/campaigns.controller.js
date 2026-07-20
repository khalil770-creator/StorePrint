const { query } = require('../../config/db');

// ── List Campaigns ────────────────────────────────────────────

exports.listCampaigns = async (req, res) => {
  try {
    const { status, brand_id } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE c.brand_id=$1';
    if (status)   { params.push(status);   where += ` AND c.status=$${params.length}`; }
    if (brand_id) { params.push(brand_id); where += ` AND c.brand_id=$${params.length}`; }
    const { rows } = await query(
      `SELECT c.*, u.name as created_by_name,
              COUNT(DISTINCT csa.id) as store_count,
              COUNT(DISTINCT cc.id)  as confirmed_count
       FROM campaigns c
       LEFT JOIN users u ON u.id = c.created_by
       LEFT JOIN campaign_store_assignments csa ON csa.campaign_id = c.id
       LEFT JOIN campaign_confirmations cc ON cc.campaign_id = c.id
       ${where}
       GROUP BY c.id, u.name
       ORDER BY c.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list campaigns' }); }
};

// ── Create Campaign ───────────────────────────────────────────

exports.createCampaign = async (req, res) => {
  try {
    const { title, description, type, start_date, end_date, brief_url, cover_image_url } = req.body;
    const { rows } = await query(
      `INSERT INTO campaigns(brand_id, title, description, type, start_date, end_date,
         brief_url, cover_image_url, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.brand_id, title, description, type, start_date || null,
       end_date || null, brief_url || null, cover_image_url || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create campaign' }); }
};

// ── Get Campaign ──────────────────────────────────────────────

exports.getCampaign = async (req, res) => {
  try {
    const { rows: camp } = await query(
      `SELECT c.*, u.name as created_by_name
       FROM campaigns c
       LEFT JOIN users u ON u.id = c.created_by
       WHERE c.id=$1 AND c.brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!camp.length) return res.status(404).json({ error: 'Campaign not found' });

    const { rows: assets } = await query(
      `SELECT ca.*, u.name as uploaded_by_name FROM campaign_assets ca
       LEFT JOIN users u ON u.id = ca.uploaded_by
       WHERE ca.campaign_id=$1 ORDER BY ca.created_at DESC`,
      [req.params.id]
    );
    const { rows: assignments } = await query(
      `SELECT csa.*, s.name as store_name, u.name as assigned_by_name
       FROM campaign_store_assignments csa
       JOIN stores s ON s.id = csa.store_id
       LEFT JOIN users u ON u.id = csa.assigned_by
       WHERE csa.campaign_id=$1`,
      [req.params.id]
    );
    const { rows: confirmations } = await query(
      `SELECT cc.*, s.name as store_name, u.name as confirmed_by_name
       FROM campaign_confirmations cc
       JOIN stores s ON s.id = cc.store_id
       LEFT JOIN users u ON u.id = cc.confirmed_by
       WHERE cc.campaign_id=$1`,
      [req.params.id]
    );
    res.json({ ...camp[0], assets, store_assignments: assignments, confirmations });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get campaign' }); }
};

// ── Update Campaign ───────────────────────────────────────────

exports.updateCampaign = async (req, res) => {
  try {
    const { title, description, type, status, start_date, end_date, brief_url, cover_image_url } = req.body;
    const { rows } = await query(
      `UPDATE campaigns SET title=$1, description=$2, type=$3, status=$4,
         start_date=$5, end_date=$6, brief_url=$7, cover_image_url=$8, updated_at=NOW()
       WHERE id=$9 AND brand_id=$10 RETURNING *`,
      [title, description, type, status, start_date || null, end_date || null,
       brief_url || null, cover_image_url || null, req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Campaign not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update campaign' }); }
};

// ── Publish Campaign ──────────────────────────────────────────

exports.publishCampaign = async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE campaigns SET status='published', updated_at=NOW()
       WHERE id=$1 AND brand_id=$2 AND status='draft' RETURNING *`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Campaign not found or not in draft status' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to publish campaign' }); }
};

// ── Upload Asset ──────────────────────────────────────────────

exports.uploadAsset = async (req, res) => {
  try {
    const { name, file_url, file_type, size_bytes } = req.body;
    // Verify campaign belongs to brand
    const { rows: camp } = await query(
      `SELECT id FROM campaigns WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!camp.length) return res.status(404).json({ error: 'Campaign not found' });

    const { rows } = await query(
      `INSERT INTO campaign_assets(campaign_id, name, file_url, file_type, size_bytes, uploaded_by)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.params.id, name, file_url, file_type || null, size_bytes || null, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to upload asset' }); }
};

// ── Assign Stores ─────────────────────────────────────────────

exports.assignStores = async (req, res) => {
  try {
    const { store_ids = [] } = req.body;
    if (!Array.isArray(store_ids) || !store_ids.length) {
      return res.status(400).json({ error: 'store_ids array is required' });
    }
    const { rows: camp } = await query(
      `SELECT id FROM campaigns WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!camp.length) return res.status(404).json({ error: 'Campaign not found' });

    const inserted = [];
    for (const store_id of store_ids) {
      const { rows } = await query(
        `INSERT INTO campaign_store_assignments(campaign_id, store_id, assigned_by)
         VALUES($1,$2,$3)
         ON CONFLICT(campaign_id, store_id) DO NOTHING RETURNING *`,
        [req.params.id, store_id, req.user.id]
      );
      if (rows.length) inserted.push(rows[0]);
    }
    res.status(201).json({ assigned: inserted.length, records: inserted });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to assign stores' }); }
};

// ── Confirm Campaign (GPS required) ──────────────────────────

exports.confirmCampaign = async (req, res) => {
  try {
    const { store_id, photo_url, notes, gps } = req.body;
    const { rows: camp } = await query(
      `SELECT id FROM campaigns WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!camp.length) return res.status(404).json({ error: 'Campaign not found' });

    const { rows } = await query(
      `INSERT INTO campaign_confirmations
         (campaign_id, store_id, confirmed_by, photo_url, gps_lat, gps_lng, gps_verified, notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT(campaign_id, store_id) DO UPDATE
         SET photo_url=$4, gps_lat=$5, gps_lng=$6, gps_verified=$7,
             notes=$8, confirmed_at=NOW(), confirmed_by=$3
       RETURNING *`,
      [req.params.id, store_id, req.user.id, photo_url || null,
       gps.lat, gps.lng, req.gpsVerified, notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to confirm campaign' }); }
};

// ── Compliance Report ─────────────────────────────────────────

exports.getCompliance = async (req, res) => {
  try {
    const { rows: camp } = await query(
      `SELECT id FROM campaigns WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!camp.length) return res.status(404).json({ error: 'Campaign not found' });

    const { rows } = await query(
      `SELECT
         COUNT(DISTINCT csa.store_id)::int  AS total_stores,
         COUNT(DISTINCT cc.store_id)::int   AS confirmed_stores,
         ROUND(
           CASE WHEN COUNT(DISTINCT csa.store_id) = 0 THEN 0
                ELSE COUNT(DISTINCT cc.store_id)::numeric
                     / COUNT(DISTINCT csa.store_id)::numeric * 100
           END, 2
         ) AS compliance_pct
       FROM campaign_store_assignments csa
       LEFT JOIN campaign_confirmations cc
         ON cc.campaign_id = csa.campaign_id AND cc.store_id = csa.store_id
       WHERE csa.campaign_id=$1`,
      [req.params.id]
    );

    const { rows: storeRows } = await query(
      `SELECT s.id, s.name,
              CASE WHEN cc.id IS NOT NULL THEN true ELSE false END as confirmed,
              cc.confirmed_at, cc.gps_verified
       FROM campaign_store_assignments csa
       JOIN stores s ON s.id = csa.store_id
       LEFT JOIN campaign_confirmations cc
         ON cc.campaign_id = csa.campaign_id AND cc.store_id = csa.store_id
       WHERE csa.campaign_id=$1
       ORDER BY s.name`,
      [req.params.id]
    );

    res.json({ ...rows[0], stores: storeRows });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get compliance' }); }
};
