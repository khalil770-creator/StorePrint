const { query } = require('../../config/db');

// ── Helpers ────────────────────────────────────────────────────

function scoreStatus(score) {
  if (score === null || score === undefined) return 'critical';
  if (score >= 80) return 'good';
  if (score >= 60) return 'warning';
  return 'critical';
}

function calcTrend(current, previous) {
  const diff = (current || 0) - (previous || 0);
  if (diff > 2) return 'up';
  if (diff < -2) return 'down';
  return 'stable';
}

// ── 1. getBrandHealthScore ─────────────────────────────────────

exports.getBrandHealthScore = async (req, res) => {
  try {
    const brandId = req.user.brand_id;

    // Current period (last 30 days)
    const [auditR, vmR, cxR, trainingR, envR, campaignR, attendanceR] = await Promise.all([
      query(
        `SELECT COALESCE(AVG(score), 0) as score
         FROM audits a JOIN audit_templates at ON at.id=a.template_id WHERE at.brand_id=$1 AND a.submitted_at > NOW()-INTERVAL '30 days'`,
        [brandId]
      ),
      query(
        `SELECT COALESCE(AVG(vs.compliance_score), 0) as score
         FROM vm_submissions vs
         JOIN vm_tasks vt ON vs.task_id = vt.id
         WHERE vt.brand_id=$1 AND vs.submitted_at > NOW() - INTERVAL '30 days'`,
        [brandId]
      ),
      query(
        `SELECT COALESCE(AVG(cr.nps_score) * 10, 0) as score
         FROM cx_responses cr
         JOIN cx_surveys cs ON cs.id = cr.survey_id
         WHERE cs.brand_id=$1
           AND cr.submitted_at > NOW() - INTERVAL '30 days'
           AND cr.nps_score IS NOT NULL`,
        [brandId]
      ),
      query(
        `SELECT COALESCE(AVG(te.score), 0) as score
         FROM training_enrollments te JOIN training_courses tc ON tc.id=te.course_id WHERE tc.brand_id=$1 AND te.status='completed' AND te.completed_at > NOW()-INTERVAL '30 days'`,
        [brandId]
      ),
      query(
        `SELECT COALESCE(AVG(es.score), 0) as score
         FROM environment_submissions es
         JOIN environment_checklists ec ON ec.id = es.checklist_id
         WHERE ec.brand_id=$1 AND es.submitted_at > NOW() - INTERVAL '30 days'`,
        [brandId]
      ),
      query(
        `SELECT COALESCE(
           AVG(
             (SELECT COUNT(DISTINCT cc2.store_id)::numeric * 100 / NULLIF(COUNT(DISTINCT csa2.store_id),0) FROM campaign_confirmations cc2 JOIN campaign_store_assignments csa2 ON cc2.campaign_id=csa2.campaign_id WHERE cc2.campaign_id=c.id)
           ), 0) as score
         FROM campaigns c
         WHERE c.brand_id=$1
           AND c.start_date >= NOW() - INTERVAL '30 days'`,
        [brandId]
      ),
      query(
        `SELECT COALESCE(
           (COUNT(CASE WHEN a.status='present' THEN 1 END)::numeric
            / NULLIF(COUNT(a.id), 0)) * 100, 0) as score
         FROM attendance a
         JOIN stores s ON s.id = a.store_id
         WHERE s.brand_id=$1
           AND DATE(a.clock_in_at) >= (NOW() - INTERVAL '30 days')::date`,
        [brandId]
      ),
    ]);

    const components = {
      audit:       parseFloat(auditR.rows[0].score)      || 0,
      vm:          parseFloat(vmR.rows[0].score)         || 0,
      cx:          parseFloat(cxR.rows[0].score)         || 0,
      training:    parseFloat(trainingR.rows[0].score)   || 0,
      environment: parseFloat(envR.rows[0].score)        || 0,
      campaign:    parseFloat(campaignR.rows[0].score)   || 0,
      attendance:  parseFloat(attendanceR.rows[0].score) || 0,
    };

    const weights = { audit: 0.25, vm: 0.20, training: 0.15, cx: 0.20, environment: 0.10, campaign: 0.05, attendance: 0.05 };
    const overall = Object.keys(weights).reduce((sum, k) => sum + components[k] * weights[k], 0);

    // Previous period (30-60 days ago) for trend
    const [prevAudit, prevVm, prevCx, prevTraining, prevEnv, prevCampaign, prevAttendance] = await Promise.all([
      query(`SELECT COALESCE(AVG(score),0) as score FROM audits a JOIN audit_templates at ON at.id=a.template_id WHERE at.brand_id=$1 AND a.submitted_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(vs.compliance_score),0) as score FROM vm_submissions vs JOIN vm_tasks vt ON vs.task_id=vt.id WHERE vt.brand_id=$1 AND vs.submitted_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(cr.nps_score)*10,0) as score FROM cx_responses cr JOIN cx_surveys cs ON cs.id=cr.survey_id WHERE cs.brand_id=$1 AND cr.submitted_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days' AND cr.nps_score IS NOT NULL`, [brandId]),
      query(`SELECT COALESCE(AVG(te.score),0) as score FROM training_enrollments te JOIN training_courses tc ON tc.id=te.course_id WHERE tc.brand_id=$1 AND te.status='completed' AND te.completed_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(es.score),0) as score FROM environment_submissions es JOIN environment_checklists ec ON ec.id=es.checklist_id WHERE ec.brand_id=$1 AND es.submitted_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE((SELECT COUNT(DISTINCT cc.store_id)::numeric*100/NULLIF(COUNT(DISTINCT csa.store_id),0) FROM campaign_confirmations cc JOIN campaign_store_assignments csa ON cc.campaign_id=csa.campaign_id WHERE cc.campaign_id IN (SELECT id FROM campaigns WHERE brand_id=$1)),0) as score`, [brandId]),
      query(`SELECT COALESCE((COUNT(CASE WHEN a.status='present' THEN 1 END)::numeric/NULLIF(COUNT(a.id),0))*100,0) as score FROM attendance a JOIN stores s ON s.id=a.store_id WHERE s.brand_id=$1 AND DATE(a.clock_in_at) BETWEEN (NOW()-INTERVAL '60 days')::date AND (NOW()-INTERVAL '30 days')::date`, [brandId]),
    ]);

    const prevComponents = {
      audit:       parseFloat(prevAudit.rows[0].score)       || 0,
      vm:          parseFloat(prevVm.rows[0].score)          || 0,
      cx:          parseFloat(prevCx.rows[0].score)          || 0,
      training:    parseFloat(prevTraining.rows[0].score)    || 0,
      environment: parseFloat(prevEnv.rows[0].score)         || 0,
      campaign:    parseFloat(prevCampaign.rows[0].score)    || 0,
      attendance:  parseFloat(prevAttendance.rows[0].score)  || 0,
    };
    const prevOverall = Object.keys(weights).reduce((sum, k) => sum + prevComponents[k] * weights[k], 0);

    res.json({
      overall: Math.round(overall * 100) / 100,
      components,
      trend: calcTrend(overall, prevOverall),
      vs_last_period: Math.round((overall - prevOverall) * 100) / 100,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get brand health score' }); }
};

// ── 2. getKpiTiles ─────────────────────────────────────────────

exports.getKpiTiles = async (req, res) => {
  try {
    const brandId = req.user.brand_id;

    const [
      auditsR, openCaR, vmR, campaignsR, trainingR, cxR, envR, attendR, openIssuesR,
      prevAuditsR, prevVmR, prevTrainingR, prevCxR, prevEnvR, prevAttendR,
    ] = await Promise.all([
      // Audits completed this month + compliance %
      query(`SELECT COUNT(*)::int as completed, COALESCE(AVG(score),0) as compliance FROM audits a JOIN audit_templates at ON at.id=a.template_id WHERE at.brand_id=$1 AND a.submitted_at >= date_trunc('month', NOW())`, [brandId]),
      // Open corrective actions
      query(`SELECT COUNT(*)::int as count FROM corrective_actions ca JOIN audits a ON a.id=ca.audit_id JOIN audit_templates at ON at.id=a.template_id WHERE at.brand_id=$1 AND ca.status NOT IN ('closed','resolved')`, [brandId]),
      // VM tasks submitted + avg compliance last 30d
      query(`SELECT COUNT(vs.id)::int as submitted, COALESCE(AVG(vs.compliance_score),0) as avg_compliance FROM vm_submissions vs JOIN vm_tasks vt ON vs.task_id=vt.id WHERE vt.brand_id=$1 AND vs.submitted_at > NOW()-INTERVAL '30 days'`, [brandId]),
      // Active campaigns + confirmation rate
      query(`SELECT (SELECT COUNT(*)::int FROM campaigns WHERE brand_id=$1 AND status='active') as active, COALESCE((SELECT COUNT(DISTINCT cc.store_id)::numeric*100/NULLIF(COUNT(DISTINCT csa.store_id),0) FROM campaign_confirmations cc JOIN campaign_store_assignments csa ON cc.campaign_id=csa.campaign_id WHERE cc.campaign_id IN (SELECT id FROM campaigns WHERE brand_id=$1 AND status='active')),0) as confirmation_rate`, [brandId]),
      // Training completion rate + avg score last 30d
      query(`SELECT COALESCE((COUNT(CASE WHEN status='completed' THEN 1 END)::numeric/NULLIF(COUNT(*),0))*100,0) as completion_rate, COALESCE(AVG(score) FILTER (WHERE status='completed'),0) as avg_score FROM training_enrollments te JOIN training_courses tc ON tc.id=te.course_id WHERE tc.brand_id=$1 AND te.enrolled_at > NOW()-INTERVAL '30 days'`, [brandId]),
      // Avg NPS + CSAT last 30d
      query(`SELECT COALESCE(AVG(nps_score),0) as avg_nps, COALESCE(AVG(csat_score),0) as avg_csat FROM cx_responses cr JOIN cx_surveys cs ON cs.id=cr.survey_id WHERE cs.brand_id=$1 AND cr.submitted_at > NOW()-INTERVAL '30 days'`, [brandId]),
      // Environment avg score last 30d
      query(`SELECT COALESCE(AVG(es.score),0) as avg_score FROM environment_submissions es JOIN environment_checklists ec ON ec.id=es.checklist_id WHERE ec.brand_id=$1 AND es.submitted_at > NOW()-INTERVAL '30 days'`, [brandId]),
      // Staff attendance rate last 30d
      query(`SELECT COALESCE((COUNT(CASE WHEN a.status='present' THEN 1 END)::numeric/NULLIF(COUNT(*),0))*100,0) as rate FROM attendance a JOIN stores s ON s.id=a.store_id WHERE s.brand_id=$1 AND DATE(a.clock_in_at) >= (NOW()-INTERVAL '30 days')::date`, [brandId]),
      // Open environment issues
      query(`SELECT COUNT(*)::int as count FROM environment_issues ei JOIN stores s ON s.id=ei.store_id WHERE s.brand_id=$1 AND ei.status NOT IN ('resolved','closed')`, [brandId]),
      // Prev period comparisons
      query(`SELECT COALESCE(AVG(score),0) as compliance FROM audits a JOIN audit_templates at ON at.id=a.template_id WHERE at.brand_id=$1 AND a.submitted_at BETWEEN date_trunc('month', NOW()-INTERVAL '1 month') AND date_trunc('month', NOW())`, [brandId]),
      query(`SELECT COALESCE(AVG(vs.compliance_score),0) as avg_compliance FROM vm_submissions vs JOIN vm_tasks vt ON vs.task_id=vt.id WHERE vt.brand_id=$1 AND vs.submitted_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE((COUNT(CASE WHEN status='completed' THEN 1 END)::numeric/NULLIF(COUNT(*),0))*100,0) as completion_rate FROM training_enrollments te JOIN training_courses tc ON tc.id=te.course_id WHERE tc.brand_id=$1 AND te.enrolled_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(nps_score),0) as avg_nps FROM cx_responses cr JOIN cx_surveys cs ON cs.id=cr.survey_id WHERE cs.brand_id=$1 AND cr.submitted_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(es.score),0) as avg_score FROM environment_submissions es JOIN environment_checklists ec ON ec.id=es.checklist_id WHERE ec.brand_id=$1 AND es.submitted_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE((COUNT(CASE WHEN a.status='present' THEN 1 END)::numeric/NULLIF(COUNT(*),0))*100,0) as rate FROM attendance a JOIN stores s ON s.id=a.store_id WHERE s.brand_id=$1 AND DATE(a.clock_in_at) BETWEEN (NOW()-INTERVAL '60 days')::date AND (NOW()-INTERVAL '30 days')::date`, [brandId]),
    ]);

    const auditCompliance    = parseFloat(auditsR.rows[0].compliance)         || 0;
    const vmCompliance       = parseFloat(vmR.rows[0].avg_compliance)         || 0;
    const trainingRate       = parseFloat(trainingR.rows[0].completion_rate)  || 0;
    const avgNps             = parseFloat(cxR.rows[0].avg_nps)               || 0;
    const envScore           = parseFloat(envR.rows[0].avg_score)             || 0;
    const attendRate         = parseFloat(attendR.rows[0].rate)               || 0;

    const prevAuditComp      = parseFloat(prevAuditsR.rows[0].compliance)     || 0;
    const prevVmComp         = parseFloat(prevVmR.rows[0].avg_compliance)     || 0;
    const prevTrainingRate   = parseFloat(prevTrainingR.rows[0].completion_rate) || 0;
    const prevNps            = parseFloat(prevCxR.rows[0].avg_nps)           || 0;
    const prevEnvScore       = parseFloat(prevEnvR.rows[0].avg_score)         || 0;
    const prevAttendRate     = parseFloat(prevAttendR.rows[0].rate)           || 0;

    const tiles = [
      {
        module: 'audit',
        label: 'Audits Completed (This Month)',
        value: auditsR.rows[0].completed,
        unit: 'audits',
        trend: calcTrend(auditCompliance, prevAuditComp),
        vs_target: auditCompliance,
        status: scoreStatus(auditCompliance),
        extra: { compliance_pct: Math.round(auditCompliance * 100) / 100 },
      },
      {
        module: 'audit',
        label: 'Open Corrective Actions',
        value: openCaR.rows[0].count,
        unit: 'items',
        trend: openCaR.rows[0].count === 0 ? 'stable' : 'down',
        vs_target: null,
        status: openCaR.rows[0].count === 0 ? 'good' : openCaR.rows[0].count < 5 ? 'warning' : 'critical',
      },
      {
        module: 'vm',
        label: 'VM Tasks Submitted',
        value: vmR.rows[0].submitted,
        unit: 'submissions',
        trend: calcTrend(vmCompliance, prevVmComp),
        vs_target: Math.round(vmCompliance * 100) / 100,
        status: scoreStatus(vmCompliance),
        extra: { avg_compliance: Math.round(vmCompliance * 100) / 100 },
      },
      {
        module: 'campaigns',
        label: 'Active Campaigns',
        value: campaignsR.rows[0].active,
        unit: 'campaigns',
        trend: 'stable',
        vs_target: Math.round(parseFloat(campaignsR.rows[0].confirmation_rate) * 100) / 100,
        status: scoreStatus(parseFloat(campaignsR.rows[0].confirmation_rate)),
        extra: { confirmation_rate: Math.round(parseFloat(campaignsR.rows[0].confirmation_rate) * 100) / 100 },
      },
      {
        module: 'training',
        label: 'Training Completion Rate',
        value: Math.round(trainingRate * 100) / 100,
        unit: '%',
        trend: calcTrend(trainingRate, prevTrainingRate),
        vs_target: Math.round(trainingRate * 100) / 100,
        status: scoreStatus(trainingRate),
        extra: { avg_score: Math.round(parseFloat(trainingR.rows[0].avg_score) * 100) / 100 },
      },
      {
        module: 'cx',
        label: 'Average NPS',
        value: Math.round(avgNps * 10) / 10,
        unit: '/10',
        trend: calcTrend(avgNps, prevNps),
        vs_target: Math.round(avgNps * 10),
        status: scoreStatus(avgNps * 10),
        extra: { avg_csat: Math.round(parseFloat(cxR.rows[0].avg_csat) * 10) / 10 },
      },
      {
        module: 'environment',
        label: 'Environment Avg Score',
        value: Math.round(envScore * 100) / 100,
        unit: '/100',
        trend: calcTrend(envScore, prevEnvScore),
        vs_target: Math.round(envScore * 100) / 100,
        status: scoreStatus(envScore),
      },
      {
        module: 'attendance',
        label: 'Staff Attendance Rate',
        value: Math.round(attendRate * 100) / 100,
        unit: '%',
        trend: calcTrend(attendRate, prevAttendRate),
        vs_target: Math.round(attendRate * 100) / 100,
        status: scoreStatus(attendRate),
      },
      {
        module: 'environment',
        label: 'Open Environment Issues',
        value: openIssuesR.rows[0].count,
        unit: 'issues',
        trend: openIssuesR.rows[0].count === 0 ? 'stable' : 'down',
        vs_target: null,
        status: openIssuesR.rows[0].count === 0 ? 'good' : openIssuesR.rows[0].count < 3 ? 'warning' : 'critical',
      },
    ];

    res.json(tiles);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get KPI tiles' }); }
};

// ── 3. getStoreRankings ────────────────────────────────────────

exports.getStoreRankings = async (req, res) => {
  try {
    const brandId = req.user.brand_id;

    const { rows: stores } = await query(
      `SELECT s.id, s.name FROM stores s WHERE s.brand_id=$1 ORDER BY s.name`,
      [brandId]
    );

    if (!stores.length) return res.json([]);

    const storeIds = stores.map(s => s.id);
    const placeholders = storeIds.map((_, i) => `$${i + 2}`).join(',');

    const [auditR, cxR, vmR] = await Promise.all([
      query(
        `SELECT a.store_id, COALESCE(AVG(a.score), NULL) as score
         FROM audits a JOIN audit_templates at ON at.id=a.template_id WHERE at.brand_id=$1 AND a.store_id IN (${placeholders})
           AND submitted_at > NOW()-INTERVAL '30 days'
         GROUP BY store_id`,
        [brandId, ...storeIds]
      ),
      query(
        `SELECT cr.store_id, COALESCE(AVG(cr.nps_score)*10, NULL) as score
         FROM cx_responses cr
         JOIN cx_surveys cs ON cs.id=cr.survey_id
         WHERE cs.brand_id=$1 AND cr.store_id IN (${placeholders})
           AND cr.submitted_at > NOW()-INTERVAL '30 days'
           AND cr.nps_score IS NOT NULL
         GROUP BY cr.store_id`,
        [brandId, ...storeIds]
      ),
      query(
        `SELECT s.id as store_id, COALESCE(AVG(vs.compliance_score), NULL) as score
         FROM stores s
         JOIN vm_tasks vt ON vt.brand_id=$1
         JOIN vm_submissions vs ON vs.task_id=vt.id AND vs.store_id=s.id
         WHERE s.id IN (${placeholders})
           AND vs.submitted_at > NOW()-INTERVAL '30 days'
         GROUP BY s.id`,
        [brandId, ...storeIds]
      ),
    ]);

    const auditMap = Object.fromEntries(auditR.rows.map(r => [r.store_id, parseFloat(r.score)]));
    const cxMap    = Object.fromEntries(cxR.rows.map(r => [r.store_id, parseFloat(r.score)]));
    const vmMap    = Object.fromEntries(vmR.rows.map(r => [r.store_id, parseFloat(r.score)]));

    const weights = { audit: 0.35, cx: 0.35, vm: 0.30 };

    const ranked = stores.map(s => {
      const auditScore = auditMap[s.id] ?? null;
      const cxScore    = cxMap[s.id]    ?? null;
      const vmScore    = vmMap[s.id]    ?? null;

      let bhs = null;
      if (auditScore !== null || cxScore !== null || vmScore !== null) {
        let weightSum = 0;
        let scoreSum = 0;
        if (auditScore !== null) { scoreSum += auditScore * weights.audit; weightSum += weights.audit; }
        if (cxScore    !== null) { scoreSum += cxScore    * weights.cx;    weightSum += weights.cx; }
        if (vmScore    !== null) { scoreSum += vmScore    * weights.vm;    weightSum += weights.vm; }
        bhs = weightSum > 0 ? Math.round((scoreSum / weightSum) * 100) / 100 : null;
      }

      return { store_id: s.id, store_name: s.name, brand_health_score: bhs, audit_score: auditScore !== null ? Math.round(auditScore * 100) / 100 : null, cx_score: cxScore !== null ? Math.round(cxScore * 100) / 100 : null };
    });

    // Sort: stores with data first (by score DESC), then null-score stores
    ranked.sort((a, b) => {
      if (a.brand_health_score === null && b.brand_health_score === null) return 0;
      if (a.brand_health_score === null) return 1;
      if (b.brand_health_score === null) return -1;
      return b.brand_health_score - a.brand_health_score;
    });

    const result = ranked.map((r, i) => ({ ...r, rank: r.brand_health_score !== null ? i + 1 : null }));
    res.json(result);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get store rankings' }); }
};

// ── 4. getTrendChart ───────────────────────────────────────────

exports.getTrendChart = async (req, res) => {
  try {
    const { module = 'audit', period = '30d', store_id } = req.query;
    const brandId = req.user.brand_id;

    let sql, params, groupBy, dateFormat;

    const storeFilter = store_id ? ` AND store_id=$3` : '';
    const storeParams = store_id ? [brandId, store_id] : [brandId];

    if (period === '30d') {
      // Daily for last 30 days
      dateFormat = `TO_CHAR(d.date, 'YYYY-MM-DD')`;
      groupBy = `DATE(`;
    } else if (period === '90d') {
      // Weekly averages
      dateFormat = `TO_CHAR(DATE_TRUNC('week', d.date), 'YYYY-MM-DD')`;
      groupBy = `DATE_TRUNC('week', `;
    } else {
      // 12m: monthly averages
      dateFormat = `TO_CHAR(DATE_TRUNC('month', d.date), 'YYYY-MM')`;
      groupBy = `DATE_TRUNC('month', `;
    }

    const intervalMap = { '30d': '30 days', '90d': '90 days', '12m': '365 days' };
    const interval = intervalMap[period] || '30 days';

    let dataQuery;
    const params2 = store_id ? [brandId, store_id] : [brandId];

    const moduleQueries = {
      audit: {
        table: 'audits',
        scoreCol: 'score',
        dateCol: 'submitted_at',
        brandCol: 'brand_id',
        storeCol: 'store_id',
      },
      vm: null, // handled separately
      cx: null,
      training: null,
      environment: null,
      campaign: null,
      attendance: null,
    };

    let rawRows;

    if (module === 'audit') {
      const storeClause = store_id ? ` AND store_id=$2` : '';
      const p = store_id ? [brandId, store_id] : [brandId];
      const { rows } = await query(
        `SELECT
           ${period === '30d' ? "DATE(submitted_at)" : period === '90d' ? "DATE_TRUNC('week', submitted_at)" : "DATE_TRUNC('month', submitted_at)"} as period,
           ROUND(AVG(a.score), 2) as value
         FROM audits a JOIN audit_templates at ON at.id=a.template_id WHERE at.brand_id=$1${storeClause}
           AND a.submitted_at > NOW() - INTERVAL '${interval}'
         GROUP BY 1 ORDER BY 1`,
        p
      );
      rawRows = rows;
    } else if (module === 'vm') {
      const storeClause = store_id ? ` AND vs.store_id=$2` : '';
      const p = store_id ? [brandId, store_id] : [brandId];
      const { rows } = await query(
        `SELECT
           ${period === '30d' ? "DATE(vs.submitted_at)" : period === '90d' ? "DATE_TRUNC('week', vs.submitted_at)" : "DATE_TRUNC('month', vs.submitted_at)"} as period,
           ROUND(AVG(vs.compliance_score), 2) as value
         FROM vm_submissions vs
         JOIN vm_tasks vt ON vs.task_id=vt.id
         WHERE vt.brand_id=$1${storeClause}
           AND vs.submitted_at > NOW() - INTERVAL '${interval}'
         GROUP BY 1 ORDER BY 1`,
        p
      );
      rawRows = rows;
    } else if (module === 'cx') {
      const storeClause = store_id ? ` AND cr.store_id=$2` : '';
      const p = store_id ? [brandId, store_id] : [brandId];
      const { rows } = await query(
        `SELECT
           ${period === '30d' ? "DATE(cr.submitted_at)" : period === '90d' ? "DATE_TRUNC('week', cr.submitted_at)" : "DATE_TRUNC('month', cr.submitted_at)"} as period,
           ROUND(AVG(cr.nps_score) * 10, 2) as value
         FROM cx_responses cr
         JOIN cx_surveys cs ON cs.id=cr.survey_id
         WHERE cs.brand_id=$1${storeClause}
           AND cr.submitted_at > NOW() - INTERVAL '${interval}'
           AND cr.nps_score IS NOT NULL
         GROUP BY 1 ORDER BY 1`,
        p
      );
      rawRows = rows;
    } else if (module === 'training') {
      const { rows } = await query(
        `SELECT
           ${period === '30d' ? "DATE(te.completed_at)" : period === '90d' ? "DATE_TRUNC('week', te.completed_at)" : "DATE_TRUNC('month', te.completed_at)"} as period,
           ROUND(AVG(te.score), 2) as value
         FROM training_enrollments te
         JOIN training_courses tc ON tc.id=te.course_id
         WHERE tc.brand_id=$1
           AND te.status='completed'
           AND te.completed_at > NOW() - INTERVAL '${interval}'
         GROUP BY 1 ORDER BY 1`,
        [brandId]
      );
      rawRows = rows;
    } else if (module === 'environment') {
      const storeClause = store_id ? ` AND es.store_id=$2` : '';
      const p = store_id ? [brandId, store_id] : [brandId];
      const { rows } = await query(
        `SELECT
           ${period === '30d' ? "DATE(es.submitted_at)" : period === '90d' ? "DATE_TRUNC('week', es.submitted_at)" : "DATE_TRUNC('month', es.submitted_at)"} as period,
           ROUND(AVG(es.score), 2) as value
         FROM environment_submissions es
         JOIN environment_checklists ec ON ec.id=es.checklist_id
         WHERE ec.brand_id=$1${storeClause}
           AND es.submitted_at > NOW() - INTERVAL '${interval}'
         GROUP BY 1 ORDER BY 1`,
        p
      );
      rawRows = rows;
    } else if (module === 'attendance') {
      const storeClause = store_id ? ` AND a.store_id=$2` : '';
      const p = store_id ? [brandId, store_id] : [brandId];
      const { rows } = await query(
        `SELECT
           ${period === '30d' ? "DATE(a.clock_in_at)" : period === '90d' ? "DATE_TRUNC('week', a.clock_in_at)" : "DATE_TRUNC('month', a.clock_in_at)"} as period,
           ROUND((COUNT(CASE WHEN a.status='present' THEN 1 END)::numeric / NULLIF(COUNT(*),0))*100, 2) as value
         FROM attendance a
         JOIN stores s ON s.id=a.store_id
         WHERE s.brand_id=$1${storeClause}
           AND DATE(a.clock_in_at) >= (NOW()-INTERVAL '${interval}')::date
         GROUP BY 1 ORDER BY 1`,
        p
      );
      rawRows = rows;
    } else {
      return res.status(400).json({ error: 'Unknown module' });
    }

    // Generate full date series with gaps as null
    const { rows: seriesRows } = await query(
      `SELECT generate_series(
         (NOW() - INTERVAL '${interval}')::date,
         NOW()::date,
         ${period === '30d' ? "'1 day'" : period === '90d' ? "'1 week'" : "'1 month'"}::interval
       )::date as date`
    );

    const dataMap = {};
    (rawRows || []).forEach(r => {
      const key = r.period instanceof Date ? r.period.toISOString().split('T')[0] : String(r.period).split('T')[0];
      dataMap[key] = r.value !== null ? parseFloat(r.value) : null;
    });

    const points = seriesRows.map(r => {
      const dateStr = r.date instanceof Date ? r.date.toISOString().split('T')[0] : String(r.date).split('T')[0];
      return { date: dateStr, value: dataMap[dateStr] !== undefined ? dataMap[dateStr] : null };
    });

    res.json({ module, period, data: points });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get trend chart' }); }
};

// ── 5. getModuleBreakdown ──────────────────────────────────────

exports.getModuleBreakdown = async (req, res) => {
  try {
    const brandId = req.user.brand_id;

    const [auditR, auditPrevR, vmR, vmPrevR, trainingR, trainingPrevR, cxR, cxPrevR, envR, envPrevR, campaignR, attendR, attendPrevR] = await Promise.all([
      query(`SELECT COALESCE(AVG(score),0) as score, COUNT(*) as cnt FROM audits a JOIN audit_templates at ON at.id=a.template_id WHERE at.brand_id=$1 AND a.submitted_at > NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(score),0) as score FROM audits a JOIN audit_templates at ON at.id=a.template_id WHERE at.brand_id=$1 AND a.submitted_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(vs.compliance_score),0) as score, COUNT(vs.id) as cnt FROM vm_submissions vs JOIN vm_tasks vt ON vs.task_id=vt.id WHERE vt.brand_id=$1 AND vs.submitted_at > NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(vs.compliance_score),0) as score FROM vm_submissions vs JOIN vm_tasks vt ON vs.task_id=vt.id WHERE vt.brand_id=$1 AND vs.submitted_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE((COUNT(CASE WHEN status='completed' THEN 1 END)::numeric/NULLIF(COUNT(*),0))*100,0) as score, COUNT(*) as cnt FROM training_enrollments te JOIN training_courses tc ON tc.id=te.course_id WHERE tc.brand_id=$1 AND te.enrolled_at > NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE((COUNT(CASE WHEN status='completed' THEN 1 END)::numeric/NULLIF(COUNT(*),0))*100,0) as score FROM training_enrollments te JOIN training_courses tc ON tc.id=te.course_id WHERE tc.brand_id=$1 AND te.enrolled_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(cr.nps_score)*10,0) as score, COUNT(cr.id) as cnt FROM cx_responses cr JOIN cx_surveys cs ON cs.id=cr.survey_id WHERE cs.brand_id=$1 AND cr.submitted_at > NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(cr.nps_score)*10,0) as score FROM cx_responses cr JOIN cx_surveys cs ON cs.id=cr.survey_id WHERE cs.brand_id=$1 AND cr.submitted_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(es.score),0) as score, COUNT(es.id) as cnt, COUNT(CASE WHEN es.score < 60 THEN 1 END) as issues FROM environment_submissions es JOIN environment_checklists ec ON ec.id=es.checklist_id WHERE ec.brand_id=$1 AND es.submitted_at > NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT COALESCE(AVG(es.score),0) as score FROM environment_submissions es JOIN environment_checklists ec ON ec.id=es.checklist_id WHERE ec.brand_id=$1 AND es.submitted_at BETWEEN NOW()-INTERVAL '60 days' AND NOW()-INTERVAL '30 days'`, [brandId]),
      query(`SELECT (SELECT COUNT(*) FROM campaigns WHERE brand_id=$1 AND start_date > NOW()-INTERVAL '30 days') as cnt, COALESCE((SELECT COUNT(DISTINCT cc.store_id)::numeric*100/NULLIF(COUNT(DISTINCT csa.store_id),0) FROM campaign_confirmations cc JOIN campaign_store_assignments csa ON cc.campaign_id=csa.campaign_id WHERE cc.campaign_id IN (SELECT id FROM campaigns WHERE brand_id=$1 AND start_date > NOW()-INTERVAL '30 days')),0) as score`, [brandId]),
      query(`SELECT COALESCE((COUNT(CASE WHEN a.status='present' THEN 1 END)::numeric/NULLIF(COUNT(*),0))*100,0) as score, COUNT(*) as cnt FROM attendance a JOIN stores s ON s.id=a.store_id WHERE s.brand_id=$1 AND DATE(a.clock_in_at) >= (NOW()-INTERVAL '30 days')::date`, [brandId]),
      query(`SELECT COALESCE((COUNT(CASE WHEN a.status='present' THEN 1 END)::numeric/NULLIF(COUNT(*),0))*100,0) as score FROM attendance a JOIN stores s ON s.id=a.store_id WHERE s.brand_id=$1 AND DATE(a.clock_in_at) BETWEEN (NOW()-INTERVAL '60 days')::date AND (NOW()-INTERVAL '30 days')::date`, [brandId]),
    ]);

    // Last activity per module
    const [lastAudit, lastVm, lastTraining, lastCx, lastEnv, lastCampaign, lastAttend] = await Promise.all([
      query(`SELECT MAX(submitted_at) as last FROM audits a JOIN audit_templates at ON at.id=a.template_id WHERE at.brand_id=$1`, [brandId]),
      query(`SELECT MAX(vs.submitted_at) as last FROM vm_submissions vs JOIN vm_tasks vt ON vs.task_id=vt.id WHERE vt.brand_id=$1`, [brandId]),
      query(`SELECT MAX(te.completed_at) as last FROM training_enrollments te JOIN training_courses tc ON tc.id=te.course_id WHERE tc.brand_id=$1 AND te.status='completed'`, [brandId]),
      query(`SELECT MAX(cr.submitted_at) as last FROM cx_responses cr JOIN cx_surveys cs ON cs.id=cr.survey_id WHERE cs.brand_id=$1`, [brandId]),
      query(`SELECT MAX(es.submitted_at) as last FROM environment_submissions es JOIN environment_checklists ec ON ec.id=es.checklist_id WHERE ec.brand_id=$1`, [brandId]),
      query(`SELECT MAX(updated_at) as last FROM campaigns WHERE brand_id=$1`, [brandId]),
      query(`SELECT MAX(a.clock_in_at) as last FROM attendance a JOIN stores s ON s.id=a.store_id WHERE s.brand_id=$1`, [brandId]),
    ]);

    const modules = [
      { module: 'audit',       score: auditR.rows[0].score,    prevScore: auditPrevR.rows[0].score,    items: parseInt(auditR.rows[0].cnt)||0,      issues: 0,                                    last: lastAudit.rows[0].last },
      { module: 'vm',          score: vmR.rows[0].score,       prevScore: vmPrevR.rows[0].score,       items: parseInt(vmR.rows[0].cnt)||0,         issues: 0,                                    last: lastVm.rows[0].last },
      { module: 'training',    score: trainingR.rows[0].score, prevScore: trainingPrevR.rows[0].score, items: parseInt(trainingR.rows[0].cnt)||0,    issues: 0,                                    last: lastTraining.rows[0].last },
      { module: 'cx',          score: cxR.rows[0].score,       prevScore: cxPrevR.rows[0].score,       items: parseInt(cxR.rows[0].cnt)||0,         issues: 0,                                    last: lastCx.rows[0].last },
      { module: 'environment', score: envR.rows[0].score,      prevScore: envPrevR.rows[0].score,      items: parseInt(envR.rows[0].cnt)||0,         issues: parseInt(envR.rows[0].issues)||0,     last: lastEnv.rows[0].last },
      { module: 'campaigns',   score: campaignR.rows[0].score, prevScore: 0,                           items: parseInt(campaignR.rows[0].cnt)||0,   issues: 0,                                    last: lastCampaign.rows[0].last },
      { module: 'attendance',  score: attendR.rows[0].score,   prevScore: attendPrevR.rows[0].score,   items: parseInt(attendR.rows[0].cnt)||0,      issues: 0,                                    last: lastAttend.rows[0].last },
    ].map(m => ({
      module:         m.module,
      score:          Math.round(parseFloat(m.score) * 100) / 100,
      trend:          calcTrend(parseFloat(m.score), parseFloat(m.prevScore)),
      items_count:    m.items,
      issues_count:   m.issues,
      last_activity:  m.last || null,
    }));

    res.json(modules);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get module breakdown' }); }
};

// ── 6. getAnomalyAlerts ────────────────────────────────────────

exports.getAnomalyAlerts = async (req, res) => {
  try {
    const { unread_only = 'true', limit = 20 } = req.query;
    const brandId = req.user.brand_id;
    const params = [brandId, parseInt(limit) || 20];
    let where = 'WHERE aa.brand_id=$1';
    if (unread_only === 'true') where += ' AND aa.is_read=false';

    const { rows } = await query(
      `SELECT aa.*, s.name as store_name
       FROM analytics_alerts aa
       LEFT JOIN stores s ON s.id = aa.store_id
       ${where}
       ORDER BY aa.triggered_at DESC
       LIMIT $2`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get alerts' }); }
};

// ── 7. markAlertRead ───────────────────────────────────────────

exports.markAlertRead = async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE analytics_alerts SET is_read=true WHERE id=$1 AND brand_id=$2 RETURNING *`,
      [req.params.alertId, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Alert not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to mark alert read' }); }
};

// ── 8. getStoreDetail ──────────────────────────────────────────

exports.getStoreDetail = async (req, res) => {
  try {
    const { storeId } = req.params;
    const brandId = req.user.brand_id;

    // Verify store belongs to brand
    const { rows: storeRows } = await query(
      `SELECT * FROM stores WHERE id=$1 AND brand_id=$2`,
      [storeId, brandId]
    );
    if (!storeRows.length) return res.status(404).json({ error: 'Store not found' });
    const store = storeRows[0];

    const [auditR, vmR, cxR, trainingR, envR, attendR, openCaR, openIssuesR, recentAuditsR] = await Promise.all([
      query(`SELECT COALESCE(AVG(score),0) as score, COUNT(*) as cnt FROM audits WHERE store_id=$1 AND submitted_at > NOW()-INTERVAL '30 days'`, [storeId]),
      query(`SELECT COALESCE(AVG(vs.compliance_score),0) as score FROM vm_submissions vs JOIN vm_tasks vt ON vs.task_id=vt.id WHERE vs.store_id=$1 AND vs.submitted_at > NOW()-INTERVAL '30 days'`, [storeId]),
      query(`SELECT COALESCE(AVG(cr.nps_score)*10,0) as score FROM cx_responses cr WHERE cr.store_id=$1 AND cr.submitted_at > NOW()-INTERVAL '30 days' AND cr.nps_score IS NOT NULL`, [storeId]),
      query(`SELECT COALESCE((COUNT(CASE WHEN te.status='completed' THEN 1 END)::numeric/NULLIF(COUNT(*),0))*100,0) as score FROM training_enrollments te WHERE te.store_id=$1 AND te.enrolled_at > NOW()-INTERVAL '30 days'`, [storeId]),
      query(`SELECT COALESCE(AVG(es.score),0) as score FROM environment_submissions es WHERE es.store_id=$1 AND es.submitted_at > NOW()-INTERVAL '30 days'`, [storeId]),
      query(`SELECT COALESCE((COUNT(CASE WHEN status='present' THEN 1 END)::numeric/NULLIF(COUNT(*),0))*100,0) as score FROM attendance WHERE store_id=$1 AND date >= (NOW()-INTERVAL '30 days')::date`, [storeId]),
      query(`SELECT ca.* FROM corrective_actions ca JOIN audits a ON a.id=ca.audit_id WHERE a.store_id=$1 AND ca.status NOT IN ('closed','resolved') ORDER BY ca.due_date ASC LIMIT 3`, [storeId]),
      query(`SELECT * FROM environment_issues WHERE store_id=$1 AND status NOT IN ('resolved','closed') ORDER BY created_at DESC LIMIT 10`, [storeId]),
      query(`SELECT id, submitted_at, score, status FROM audits WHERE store_id=$1 ORDER BY submitted_at DESC LIMIT 5`, [storeId]),
    ]);

    const components = {
      audit:       Math.round(parseFloat(auditR.rows[0].score)    * 100) / 100,
      vm:          Math.round(parseFloat(vmR.rows[0].score)       * 100) / 100,
      cx:          Math.round(parseFloat(cxR.rows[0].score)       * 100) / 100,
      training:    Math.round(parseFloat(trainingR.rows[0].score) * 100) / 100,
      environment: Math.round(parseFloat(envR.rows[0].score)      * 100) / 100,
      attendance:  Math.round(parseFloat(attendR.rows[0].score)   * 100) / 100,
    };

    const weights = { audit: 0.25, vm: 0.20, training: 0.15, cx: 0.20, environment: 0.10, attendance: 0.10 };
    const bhs = Object.keys(weights).reduce((sum, k) => sum + (components[k] || 0) * weights[k], 0);

    res.json({
      store,
      brand_health_score: Math.round(bhs * 100) / 100,
      components,
      top_corrective_actions: openCaR.rows,
      open_issues: openIssuesR.rows,
      recent_audits: recentAuditsR.rows,
    });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get store detail' }); }
};

// ── 9. getKpiTargets ───────────────────────────────────────────

exports.getKpiTargets = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT * FROM kpi_targets WHERE brand_id=$1 ORDER BY module, metric_name`,
      [req.user.brand_id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get KPI targets' }); }
};

// ── 10. upsertKpiTarget ────────────────────────────────────────

exports.upsertKpiTarget = async (req, res) => {
  try {
    const { module, metric_name, target_value, unit, period } = req.body;
    if (!module || !metric_name || target_value === undefined) {
      return res.status(400).json({ error: 'module, metric_name, and target_value are required' });
    }

    const { rows } = await query(
      `INSERT INTO kpi_targets(brand_id, module, metric_name, target_value, unit, period)
       VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT (brand_id, module, metric_name)
       DO UPDATE SET target_value=EXCLUDED.target_value, unit=EXCLUDED.unit, period=EXCLUDED.period, updated_at=now()
       RETURNING *`,
      [req.user.brand_id, module, metric_name, target_value, unit || null, period || 'monthly']
    );
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to upsert KPI target' }); }
};
