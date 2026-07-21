const { query } = require('../../config/db');

// ── List Courses ──────────────────────────────────────────────

exports.listCourses = async (req, res) => {
  try {
    const { category, published } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE tc.brand_id=$1';
    if (category)  { params.push(category);          where += ` AND tc.category=$${params.length}`; }
    if (published !== undefined) { params.push(published === 'true'); where += ` AND tc.is_published=$${params.length}`; }

    const { rows } = await query(
      `SELECT tc.*, u.name as created_by_name,
              COUNT(DISTINCT te.id) as enrollment_count,
              COUNT(DISTINCT CASE WHEN te.status='completed' THEN te.id END) as completed_count
       FROM training_courses tc
       LEFT JOIN users u ON u.id = tc.created_by
       LEFT JOIN training_enrollments te ON te.course_id = tc.id
       ${where}
       GROUP BY tc.id, u.name
       ORDER BY tc.created_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list courses' }); }
};

// ── Create Course ─────────────────────────────────────────────

exports.createCourse = async (req, res) => {
  try {
    const { title, description, category, thumbnail_url, modules = [],
      duration_mins, duration_minutes, pass_score, pass_mark } = req.body;
    const durMins  = duration_mins  || duration_minutes  || null;
    const passScore = pass_score || pass_mark || 80;
    const { rows } = await query(
      `INSERT INTO training_courses(brand_id, title, description, category, duration_mins, pass_score, thumbnail_url, created_by)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user.brand_id, title, description || null, category || null,
       durMins, passScore, thumbnail_url || null, req.user.id]
    );
    const course = rows[0];
    const insertedModules = [];
    for (const [i, m] of modules.entries()) {
      if (!m.title?.trim()) continue;
      const { rows: mr } = await query(
        `INSERT INTO training_modules(course_id, title, content_type, order_index, has_quiz)
         VALUES($1,$2,$3,$4,$5) RETURNING *`,
        [course.id, m.title.trim(), m.content_type || 'video', i, m.has_quiz || false]
      );
      insertedModules.push(mr[0]);
    }
    res.status(201).json({ ...course, modules: insertedModules });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create course' }); }
};

// ── Get Course ────────────────────────────────────────────────

