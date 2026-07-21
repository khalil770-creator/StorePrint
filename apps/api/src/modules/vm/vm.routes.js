const router = require('express').Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const { gpsVerify } = require('../../middleware/gpsVerify');
const ctrl = require('./vm.controller');

router.use(authenticate);

// Templates
router.get('/templates',             requirePermission('vm', 'read'),   ctrl.listTemplates);
router.post('/templates',            requirePermission('vm', 'create'), ctrl.createTemplate);
router.put('/templates/:id',         requirePermission('vm', 'update'), ctrl.updateTemplate);
router.delete('/templates/:id',      requirePermission('vm', 'delete'), ctrl.deleteTemplate);

// Compliance report
router.get('/compliance',            requirePermission('vm', 'read'),   ctrl.getCompliance);

// Tasks
router.get('/tasks',                 requirePermission('vm', 'read'),   ctrl.listTasks);
router.post('/tasks',                requirePermission('vm', 'create'), ctrl.createTask);
router.get('/tasks/:id',             requirePermission('vm', 'read'),   ctrl.getTask);
router.post('/tasks/:id/submit',     requirePermission('vm', 'update'), gpsVerify('store_id'), ctrl.submitTask);
router.put('/tasks/:id/review',      requirePermission('vm', 'update'), ctrl.reviewTask);

module.exports = router;
