/**
 * @module services/roomService
 * Room catalogue queries and availability checks.
 */
const Room = require('../models/Room');

const roomService = {
  /** List all room types with optional sorting. */
  listRooms(query = {}) {
    return Room.findAll({
      sortBy: query.sortBy || 'price_per_night',
      order:  query.order  || 'ASC',
    });
  },

  /** Get single room type by id. */
  getRoom(id) {
    const room = Room.findById(id);
    if (!room) throw Object.assign(new Error('Room type not found'), { status: 404 });
    return room;
  },

  /**
   * Check availability for a room type over a date range.
   * @returns {{ available: boolean, count: number }}
   */
  checkAvailability(roomTypeId, checkIn, checkOut) {
    const count = Room.getAvailability(roomTypeId, checkIn, checkOut);
    return { available: count > 0, count };
  },

  /**
   * Get availability for ALL room types on a date range.
   */
  checkAllAvailability(checkIn, checkOut) {
    const rooms = Room.findAll();
    return rooms.map(r => ({
      ...r,
      availableRooms: Room.getAvailability(r.id, checkIn, checkOut),
    }));
  },
};

module.exports = roomService;
