const { query } = require('../../config/db');

// ── List Surveys ──────────────────────────────────────────────

exports.listSurveys = async (req, res) => {
  try {
    const { type, active } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE s.brand_id=$1';
    if (type)   { params.push(type);                where += ` AND s.type=$${params.length}`; }
    if (active !== undefined) { params.push(active === 'true'); where += ` AND s.is_active=$${params.length}`; }

    const { rows } = await query(
      `SELECT s.*, u.name as created_by_name,
              COUNT(cr.id)::int as response_count
       FROM cx_surveys s
       LEFT JOIN users u ON u.id = s.created_by
       LEFT JOIN cx_responses cr ON cr.survey_id = s.id
       ${where}
       GROUP BY s.id, u.name
       ORDER BY s.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list surveys' }); }
};

// ── Create Survey ─────────────────────────────────────────────

exports.createSurvey = async (req, res) => {
  try {
    const { title, type, description, questions, is_active } = req.body;
    const { rows } = await query(
      `INSERT INTO cx_surveys
         (brand_id, title, type, description, questions, is_active, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.brand_id, title, type || 'custom', description || null,
       JSON.stringify(questions || []),
       is_active !== undefined ? is_active : false,
       req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create survey' }); }
};

// ── Update Survey ─────────────────────────────────────────────

exports.updateSurvey = async (req, res) => {
  try {
    const { title, type, description, questions, is_active } = req.body;
    const { rows } = await query(
      `UPDATE cx_surveys
         SET title=$1, type=$2, description=$3, questions=$4,
             is_active=$5, updated_at=NOW()
       WHERE id=$6 AND brand_id=$7
       RETURNING *`,
      [title, type || 'custom', description || null,
       JSON.stringify(questions || []),
       is_active !== undefined ? is_active : true,
       req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Survey not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update survey' }); }
};

// ── Get Survey ────────────────────────────────────────────────

exports.getSurvey = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT s.*, u.name as created_by_name
       FROM cx_surveys s
       LEFT JOIN users u ON u.id = s.created_by
       WHERE s.id=$1 AND s.brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Survey not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get survey' }); }
};

// ── Submit Response (public — no auth guard on route) ─────────

exports.submitResponse = async (req, res) => {
  try {
    const { store_id, channel, nps_score, csat_score, answers, verbatim, customer_ref } = req.body;

    // Verify survey exists and is active — also fetch brand_id for store validation
    const { rows: survey } = await query(
      `SELECT id, type, brand_id FROM cx_surveys WHERE id=$1 AND is_active=true`,
      [req.params.id]
    );
    if (!survey.length) return res.status(404).json({ error: 'Survey not found or inactive' });
    // Validate store_id belongs to the survey's brand to prevent cross-tenant injection
    if (store_id) {
      const { rows: storeCheck } = await query(
        `SELECT id FROM stores WHERE id=$1 AND brand_id=$2`,
        [store_id, survey[0].brand_id]
      );
      if (!storeCheck.length) return res.status(400).json({ error: 'Invalid store' });
    }

    // Derive sentiment from scores
    let sentiment = 'neutral';
    const score = nps_score !== undefined ? nps_score : csat_score;
    if (score !== undefined) {
      if (nps_score !== undefined) {
        sentiment = nps_score >= 9 ? 'positive' : nps_score <= 6 ? 'negative' : 'neutral';
      } else {
        sentiment = csat_score >= 4 ? 'positive' : csat_score <= 2 ? 'negative' : 'neutral';
      }
    }

    const { rows } = await query(
      `INSERT INTO cx_responses
         (survey_id, store_id, channel, nps_score, csat_score, answers, sentiment, verbatim, customer_ref)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.params.id, store_id || null, channel || 'in-store',
       nps_score !== undefined ? nps_score : null,
       csat_score !== undefined ? csat_score : null,
       JSON.stringify(answers || {}), sentiment, verbatim || null, customer_ref || null]
    );

    // Auto-create alert for low NPS or negative sentiment
    if ((nps_score !== undefined && nps_score <= 6) || sentiment === 'negative') {
      // Get brand_id from survey
      const { rows: sv } = await query(`SELECT brand_id FROM cx_surveys WHERE id=$1`, [req.params.id]);
      if (sv.length) {
        await query(
          `INSERT INTO cx_alerts(brand_id, store_id, type, message)
           VALUES($1,$2,$3,$4)`,
          [sv[0].brand_id, store_id || null,
           nps_score !== undefined ? 'low_nps' : 'negative_review',
           `${nps_score !== undefined ? `NPS score ${nps_score}` : 'Negative feedback'} received${store_id ? ' at store' : ''}`]
        );
      }
    }

    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to submit response' }); }
};

// ── List Responses ────────────────────────────────────────────

exports.listResponses = async (req, res) => {
  try {
    const { store_id, date_from, date_to, sentiment, survey_id } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE cs.brand_id=$1';
    if (store_id)  { params.push(store_id);  where += ` AND cr.store_id=$${params.length}`; }
    if (date_from) { params.push(date_from); where += ` AND cr.submitted_at>=$${params.length}`; }
    if (date_to)   { params.push(date_to);   where += ` AND cr.submitted_at<=$${params.length}`; }
    if (sentiment) { params.push(sentiment); where += ` AND cr.sentiment=$${params.length}`; }
    if (survey_id) { params.push(survey_id); where += ` AND cr.survey_id=$${params.length}`; }

    const { rows } = await query(
      `SELECT cr.*, cs.title as survey_title, s.name as store_name
       FROM cx_responses cr
       JOIN cx_surveys cs ON cs.id = cr.survey_id
       LEFT JOIN stores s ON s.id = cr.store_id
       ${where}
       ORDER BY cr.submitted_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list responses' }); }
};

// ── Responses Summary (NPS + CSAT) ───────────────────────────

exports.responsesSummary = async (req, res) => {
  try {
    const { store_id, date_from, date_to } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE cs.brand_id=$1';
    if (store_id)  { params.push(store_id);  where += ` AND cr.store_id=$${params.length}`; }
    if (date_from) { params.push(date_from); where += ` AND cr.submitted_at>=$${params.length}`; }
    if (date_to)   { params.push(date_to);   where += ` AND cr.submitted_at<=$${params.length}`; }

    const { rows } = await query(
      `SELECT
         s.id as store_id, s.name as store_name,
         COUNT(cr.id)::int as total_responses,
         ROUND(AVG(cr.nps_score) FILTER (WHERE cr.nps_score IS NOT NULL), 1) as avg_nps,
         ROUND(AVG(cr.csat_score) FILTER (WHERE cr.csat_score IS NOT NULL), 1) as avg_csat,
         COUNT(CASE WHEN cr.sentiment='positive' THEN 1 END)::int as positive_count,
         COUNT(CASE WHEN cr.sentiment='neutral'  THEN 1 END)::int as neutral_count,
         COUNT(CASE WHEN cr.sentiment='negative' THEN 1 END)::int as negative_count,
         ROUND(
           (COUNT(CASE WHEN cr.nps_score>=9 THEN 1 END)::numeric
            - COUNT(CASE WHEN cr.nps_score<=6 THEN 1 END)::numeric)
           / NULLIF(COUNT(cr.nps_score), 0)::numeric * 100, 1
         ) as nps_score
       FROM cx_responses cr
       JOIN cx_surveys cs ON cs.id = cr.survey_id
       LEFT JOIN stores s ON s.id = cr.store_id
       ${where}
       GROUP BY s.id, s.name
       ORDER BY avg_nps DESC NULLS LAST`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get summary' }); }
};

// ── List Reviews ──────────────────────────────────────────────

exports.listReviews = async (req, res) => {
  try {
    const { store_id, platform, sentiment } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE brand_id=$1';
    if (store_id)  { params.push(store_id);  where += ` AND store_id=$${params.length}`; }
    if (platform)  { params.push(platform);  where += ` AND platform=$${params.length}`; }
    if (sentiment) { params.push(sentiment); where += ` AND sentiment=$${params.length}`; }

    const { rows } = await query(
      `SELECT crs.*, s.name as store_name
       FROM cx_review_sources crs
       LEFT JOIN stores s ON s.id = crs.store_id
       ${where}
       ORDER BY crs.review_date DESC NULLS LAST, crs.imported_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list reviews' }); }
};

// ── Add Review ────────────────────────────────────────────────

exports.addReview = async (req, res) => {
  try {
    const { store_id, platform, rating, review_text, reviewer_name, review_date, sentiment, response_text } = req.body;
    const { rows } = await query(
      `INSERT INTO cx_review_sources
         (brand_id, store_id, platform, rating, review_text, reviewer_name,
          review_date, sentiment, response_text)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user.brand_id, store_id || null, platform || 'manual',
       rating || null, review_text || null, reviewer_name || null,
       review_date || null, sentiment || null, response_text || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to add review' }); }
};

// ── List Alerts ───────────────────────────────────────────────

exports.listAlerts = async (req, res) => {
  try {
    const { store_id } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE brand_id=$1 AND is_read=false';
    if (store_id) { params.push(store_id); where += ` AND store_id=$${params.length}`; }

    const { rows } = await query(
      `SELECT ca.*, s.name as store_name
       FROM cx_alerts ca
       LEFT JOIN stores s ON s.id = ca.store_id
       ${where}
       ORDER BY ca.triggered_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list alerts' }); }
};

// ── Mark Alert Read ───────────────────────────────────────────

exports.markAlertRead = async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE cx_alerts SET is_read=true WHERE id=$1 AND brand_id=$2 RETURNING *`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Alert not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to mark alert read' }); }
};

// ── CX Dashboard ──────────────────────────────────────────────

exports.dashboard = async (req, res) => {
  try {
    const brandId = req.user.brand_id;

    const { rows: overview } = await query(
      `SELECT
         COUNT(cr.id)::int as total_responses,
         ROUND(AVG(cr.nps_score) FILTER (WHERE cr.nps_score IS NOT NULL), 1) as avg_nps,
         ROUND(AVG(cr.csat_score) FILTER (WHERE cr.csat_score IS NOT NULL), 1) as avg_csat,
         COUNT(CASE WHEN cr.sentiment='positive' THEN 1 END)::int as positive,
         COUNT(CASE WHEN cr.sentiment='neutral'  THEN 1 END)::int as neutral,
         COUNT(CASE WHEN cr.sentiment='negative' THEN 1 END)::int as negative
       FROM cx_responses cr
       JOIN cx_surveys cs ON cs.id = cr.survey_id
       WHERE cs.brand_id=$1
         AND cr.submitted_at >= NOW() - INTERVAL '30 days'`,
      [brandId]
    );

    const { rows: storeRankings } = await query(
      `SELECT s.id, s.name,
              COUNT(cr.id)::int as responses,
              ROUND(AVG(cr.nps_score) FILTER (WHERE cr.nps_score IS NOT NULL), 1) as avg_nps,
              ROUND(AVG(cr.csat_score) FILTER (WHERE cr.csat_score IS NOT NULL), 1) as avg_csat
       FROM cx_responses cr
       JOIN cx_surveys cs ON cs.id = cr.survey_id
       JOIN stores s ON s.id = cr.store_id
       WHERE cs.brand_id=$1
         AND cr.submitted_at >= NOW() - INTERVAL '30 days'
       GROUP BY s.id, s.name
       ORDER BY avg_nps DESC NULLS LAST
       LIMIT 10`,
      [brandId]
    );

    const { rows: unreadAlerts } = await query(
      `SELECT COUNT(*)::int as count FROM cx_alerts WHERE brand_id=$1 AND is_read=false`,
      [brandId]
    );

    const { rows: avgRating } = await query(
      `SELECT ROUND(AVG(rating), 1) as avg_rating, COUNT(*)::int as total_reviews
       FROM cx_review_sources WHERE brand_id=$1`,
      [brandId]
    );

    res.json({
      period: '30_days',
      overview: overview[0],
      store_rankings: storeRankings,
      unread_alerts: unreadAlerts[0].count,
      review_summary: avgRating[0],
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get dashboard' }); }
};
