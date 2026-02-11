const { Router } = require('express');
const ctrl = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.post('/register', ctrl.register);
router.post('/login',    ctrl.login);

// Protected
router.get('/profile',          authenticate, ctrl.getProfile);
router.patch('/profile',        authenticate, ctrl.updateProfile);
router.post('/change-password', authenticate, ctrl.changePassword);

module.exports = router;
