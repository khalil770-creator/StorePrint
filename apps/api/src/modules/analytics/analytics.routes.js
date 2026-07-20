const router = require('express').Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const ctrl = require('./analytics.controller');

router.use(authenticate);

router.get('/brand-health',         requirePermission('analytics', 'read'),   ctrl.getBrandHealthScore);
router.get('/kpi-tiles',            requirePermission('analytics', 'read'),   ctrl.getKpiTiles);
router.get('/store-rankings',       requirePermission('analytics', 'read'),   ctrl.getStoreRankings);
router.get('/trend',                requirePermission('analytics', 'read'),   ctrl.getTrendChart);
router.get('/module-breakdown',     requirePermission('analytics', 'read'),   ctrl.getModuleBreakdown);
router.get('/alerts',               requirePermission('analytics', 'read'),   ctrl.getAnomalyAlerts);
router.put('/alerts/:alertId/read', requirePermission('analytics', 'update'), ctrl.markAlertRead);
router.get('/stores/:storeId',      requirePermission('analytics', 'read'),   ctrl.getStoreDetail);
router.get('/kpi-targets',          requirePermission('analytics', 'read'),   ctrl.getKpiTargets);
router.put('/kpi-targets',          requirePermission('analytics', 'update'), ctrl.upsertKpiTarget);

module.exports = router;
