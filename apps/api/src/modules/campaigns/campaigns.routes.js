const router = require('express').Router();
const { authenticate, requirePermission } = require('../../middleware/auth');
const { gpsVerify } = require('../../middleware/gpsVerify');
const ctrl = require('./campaigns.controller');

router.use(authenticate);

router.get('/',                      requirePermission('campaigns', 'read'),   ctrl.listCampaigns);
router.post('/',                     requirePermission('campaigns', 'create'), ctrl.createCampaign);
router.get('/:id',                   requirePermission('campaigns', 'read'),   ctrl.getCampaign);
router.put('/:id',                   requirePermission('campaigns', 'update'), ctrl.updateCampaign);
router.post('/:id/publish',          requirePermission('campaigns', 'update'), ctrl.publishCampaign);
router.post('/:id/assets',           requirePermission('campaigns', 'update'), ctrl.uploadAsset);
router.post('/:id/stores',           requirePermission('campaigns', 'update'), ctrl.assignStores);
router.post('/:id/confirm',          requirePermission('campaigns', 'update'), gpsVerify('store_id'), ctrl.confirmCampaign);
router.get('/:id/compliance',        requirePermission('campaigns', 'read'),   ctrl.getCompliance);

module.exports = router;
