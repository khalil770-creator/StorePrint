const router  = require('express').Router();
const multer  = require('multer');
const { authenticate, requirePermission } = require('../../middleware/auth');
const ctrl    = require('./brand-hub.controller');

// multer — store in memory, 50 MB limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/zip', 'application/x-zip-compressed',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'application/octet-stream',   // PSD / AI / generic
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(psd|ai|eps|svg|zip|doc|docx|pdf|png|jpg|jpeg|gif|webp)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed'));
    }
  },
});

router.use(authenticate);

// ── Categories (read: any brand_hub user; write: admin only) ──
router.get('/categories',           requirePermission('brand_hub', 'read'),   ctrl.listCategories);
router.post('/categories',          requirePermission('admin',     'create'), ctrl.createCategory);
router.put('/categories/:id',       requirePermission('admin',     'update'), ctrl.updateCategory);
router.delete('/categories/:id',    requirePermission('admin',     'delete'), ctrl.deleteCategory);

// ── Assets ────────────────────────────────────────────────────
router.get('/assets',               requirePermission('brand_hub', 'read'),   ctrl.listAssets);
router.get('/assets/:id',           requirePermission('brand_hub', 'read'),   ctrl.getAsset);
router.get('/assets/:id/download',  requirePermission('brand_hub', 'read'),   ctrl.downloadAsset);

// Upload (multipart file) — admin only
router.post('/assets/upload',       requirePermission('admin', 'create'),     upload.single('file'), ctrl.uploadAsset);
// Link (external URL) — admin only
router.post('/assets/link',         requirePermission('admin', 'create'),     ctrl.addLinkAsset);
// Update metadata
router.put('/assets/:id',           requirePermission('admin', 'update'),     ctrl.updateAsset);
// Delete
router.delete('/assets/:id',        requirePermission('admin', 'delete'),     ctrl.deleteAsset);

module.exports = router;
