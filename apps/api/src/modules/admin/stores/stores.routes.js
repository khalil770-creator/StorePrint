const router = require('express').Router();
const { authenticate, requirePermission } = require('../../../middleware/auth');
const ctrl = require('./stores.controller');

router.use(authenticate);

router.get('/list',            ctrl.listBasic);   // lightweight list — any authenticated user
router.get('/',                requirePermission('admin', 'read'),   ctrl.list);
router.post('/',               requirePermission('admin', 'create'), ctrl.create);
router.get('/export',          requirePermission('admin', 'export'), ctrl.exportCsv);
router.get('/hierarchy',       requirePermission('admin', 'read'),   ctrl.hierarchy);
router.get('/:id',             requirePermission('admin', 'read'),   ctrl.get);
router.put('/:id',             requirePermission('admin', 'update'), ctrl.update);
router.put('/:id/status',      requirePermission('admin', 'update'), ctrl.setStatus);
router.put('/:id/geofence',    requirePermission('admin', 'update'), ctrl.setGeofence);
router.get('/:id/staff',       requirePermission('admin', 'read'),   ctrl.getStaff);
router.delete('/:id',          requirePermission('admin', 'delete'), ctrl.remove);

module.exports = router;
