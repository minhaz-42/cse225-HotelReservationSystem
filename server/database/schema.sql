-- ================================================================
-- Hotel Reservation System — Database Schema
-- SQLite3
-- ================================================================

-- Users & authentication
CREATE TABLE IF NOT EXISTS users (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    username        TEXT    UNIQUE NOT NULL,
    email           TEXT    UNIQUE NOT NULL,
    password_hash   TEXT    NOT NULL,
    name            TEXT    NOT NULL,
    contact_number  TEXT,
    role            TEXT    DEFAULT 'user' CHECK(role IN ('user','admin')),
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Room catalogue
CREATE TABLE IF NOT EXISTS room_types (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            TEXT    UNIQUE NOT NULL,
    description     TEXT,
    capacity        INTEGER NOT NULL,
    price_per_night REAL    NOT NULL,
    total_rooms     INTEGER NOT NULL,
    amenities       TEXT,           -- JSON array stored as text
    image_url       TEXT,
    rating          REAL    DEFAULT 4.0,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Reservations / bookings
CREATE TABLE IF NOT EXISTS reservations (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL,
    room_type_id      INTEGER NOT NULL,
    reference_number  TEXT    UNIQUE NOT NULL,
    check_in          DATE    NOT NULL,
    check_out         DATE    NOT NULL,
    guests            INTEGER DEFAULT 1,
    total_amount      REAL    NOT NULL,
    status            TEXT    DEFAULT 'pending'
                        CHECK(status IN ('pending','confirmed','cancelled','completed')),
    notes             TEXT,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at        DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id)      REFERENCES users(id),
    FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

-- Dynamic pricing history
CREATE TABLE IF NOT EXISTS pricing_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    room_type_id    INTEGER NOT NULL,
    date            DATE    NOT NULL,
    price           REAL    NOT NULL,
    demand_factor   REAL    DEFAULT 1.0,
    FOREIGN KEY (room_type_id) REFERENCES room_types(id)
);

-- Activity / audit log
CREATE TABLE IF NOT EXISTS activity_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER,
    action      TEXT    NOT NULL,
    details     TEXT,
    ip_address  TEXT,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_reservations_user    ON reservations(user_id);
CREATE INDEX IF NOT EXISTS idx_reservations_dates   ON reservations(check_in, check_out);
CREATE INDEX IF NOT EXISTS idx_reservations_status  ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_pricing_date         ON pricing_history(room_type_id, date);
CREATE INDEX IF NOT EXISTS idx_activity_user        ON activity_log(user_id);
