/**
 * @module models/Reservation
 * Data-access layer for the `reservations` table.
 */
const { getDatabase } = require('../config/database');

const Reservation = {
  create({ userId, roomTypeId, referenceNumber, checkIn, checkOut, guests, totalAmount, notes }) {
    const db = getDatabase();
    const info = db.prepare(
      `INSERT INTO reservations
         (user_id, room_type_id, reference_number, check_in, check_out, guests, total_amount, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(userId, roomTypeId, referenceNumber, checkIn, checkOut, guests || 1, totalAmount, notes || null);
    return this.findById(info.lastInsertRowid);
  },

  findById(id) {
    const db = getDatabase();
    return db.prepare(
      `SELECT r.*, rt.name AS room_name, u.username
       FROM reservations r
       JOIN room_types rt ON r.room_type_id = rt.id
       JOIN users u       ON r.user_id = u.id
       WHERE r.id = ?`
    ).get(id) || null;
  },

  findByReference(ref) {
    const db = getDatabase();
    return db.prepare(
      `SELECT r.*, rt.name AS room_name, u.username
       FROM reservations r
       JOIN room_types rt ON r.room_type_id = rt.id
       JOIN users u       ON r.user_id = u.id
       WHERE r.reference_number = ?`
    ).get(ref) || null;
  },

  /** All reservations for a specific user. */
  findByUser(userId) {
    const db = getDatabase();
    return db.prepare(
      `SELECT r.*, rt.name AS room_name
       FROM reservations r
       JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`
    ).all(userId);
  },

  /** All reservations (admin view), optional status filter. */
  findAll({ status, limit = 100, offset = 0 } = {}) {
    const db = getDatabase();
    let sql = `SELECT r.*, rt.name AS room_name, u.username
               FROM reservations r
               JOIN room_types rt ON r.room_type_id = rt.id
               JOIN users u       ON r.user_id = u.id`;
    const params = [];
    if (status) {
      sql += ` WHERE r.status = ?`;
      params.push(status);
    }
    sql += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
    params.push(limit, offset);
    return db.prepare(sql).all(...params);
  },

  updateStatus(id, status) {
    const db = getDatabase();
    db.prepare(
      `UPDATE reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(status, id);
    return this.findById(id);
  },

  cancel(id) {
    return this.updateStatus(id, 'cancelled');
  },

  confirm(id) {
    return this.updateStatus(id, 'confirmed');
  },

  /** Check for overlapping active reservations for the same room type. */
  hasOverlap(roomTypeId, checkIn, checkOut, excludeId = null) {
    const db = getDatabase();
    let sql = `SELECT COUNT(*) AS cnt FROM reservations
               WHERE room_type_id = ? AND status IN ('pending','confirmed')
                 AND check_in < ? AND check_out > ?`;
    const params = [roomTypeId, checkOut, checkIn];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    const row = db.prepare(sql).get(...params);
    return row.cnt;
  },

  /** Aggregate stats for admin analytics. */
  getStats() {
    const db = getDatabase();
    const total   = db.prepare(`SELECT COUNT(*) AS cnt FROM reservations`).get().cnt;
    const pending = db.prepare(`SELECT COUNT(*) AS cnt FROM reservations WHERE status='pending'`).get().cnt;
    const confirmed = db.prepare(`SELECT COUNT(*) AS cnt FROM reservations WHERE status='confirmed'`).get().cnt;
    const cancelled = db.prepare(`SELECT COUNT(*) AS cnt FROM reservations WHERE status='cancelled'`).get().cnt;
    const revenue = db.prepare(
      `SELECT COALESCE(SUM(total_amount),0) AS total FROM reservations WHERE status IN ('confirmed','completed')`
    ).get().total;

    const byRoom = db.prepare(
      `SELECT rt.name, COUNT(r.id) AS bookings, SUM(r.total_amount) AS revenue
       FROM reservations r JOIN room_types rt ON r.room_type_id = rt.id
       WHERE r.status IN ('confirmed','completed')
       GROUP BY rt.name ORDER BY bookings DESC`
    ).all();

    const monthly = db.prepare(
      `SELECT strftime('%Y-%m', check_in) AS month, COUNT(*) AS bookings,
              SUM(total_amount) AS revenue
       FROM reservations WHERE status IN ('confirmed','completed')
       GROUP BY month ORDER BY month DESC LIMIT 12`
    ).all();

    return { total, pending, confirmed, cancelled, revenue, byRoom, monthly };
  },
};

module.exports = Reservation;
