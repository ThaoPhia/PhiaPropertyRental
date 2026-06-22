import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'database', 'phiarentalllc.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
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
`);

const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };

if (propertyCount.count === 0) {
  const seed = db.prepare(`
    INSERT INTO properties (
      name, type, address, city, state, zipCode, bedrooms, bathrooms, squareFeet, price, description, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  seed.run(
    'Downtown Duplex',
    'duplex',
    '123 Main St',
    'New York',
    'NY',
    '10001',
    3,
    2,
    2000,
    450000,
    'Beautiful duplex in the heart of downtown with modern amenities.',
    '/images/duplex1.jpg'
  );

  seed.run(
    'Park View Apartment',
    'apartment',
    '456 Park Ave',
    'New York',
    'NY',
    '10002',
    2,
    1,
    1200,
    250000,
    'Cozy apartment with park views and updated fixtures.',
    '/images/apt1.jpg'
  );
}

export default db;

