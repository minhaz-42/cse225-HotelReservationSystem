/**
 * @module services/pricingService
 * Dynamic pricing simulation.
 *
 * Research note
 * ─────────────
 * Implements a simple demand-based multiplier:
 *   effective_price = base_price × demand_factor
 *
 * The demand factor rises when occupancy is high and can be
 * extended with day-of-week, seasonal, or ML-based models.
 */
const Room = require('../models/Room');
const { getDatabase } = require('../config/database');

const pricingService = {
  /**
   * Return the effective per-night price for a room type and date range.
   * Falls back to the catalogue base price when no dynamic entry exists.
   */
  getDynamicPrice(roomTypeId, checkIn, _checkOut) {
    const db   = getDatabase();
    const room = Room.findById(roomTypeId);
    if (!room) return 0;

    // Check pricing_history for an override on check-in date
    const entry = db.prepare(
      `SELECT price, demand_factor FROM pricing_history
       WHERE room_type_id = ? AND date = ? ORDER BY id DESC LIMIT 1`
    ).get(roomTypeId, checkIn);

    if (entry) return entry.price * entry.demand_factor;

    // Simulate demand factor based on occupancy ratio
    const factor = this._computeDemandFactor(roomTypeId, checkIn);
    return Math.round(room.price_per_night * factor);
  },

  /**
   * Simple occupancy-based demand multiplier.
   *   0 – 50 % occupancy  → 1.0×
   *  50 – 80 %            → 1.15×
   *  80 – 100 %           → 1.35×
   */
  _computeDemandFactor(roomTypeId, date) {
    const db   = getDatabase();
    const room = db.prepare(`SELECT total_rooms FROM room_types WHERE id = ?`).get(roomTypeId);
    if (!room) return 1.0;

    const booked = db.prepare(
      `SELECT COUNT(*) AS cnt FROM reservations
       WHERE room_type_id = ? AND status IN ('pending','confirmed')
         AND check_in <= ? AND check_out > ?`
    ).get(roomTypeId, date, date);

    const occupancy = (booked?.cnt || 0) / room.total_rooms;
    if (occupancy >= 0.8) return 1.35;
    if (occupancy >= 0.5) return 1.15;
    return 1.0;
  },

  /** Record a pricing snapshot (could be called by a cron job). */
  recordPrice(roomTypeId, date, price, demandFactor = 1.0) {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO pricing_history (room_type_id, date, price, demand_factor)
       VALUES (?, ?, ?, ?)`
    ).run(roomTypeId, date, price, demandFactor);
  },
};

module.exports = pricingService;
