const { Router } = require('express');
const ctrl = require('../controllers/llmController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate);  // all LLM routes require login

router.post('/parse-booking',  ctrl.parseBooking);
router.post('/recommend',      ctrl.recommend);
router.post('/chat',           ctrl.chat);
router.post('/analyse-image',  ctrl.analyseImage);

// Admin-only
router.post('/analytics-report', authorize('admin'), ctrl.analyticsReport);

module.exports = router;
