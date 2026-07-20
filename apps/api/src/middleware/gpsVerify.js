/**
 * GPS Presence Verification Middleware
 * Applies to ALL checklist/audit/task submissions across every module.
 * Blocks submission if device GPS is outside the store's configured geo-fence.
 */
const { query } = require('../config/db');

const toRad = (deg) => (deg * Math.PI) / 180;

// Haversine formula — returns distance in metres
const haversineDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * Usage: router.post('/submit', gpsVerify('storeId'), handler)
 * Expects req.body.gps = { lat, lng, accuracy_m } and req.body[storeIdField]
 */
const gpsVerify = (storeIdField = 'store_id') => async (req, res, next) => {
  const { gps } = req.body;
  const storeId = (req.body[storeIdField] || req.params.storeId || '').trim();

  if (!gps || gps.lat === undefined || gps.lng === undefined) {
    return res.status(400).json({
      error: 'GPS location is required for this submission.',
      code: 'GPS_REQUIRED',
    });
  }

  if (!storeId) {
    return res.status(400).json({ error: 'store_id is required', code: 'STORE_REQUIRED' });
  }

  try {
    const { rows } = await query(
      'SELECT lat, lng, geofence_radius FROM stores WHERE id = $1',
      [storeId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Store not found' });

    const store = rows[0];
    if (!store.lat || !store.lng) {
      // Store has no registered GPS — log but allow
      req.gpsVerified = false;
      req.gpsDistance = null;
      return next();
    }

    const distance = haversineDistance(
      parseFloat(gps.lat), parseFloat(gps.lng),
      parseFloat(store.lat), parseFloat(store.lng)
    );

    const radius = store.geofence_radius || 100;

    if (distance > radius) {
      return res.status(403).json({
        error: `You must be physically present at the store to submit. You are ${Math.round(distance)}m away (allowed: ${radius}m).`,
        code: 'OUTSIDE_GEOFENCE',
        distance_m: Math.round(distance),
        allowed_radius_m: radius,
      });
    }

    req.gpsVerified = true;
    req.gpsDistance = Math.round(distance);
    req.gpsData = gps;

    // Log check-in
    await query(
      `INSERT INTO gps_check_ins
        (user_id, store_id, lat, lng, accuracy_m, verified, distance_m, module, ref_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [
        req.user.id, storeId, gps.lat, gps.lng,
        gps.accuracy_m || null, true, req.gpsDistance,
        req.body.module || 'unknown', null
      ]
    );

    next();
  } catch (err) {
    console.error('GPS verify error:', err);
    return res.status(500).json({ error: 'GPS verification failed' });
  }
};

module.exports = { gpsVerify };
