/**
 * @module middleware/logger
 * Structured activity logger — writes to the activity_log table.
 */
const { getDatabase } = require('../config/database');

/**
 * Log a user action.
 * @param {number|null} userId
 * @param {string}      action   e.g. 'LOGIN', 'BOOK_ROOM'
 * @param {string}      details  Free-text / JSON string
 * @param {string}      ip
 */
function logActivity(userId, action, details = '', ip = '') {
  try {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO activity_log (user_id, action, details, ip_address)
       VALUES (?, ?, ?, ?)`
    ).run(userId, action, details, ip);
  } catch {
    // Non-critical — don't crash the request
    console.error('[logger] failed to write activity log');
  }
}

/**
 * Express middleware that logs every request.
 */
function requestLogger(req, _res, next) {
  const userId = req.user?.id ?? null;
  logActivity(userId, `${req.method} ${req.originalUrl}`, '', req.ip);
  next();
}

module.exports = { logActivity, requestLogger };
