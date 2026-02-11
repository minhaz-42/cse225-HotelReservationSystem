/**
 * @module models/User
 * Data-access layer for the `users` table.
 */
const { getDatabase } = require('../config/database');

const User = {
  /** Create a new user row. Returns the new user object (without password_hash). */
  create({ username, email, passwordHash, name, contactNumber, role = 'user' }) {
    const db = getDatabase();
    const info = db.prepare(
      `INSERT INTO users (username, email, password_hash, name, contact_number, role)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(username, email, passwordHash, name, contactNumber || null, role);
    return this.findById(info.lastInsertRowid);
  },

  findById(id) {
    const db = getDatabase();
    const row = db.prepare(
      `SELECT id, username, email, name, contact_number, role, created_at, updated_at
       FROM users WHERE id = ?`
    ).get(id);
    return row || null;
  },

  findByUsername(username) {
    const db = getDatabase();
    return db.prepare(`SELECT * FROM users WHERE username = ?`).get(username) || null;
  },

  findByEmail(email) {
    const db = getDatabase();
    return db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) || null;
  },

  /** List all users (admin). */
  findAll() {
    const db = getDatabase();
    return db.prepare(
      `SELECT id, username, email, name, contact_number, role, created_at
       FROM users ORDER BY created_at DESC`
    ).all();
  },

  updatePassword(id, passwordHash) {
    const db = getDatabase();
    db.prepare(
      `UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
    ).run(passwordHash, id);
  },

  updateProfile(id, { email, name, contactNumber }) {
    const db = getDatabase();
    db.prepare(
      `UPDATE users SET email = COALESCE(?, email),
                        name  = COALESCE(?, name),
                        contact_number = COALESCE(?, contact_number),
                        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(email || null, name || null, contactNumber || null, id);
    return this.findById(id);
  },
};

module.exports = User;
