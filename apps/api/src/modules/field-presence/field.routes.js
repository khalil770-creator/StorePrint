const router = require('express').Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const { gpsVerify } = require('../../middleware/gpsVerify');
const ctrl = require('./field.controller');

router.use(authenticate);

// Attendance
router.post('/clock-in',    gpsVerify('store_id'), ctrl.clockIn);
router.post('/clock-out',   gpsVerify('store_id'), ctrl.clockOut);
router.get('/attendance',                           ctrl.myAttendance);
router.get('/attendance/store/:storeId', requirePermission('field_presence', 'read'), ctrl.storeAttendance);
router.get('/attendance/live/:storeId',  requirePermission('field_presence', 'read'), ctrl.livePresence);

// Roster
router.get('/rosters',                requirePermission('field_presence', 'read'),   ctrl.listRosters);
router.post('/rosters',               requirePermission('field_presence', 'create'), ctrl.createRoster);
router.get('/rosters/:id',            requirePermission('field_presence', 'read'),   ctrl.getRoster);
router.post('/rosters/:id/publish',   requirePermission('field_presence', 'update'), ctrl.publishRoster);

// Shifts
router.get('/shifts',                 requirePermission('field_presence', 'read'),   ctrl.myShifts);
router.post('/shifts',                requirePermission('field_presence', 'create'), ctrl.createShift);
router.put('/shifts/:id',             requirePermission('field_presence', 'update'), ctrl.updateShift);
router.delete('/shifts/:id',          requirePermission('field_presence', 'delete'), ctrl.deleteShift);

// Shift swaps
router.post('/shifts/:id/swap',       ctrl.requestSwap);
router.put('/shift-swaps/:id',        requirePermission('field_presence', 'update'), ctrl.reviewSwap);

module.exports = router;
