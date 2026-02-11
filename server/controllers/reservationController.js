/**
 * @module controllers/reservationController
 * CRUD operations for reservations (user-facing).
 */
const reservationService = require('../services/reservationService');
const { isValidDate }    = require('../middleware/validation');
const { logActivity }    = require('../middleware/logger');

const reservationController = {
  /** POST /api/reservations — create a booking */
  async create(req, res) {
    try {
      const { roomTypeId, checkIn, checkOut, guests, notes } = req.body;

      if (!roomTypeId || !checkIn || !checkOut) {
        return res.status(400).json({ error: 'roomTypeId, checkIn and checkOut are required' });
      }
      if (!isValidDate(checkIn) || !isValidDate(checkOut)) {
        return res.status(400).json({ error: 'Dates must be YYYY-MM-DD' });
      }

      const result = reservationService.book({
        userId: req.user.id,
        roomTypeId, checkIn, checkOut,
        guests: guests || 1,
        notes,
      });

      logActivity(req.user.id, 'BOOK_ROOM', `Ref ${result.reference_number}`, req.ip);
      res.status(201).json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  /** GET /api/reservations — list current user's bookings */
  async list(req, res) {
    try {
      const data = reservationService.getUserReservations(req.user.id);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** GET /api/reservations/:id */
  async getOne(req, res) {
    try {
      const r = reservationService.listAll();
      const item = r.find(x => x.id === Number(req.params.id));
      if (!item) return res.status(404).json({ error: 'Not found' });
      if (req.user.role !== 'admin' && item.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** PATCH /api/reservations/:id/cancel */
  async cancel(req, res) {
    try {
      const result = reservationService.cancel(
        Number(req.params.id), req.user.id, req.user.role
      );
      logActivity(req.user.id, 'CANCEL_RESERVATION', `ID ${req.params.id}`, req.ip);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },
};

module.exports = reservationController;
