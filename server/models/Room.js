/**
 * @module models/Room
 * Data-access layer for the `room_types` table.
 */
const { getDatabase } = require('../config/database');

const Room = {
  create({ name, description, capacity, pricePerNight, totalRooms, amenities, imageUrl, rating }) {
    const db = getDatabase();
    const info = db.prepare(
      `INSERT INTO room_types (name, description, capacity, price_per_night, total_rooms, amenities, image_url, rating)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      name, description || '', capacity, pricePerNight,
      totalRooms, JSON.stringify(amenities || []), imageUrl || null, rating || 4.0
    );
    return this.findById(info.lastInsertRowid);
  },

  findById(id) {
    const db = getDatabase();
    const row = db.prepare(`SELECT * FROM room_types WHERE id = ?`).get(id);
    if (row) row.amenities = JSON.parse(row.amenities || '[]');
    return row || null;
  },

  findByName(name) {
    const db = getDatabase();
    const row = db.prepare(`SELECT * FROM room_types WHERE name = ?`).get(name);
    if (row) row.amenities = JSON.parse(row.amenities || '[]');
    return row || null;
  },

  /** List all room types, optionally sorted. */
  findAll({ sortBy = 'price_per_night', order = 'ASC' } = {}) {
    const db = getDatabase();
    const allowed = ['price_per_night', 'rating', 'capacity', 'name'];
    const col = allowed.includes(sortBy) ? sortBy : 'price_per_night';
    const dir = order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
    const rows = db.prepare(`SELECT * FROM room_types ORDER BY ${col} ${dir}`).all();
    return rows.map(r => ({ ...r, amenities: JSON.parse(r.amenities || '[]') }));
  },

  /**
   * Count how many rooms of a type are already booked for a given date range.
   * Returns the number of available rooms.
   */
  getAvailability(roomTypeId, checkIn, checkOut) {
    const db = getDatabase();
    const room = db.prepare(`SELECT total_rooms FROM room_types WHERE id = ?`).get(roomTypeId);
    if (!room) return 0;

    const overlap = db.prepare(
      `SELECT COUNT(*) AS cnt FROM reservations
       WHERE room_type_id = ? AND status IN ('pending','confirmed')
         AND check_in < ? AND check_out > ?`
    ).get(roomTypeId, checkOut, checkIn);

    return Math.max(0, room.total_rooms - (overlap?.cnt || 0));
  },

  /** Update a room type (admin). */
  update(id, fields) {
    const db = getDatabase();
    const sets = [];
    const vals = [];
    for (const [k, v] of Object.entries(fields)) {
      if (v !== undefined) {
        const col = k.replace(/([A-Z])/g, '_$1').toLowerCase(); // camelCase → snake_case
        sets.push(`${col} = ?`);
        vals.push(k === 'amenities' ? JSON.stringify(v) : v);
      }
    }
    if (!sets.length) return this.findById(id);
    vals.push(id);
    db.prepare(`UPDATE room_types SET ${sets.join(', ')} WHERE id = ?`).run(...vals);
    return this.findById(id);
  },
};

module.exports = Room;
