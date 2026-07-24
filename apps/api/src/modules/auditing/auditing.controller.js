const { query } = require('../../config/db');

// ── Templates ──────────────────────────────────────────────────

exports.listTemplates = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT t.*, COUNT(DISTINCT atc.id) as category_count
       FROM audit_templates t
       LEFT JOIN audit_template_categories atc ON atc.template_id = t.id
       WHERE t.brand_id=$1 GROUP BY t.id ORDER BY t.name`,
      [req.user.brand_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to list templates' }); }
};

exports.createTemplate = async (req, res) => {
  try {
    const { name, description, categories = [] } = req.body;
    const { rows } = await query(
      `INSERT INTO audit_templates(brand_id, name, description, created_by)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [req.user.brand_id, name, description, req.user.id]
    );
    const tmpl = rows[0];
    for (const [i, cat] of categories.entries()) {
      const { rows: catRows } = await query(
        `INSERT INTO audit_template_categories(template_id, name, weight, sort_order)
         VALUES($1,$2,$3,$4) RETURNING id`,
        [tmpl.id, cat.name, cat.weight || 1.0, i]
      );
      for (const [j, q] of (cat.questions || []).entries()) {
        await query(
          `INSERT INTO audit_template_questions
            (category_id, text, type, weight, required, required_photo, is_critical, pass_criteria, sort_order)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [catRows[0].id, q.text, q.type || 'yes_no', q.weight || 1, q.required || false,
           q.required_photo || false, q.is_critical || false, q.pass_criteria || null, j]
        );
      }
    }
    res.status(201).json(tmpl);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create template' }); }
};

exports.getTemplate = async (req, res) => {
  try {
    const { rows: tmpl } = await query(
      `SELECT * FROM audit_templates WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!tmpl.length) return res.status(404).json({ error: 'Template not found' });

    const { rows: cats } = await query(
      `SELECT * FROM audit_template_categories WHERE template_id=$1 ORDER BY sort_order`,
      [req.params.id]
    );
    for (const cat of cats) {
      const { rows: qs } = await query(
        `SELECT * FROM audit_template_questions WHERE category_id=$1 ORDER BY sort_order`,
        [cat.id]
      );
      cat.questions = qs;
    }
    res.json({ ...tmpl[0], categories: cats });
  } catch (err) { res.status(500).json({ error: 'Failed to get template' }); }
};

