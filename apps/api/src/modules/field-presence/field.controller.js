const { query } = require('../../config/db');

exports.clockIn = async (req, res) => {
  try {
    const { store_id, shift_id } = req.body;
    const { gps } = req.body;

    // Check already clocked in
    const { rows: active } = await query(
      `SELECT id FROM attendance WHERE user_id=$1 AND store_id=$2 AND clock_out_at IS NULL`,
      [req.user.id, store_id]
    );
    if (active.length) return res.status(409).json({ error: 'Already clocked in at this store' });

    // Check if late vs scheduled shift
    let isLate = false, lateMinutes = 0;
    if (shift_id) {
      const { rows: shift } = await query(`SELECT date, start_time FROM shifts WHERE id=$1`, [shift_id]);
      if (shift.length) {
        const scheduledStart = new Date(`${shift[0].date}T${shift[0].start_time}`);
        const now = new Date();
        lateMinutes = Math.max(0, Math.floor((now - scheduledStart) / 60000));
        isLate = lateMinutes > 5; // 5-min grace
      }
    }

    const { rows } = await query(
      `INSERT INTO attendance
        (user_id, store_id, shift_id, clock_in_at, clock_in_lat, clock_in_lng,
         clock_in_verified, is_late, late_minutes, status)
       VALUES($1,$2,$3,NOW(),$4,$5,$6,$7,$8,'present') RETURNING *`,
      [req.user.id, store_id, shift_id || null,
       gps.lat, gps.lng, req.gpsVerified, isLate, lateMinutes]
    );
    res.status(201).json({ attendance: rows[0], is_late: isLate, late_minutes: lateMinutes });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Clock-in failed' }); }
};

exports.clockOut = async (req, res) => {
  try {
    const { store_id } = req.body;
    const { gps } = req.body;

    const { rows: active } = await query(
      `SELECT a.*, s.end_time, s.date FROM attendance a
       LEFT JOIN shifts s ON s.id = a.shift_id
       WHERE a.user_id=$1 AND a.store_id=$2 AND a.clock_out_at IS NULL`,
      [req.user.id, store_id]
    );
    if (!active.length) return res.status(404).json({ error: 'No active clock-in found' });

    const rec = active[0];
    let earlyExit = false;
    if (rec.end_time && rec.date) {
      const scheduledEnd = new Date(`${rec.date}T${rec.end_time}`);
      earlyExit = new Date() < scheduledEnd;
    }

    const { rows } = await query(
      `UPDATE attendance SET clock_out_at=NOW(), clock_out_lat=$1, clock_out_lng=$2,
         early_exit=$3 WHERE id=$4 RETURNING *`,
      [gps.lat, gps.lng, earlyExit, rec.id]
    );
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Clock-out failed' }); }
};

exports.myAttendance = async (req, res) => {
  try {
    const { from, to } = req.query;
    const params = [req.user.id];
    let where = 'WHERE user_id=$1';
    if (from) { params.push(from); where += ` AND clock_in_at>=$${params.length}`; }
    if (to)   { params.push(to);   where += ` AND clock_in_at<=$${params.length}`; }
    const { rows } = await query(
      `SELECT a.*, st.name as store_name FROM attendance a
       JOIN stores st ON st.id = a.store_id
       ${where} ORDER BY a.clock_in_at DESC`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to get attendance' }); }
};

exports.storeAttendance = async (req, res) => {
  try {
    const { date } = req.query;
    const params = [req.params.storeId];
    let where = 'WHERE a.store_id=$1';
    if (date) { params.push(date); where += ` AND DATE(a.clock_in_at)=$${params.length}`; }
    const { rows } = await query(
      `SELECT a.*, u.name as user_name, u.email, r.name as role
       FROM attendance a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN roles r ON r.id = u.role_id
       ${where} ORDER BY a.clock_in_at`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to get store attendance' }); }
};

exports.livePresence = async (req, res) => {
  try {
    const { rows } = await query(
      `SELECT u.id, u.name, u.email, r.name as role, a.clock_in_at, a.is_late
       FROM attendance a
       JOIN users u ON u.id = a.user_id
       LEFT JOIN roles r ON r.id = u.role_id
       WHERE a.store_id=$1 AND a.clock_out_at IS NULL
       ORDER BY a.clock_in_at`,
      [req.params.storeId]
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to get live presence' }); }
};

exports.listRosters = async (req, res) => {
  try {
    const { store_id } = req.query;
    const params = [req.user.brand_id];
    let where = 'WHERE st.brand_id=$1';
    if (store_id) { params.push(store_id); where += ` AND rs.store_id=$${params.length}`; }
    const { rows } = await query(
      `SELECT rs.*, st.name as store_name, COUNT(sh.id) as shift_count
       FROM roster_schedules rs
       JOIN stores st ON st.id = rs.store_id
       LEFT JOIN shifts sh ON sh.roster_id = rs.id
       ${where} GROUP BY rs.id, st.name ORDER BY rs.start_date DESC`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to list rosters' }); }
};

exports.createRoster = async (req, res) => {
  try {
    const { store_id, name, start_date, end_date } = req.body;
    const { rows } = await query(
      `INSERT INTO roster_schedules(store_id, name, start_date, end_date, created_by)
       VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [store_id, name, start_date, end_date, req.user.id]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create roster' }); }
};

exports.getRoster = async (req, res) => {
  try {
    const { rows: roster } = await query(`SELECT * FROM roster_schedules WHERE id=$1`, [req.params.id]);
    if (!roster.length) return res.status(404).json({ error: 'Roster not found' });
    const { rows: shifts } = await query(
      `SELECT sh.*, u.name as user_name, u.email FROM shifts sh
       JOIN users u ON u.id = sh.user_id
       WHERE sh.roster_id=$1 ORDER BY sh.date, sh.start_time`,
      [req.params.id]
    );
    res.json({ ...roster[0], shifts });
  } catch (err) { res.status(500).json({ error: 'Failed to get roster' }); }
};

exports.publishRoster = async (req, res) => {
  try {
    await query(
      `UPDATE roster_schedules SET status='published', published_at=NOW(), published_by=$1 WHERE id=$2`,
      [req.user.id, req.params.id]
    );
    // TODO: send push notification to all staff on this roster via Ntfy
    res.json({ message: 'Roster published and staff notified' });
  } catch (err) { res.status(500).json({ error: 'Failed to publish roster' }); }
};

exports.myShifts = async (req, res) => {
  try {
    const { from, to } = req.query;
    const params = [req.user.id];
    let where = 'WHERE sh.user_id=$1';
    if (from) { params.push(from); where += ` AND sh.date>=$${params.length}`; }
    if (to)   { params.push(to);   where += ` AND sh.date<=$${params.length}`; }
    const { rows } = await query(
      `SELECT sh.*, st.name as store_name, rs.name as roster_name
       FROM shifts sh
       JOIN stores st ON st.id = sh.store_id
       JOIN roster_schedules rs ON rs.id = sh.roster_id
       ${where} AND rs.status='published'
       ORDER BY sh.date, sh.start_time`,
      params
    );
    res.json(rows);
  } catch (err) { res.status(500).json({ error: 'Failed to get shifts' }); }
};

exports.createShift = async (req, res) => {
  try {
    const { roster_id, store_id, user_id, date, start_time, end_time, role_label, zone, notes } = req.body;
    const { rows } = await query(
      `INSERT INTO shifts(roster_id,store_id,user_id,date,start_time,end_time,role_label,zone,notes)
       VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [roster_id, store_id, user_id, date, start_time, end_time, role_label, zone, notes]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to create shift' }); }
};

exports.updateShift = async (req, res) => {
  try {
    const { start_time, end_time, role_label, zone, notes } = req.body;
    const { rows } = await query(
      `UPDATE shifts SET start_time=$1,end_time=$2,role_label=$3,zone=$4,notes=$5
       WHERE id=$6 RETURNING *`,
      [start_time, end_time, role_label, zone, notes, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Shift not found' });
    res.json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to update shift' }); }
};

exports.deleteShift = async (req, res) => {
  try {
    await query(`DELETE FROM shifts WHERE id=$1`, [req.params.id]);
    res.json({ message: 'Shift deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete shift' }); }
};

exports.requestSwap = async (req, res) => {
  try {
    const { swap_with_user, reason } = req.body;
    const { rows } = await query(
      `INSERT INTO shift_swap_requests(shift_id, requested_by, swap_with_user, reason)
       VALUES($1,$2,$3,$4) RETURNING *`,
      [req.params.id, req.user.id, swap_with_user || null, reason]
    );
    res.status(201).json(rows[0]);
  } catch (err) { res.status(500).json({ error: 'Failed to request swap' }); }
};

exports.reviewSwap = async (req, res) => {
  try {
    const { status } = req.body; // approved or rejected
    await query(
      `UPDATE shift_swap_requests SET status=$1, reviewed_by=$2, reviewed_at=NOW() WHERE id=$3`,
      [status, req.user.id, req.params.id]
    );
    if (status === 'approved') {
      // Swap the user_id on the shift
      const { rows: swap } = await query(`SELECT * FROM shift_swap_requests WHERE id=$1`, [req.params.id]);
      if (swap.length && swap[0].swap_with_user) {
        await query(`UPDATE shifts SET user_id=$1 WHERE id=$2`, [swap[0].swap_with_user, swap[0].shift_id]);
      }
    }
    res.json({ message: `Swap request ${status}` });
  } catch (err) { res.status(500).json({ error: 'Failed to review swap' }); }
};
