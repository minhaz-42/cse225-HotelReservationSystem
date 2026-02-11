/**
 * Hotel Reservation System — Express entry point.
 *
 * Starts the REST API, serves the static frontend,
 * and mounts all route groups.
 */
const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const path       = require('path');
const env        = require('./config/env');
const { initDatabase } = require('./config/database');

// ── Express app ─────────────────────────────────────────────
const app = express();

// Security & parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json({ limit: '10mb' }));   // supports VLM image uploads
app.use(morgan('dev'));

// Rate limiter (global)
app.use(rateLimit({
  windowMs: env.rateLimit.windowMs,
  max:      env.rateLimit.max,
  standardHeaders: true,
  legacyHeaders:   false,
}));

// ── Static frontend ─────────────────────────────────────────
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── API routes ──────────────────────────────────────────────
app.use('/api/auth',         require('./routes/auth'));
app.use('/api/rooms',        require('./routes/rooms'));
app.use('/api/reservations', require('./routes/reservations'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/llm',          require('./routes/llm'));

// ── Health check ────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

// ── SPA fallback ────────────────────────────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Global error handler ────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

// ── Start ───────────────────────────────────────────────────
if (require.main === module) {
  (async () => {
    await initDatabase();
    app.listen(env.port, () => {
      console.log(`\n  🏨  Hotel Reservation System API`);
      console.log(`     → http://localhost:${env.port}`);
      console.log(`     → env: ${env.nodeEnv}\n`);
    });
  })();
}

module.exports = app;   // exported for supertest
