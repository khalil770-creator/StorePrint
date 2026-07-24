const router = require('express').Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const { gpsVerify } = require('../../middleware/gpsVerify');
const ctrl = require('./auditing.controller');

router.use(authenticate);

// Templates
router.get('/templates',           requirePermission('auditing', 'read'),   ctrl.listTemplates);
router.post('/templates',          requirePermission('auditing', 'create'), ctrl.createTemplate);
router.get('/templates/:id',       requirePermission('auditing', 'read'),   ctrl.getTemplate);
router.put('/templates/:id',       requirePermission('auditing', 'update'), ctrl.updateTemplate);
router.delete('/templates/:id',    requirePermission('auditing', 'delete'), ctrl.deleteTemplate);

// Schedules
router.get('/schedules',           requirePermission('auditing', 'read'),   ctrl.listSchedules);
router.post('/schedules',          requirePermission('auditing', 'create'), ctrl.createSchedule);

// Corrective Actions — must be before /:id to avoid route shadowing
router.get('/corrective-actions',              requirePermission('auditing', 'read'),   ctrl.listCorrectiveActions);
router.put('/corrective-actions/:id',          requirePermission('auditing', 'update'), ctrl.updateCorrectiveAction);
router.post('/corrective-actions/:id/resolve', requirePermission('auditing', 'update'), ctrl.resolveCorrectiveAction);

// Reports — must be before /:id
router.get('/reports/store/:storeId',      requirePermission('auditing', 'read'),   ctrl.storeReport);
router.get('/reports/benchmarks',          requirePermission('auditing', 'read'),   ctrl.benchmarks);

// Audits — GPS required on start and submit
router.get('/',                    requirePermission('auditing', 'read'),   ctrl.listAudits);
router.post('/start',              requirePermission('auditing', 'create'), gpsVerify('store_id'), ctrl.startAudit);
router.get('/:id',                 requirePermission('auditing', 'read'),   ctrl.getAudit);
router.post('/:id/responses',      requirePermission('auditing', 'update'), ctrl.saveResponse);
router.post('/:id/submit',         requirePermission('auditing', 'update'), gpsVerify('store_id'), ctrl.submitAudit);

module.exports = router;
