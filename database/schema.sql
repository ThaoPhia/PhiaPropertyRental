-- Phia Properties LLC Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('duplex', 'apartment', 'other')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zipCode TEXT NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms REAL NOT NULL,
  squareFeet INTEGER NOT NULL,
  price REAL NOT NULL,
  description TEXT,
  image_url TEXT,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON properties(price);

CREATE TRIGGER IF NOT EXISTS trg_properties_updated_at
AFTER UPDATE ON properties
FOR EACH ROW
BEGIN
  UPDATE properties SET updatedAt = datetime('now') WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
  createdAt TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expiresAt TEXT NOT NULL,
  createdAt TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expiresAt);

-- Sample data
INSERT INTO properties (
  name, type, address, city, state, zipCode, bedrooms, bathrooms, squareFeet, price, description, image_url
) VALUES
('Downtown Duplex', 'duplex', '123 Main St', 'New York', 'NY', '10001', 3, 2, 2000, 450000.00, 'Beautiful duplex in the heart of downtown with modern amenities.', '/images/properties/duplex1.jpg'),
('Park View Apartment', 'apartment', '456 Park Ave', 'New York', 'NY', '10002', 2, 1, 1200, 250000.00, 'Cozy apartment with park views and updated fixtures.', '/images/properties/apt1.jpg');
