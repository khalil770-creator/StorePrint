const router = require('express').Router();
const { authenticate, requirePermission } = require('../../../middleware/auth');
const ctrl = require('./roles.controller');

router.use(authenticate);

router.get('/',            requirePermission('admin', 'read'),   ctrl.list);
router.post('/',           requirePermission('admin', 'create'), ctrl.create);
router.get('/permission-matrix', requirePermission('admin', 'read'), ctrl.permissionMatrix);
router.get('/:id',         requirePermission('admin', 'read'),   ctrl.get);
router.put('/:id',         requirePermission('admin', 'update'), ctrl.update);
router.delete('/:id',      requirePermission('admin', 'delete'), ctrl.remove);
router.post('/:id/clone',  requirePermission('admin', 'create'), ctrl.clone);

module.exports = router;
