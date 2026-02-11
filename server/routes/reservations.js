const { Router } = require('express');
const ctrl = require('../controllers/reservationController');
const { authenticate } = require('../middleware/auth');

const router = Router();

router.use(authenticate);  // all reservation routes require auth

router.post('/',             ctrl.create);
router.get('/',              ctrl.list);
router.get('/:id',           ctrl.getOne);
router.patch('/:id/cancel',  ctrl.cancel);

module.exports = router;
