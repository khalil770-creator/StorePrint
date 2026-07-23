const router = require('express').Router();
const { authenticate } = require('../../../middleware/auth');
const ctrl = require('./auth.controller');

router.post('/login',          ctrl.login);
router.post('/refresh',        ctrl.refresh);
router.post('/logout',         ctrl.logout);
router.get('/me',              authenticate, ctrl.me);
router.put('/me/password',     authenticate, ctrl.changePassword);

module.exports = router;
