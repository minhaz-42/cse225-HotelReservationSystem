/**
 * Database seed script.
 * Run: node server/database/seed.js
 *
 * Creates admin user + initial room types mirrored from the original
 * C++ prototype.
 */
const bcrypt = require('bcryptjs');
const { initDatabase, getDatabase, closeDatabase } = require('../config/database');
const env = require('../config/env');

async function seed() {
  await initDatabase();
  const db = getDatabase();

  console.log('Seeding database …');

  // ── Admin user ──────────────────────────────────────────
  const existing = db.prepare(`SELECT id FROM users WHERE username = ?`).get(env.admin.username);
  if (!existing) {
    const hash = await bcrypt.hash(env.admin.password, 12);
    db.prepare(
      `INSERT INTO users (username, email, password_hash, name, role)
       VALUES (?, ?, ?, ?, 'admin')`
    ).run(env.admin.username, env.admin.email, hash, 'Administrator');
    console.log('  ✔ Admin user created');
  } else {
    console.log('  – Admin user already exists');
  }

  // ── Test user ──────────────────────────────────────────
  const hash = await bcrypt.hash('password', 12);
  db.prepare(
    `INSERT OR REPLACE INTO users (id, username, email, password_hash, name, role)
     VALUES ((SELECT id FROM users WHERE username = 'minhaz-42'), 'minhaz-42', 'minhaz@example.com', ?, 'Minhaz User', 'user')`
  ).run(hash);
  console.log('  ✔ Test user updated/created');

  // ── Room types ──────────────────────────────────────────
  const rooms = [
    {
      name: 'Standard Room',
      description: 'Comfortable room for 1-2 guests with essential amenities.',
      capacity: 2,
      price: 5000,
      total: 15,
      amenities: ['Single bed ×2', 'Private bathroom', 'TV', 'Wi-Fi', 'Air conditioning', 'In-room dining'],
      rating: 3.8,
    },
    {
      name: 'Deluxe Room',
      description: 'Upgraded furnishings with extra comforts for up to 4 guests.',
      capacity: 4,
      price: 9000,
      total: 10,
      amenities: ['California King bed', 'Single bed', 'Mini-refrigerator', 'TV', 'Wi-Fi', 'Air conditioning', 'Fitness center access', 'Gourmet dining', 'Cooking class'],
      rating: 4.2,
    },
    {
      name: 'Suite Room',
      description: 'Spacious suite with separate living area and kitchenette.',
      capacity: 4,
      price: 12000,
      total: 10,
      amenities: ['Double bed ×2', 'Living room', 'Kitchenette', 'Private chef dining', 'Welcome fruit basket & wine', 'Private yoga session', 'Bowling & billiard access'],
      rating: 4.5,
    },
    {
      name: 'Executive Room',
      description: 'Premium room with business amenities and executive lounge access.',
      capacity: 6,
      price: 20000,
      total: 7,
      amenities: ['Multiple beds', 'Executive lounge', 'Complimentary breakfast', 'Business center', 'Meeting rooms', 'Spa & game room access'],
      rating: 4.7,
    },
    {
      name: 'Penthouse',
      description: 'The pinnacle of luxury — expansive space, private balcony and butler service.',
      capacity: 10,
      price: 35000,
      total: 3,
      amenities: ['Expansive layout', 'Private balcony', 'Private chef & menu', 'Jacuzzi', 'Sports & recreation access', 'Butler service'],
      rating: 4.9,
    },
  ];

  const insert = db.prepare(
    `INSERT OR IGNORE INTO room_types (name, description, capacity, price_per_night, total_rooms, amenities, rating)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  for (const r of rooms) {
    insert.run(r.name, r.description, r.capacity, r.price, r.total, JSON.stringify(r.amenities), r.rating);
  }
  console.log('  ✔ Room types seeded');

  closeDatabase();
  console.log('Done.\n');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