exports.getCourse = async (req, res) => {
  try {
    const { rows: course } = await query(
      `SELECT tc.*, u.name as created_by_name
       FROM training_courses tc
       LEFT JOIN users u ON u.id = tc.created_by
       WHERE tc.id=$1 AND tc.brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!course.length) return res.status(404).json({ error: 'Course not found' });

    const { rows: modules } = await query(
      `SELECT tm.*, COUNT(tq.id)::int as quiz_count
       FROM training_modules tm
       LEFT JOIN training_quizzes tq ON tq.module_id = tm.id
       WHERE tm.course_id=$1
       GROUP BY tm.id
       ORDER BY tm.order_index ASC`,
      [req.params.id]
    );

    const { rows: stats } = await query(
      `SELECT
         COUNT(*)::int as total_enrolled,
         COUNT(CASE WHEN status='completed' THEN 1 END)::int as completed,
         COUNT(CASE WHEN status='in_progress' THEN 1 END)::int as in_progress,
         ROUND(AVG(score) FILTER (WHERE score IS NOT NULL), 1) as avg_score
       FROM training_enrollments WHERE course_id=$1`,
      [req.params.id]
    );

    res.json({ ...course[0], modules, enrollment_stats: stats[0] });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get course' }); }
};

// ── Update Course ─────────────────────────────────────────────

exports.updateCourse = async (req, res) => {
  try {
    const { title, description, category, thumbnail_url, modules,
      duration_mins, duration_minutes, pass_score, pass_mark } = req.body;
    const durMins   = duration_mins  || duration_minutes  || null;
    const passScore = pass_score || pass_mark || 80;
    const { rows } = await query(
      `UPDATE training_courses SET title=$1, description=$2, category=$3,
         duration_mins=$4, pass_score=$5, thumbnail_url=$6, updated_at=NOW()
       WHERE id=$7 AND brand_id=$8 RETURNING *`,
      [title, description || null, category || null, durMins,
       passScore, thumbnail_url || null, req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Course not found' });

    if (Array.isArray(modules)) {
      await query(`DELETE FROM training_modules WHERE course_id=$1`, [req.params.id]);
      for (const [i, m] of modules.entries()) {
        if (!m.title?.trim()) continue;
        await query(
          `INSERT INTO training_modules(course_id, title, content_type, order_index, has_quiz)
           VALUES($1,$2,$3,$4,$5)`,
          [req.params.id, m.title.trim(), m.content_type || 'video', i, m.has_quiz || false]
        );
      }
    }
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update course' }); }
};

exports.deleteCourse = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT id FROM training_courses WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Course not found' });
    await query(`DELETE FROM training_modules WHERE course_id=$1`, [req.params.id]);
    await query(`DELETE FROM training_courses WHERE id=$1 AND brand_id=$2`, [req.params.id, req.user.brand_id]);
    res.json({ message: 'Course deleted' });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete course' }); }
};

// ── Publish Course ────────────────────────────────────────────

exports.publishCourse = async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE training_courses SET is_published=true, updated_at=NOW()
       WHERE id=$1 AND brand_id=$2 RETURNING *`,
      [req.params.id, req.user.brand_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Course not found' });
    res.json(rows[0]);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to publish course' }); }
};

// ── List Modules ──────────────────────────────────────────────

exports.listModules = async (req, res) => {
  try {
    // Verify course belongs to brand
    const { rows: course } = await query(
      `SELECT id FROM training_courses WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!course.length) return res.status(404).json({ error: 'Course not found' });

    const { rows } = await query(
      `SELECT tm.*, COUNT(tq.id)::int as quiz_count
       FROM training_modules tm
       LEFT JOIN training_quizzes tq ON tq.module_id = tm.id
       WHERE tm.course_id=$1
       GROUP BY tm.id
       ORDER BY tm.order_index ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list modules' }); }
};

// ── Add Module ────────────────────────────────────────────────

exports.addModule = async (req, res) => {
  try {
    const { title, content_type, content_url, content_text, order_index, duration_mins, quizzes } = req.body;
    const { rows: course } = await query(
      `SELECT id FROM training_courses WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!course.length) return res.status(404).json({ error: 'Course not found' });

    const { rows: mod } = await query(
      `INSERT INTO training_modules(course_id, title, content_type, content_url, content_text, order_index, duration_mins)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, title, content_type || null, content_url || null,
       content_text || null, order_index || 0, duration_mins || null]
    );

    // Optionally insert quiz questions
    const insertedQuizzes = [];
    if (Array.isArray(quizzes) && quizzes.length) {
      for (const q of quizzes) {
        const { rows: qrow } = await query(
          `INSERT INTO training_quizzes(module_id, question, options, correct_index, explanation)
           VALUES($1,$2,$3,$4,$5) RETURNING *`,
          [mod[0].id, q.question, JSON.stringify(q.options || []), q.correct_index, q.explanation || null]
        );
        insertedQuizzes.push(qrow[0]);
      }
    }

    res.status(201).json({ ...mod[0], quizzes: insertedQuizzes });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to add module' }); }
};

// ── Enroll Users ──────────────────────────────────────────────

exports.enrollUsers = async (req, res) => {
  try {
    const { user_ids = [], store_id } = req.body;
    if (!Array.isArray(user_ids) || !user_ids.length) {
      return res.status(400).json({ error: 'user_ids array is required' });
    }
    const { rows: course } = await query(
      `SELECT id FROM training_courses WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!course.length) return res.status(404).json({ error: 'Course not found' });

    const enrolled = [];
    for (const user_id of user_ids) {
      const { rows } = await query(
        `INSERT INTO training_enrollments(course_id, user_id, store_id)
         VALUES($1,$2,$3)
         ON CONFLICT(course_id, user_id) DO NOTHING RETURNING *`,
        [req.params.id, user_id, store_id || null]
      );
      if (rows.length) enrolled.push(rows[0]);
    }
    res.status(201).json({ enrolled: enrolled.length, records: enrolled });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to enroll users' }); }
};

// ── List Enrollments ──────────────────────────────────────────

exports.listEnrollments = async (req, res) => {
  try {
    const { rows: course } = await query(
      `SELECT id FROM training_courses WHERE id=$1 AND brand_id=$2`,
      [req.params.id, req.user.brand_id]
    );
    if (!course.length) return res.status(404).json({ error: 'Course not found' });

    const { rows } = await query(
      `SELECT te.*, u.name as user_name, u.email, s.name as store_name
       FROM training_enrollments te
       JOIN users u ON u.id = te.user_id
       LEFT JOIN stores s ON s.id = te.store_id
       WHERE te.course_id=$1
       ORDER BY te.enrolled_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list enrollments' }); }
};

// ── Update Module Progress ────────────────────────────────────

exports.updateProgress = async (req, res) => {
  try {
    const { module_id, completed, score, attempts } = req.body;
    if (!module_id) return res.status(400).json({ error: 'module_id is required' });

    // Verify enrollment belongs to current user (or admin can update)
    const { rows: enroll } = await query(
      `SELECT te.*, tc.pass_score, tc.brand_id
       FROM training_enrollments te
       JOIN training_courses tc ON tc.id = te.course_id
       WHERE te.id=$1`,
      [req.params.enrollmentId]
    );
    if (!enroll.length) return res.status(404).json({ error: 'Enrollment not found' });
    if (enroll[0].brand_id !== req.user.brand_id) return res.status(403).json({ error: 'Forbidden' });

    const { rows } = await query(
      `INSERT INTO training_progress(enrollment_id, module_id, completed, score, attempts, completed_at)
       VALUES($1,$2,$3,$4,$5,$6)
       ON CONFLICT(enrollment_id, module_id) DO UPDATE
         SET completed=$3, score=$4, attempts=training_progress.attempts+1,
             completed_at=CASE WHEN $3 THEN NOW() ELSE training_progress.completed_at END
       RETURNING *`,
      [req.params.enrollmentId, module_id, completed || false,
       score || null, attempts || 1, completed ? 'NOW()' : null]
    );

    // Recalculate overall progress
    const { rows: prog } = await query(
      `SELECT
         COUNT(tm.id)::int as total_modules,
         COUNT(tp.id) FILTER (WHERE tp.completed=true)::int as completed_modules
       FROM training_modules tm
       LEFT JOIN training_progress tp ON tp.module_id=tm.id AND tp.enrollment_id=$1
       WHERE tm.course_id=$2`,
      [req.params.enrollmentId, enroll[0].course_id]
    );
    const pct = prog[0].total_modules > 0
      ? Math.round((prog[0].completed_modules / prog[0].total_modules) * 100)
      : 0;

    await query(
      `UPDATE training_enrollments SET progress_pct=$1,
         status=CASE WHEN $1=100 THEN 'in_progress' ELSE status END
       WHERE id=$2`,
      [pct, req.params.enrollmentId]
    );

    res.json({ ...rows[0], progress_pct: pct });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update progress' }); }
};

// ── Complete Enrollment + Issue Cert ──────────────────────────

exports.completeEnrollment = async (req, res) => {
  try {
    const { score, expires_at, certificate_url } = req.body;

    const { rows: enroll } = await query(
      `SELECT te.*, tc.pass_score, tc.brand_id
       FROM training_enrollments te
       JOIN training_courses tc ON tc.id = te.course_id
       WHERE te.id=$1`,
      [req.params.enrollmentId]
    );
    if (!enroll.length) return res.status(404).json({ error: 'Enrollment not found' });
    if (enroll[0].brand_id !== req.user.brand_id) return res.status(403).json({ error: 'Forbidden' });

    const passed = score !== undefined ? score >= enroll[0].pass_score : true;
    const newStatus = passed ? 'completed' : 'failed';

    const { rows: updated } = await query(
      `UPDATE training_enrollments
       SET status=$1, score=$2, progress_pct=100, completed_at=NOW()
       WHERE id=$3 RETURNING *`,
      [newStatus, score || null, req.params.enrollmentId]
    );

    let cert = null;
    if (passed) {
      const { rows } = await query(
        `INSERT INTO certifications(user_id, course_id, store_id, expires_at, certificate_url)
         VALUES($1,$2,$3,$4,$5) RETURNING *`,
        [enroll[0].user_id, enroll[0].course_id, enroll[0].store_id,
         expires_at || null, certificate_url || null]
      );
      cert = rows[0];
    }

    res.json({ enrollment: updated[0], certification: cert });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to complete enrollment' }); }
};

// ── My Courses ────────────────────────────────────────────────

exports.myCourses = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT te.*, tc.title, tc.description, tc.category, tc.thumbnail_url,
              tc.duration_mins, tc.pass_score
       FROM training_enrollments te
       JOIN training_courses tc ON tc.id = te.course_id
       WHERE te.user_id=$1
       ORDER BY te.enrolled_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to get my courses' }); }
};

// ── List Certifications ───────────────────────────────────────

exports.listCertifications = async (req, res) => {
  try {
    const { user_id, store_id } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE tc.brand_id=$1';
    if (user_id)  { params.push(user_id);  where += ` AND c.user_id=$${params.length}`; }
    if (store_id) { params.push(store_id); where += ` AND c.store_id=$${params.length}`; }

    const { rows } = await query(
      `SELECT c.*, u.name as user_name, u.email, tc.title as course_title, s.name as store_name
       FROM certifications c
       JOIN users u ON u.id = c.user_id
       JOIN training_courses tc ON tc.id = c.course_id
       LEFT JOIN stores s ON s.id = c.store_id
       ${where}
       ORDER BY c.issued_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to list certifications' }); }
};
