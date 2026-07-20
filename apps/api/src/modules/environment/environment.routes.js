const router = require('express').Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const { gpsVerify } = require('../../middleware/gpsVerify');
const ctrl = require('./environment.controller');

router.use(authenticate);

router.get('/checklists',                requirePermission('environment', 'read'),   ctrl.listChecklists);
router.post('/checklists',               requirePermission('environment', 'create'), ctrl.createChecklist);
router.get('/checklists/:id',            requirePermission('environment', 'read'),   ctrl.getChecklist);
router.put('/checklists/:id',            requirePermission('environment', 'update'), ctrl.updateChecklist);
router.post('/checklists/:id/submit',    requirePermission('environment', 'update'), gpsVerify('store_id'), ctrl.submitChecklist);
router.get('/submissions',               requirePermission('environment', 'read'),   ctrl.listSubmissions);
router.get('/submissions/:id',           requirePermission('environment', 'read'),   ctrl.getSubmission);
router.get('/issues',                    requirePermission('environment', 'read'),   ctrl.listIssues);
router.put('/issues/:id',                requirePermission('environment', 'update'), ctrl.updateIssue);
router.get('/store-report/:storeId',     requirePermission('environment', 'read'),   ctrl.storeReport);

module.exports = router;
