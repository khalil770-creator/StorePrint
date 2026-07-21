const router = require('express').Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const { gpsVerify } = require('../../middleware/gpsVerify');
const ctrl = require('./field.controller');

router.use(authenticate);

// My store
router.get('/my-store',       ctrl.myStore);
router.get('/my-store/staff', ctrl.myStoreStaff);

// Attendance
router.post('/clock-in',    gpsVerify('store_id'), ctrl.clockIn);
router.post('/clock-out',   gpsVerify('store_id'), ctrl.clockOut);
router.get('/attendance',                           ctrl.myAttendance);
router.get('/attendance/store/:storeId', requirePermission('field', 'read'), ctrl.storeAttendance);
router.get('/attendance/live/:storeId',  requirePermission('field', 'read'), ctrl.livePresence);
router.get('/live-presence',             requirePermission('field', 'read'), ctrl.allLivePresence);

// Roster
router.get('/rosters',                requirePermission('field', 'read'),   ctrl.listRosters);
router.post('/rosters',               requirePermission('field', 'create'), ctrl.createRoster);
router.get('/rosters/:id',            requirePermission('field', 'read'),   ctrl.getRoster);
router.post('/rosters/:id/publish',   requirePermission('field', 'update'), ctrl.publishRoster);
router.post('/rosters/:id/copy',      requirePermission('field', 'create'), ctrl.copyRoster);

// Shifts — GET own shifts is open to all authenticated users
router.get('/shifts',                                                        ctrl.myShifts);
router.post('/shifts',                requirePermission('field', 'create'), ctrl.createShift);
router.put('/shifts/:id',             requirePermission('field', 'update'), ctrl.updateShift);
router.delete('/shifts/:id',          requirePermission('field', 'delete'), ctrl.deleteShift);

// Shift swaps
router.post('/shifts/:id/swap',       ctrl.requestSwap);
router.put('/shift-swaps/:id',        requirePermission('field', 'update'), ctrl.reviewSwap);

module.exports = router;
