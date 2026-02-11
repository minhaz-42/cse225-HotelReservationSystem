const { Router } = require('express');
const ctrl = require('../controllers/roomController');

const router = Router();

router.get('/',                     ctrl.list);
router.get('/availability/all',     ctrl.allAvailability);
router.get('/:id',                  ctrl.getOne);
router.get('/:id/availability',     ctrl.availability);

module.exports = router;
