const router = require('express').Router();
const { authenticate, requirePermission } = require('../../../middleware/auth');
const ctrl = require('./users.controller');

router.use(authenticate);

router.get('/',           requirePermission('admin', 'read'),   ctrl.list);
router.post('/',          requirePermission('admin', 'create'), ctrl.invite);
router.post('/bulk',      requirePermission('admin', 'create'), ctrl.bulkImport);
router.get('/export',     requirePermission('admin', 'export'), ctrl.exportCsv);
router.get('/:id',        requirePermission('admin', 'read'),   ctrl.get);
router.put('/:id',        requirePermission('admin', 'update'), ctrl.update);
router.post('/:id/deactivate',     requirePermission('admin', 'update'), ctrl.deactivate);
router.post('/:id/activate',       requirePermission('admin', 'update'), ctrl.activate);
router.post('/:id/reset-password', requirePermission('admin', 'update'), ctrl.resetPassword);
router.post('/:id/force-logout',   requirePermission('admin', 'update'), ctrl.forceLogout);
router.get('/:id/login-history',   requirePermission('admin', 'read'),   ctrl.loginHistory);
router.put('/:id/stores',          requirePermission('admin', 'update'), ctrl.assignStores);
router.put('/:id/role',            requirePermission('admin', 'update'), ctrl.assignRole);

module.exports = router;
