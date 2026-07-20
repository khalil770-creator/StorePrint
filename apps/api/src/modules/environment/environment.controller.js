const { query } = require('../../config/db');

// ── List Checklists ───────────────────────────────────────────

exports.listChecklists = async (req, res) => {
  try {
    const { category, active } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE ec.brand_id=$1';
    if (category) { params.push(category);          where += ` AND ec.category=$${params.length}`; }
    if (active !== undefined) { params.push(active === 'true'); where += ` AND ec.is_active=$${params.length}`; }

    const { rows } = await query(
      `SELECT ec.*, u.name as created_by_name,
              COUNT(eci.id)::int as item_count
       FROM environment_checklists ec
       LEFT JOIN users u ON u.id = ec.created_by
       LEFT JOIN environment_checklist_items eci ON eci.checklist_id = ec.id
       ${where}
       GROUP BY ec.id, u.name
       ORDER BY ec.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list checklists' }); }
};

// ── Create Checklist ──────────────────────────────────────────

exports.createChecklist = async (req, res) => {
  try {
    const { title, category, description, frequency, items = [] } = req.body;
    const { rows: cl } = await query(
      `INSERT INTO environment_checklists(brand_id, title, category, description, frequency, created_by)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user.brand_id, title, category || null, description || null,
       frequency || null, req.user.id]
    );

    const insertedItems = [];
    for (const item of items) {
      const { rows } = await query(
        `INSERT INTO environment_checklist_items
           (checklist_id, item_text, order_index, requires_photo, requires_measurement, unit)
         VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
        [cl[0].id, item.item_text, item.order_index || 0,
         item.requires_photo || false, item.requires_measurement || false, item.unit || null]
      );
      insertedItems.push(rows[0]);
    }

    res.status(201).json({ ...cl[0], items: insertedItems });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create checklist' }); }
};

// ── Get Checklist ─────────────────────────────────────────────

exports.getChecklist = async (req, res) => {
  try {
    const { rows: cl } = await query(
      `SELECT ec.*, u.name as created_by_name
       FROM environment_checklists ec
       LEFT JOIN users u ON u.id = ec.created_by
       WHERE ec.id=$1 AND ec.brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!cl.length) return res.status(404).json({ error: 'Checklist not found' });

    const { rows: items } = await query(
      `SELECT * FROM environment_checklist_items WHERE checklist_id=$1 ORDER BY order_index ASC`,
      [req.params.id]
    );
    res.json({ ...cl[0], items });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get checklist' }); }
};

// ── Update Checklist ──────────────────────────────────────────

exports.updateChecklist = async (req, res) => {
  try {
    const { title, description, frequency, is_active, items } = req.body;
    const { rows: cl } = await query(
      `SELECT id FROM environment_checklists WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!cl.length) return res.status(404).json({ error: 'Checklist not found' });

    await query(
      `UPDATE environment_checklists
         SET title=$1, description=$2, frequency=$3, is_active=$4, updated_at=NOW()
       WHERE id=$5`,
      [title, description || null, frequency || null, is_active !== undefined ? is_active : true, req.params.id]
    );

    // Replace items if provided
    if (Array.isArray(items)) {
      await query(`DELETE FROM environment_checklist_items WHERE checklist_id=$1`, [req.params.id]);
      for (const item of items) {
        await query(
          `INSERT INTO environment_checklist_items
             (checklist_id, item_text, order_index, requires_photo, requires_measurement, unit)
           VALUES($1,$2,$3,$4,$5,$6)`,
          [req.params.id, item.item_text, item.order_index || 0,
           item.requires_photo || false, item.requires_measurement || false, item.unit || null]
        );
      }
    }

    res.json({ message: 'Checklist updated' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update checklist' }); }
};

// ── Submit Checklist (GPS required) ──────────────────────────

exports.submitChecklist = async (req, res) => {
  try {
    const { store_id, items = [], notes, gps } = req.body;
    if (!store_id) return res.status(400).json({ error: 'store_id is required' });

    const { rows: cl } = await query(
      `SELECT id FROM environment_checklists WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!cl.length) return res.status(404).json({ error: 'Checklist not found' });

    // Score: count ok items / total non-na items
    const totalItems = items.filter(i => i.status !== 'na').length;
    const okItems    = items.filter(i => i.status === 'ok').length;
    const score      = totalItems > 0 ? Math.round((okItems / totalItems) * 100) : 100;
    const issueItems = items.filter(i => i.status === 'issue');
    const overallStatus = issueItems.length === 0 ? 'pass'
      : issueItems.length === totalItems ? 'fail' : 'partial';

    const { rows: sub } = await query(
      `INSERT INTO environment_submissions
         (checklist_id, store_id, submitted_by, overall_status, score, notes,
          gps_lat, gps_lng, gps_verified)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.id, store_id, req.user.id, overallStatus, score,
       notes || null, gps?.lat || null, gps?.lng || null, req.gpsVerified || false]
    );

    const submissionItems = [];
    for (const item of items) {
      const { rows } = await query(
        `INSERT INTO environment_submission_items
           (submission_id, checklist_item_id, status, value, photo_url, note)
         VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
        [sub[0].id, item.checklist_item_id, item.status || 'na',
         item.value || null, item.photo_url || null, item.note || null]
      );
      submissionItems.push(rows[0]);
    }

    // Auto-create issues for items with issue status
    for (const item of issueItems) {
      const { rows: clItem } = await query(
        `SELECT item_text FROM environment_checklist_items WHERE id=$1`,
        [item.checklist_item_id]
      );
      await query(
        `INSERT INTO environment_issues(submission_id, store_id, item_text, severity, photo_url)
         VALUES($1,$2,$3,$4,$5)`,
        [sub[0].id, store_id, clItem[0]?.item_text || 'Unknown item',
         item.severity || 'medium', item.photo_url || null]
      );
    }

    res.status(201).json({ ...sub[0], items: submissionItems });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to submit checklist' }); }
};

// ── List Submissions ──────────────────────────────────────────

exports.listSubmissions = async (req, res) => {
  try {
    const { store_id, date_from, date_to } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE ec.brand_id=$1';
    if (store_id)  { params.push(store_id);  where += ` AND es.store_id=$${params.length}`; }
    if (date_from) { params.push(date_from); where += ` AND es.submitted_at>=$${params.length}`; }
    if (date_to)   { params.push(date_to);   where += ` AND es.submitted_at<=$${params.length}`; }

    const { rows } = await query(
      `SELECT es.*, ec.title as checklist_title, ec.category,
              s.name as store_name, u.name as submitted_by_name
       FROM environment_submissions es
       JOIN environment_checklists ec ON ec.id = es.checklist_id
       JOIN stores s ON s.id = es.store_id
       LEFT JOIN users u ON u.id = es.submitted_by
       ${where}
       ORDER BY es.submitted_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list submissions' }); }
};

// ── Get Submission ────────────────────────────────────────────

exports.getSubmission = async (req, res) => {
  try {
    const { rows: sub } = await query(
      `SELECT es.*, ec.title as checklist_title, s.name as store_name, u.name as submitted_by_name
       FROM environment_submissions es
       JOIN environment_checklists ec ON ec.id = es.checklist_id
       JOIN stores s ON s.id = es.store_id
       LEFT JOIN users u ON u.id = es.submitted_by
       WHERE es.id=$1 AND ec.brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!sub.length) return res.status(404).json({ error: 'Submission not found' });

    const { rows: items } = await query(
      `SELECT esi.*, eci.item_text, eci.requires_photo, eci.requires_measurement, eci.unit
       FROM environment_submission_items esi
       LEFT JOIN environment_checklist_items eci ON eci.id = esi.checklist_item_id
       WHERE esi.submission_id=$1
       ORDER BY eci.order_index ASC`,
      [req.params.id]
    );
    res.json({ ...sub[0], items });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get submission' }); }
};

// ── List Issues ───────────────────────────────────────────────

exports.listIssues = async (req, res) => {
  try {
    const { store_id, severity, status } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE ec.brand_id=$1';
    if (store_id) { params.push(store_id); where += ` AND ei.store_id=$${params.length}`; }
    if (severity) { params.push(severity); where += ` AND ei.severity=$${params.length}`; }
    if (status)   { params.push(status);   where += ` AND ei.status=$${params.length}`; }
    else          { params.push('resolved'); where += ` AND ei.status<>$${params.length}`; }

    const { rows } = await query(
      `SELECT ei.*, s.name as store_name, u.name as assigned_to_name
       FROM environment_issues ei
       JOIN environment_submissions es ON es.id = ei.submission_id
       JOIN environment_checklists ec ON ec.id = es.checklist_id
       LEFT JOIN stores s ON s.id = ei.store_id
       LEFT JOIN users u ON u.id = ei.assigned_to
       ${where}
       ORDER BY ei.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list issues' }); }
};

// ── Update Issue ──────────────────────────────────────────────

exports.updateIssue = async (req, res) => {
  try {
    const { status, assigned_to, photo_url } = req.body;
    const resolvedAt = status === 'resolved' ? 'NOW()' : null;

    const { rows } = await query(
      `UPDATE environment_issues
       SET status=COALESCE($1, status),
           assigned_to=COALESCE($2, assigned_to),
           photo_url=COALESCE($3, photo_url),
           resolved_at=CASE WHEN $1='resolved' THEN NOW() ELSE resolved_at END
       WHERE id=$4
         AND store_id IN (SELECT id FROM stores WHERE brand_id=$5)
       RETURNING *`,
      [status || null, assigned_to || null, photo_url || null,
       req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Issue not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update issue' }); }
};

// ── Store Environment Report ──────────────────────────────────

exports.storeReport = async (req, res) => {
  try {
    const { rows: store } = await query(
      `SELECT id FROM stores WHERE id=$1 AND brand_id=$2`,
      [req.params.storeId, req.user.brand_id]
    );
    if (!store.length) return res.status(404).json({ error: 'Store not found' });

    const { rows: history } = await query(
      `SELECT es.submitted_at::date as date, AVG(es.score)::int as avg_score,
              COUNT(*)::int as submission_count,
              COUNT(CASE WHEN es.overall_status='pass' THEN 1 END)::int as pass_count
       FROM environment_submissions es
       JOIN environment_checklists ec ON ec.id = es.checklist_id
       WHERE es.store_id=$1 AND ec.brand_id=$2
       GROUP BY es.submitted_at::date
       ORDER BY es.submitted_at::date DESC
       LIMIT 30`,
      [req.params.storeId, req.user.brand_id]
    );

    const { rows: summary } = await query(
      `SELECT AVG(es.score)::int as overall_avg,
              COUNT(*)::int as total_submissions,
              COUNT(CASE WHEN es.overall_status='pass' THEN 1 END)::int as total_pass
       FROM environment_submissions es
       JOIN environment_checklists ec ON ec.id = es.checklist_id
       WHERE es.store_id=$1 AND ec.brand_id=$2`,
      [req.params.storeId, req.user.brand_id]
    );

    res.json({ store_id: req.params.storeId, summary: summary[0], history });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get store report' }); }
};
