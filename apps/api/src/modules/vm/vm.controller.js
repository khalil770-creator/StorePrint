const { query } = require('../../config/db');

// ── VM Templates ──────────────────────────────────────────────

exports.listTemplates = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.*, u.name as created_by_name
       FROM vm_templates t
       LEFT JOIN users u ON u.id = t.created_by
       WHERE t.brand_id=$1
       ORDER BY t.created_at DESC`,
      [req.user.brand_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list VM templates' }); }
};

exports.createTemplate = async (req, res) => {
  try {
    const { title, description, zone_name, planogram_url, instructions, is_active } = req.body;
    const { rows } = await query(
      `INSERT INTO vm_templates(brand_id, title, description, zone_name, planogram_url,
         instructions, is_active, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.brand_id, title, description || null, zone_name || null,
       planogram_url || null, instructions || null,
       is_active !== undefined ? is_active : true, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create VM template' }); }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { title, description, zone_name, planogram_url, instructions, is_active } = req.body;
    const { rows } = await query(
      `UPDATE vm_templates SET title=$1, description=$2, zone_name=$3, planogram_url=$4,
         instructions=$5, is_active=$6, updated_at=NOW()
       WHERE id=$7 AND brand_id=$8 RETURNING *`,
      [title, description || null, zone_name || null, planogram_url || null,
       instructions || null, is_active !== undefined ? is_active : true,
       req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Template not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update VM template' }); }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const { rows } = await query(
      `DELETE FROM vm_templates WHERE id=$1 AND brand_id=$2 RETURNING id`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Template not found' });
    res.json({ success: true });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete VM template' }); }
};

// ── VM Tasks ──────────────────────────────────────────────────

exports.listTasks = async (req, res) => {
  try {
    const { store_id, status, assigned_to } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE vt.brand_id=$1';
    if (store_id)    { params.push(store_id);    where += ` AND vt.store_id=$${params.length}`; }
    if (status)      { params.push(status);      where += ` AND vt.status=$${params.length}`; }
    if (assigned_to) { params.push(assigned_to); where += ` AND vt.assigned_to=$${params.length}`; }

    const { rows } = await query(
      `SELECT vt.*, s.name as store_name, u.name as assigned_to_name,
              tmpl.title as template_title
       FROM vm_tasks vt
       JOIN stores s ON s.id = vt.store_id
       LEFT JOIN users u ON u.id = vt.assigned_to
       LEFT JOIN vm_templates tmpl ON tmpl.id = vt.template_id
       ${where}
       ORDER BY vt.due_date ASC NULLS LAST, vt.priority DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list VM tasks' }); }
};

exports.createTask = async (req, res) => {
  try {
    const { template_id, store_id, assigned_to, title, due_date, priority } = req.body;
    const { rows } = await query(
      `INSERT INTO vm_tasks(brand_id, template_id, store_id, assigned_to, title, due_date,
         priority, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.brand_id, template_id || null, store_id, assigned_to || null,
       title, due_date || null, priority || 'medium', req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create VM task' }); }
};

exports.getTask = async (req, res) => {
  try {
    const { rows: task } = await query(
      `SELECT vt.*, s.name as store_name, u.name as assigned_to_name,
              tmpl.title as template_title, tmpl.planogram_url, tmpl.instructions, tmpl.zone_name
       FROM vm_tasks vt
       JOIN stores s ON s.id = vt.store_id
       LEFT JOIN users u ON u.id = vt.assigned_to
       LEFT JOIN vm_templates tmpl ON tmpl.id = vt.template_id
       WHERE vt.id=$1 AND vt.brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!task.length) return res.status(404).json({ error: 'VM task not found' });

    // Get latest submission and its photos
    const { rows: submissions } = await query(
      `SELECT vs.*, u.name as submitted_by_name, rv.name as reviewed_by_name
       FROM vm_submissions vs
       LEFT JOIN users u ON u.id = vs.submitted_by
       LEFT JOIN users rv ON rv.id = vs.reviewed_by
       WHERE vs.task_id=$1
       ORDER BY vs.submitted_at DESC`,
      [req.params.id]
    );

    for (const sub of submissions) {
      const { rows: photos } = await query(
        `SELECT * FROM vm_submission_photos WHERE submission_id=$1 ORDER BY uploaded_at`,
        [sub.id]
      );
      sub.photos = photos;
    }

    res.json({ ...task[0], submissions });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get VM task' }); }
};

// ── Submit VM Check (GPS required) ───────────────────────────

exports.submitTask = async (req, res) => {
  try {
    const { store_id, notes, photos = [], gps } = req.body;

    const { rows: task } = await query(
      `SELECT id, brand_id, template_id FROM vm_tasks WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!task.length) return res.status(404).json({ error: 'VM task not found' });

    // Auto-score: photos provided / expected (simple ratio based on photo count)
    const photoCount = Array.isArray(photos) ? photos.length : 0;
    const compliance_score = photoCount > 0 ? Math.min(100, photoCount * 25) : 0;

    // Insert submission
    const { rows: sub } = await query(
      `INSERT INTO vm_submissions
         (task_id, store_id, submitted_by, compliance_score, notes,
          gps_lat, gps_lng, gps_verified)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, store_id, req.user.id, compliance_score, notes || null,
       gps.lat, gps.lng, req.gpsVerified]
    );
    const submission = sub[0];

    // Insert photos
    for (const p of photos) {
      await query(
        `INSERT INTO vm_submission_photos(submission_id, photo_url, zone_label)
         VALUES($1,$2,$3)`,
        [submission.id, p.photo_url, p.zone_label || null]
      );
    }

    // Update task status
    await query(
      `UPDATE vm_tasks SET status='submitted', updated_at=NOW() WHERE id=$1`,
      [req.params.id]
    );

    res.status(201).json({ ...submission, photos });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to submit VM task' }); }
};

// ── Review Submission ─────────────────────────────────────────

exports.reviewTask = async (req, res) => {
  try {
    const { submission_id, status, compliance_score } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved or rejected' });
    }

    // Verify submission belongs to a task owned by this brand
    const { rows: subCheck } = await query(
      `SELECT vs.id FROM vm_submissions vs
       JOIN vm_tasks vt ON vt.id = vs.task_id
       WHERE vs.id=$1 AND vt.brand_id=$2`,
      [submission_id, req.user.brand_id]
    );
    if (!subCheck.length) return res.status(404).json({ error: 'Submission not found' });

    const { rows: sub } = await query(
      `UPDATE vm_submissions
         SET status=$1, reviewed_by=$2, reviewed_at=NOW()
             ${compliance_score !== undefined ? `, compliance_score=${parseInt(compliance_score)}` : ''}
       WHERE id=$3 RETURNING *`,
      [status, req.user.id, submission_id]
    );

    // Update task status — scoped to brand
    await query(
      `UPDATE vm_tasks SET status=$1, updated_at=NOW() WHERE id=$2 AND brand_id=$3`,
      [status, req.params.id, req.user.brand_id]
    );

    res.json(sub[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to review VM submission' }); }
};

// ── Compliance Report ─────────────────────────────────────────

exports.getCompliance = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.id, s.name as store_name,
              COUNT(vt.id)::int                                        AS total_tasks,
              COUNT(CASE WHEN vt.status='approved' THEN 1 END)::int    AS approved_tasks,
              COUNT(CASE WHEN vt.status='submitted' THEN 1 END)::int   AS pending_review,
              COUNT(CASE WHEN vt.status='rejected' THEN 1 END)::int    AS rejected_tasks,
              ROUND(AVG(vs.compliance_score)::numeric, 2)              AS avg_compliance_score
       FROM stores s
       LEFT JOIN vm_tasks vt ON vt.store_id = s.id AND vt.brand_id=$1
       LEFT JOIN vm_submissions vs ON vs.task_id = vt.id AND vs.status='approved'
       WHERE s.brand_id=$1
       GROUP BY s.id
       ORDER BY avg_compliance_score DESC NULLS LAST`,
      [req.user.brand_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get VM compliance' }); }
};
