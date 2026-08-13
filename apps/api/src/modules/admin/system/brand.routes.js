const router = require('express').Router();
const multer = require('multer');
const { authenticate, requirePermission } = require('../../../middleware/auth');
const ctrl = require('./brand.controller');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);
router.get('/',            ctrl.getBrand);
router.put('/',            requirePermission('admin', 'update'), ctrl.updateBrand);
router.post('/logo',       requirePermission('admin', 'update'), upload.single('logo'), ctrl.uploadLogo);

module.exports = router;
