/**
 * @module services/analyticsService
 * Reservation demand analytics and sentiment helpers.
 */
const Reservation = require('../models/Reservation');

const analyticsService = {
  /**
   * Build a plain-English summary suitable for the admin dashboard
   * or for feeding into an LLM prompt.
   */
  buildSummaryText() {
    const stats = Reservation.getStats();

    const lines = [
      `Total reservations: ${stats.total}`,
      `  Pending: ${stats.pending}`,
      `  Confirmed: ${stats.confirmed}`,
      `  Cancelled: ${stats.cancelled}`,
      `Total confirmed revenue: ${stats.revenue.toFixed(2)}`,
      '',
      'Revenue by room type:',
    ];

    for (const r of stats.byRoom) {
      lines.push(`  ${r.name}: ${r.bookings} bookings, revenue ${r.revenue.toFixed(2)}`);
    }

    if (stats.monthly.length) {
      lines.push('', 'Monthly breakdown (recent 12):');
      for (const m of stats.monthly) {
        lines.push(`  ${m.month}: ${m.bookings} bookings, revenue ${m.revenue.toFixed(2)}`);
      }
    }

    return lines.join('\n');
  },

  /** Demand heatmap data: bookings per day for a given month. */
  demandHeatmap(year, month) {
    const { getDatabase } = require('../config/database');
    const db = getDatabase();
    const rows = db.prepare(
      `SELECT strftime('%d', check_in) AS day, COUNT(*) AS cnt
       FROM reservations
       WHERE strftime('%Y', check_in) = ? AND strftime('%m', check_in) = ?
         AND status IN ('pending','confirmed')
       GROUP BY day ORDER BY day`
    ).all(String(year), String(month).padStart(2, '0'));
    return rows;
  },
};

module.exports = analyticsService;
