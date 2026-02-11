const { Router } = require('express');
const ctrl = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');

const router = Router();

router.use(authenticate, authorize('admin'));

router.get('/reservations',               ctrl.listReservations);
router.patch('/reservations/:id/confirm',  ctrl.confirmReservation);
router.delete('/reservations/:id',         ctrl.deleteReservation);
router.get('/stats',                       ctrl.getStats);
router.get('/analytics/summary',           ctrl.analyticsSummary);
router.get('/analytics/heatmap',           ctrl.demandHeatmap);
router.get('/users',                       ctrl.listUsers);
router.put('/rooms/:id',                   ctrl.updateRoom);

module.exports = router;
