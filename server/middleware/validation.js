/**
 * @module middleware/validation
 * Lightweight request body validators.
 */

/**
 * Ensure `fields` exist and are non-empty strings on req.body.
 */
function requireFields(...fields) {
  return (req, res, next) => {
    const missing = fields.filter(f => {
      const v = req.body[f];
      return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
    });
    if (missing.length) {
      return res.status(400).json({
        error: 'Missing required fields',
        fields: missing,
      });
    }
    next();
  };
}

/** Very small email format check (not exhaustive). */
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/** Date string must be YYYY-MM-DD. */
function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

module.exports = { requireFields, isValidEmail, isValidDate };
