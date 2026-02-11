/**
 * @module config/env
 * Centralised environment variable access with defaults.
 */
require('dotenv').config();

module.exports = {
  port:             parseInt(process.env.PORT, 10) || 3000,
  nodeEnv:          process.env.NODE_ENV || 'development',
  jwtSecret:        process.env.JWT_SECRET || 'change-me',
  jwtExpiresIn:     process.env.JWT_EXPIRES_IN || '24h',
  dbPath:           process.env.DB_PATH || './data/hotel.db',
  ollama: {
    baseUrl:        process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model:          process.env.OLLAMA_MODEL || 'llama3',
    vlmModel:       process.env.OLLAMA_VLM_MODEL || 'llava',
  },
  rateLimit: {
    windowMs:       parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000,
    max:            parseInt(process.env.RATE_LIMIT_MAX, 10) || 100,
  },
  admin: {
    username:       process.env.ADMIN_USERNAME || 'admin',
    password:       process.env.ADMIN_PASSWORD || 'hrsadmin2024!',
    email:          process.env.ADMIN_EMAIL || 'admin@hotel.local',
  },
};
