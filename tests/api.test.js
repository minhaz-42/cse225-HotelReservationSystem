/**
 * Integration tests for the Hotel Reservation System API.
 *
 * Uses an in-memory SQLite DB so no real data is affected.
 */
const request = require('supertest');
const path    = require('path');

// Override DB path to use an in-memory database
process.env.DB_PATH = ':memory:';
process.env.JWT_SECRET = 'test-secret';

const { initDatabase, getDatabase, closeDatabase } = require('../server/config/database');
const app = require('../server/index');
const bcrypt = require('bcryptjs');

/* ─── helpers ────────────────────────────────────── */

let adminToken, userToken, userId, roomTypeId, reservationId;

beforeAll(async () => {
  await initDatabase(':memory:');
  const db = getDatabase();

  // Seed rooms
  db.prepare(`INSERT INTO room_types (name, description, capacity, price_per_night, total_rooms, amenities, rating)
    VALUES ('Standard Room', 'Basic room', 2, 5000, 3, '["TV","Wi-Fi"]', 4.0)`).run();
  db.prepare(`INSERT INTO room_types (name, description, capacity, price_per_night, total_rooms, amenities, rating)
    VALUES ('Deluxe Room', 'Nice room', 4, 9000, 2, '["TV","Wi-Fi","Minibar"]', 4.5)`).run();

  const stdRoom = db.prepare(`SELECT id FROM room_types WHERE name = 'Standard Room'`).get();
  roomTypeId = stdRoom.id;

  // Seed admin
  const adminHash = await bcrypt.hash('adminpass', 10);
  db.prepare(`INSERT INTO users (username, email, password_hash, name, role)
    VALUES ('admin', 'admin@test.com', ?, 'Admin', 'admin')`).run(adminHash);
});

afterAll(() => {
  closeDatabase();
});

/* ═══════════════════════════════════════════════════
   AUTH TESTS
   ═══════════════════════════════════════════════════ */

describe('Auth', () => {
  test('POST /api/auth/register — creates a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'alice',
      email: 'alice@test.com',
      password: 'password123',
      name: 'Alice Smith',
      contactNumber: '09171234567',
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('alice');

    userToken = res.body.token;
    userId    = res.body.user.id;
  });

  test('POST /api/auth/register — rejects duplicate username', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'alice', email: 'alice2@test.com', password: 'password', name: 'A',
    });
    expect(res.status).toBe(409);
  });

  test('POST /api/auth/register — rejects missing fields', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'bob' });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/register — rejects invalid email', async () => {
    const res = await request(app).post('/api/auth/register').send({
      username: 'bob', email: 'not-an-email', password: 'password', name: 'Bob',
    });
    expect(res.status).toBe(400);
  });

  test('POST /api/auth/login — succeeds with valid creds', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'alice', password: 'password123',
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/auth/login — fails with wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'alice', password: 'wrong',
    });
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/login — admin login', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: 'admin', password: 'adminpass',
    });
    expect(res.status).toBe(200);
    adminToken = res.body.token;
  });

  test('GET /api/auth/profile — requires auth', async () => {
    const res = await request(app).get('/api/auth/profile');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/profile — returns user info', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.username).toBe('alice');
  });
});

/* ═══════════════════════════════════════════════════
   ROOM TESTS
   ═══════════════════════════════════════════════════ */

