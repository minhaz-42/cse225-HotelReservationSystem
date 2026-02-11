/**
 * @module controllers/adminController
 * Admin-only reservation management, analytics, and user listing.
 */
const reservationService = require('../services/reservationService');
const analyticsService   = require('../services/analyticsService');
const User               = require('../models/User');
const Room               = require('../models/Room');
const { logActivity }    = require('../middleware/logger');

const adminController = {
  /** GET /api/admin/reservations */
  listReservations(req, res) {
    try {
      const data = reservationService.listAll({
        status: req.query.status,
        limit:  Number(req.query.limit)  || 100,
        offset: Number(req.query.offset) || 0,
      });
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** PATCH /api/admin/reservations/:id/confirm */
  confirmReservation(req, res) {
    try {
      const result = reservationService.confirm(Number(req.params.id));
      logActivity(req.user.id, 'CONFIRM_RESERVATION', `ID ${req.params.id}`, req.ip);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  /** DELETE /api/admin/reservations/:id */
  deleteReservation(req, res) {
    try {
      const result = reservationService.cancel(Number(req.params.id), req.user.id, 'admin');
      logActivity(req.user.id, 'DELETE_RESERVATION', `ID ${req.params.id}`, req.ip);
      res.json(result);
    } catch (err) {
      res.status(err.status || 500).json({ error: err.message });
    }
  },

  /** GET /api/admin/stats */
  getStats(req, res) {
    try {
      const stats = reservationService.getStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** GET /api/admin/analytics/summary */
  analyticsSummary(req, res) {
    try {
      const text = analyticsService.buildSummaryText();
      res.json({ summary: text });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** GET /api/admin/analytics/heatmap?year=...&month=... */
  demandHeatmap(req, res) {
    try {
      const year  = Number(req.query.year)  || new Date().getFullYear();
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      const data  = analyticsService.demandHeatmap(year, month);
      res.json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** GET /api/admin/users */
  listUsers(req, res) {
    try {
      res.json(User.findAll());
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  /** PUT /api/admin/rooms/:id */
  updateRoom(req, res) {
    try {
      const room = Room.update(Number(req.params.id), req.body);
      res.json(room);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};

module.exports = adminController;
