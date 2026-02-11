/**
 * @module services/authService
 * Authentication business logic — register, login, token generation.
 */
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const env    = require('../config/env');

const SALT_ROUNDS = 12;

const authService = {
  /**
   * Register a new user.
   * @returns {{ user, token }}
   */
  async register({ username, email, password, name, contactNumber }) {
    if (User.findByUsername(username)) {
      throw Object.assign(new Error('Username already exists'), { status: 409 });
    }
    if (User.findByEmail(email)) {
      throw Object.assign(new Error('Email already registered'), { status: 409 });
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = User.create({ username, email, passwordHash, name, contactNumber });
    const token = this._generateToken(user);
    return { user, token };
  },

  /**
   * Authenticate user and return a JWT.
   * @returns {{ user, token }}
   */
  async login(username, password) {
    const record = User.findByUsername(username);
    if (!record) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    const match = await bcrypt.compare(password, record.password_hash);
    if (!match) {
      throw Object.assign(new Error('Invalid credentials'), { status: 401 });
    }
    const user = User.findById(record.id);   // safe projection
    const token = this._generateToken(user);
    return { user, token };
  },

  /**
   * Change password (requires knowing current password).
   */
  async changePassword(userId, currentPassword, newPassword) {
    const record = User.findById(userId);
    if (!record) throw Object.assign(new Error('User not found'), { status: 404 });

    // Fetch full record with hash
    const { getDatabase } = require('../config/database');
    const full = getDatabase().prepare(`SELECT password_hash FROM users WHERE id = ?`).get(userId);
    const match = await bcrypt.compare(currentPassword, full.password_hash);
    if (!match) throw Object.assign(new Error('Current password is incorrect'), { status: 401 });

    const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    User.updatePassword(userId, hash);
  },

  /** Internal: sign a JWT. */
  _generateToken(user) {
    return jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      env.jwtSecret,
      { expiresIn: env.jwtExpiresIn }
    );
  },
};

module.exports = authService;
