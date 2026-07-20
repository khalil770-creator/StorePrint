const router = require('express').Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const ctrl = require('./cx.controller');

router.use(authenticate);

router.get('/surveys',               requirePermission('cx', 'read'),   ctrl.listSurveys);
router.post('/surveys',              requirePermission('cx', 'create'), ctrl.createSurvey);
router.get('/surveys/:id',           requirePermission('cx', 'read'),   ctrl.getSurvey);
router.put('/surveys/:id',           requirePermission('cx', 'update'), ctrl.updateSurvey);
router.post('/surveys/:id/respond',                                      ctrl.submitResponse); // public — no auth
router.get('/responses',             requirePermission('cx', 'read'),   ctrl.listResponses);
router.get('/responses/summary',     requirePermission('cx', 'read'),   ctrl.responsesSummary);
router.get('/reviews',               requirePermission('cx', 'read'),   ctrl.listReviews);
router.post('/reviews',              requirePermission('cx', 'create'), ctrl.addReview);
router.get('/alerts',                requirePermission('cx', 'read'),   ctrl.listAlerts);
router.put('/alerts/:id/read',       requirePermission('cx', 'update'), ctrl.markAlertRead);
router.get('/dashboard',             requirePermission('cx', 'read'),   ctrl.dashboard);

module.exports = router;