describe('Rooms', () => {
  test('GET /api/rooms — lists all room types', async () => {
    const res = await request(app).get('/api/rooms');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test('GET /api/rooms — supports sorting', async () => {
    const res = await request(app).get('/api/rooms?sortBy=price_per_night&order=DESC');
    expect(res.status).toBe(200);
    expect(res.body[0].price_per_night).toBeGreaterThanOrEqual(res.body[1].price_per_night);
  });

  test('GET /api/rooms/:id — returns single room', async () => {
    const res = await request(app).get(`/api/rooms/${roomTypeId}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Standard Room');
  });

  test('GET /api/rooms/:id/availability — checks availability', async () => {
    const res = await request(app)
      .get(`/api/rooms/${roomTypeId}/availability?checkIn=2026-04-01&checkOut=2026-04-05`);
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
    expect(res.body.count).toBe(3); // total_rooms
  });
});

/* ═══════════════════════════════════════════════════
   RESERVATION TESTS
   ═══════════════════════════════════════════════════ */

describe('Reservations', () => {
  test('POST /api/reservations — creates a booking', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        roomTypeId,
        checkIn: '2026-05-01',
        checkOut: '2026-05-03',
        guests: 2,
      });
    expect(res.status).toBe(201);
    expect(res.body.reference_number).toBeDefined();
    expect(res.body.total_amount).toBeGreaterThan(0);
    reservationId = res.body.id;
  });

  test('POST /api/reservations — rejects invalid dates', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ roomTypeId, checkIn: '2026-05-05', checkOut: '2026-05-02' });
    expect(res.status).toBe(400);
  });

  test('POST /api/reservations — rejects past check-out before check-in', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ roomTypeId, checkIn: '2026-06-10', checkOut: '2026-06-10' });
    expect(res.status).toBe(400);
  });

  test('POST /api/reservations — rejects over-capacity guests', async () => {
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ roomTypeId, checkIn: '2026-07-01', checkOut: '2026-07-03', guests: 99 });
    expect(res.status).toBe(400);
  });

  test('GET /api/reservations — lists user bookings', async () => {
    const res = await request(app)
      .get('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  test('PATCH /api/reservations/:id/cancel — cancels own booking', async () => {
    const res = await request(app)
      .patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('cancelled');
  });

  test('PATCH /api/reservations/:id/cancel — cannot cancel twice', async () => {
    const res = await request(app)
      .patch(`/api/reservations/${reservationId}/cancel`)
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(400);
  });

  test('POST /api/reservations — rejects if no rooms left (overbooking)', async () => {
    // Book all 3 Standard Rooms for the same date
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/reservations')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ roomTypeId, checkIn: '2026-08-01', checkOut: '2026-08-03' });
    }
    // 4th booking should fail
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ roomTypeId, checkIn: '2026-08-01', checkOut: '2026-08-03' });
    expect(res.status).toBe(409);
  });
});

/* ═══════════════════════════════════════════════════
   ADMIN TESTS
   ═══════════════════════════════════════════════════ */

describe('Admin', () => {
  let pendingId;

  beforeAll(async () => {
    // create a new pending booking
    const res = await request(app)
      .post('/api/reservations')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ roomTypeId, checkIn: '2026-09-01', checkOut: '2026-09-03' });
    pendingId = res.body.id;
  });

  test('GET /api/admin/reservations — requires admin', async () => {
    const res = await request(app)
      .get('/api/admin/reservations')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.status).toBe(403);
  });

  test('GET /api/admin/reservations — admin can list all', async () => {
    const res = await request(app)
      .get('/api/admin/reservations')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('PATCH /api/admin/reservations/:id/confirm — confirms booking', async () => {
    const res = await request(app)
      .patch(`/api/admin/reservations/${pendingId}/confirm`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('confirmed');
  });

  test('GET /api/admin/stats — returns statistics', async () => {
    const res = await request(app)
      .get('/api/admin/stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });
});

/* ═══════════════════════════════════════════════════
   SECURITY / EDGE CASE TESTS
   ═══════════════════════════════════════════════════ */

describe('Security & Edge Cases', () => {
  test('SQL injection in username is handled safely', async () => {
    const res = await request(app).post('/api/auth/login').send({
      username: "admin' OR '1'='1",
      password: 'anything',
    });
    expect(res.status).toBe(401);
  });

  test('Invalid JWT is rejected', async () => {
    const res = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', 'Bearer not.a.valid.token');
    expect(res.status).toBe(401);
  });

  test('Health check', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
