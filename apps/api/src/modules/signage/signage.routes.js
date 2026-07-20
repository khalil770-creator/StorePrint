const router = require('express').Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const { gpsVerify } = require('../../middleware/gpsVerify');
const ctrl = require('./signage.controller');

router.use(authenticate);

// Templates
router.get('/templates',                    requirePermission('signage', 'read'),   ctrl.listTemplates);
router.post('/templates',                   requirePermission('signage', 'create'), ctrl.createTemplate);
router.get('/templates/:id',                requirePermission('signage', 'read'),   ctrl.getTemplate);

// Print requests
router.get('/print-requests',               requirePermission('signage', 'read'),   ctrl.listPrintRequests);
router.post('/print-requests',              requirePermission('signage', 'create'), ctrl.createPrintRequest);
router.put('/print-requests/:id/status',    requirePermission('signage', 'update'), ctrl.updatePrintRequestStatus);

// Installations — GPS required
router.post('/installations',               requirePermission('signage', 'create'), gpsVerify('store_id'), ctrl.confirmInstallation);

// Compliance
router.get('/compliance',                   requirePermission('signage', 'read'),   ctrl.getCompliance);

module.exports = router;