exports.updateTemplate = async (req, res) => {
  try {
    const { name, description, status, categories = [] } = req.body;
    await query(
      `UPDATE audit_templates SET name=$1, description=$2, status=$3, updated_at=NOW()
       WHERE id=$4 AND brand_id=$5`,
      [name, description, status || 'draft', req.params.id, req.user.brand_id]
    );

    // Replace categories and questions
    const { rows: existingCats } = await query(
      `SELECT id FROM audit_template_categories WHERE template_id=$1`,
      [req.params.id]
    );
    for (const cat of existingCats) {
      await query(`DELETE FROM audit_template_questions WHERE category_id=$1`, [cat.id]);
    }
    await query(`DELETE FROM audit_template_categories WHERE template_id=$1`, [req.params.id]);

    for (const [i, cat] of categories.entries()) {
      const { rows: catRows } = await query(
        `INSERT INTO audit_template_categories(template_id, name, weight, sort_order)
         VALUES($1,$2,$3,$4) RETURNING id`,
        [req.params.id, cat.name, cat.weight || 1.0, i]
      );
      for (const [j, q] of (cat.questions || []).entries()) {
        await query(
          `INSERT INTO audit_template_questions
            (category_id, text, type, weight, required, required_photo, is_critical, pass_criteria, sort_order)
           VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [catRows[0].id, q.text, q.type || 'yes_no', q.weight || 1, q.required || false,
           q.required_photo || false, q.is_critical || false, q.pass_criteria || null, j]
        );
      }
    }

    res.json({ message: 'Template updated' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update template' }); }
};

exports.deleteTemplate = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id FROM audit_templates WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Template not found' });

    // Cascade: delete categories → questions → template
    const { rows: cats } = await query(
      `SELECT id FROM audit_template_categories WHERE template_id=$1`, [req.params.id]
    );
    for (const cat of cats) {
      await query(`DELETE FROM audit_template_questions WHERE category_id=$1`, [cat.id]);
    }
    await query(`DELETE FROM audit_template_categories WHERE template_id=$1`, [req.params.id]);
    await query(`DELETE FROM audit_templates WHERE id=$1 AND brand_id=$2`, [req.params.id, req.user.brand_id]);

    res.json({ message: 'Template deleted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete template' }); }
};

// ── Schedules ─────────────────────────────────────────────────

exports.listSchedules = async (req, res) => {
  try {
    const { store_id } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE t.brand_id=$1';
    if (store_id) { params.push(store_id); where += ` AND s.store_id=$${params.length}`; }
    const { rows } = await query(
      `SELECT s.*, t.name as template_name, st.name as store_name
       FROM audit_schedules s
       JOIN audit_templates t ON t.id = s.template_id
       JOIN stores st ON st.id = s.store_id
       ${where} ORDER BY s.next_due`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to list schedules' }); }
};

exports.createSchedule = async (req, res) => {
  try {
    const { template_id, store_id, frequency, next_due, assigned_to, type } = req.body;
    // Verify template and store belong to this brand
    const { rows: tmplCheck } = await query(
      `SELECT id FROM audit_templates WHERE id=$1 AND brand_id=$2`,
      [template_id, req.user.brand_id]
    );
    if (!tmplCheck.length) return res.status(404).json({ error: 'Template not found' });
    const { rows: storeCheck } = await query(
      `SELECT id FROM stores WHERE id=$1 AND brand_id=$2`,
      [store_id, req.user.brand_id]
    );
    if (!storeCheck.length) return res.status(404).json({ error: 'Store not found' });
    const { rows } = await query(
      `INSERT INTO audit_schedules(template_id,store_id,frequency,next_due,assigned_to,type)
       VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
      [template_id, store_id, frequency, next_due, assigned_to, type || 'scheduled']
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create schedule' }); }
};

// ── Audits ────────────────────────────────────────────────────

exports.listAudits = async (req, res) => {
  try {
    const { store_id, status, from, to, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.brand_id];
    let where = 'WHERE t.brand_id=$1';
    if (store_id) { params.push(store_id); where += ` AND a.store_id=$${params.length}`; }
    if (status)   { params.push(status);   where += ` AND a.status=$${params.length}`; }
    if (from)     { params.push(from);     where += ` AND a.started_at>=$${params.length}`; }
    if (to)       { params.push(to);       where += ` AND a.started_at<=$${params.length}`; }
    params.push(limit, offset);
    const { rows } = await query(
      `SELECT a.*, t.name as template_name, st.name as store_name, u.name as auditor_name
       FROM audits a
       JOIN audit_templates t ON t.id = a.template_id
       JOIN stores st ON st.id = a.store_id
       JOIN users u ON u.id = a.auditor_id
       ${where} ORDER BY a.started_at DESC
       LIMIT $${params.length-1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to list audits' }); }
};

exports.startAudit = async (req, res) => {
  try {
    const { template_id, store_id, schedule_id } = req.body;
    const { gps } = req.body;
    // Verify template and store belong to this brand
    const { rows: tmplCheck } = await query(
      `SELECT id FROM audit_templates WHERE id=$1 AND brand_id=$2`,
      [template_id, req.user.brand_id]
    );
    if (!tmplCheck.length) return res.status(404).json({ error: 'Template not found' });
    const { rows: storeCheck } = await query(
      `SELECT id FROM stores WHERE id=$1 AND brand_id=$2`,
      [store_id, req.user.brand_id]
    );
    if (!storeCheck.length) return res.status(404).json({ error: 'Store not found' });
    const { rows } = await query(
      `INSERT INTO audits
        (template_id, schedule_id, store_id, auditor_id, status,
         check_in_lat, check_in_lng, check_in_time, device_id, gps_verified)
       VALUES($1,$2,$3,$4,'in_progress',$5,$6,NOW(),$7,$8) RETURNING *`,
      [template_id, schedule_id || null, store_id, req.user.id,
       gps.lat, gps.lng, gps.device_id || null, req.gpsVerified]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to start audit' }); }
};

exports.getAudit = async (req, res) => {
  try {
    const { rows: audit } = await query(
      `SELECT a.*, t.name as template_name, st.name as store_name, u.name as auditor_name
       FROM audits a
       JOIN audit_templates t ON t.id = a.template_id
       JOIN stores st ON st.id = a.store_id
       JOIN users u ON u.id = a.auditor_id
       WHERE a.id=$1 AND t.brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!audit.length) return res.status(404).json({ error: 'Audit not found' });

    // Load template categories + questions so the mobile form can render them
    const { rows: cats } = await query(
      `SELECT * FROM audit_template_categories WHERE template_id=$1 ORDER BY sort_order`,
      [audit[0].template_id]
    );
    for (const cat of cats) {
      const { rows: qs } = await query(
        `SELECT * FROM audit_template_questions WHERE category_id=$1 ORDER BY sort_order`,
        [cat.id]
      );
      cat.questions = qs;
    }

    const { rows: responses } = await query(
      `SELECT ar.*, atq.text as question_text, atq.type as question_type, atq.is_critical
       FROM audit_responses ar
       JOIN audit_template_questions atq ON atq.id = ar.question_id
       WHERE ar.audit_id=$1`,
      [req.params.id]
    );

    // Annotate each category with its score and per-question responses
    for (const cat of cats) {
      const catQs = cat.questions || [];
      const catResps = responses.filter(r => catQs.find(q => Number(q.id) === Number(r.question_id)));
      const pass = catResps.filter(r => r.response === 'yes' || parseFloat(r.response) >= 3).length;
      cat.score = catQs.length ? Math.round((pass / catQs.length) * 100) : null;
      cat.questions = catQs.map(q => ({
        ...q,
        response: responses.find(r => Number(r.question_id) === Number(q.id)) || null,
      }));
    }

    res.json({ ...audit[0], categories: cats, responses });
  } catch (err) { res.status(500).json({ error: 'Failed to get audit' }); }
};

exports.saveResponse = async (req, res) => {
  try {
    const { question_id, response, notes, photo_url, photo_lat, photo_lng } = req.body;
    // Verify audit belongs to this brand
    const { rows: auditCheck } = await query(
      `SELECT a.id FROM audits a
       JOIN audit_templates t ON t.id = a.template_id
       WHERE a.id=$1 AND t.brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!auditCheck.length) return res.status(404).json({ error: 'Audit not found' });
    await query(
      `INSERT INTO audit_responses(audit_id,question_id,response,notes,photo_url,photo_lat,photo_lng,photo_ts)
       VALUES($1,$2,$3,$4,$5,$6,$7,NOW())
       ON CONFLICT(audit_id,question_id) DO UPDATE
       SET response=$3,notes=$4,photo_url=$5,photo_lat=$6,photo_lng=$7,photo_ts=NOW()`,
      [req.params.id, question_id, response, notes, photo_url, photo_lat, photo_lng]
    );
    res.json({ message: 'Response saved' });
  } catch (err) { res.status(500).json({ error: 'Failed to save response' }); }
};

exports.submitAudit = async (req, res) => {
  try {
    const auditId = req.params.id;

    // Fetch template with weights — verify brand ownership
    const { rows: auditRows } = await query(
      `SELECT a.* FROM audits a
       JOIN audit_templates t ON t.id = a.template_id
       WHERE a.id=$1 AND t.brand_id=$2`,
      [auditId, req.user.brand_id]
    );
    if (!auditRows.length) return res.status(404).json({ error: 'Audit not found' });
    const audit = auditRows[0];

    const { rows: cats } = await query(
      `SELECT * FROM audit_template_categories WHERE template_id=$1`, [audit.template_id]
    );
    const { rows: questions } = await query(
      `SELECT atq.*, atc.weight FROM audit_template_questions atq
       JOIN audit_template_categories atc ON atc.id = atq.category_id
       WHERE atc.template_id=$1`, [audit.template_id]
    );
    const { rows: responses } = await query(
      `SELECT * FROM audit_responses WHERE audit_id=$1`, [auditId]
    );

    // Calculate weighted score
    let totalWeight = 0, weightedScore = 0, criticalFail = false;
    const flaggedItems = [];

    for (const cat of cats) {
      const catQs = questions.filter(q => Number(q.category_id) === Number(cat.id));
      const catResps = responses.filter(r => catQs.find(q => Number(q.id) === Number(r.question_id)));
      const pass = catResps.filter(r => r.response === 'yes' || parseFloat(r.response) >= 3).length;
      const catScore = catQs.length ? (pass / catQs.length) * 100 : 0;
      totalWeight += parseFloat(cat.weight || 1);
      weightedScore += catScore * parseFloat(cat.weight || 1);

      catQs.forEach(q => {
        const resp = responses.find(r => Number(r.question_id) === Number(q.id));
        const isFail = !resp || resp.response === 'no' || (resp.response !== 'yes' && parseFloat(resp.response) < 3);
        if (isFail) {
          if (q.is_critical) criticalFail = true;
          flaggedItems.push({ question_id: q.id, text: q.text, is_critical: q.is_critical });
        }
      });
    }

    const finalScore = totalWeight ? weightedScore / totalWeight : 0;
    const { rows: threshold } = await query(
      `SELECT b.id FROM brands b WHERE b.id=$1`, [req.user.brand_id]
    );
    const brandThreshold = 70; // default; will be configurable per brand
    const passed = !criticalFail && finalScore >= brandThreshold;

    await query(
      `UPDATE audits SET status='submitted', score=$1, passed=$2, brand_threshold=$3,
         submitted_at=NOW(), gps_verified=$4
       WHERE id=$5`,
      [finalScore.toFixed(2), passed, brandThreshold, req.gpsVerified, auditId]
    );

    // Auto-create corrective actions for failed items
    for (const item of flaggedItems) {
      await query(
        `INSERT INTO corrective_actions(audit_id,question_id,store_id,description,assigned_to,sla_hours,due_at)
         VALUES($1,$2,$3,$4,$5,48,NOW()+INTERVAL '48 hours')`,
        [auditId, item.question_id, audit.store_id, item.text, null]
      );
    }

    res.json({ score: finalScore.toFixed(2), passed, flagged_items: flaggedItems });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to submit audit' }); }
};

exports.listCorrectiveActions = async (req, res) => {
  try {
    const { store_id, status } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE st.brand_id=$1';
    if (store_id) { params.push(store_id); where += ` AND ca.store_id=$${params.length}`; }
    if (status)   { params.push(status);   where += ` AND ca.status=$${params.length}`; }
    const { rows } = await query(
      `SELECT ca.*, st.name as store_name, u.name as assigned_to_name
       FROM corrective_actions ca
       JOIN stores st ON st.id = ca.store_id
       LEFT JOIN users u ON u.id = ca.assigned_to
       ${where} ORDER BY ca.due_at`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to list corrective actions' }); }
};

exports.updateCorrectiveAction = async (req, res) => {
  try {
    const { assigned_to, status } = req.body;
    await query(
      `UPDATE corrective_actions SET assigned_to=$1, status=$2, updated_at=NOW()
       WHERE id=$3
         AND store_id IN (SELECT id FROM stores WHERE brand_id=$4)`,
      [assigned_to, status, req.params.id, req.user.brand_id]
    );
    res.json({ message: 'Corrective action updated' });
  } catch (err) { res.status(500).json({ error: 'Failed to update corrective action' }); }
};

exports.resolveCorrectiveAction = async (req, res) => {
  try {
    const { resolution_notes } = req.body;
    await query(
      `UPDATE corrective_actions SET status='resolved', resolution_notes=$1,
         resolved_at=NOW(), updated_at=NOW()
       WHERE id=$2
         AND store_id IN (SELECT id FROM stores WHERE brand_id=$3)`,
      [resolution_notes, req.params.id, req.user.brand_id]
    );
    res.json({ message: 'Corrective action resolved' });
  } catch (err) { res.status(500).json({ error: 'Failed to resolve corrective action' }); }
};

exports.storeReport = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT a.id, a.score, a.passed, a.submitted_at, t.name as template_name, u.name as auditor
       FROM audits a
       JOIN audit_templates t ON t.id = a.template_id
       JOIN users u ON u.id = a.auditor_id
       JOIN stores st ON st.id = a.store_id
       WHERE a.store_id=$1 AND st.brand_id=$2 AND a.status='submitted'
       ORDER BY a.submitted_at DESC LIMIT 50`,
      [req.params.storeId, req.user.brand_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to get store report' }); }
};

exports.benchmarks = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT st.id, st.name, st.format,
              ROUND(AVG(a.score)::numeric, 2) as avg_score,
              COUNT(a.id) as audit_count,
              SUM(CASE WHEN a.passed THEN 1 ELSE 0 END) as passed_count
       FROM stores st
       LEFT JOIN audits a ON a.store_id = st.id AND a.status='submitted'
       WHERE st.brand_id=$1
       GROUP BY st.id ORDER BY avg_score DESC NULLS LAST`,
      [req.user.brand_id]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to get benchmarks' }); }
};
