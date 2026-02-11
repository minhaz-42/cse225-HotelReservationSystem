/**
 * @module services/reservationService
 * Booking creation, cancellation, confirmation and validation logic.
 */
const { v4: uuidv4 } = require('uuid');
const Room        = require('../models/Room');
const Reservation = require('../models/Reservation');
const pricingService = require('./pricingService');

const reservationService = {
  /**
   * Create a new reservation after validation.
   */
  book({ userId, roomTypeId, checkIn, checkOut, guests, notes }) {
    // 1. Validate room exists
    const room = Room.findById(roomTypeId);
    if (!room) throw Object.assign(new Error('Room type not found'), { status: 404 });

    // 2. Validate dates
    const inDate  = new Date(checkIn);
    const outDate = new Date(checkOut);
    if (outDate <= inDate) {
      throw Object.assign(new Error('Check-out must be after check-in'), { status: 400 });
    }

    // 3. Validate guests
    if (guests && guests > room.capacity) {
      throw Object.assign(new Error(`Room capacity is ${room.capacity}`), { status: 400 });
    }

    // 4. Check availability
    const avail = Room.getAvailability(roomTypeId, checkIn, checkOut);
    if (avail <= 0) {
      throw Object.assign(new Error('No rooms available for the selected dates'), { status: 409 });
    }

    // 5. Calculate total
    const nights = Math.ceil((outDate - inDate) / (1000 * 60 * 60 * 24));
    const pricePerNight = pricingService.getDynamicPrice(roomTypeId, checkIn, checkOut);
    const totalAmount = pricePerNight * nights;

    // 6. Generate reference
    const referenceNumber = uuidv4().slice(0, 8).toUpperCase();

    // 7. Persist
    const reservation = Reservation.create({
      userId, roomTypeId, referenceNumber, checkIn, checkOut,
      guests: guests || 1, totalAmount, notes,
    });

    return { ...reservation, nights, pricePerNight };
  },

  /** Get all reservations for a user. */
  getUserReservations(userId) {
    return Reservation.findByUser(userId);
  },

  /** Cancel a reservation (user can only cancel their own). */
  cancel(reservationId, userId, role) {
    const r = Reservation.findById(reservationId);
    if (!r) throw Object.assign(new Error('Reservation not found'), { status: 404 });
    if (role !== 'admin' && r.user_id !== userId) {
      throw Object.assign(new Error('Forbidden'), { status: 403 });
    }
    if (r.status === 'cancelled') {
      throw Object.assign(new Error('Already cancelled'), { status: 400 });
    }
    return Reservation.cancel(reservationId);
  },

  /** Confirm a reservation (admin only). */
  confirm(reservationId) {
    const r = Reservation.findById(reservationId);
    if (!r) throw Object.assign(new Error('Reservation not found'), { status: 404 });
    if (r.status !== 'pending') {
      throw Object.assign(new Error(`Cannot confirm a ${r.status} reservation`), { status: 400 });
    }
    return Reservation.confirm(reservationId);
  },

  /** Admin: list all reservations with optional filters. */
  listAll(query = {}) {
    return Reservation.findAll(query);
  },

  /** Stats for admin dashboard. */
  getStats() {
    return Reservation.getStats();
  },
};

module.exports = reservationService;
