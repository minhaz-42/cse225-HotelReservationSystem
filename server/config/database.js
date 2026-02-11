/**
 * @module config/database
 * SQLite connection via sql.js (pure WASM — no native compilation needed).
 * Reads schema.sql on first run to create tables.
 * Persists to disk on every write using a thin wrapper that keeps
 * the synchronous call-site API the rest of the codebase expects.
 */
const initSqlJs = require('sql.js');
const path      = require('path');
const fs        = require('fs');
const env       = require('./env');

let _db;       // raw sql.js Database
let _wrapper;  // thin helper that exposes a better-sqlite3-compatible API
let _dbPath;

/**
 * Thin adapter that exposes the subset of better-sqlite3 API used
 * in the rest of the project.
 */
function createWrapper(db, dbPath) {
  /** Flush the database to disk (no-op for :memory:). */
  function save() {
    if (dbPath && dbPath !== ':memory:') {
      const data = db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(dbPath, buffer);
    }
  }

  return {
    /** Run a statement that returns no rows (INSERT / UPDATE / DELETE). */
    exec(sql) {
      db.run(sql);
      save();
    },

    /** Return a prepared-statement-like object. */
    prepare(sql) {
      return {
        /** Run and return { lastInsertRowid, changes }. */
        run(...params) {
          db.run(sql, params);
          save();
          const id = db.exec('SELECT last_insert_rowid() AS id');
          const changes = db.getRowsModified();
          return {
            lastInsertRowid: id.length ? id[0].values[0][0] : 0,
            changes,
          };
        },
        /** Fetch one row as an object (or undefined). */
        get(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          if (stmt.step()) {
            const cols = stmt.getColumnNames();
            const vals = stmt.get();
            stmt.free();
            const row = {};
            cols.forEach((c, i) => { row[c] = vals[i]; });
            return row;
          }
          stmt.free();
          return undefined;
        },
        /** Fetch all rows as an array of objects. */
        all(...params) {
          const stmt = db.prepare(sql);
          stmt.bind(params);
          const rows = [];
          const cols = stmt.getColumnNames();
          while (stmt.step()) {
            const vals = stmt.get();
            const row = {};
            cols.forEach((c, i) => { row[c] = vals[i]; });
            rows.push(row);
          }
          stmt.free();
          return rows;
        },
      };
    },

    /** Pragma helper (only WAL and foreign_keys are used). */
    pragma(_p) { /* no-op for sql.js */ },

    /** Simple transaction wrapper. */
    transaction(fn) {
      return (...args) => {
        db.run('BEGIN TRANSACTION');
        try {
          fn(...args);
          db.run('COMMIT');
          save();
        } catch (e) {
          try { db.run('ROLLBACK'); } catch { /* already rolled back */ }
          throw e;
        }
      };
    },

    /** Close the database. */
    close() { db.close(); },
  };
}

/**
 * Initialise (or return existing) database wrapper.
 * **Must** be called after `await initDatabase()` at startup.
 * @returns {ReturnType<typeof createWrapper>}
 */
function getDatabase() {
  if (!_wrapper) throw new Error('Database not initialised — call initDatabase() first');
  return _wrapper;
}

/**
 * Async one-time init.  Call once at server startup.
 * @param {string} [dbPath] Override (e.g. ':memory:' in tests).
 */
async function initDatabase(dbPath) {
  if (_wrapper) return _wrapper;

  const SQL = await initSqlJs();
  const resolvedPath = dbPath || env.dbPath;
  _dbPath = resolvedPath;

  if (resolvedPath && resolvedPath !== ':memory:') {
    const abs = path.resolve(resolvedPath);
    const dir = path.dirname(abs);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    if (fs.existsSync(abs)) {
      const fileBuffer = fs.readFileSync(abs);
      _db = new SQL.Database(fileBuffer);
    } else {
      _db = new SQL.Database();
    }
    _dbPath = abs;
  } else {
    _db = new SQL.Database();
    _dbPath = ':memory:';
  }

  _wrapper = createWrapper(_db, _dbPath);

  // Run schema migration
  const schemaPath = path.join(__dirname, '..', 'database', 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf-8');
  _wrapper.exec(schema);

  return _wrapper;
}

/** Close the connection (useful in tests). */
function closeDatabase() {
  if (_db) {
    _db.close();
    _db = undefined;
    _wrapper = undefined;
  }
}

module.exports = { getDatabase, initDatabase, closeDatabase };
