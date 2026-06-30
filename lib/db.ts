import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { hashPassword } from '@/lib/password';

const dbPath = process.env.SQLITE_DB_PATH || path.join(process.cwd(), 'database', 'phiarentalllc.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('duplex', 'apartment', 'other')),
    status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'coming soon')),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    state TEXT NOT NULL,
    zipCode TEXT NOT NULL,
    bedrooms INTEGER NOT NULL,
    bathrooms REAL NOT NULL,
    squareFeet INTEGER NOT NULL,
    monthlyRent REAL NOT NULL DEFAULT 0,
    details TEXT,
    highlights TEXT NOT NULL DEFAULT '[]',
    dateAvailable TEXT,
    image_url TEXT,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
  CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
  CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
  CREATE INDEX IF NOT EXISTS idx_properties_monthly_rent ON properties(monthlyRent);

  CREATE TRIGGER IF NOT EXISTS trg_properties_updated_at
  AFTER UPDATE ON properties
  FOR EACH ROW
  BEGIN
    UPDATE properties SET updatedAt = datetime('now') WHERE id = NEW.id;
  END;

  CREATE TABLE IF NOT EXISTS property_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    image_url TEXT NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE,
    UNIQUE(property_id, image_url)
  );

  CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
  CREATE INDEX IF NOT EXISTS idx_property_images_sort_order ON property_images(property_id, sort_order, id);

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

  CREATE TABLE IF NOT EXISTS applications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    property_id INTEGER NOT NULL,
    property_name TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    household_income REAL NOT NULL,
    move_in_date TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expiresAt);
  CREATE INDEX IF NOT EXISTS idx_applications_property_id ON applications(property_id);
  CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
`);

const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };

function getPropertyColumns(): Set<string> {
  const rows = db.prepare('PRAGMA table_info(properties)').all() as { name: string }[];
  return new Set(rows.map((row) => row.name));
}

const propertyColumns = getPropertyColumns();

function addColumnIfMissing(columnName: string, definition: string): void {
  if (!propertyColumns.has(columnName)) {
    db.exec(`ALTER TABLE properties ADD COLUMN ${definition}`);
  }
}

addColumnIfMissing('status', "status TEXT DEFAULT 'available'");
addColumnIfMissing('monthlyRent', 'monthlyRent REAL DEFAULT 0');
addColumnIfMissing('details', 'details TEXT');
addColumnIfMissing('highlights', "highlights TEXT DEFAULT '[]'");
addColumnIfMissing('dateAvailable', 'dateAvailable TEXT');

db.prepare(`
  UPDATE properties
  SET status = COALESCE(status, ?),
      highlights = COALESCE(NULLIF(highlights, ''), '[]')
`).run('available');

db.prepare("UPDATE properties SET dateAvailable = COALESCE(dateAvailable, date('now')) WHERE status = 'available' AND (dateAvailable IS NULL OR dateAvailable = '')").run();

if (propertyCount.count === 0) {
  const seed = db.prepare(`
    INSERT INTO properties (
      name, type, status, address, city, state, zipCode, bedrooms, bathrooms, squareFeet, monthlyRent, details, highlights, dateAvailable, image_url
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  seed.run(
    'Downtown Duplex',
    'duplex',
    'available',
    '123 Main St',
    'New York',
    'NY',
    '10001',
    3,
    2,
    2000,
    450000,
    'Beautiful duplex in the heart of downtown with modern amenities.',
    JSON.stringify([
      { icon: 'GarageIcon', text: 'Spacious layout' },
      { icon: 'GarageIcon', text: 'Modern amenities' },
    ]),
    '2026-06-24',
    '/images/properties/duplex1.jpg'
  );

  seed.run(
    'Park View Apartment',
    'apartment',
    'available',
    '456 Park Ave',
    'New York',
    'NY',
    '10002',
    2,
    1,
    1200,
    250000,
    'Cozy apartment with park views and updated fixtures.',
    JSON.stringify([
      { icon: 'GarageIcon', text: 'Park views' },
      { icon: 'GarageIcon', text: 'Updated fixtures' },
    ]),
    '2026-06-24',
    '/images/properties/apt1.jpg'
  );
}

db.prepare('UPDATE properties SET image_url = ? WHERE image_url = ?')
  .run('/images/properties/duplex1.jpg', '/images/duplex1.jpg');
db.prepare('UPDATE properties SET image_url = ? WHERE image_url = ?')
  .run('/images/properties/apt1.jpg', '/images/apt1.jpg');

db.prepare(`
  UPDATE properties
  SET dateAvailable = COALESCE(NULLIF(dateAvailable, ''), date('now')),
      highlights = COALESCE(NULLIF(highlights, ''), '[]'),
      status = COALESCE(NULLIF(status, ''), 'available')
`).run();

db.prepare(`
  INSERT OR IGNORE INTO property_images (property_id, image_url, sort_order)
  SELECT id, image_url, 0
  FROM properties
  WHERE image_url IS NOT NULL AND image_url != ''
`).run();

const adminEmail = 'thoj.phia@gmail.com';
const adminPassword = process.env.CMS_ADMIN_PASSWORD || 'ChangeMeNow!123!';
const globalState = globalThis as typeof globalThis & { cmsPasswordWarningShown?: boolean };

if (
  !process.env.CMS_ADMIN_PASSWORD &&
  process.env.NODE_ENV !== 'production' &&
  !globalState.cmsPasswordWarningShown
) {
  console.warn(
    'CMS_ADMIN_PASSWORD is not set. Using insecure default admin password. Set CMS_ADMIN_PASSWORD in .env.local.'
  );
  globalState.cmsPasswordWarningShown = true;
}

db.prepare('INSERT OR IGNORE INTO users (email, password_hash, role) VALUES (?, ?, ?)')
  .run(adminEmail, hashPassword(adminPassword), 'admin');
db.prepare('UPDATE users SET role = ? WHERE email = ?').run('admin', adminEmail);

if (process.env.CMS_ADMIN_PASSWORD) {
  db.prepare('UPDATE users SET password_hash = ? WHERE email = ?')
    .run(hashPassword(adminPassword), adminEmail);
}

db.prepare(`DELETE FROM auth_sessions WHERE datetime(expiresAt) <= datetime('now')`).run();

export default db;
