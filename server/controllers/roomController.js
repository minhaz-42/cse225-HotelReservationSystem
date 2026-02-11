/**
 * @module controllers/roomController
 * Room catalogue and availability endpoints.
 */
const roomService = require('../services/roomService');

const roomController = {
  /** GET /api/rooms */
  list(req, res) {
    try {
      const rooms = roomService.listRooms({
        sortBy: req.query.sortBy,
        order:  req.query.order,
      });
      res.json(rooms);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** GET /api/rooms/:id */
  getOne(req, res) {
    try {
      const room = roomService.getRoom(Number(req.params.id));
      res.json(room);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  /** GET /api/rooms/:id/availability?checkIn=...&checkOut=... */
  availability(req, res) {
    try {
      const { checkIn, checkOut } = req.query;
      if (!checkIn || !checkOut) {
        return res.status(400).json({ error: 'checkIn and checkOut query params are required' });
      }
      const result = roomService.checkAvailability(Number(req.params.id), checkIn, checkOut);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** GET /api/rooms/availability/all?checkIn=...&checkOut=... */
  allAvailability(req, res) {
    try {
      const { checkIn, checkOut } = req.query;
      if (!checkIn || !checkOut) {
        return res.status(400).json({ error: 'checkIn and checkOut query params are required' });
      }
      const result = roomService.checkAllAvailability(checkIn, checkOut);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = roomController;
