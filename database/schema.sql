-- PhiaPropertyRental Database Schema (SQLite)

CREATE TABLE IF NOT EXISTS properties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('duplex', 'apartment', 'other')),
  status TEXT NOT NULL DEFAULT 'available' CHECK(status IN ('available', 'occupied', 'coming soon', 'removed')),
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms REAL NOT NULL,
  square_feet INTEGER NOT NULL,
  monthly_rent REAL NOT NULL DEFAULT 0,
  details TEXT,
  highlights TEXT NOT NULL DEFAULT '[]',
  date_available TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type);
CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_monthly_rent ON properties(monthly_rent);

CREATE TRIGGER IF NOT EXISTS trg_properties_updated_at
AFTER UPDATE ON properties
FOR EACH ROW
BEGIN
  UPDATE properties SET updated_at = datetime('now') WHERE id = NEW.id;
END;

CREATE TABLE IF NOT EXISTS property_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE,
  UNIQUE(property_id, image_url)
);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_property_images_sort_order ON property_images(property_id, sort_order, id);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS auth_sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);

CREATE TABLE IF NOT EXISTS applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  property_id INTEGER NOT NULL,
  property_name TEXT NOT NULL,
  applicant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  household_income REAL NOT NULL,
  move_in_date TEXT NOT NULL,
  current_address_street TEXT,
  current_address_city TEXT,
  current_address_state TEXT,
  current_address_zip TEXT,
  current_address_since_date TEXT,
  total_occupancy INTEGER,
  landlord_name TEXT,
  landlord_phone TEXT,
  additional_info TEXT,
  status TEXT NOT NULL DEFAULT '' CHECK(status IN ('', 'pending', 'approved', 'approve-archived', 'declined', 'deleted')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_applications_property_id ON applications(property_id);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Sample data
INSERT INTO properties (
  name, type, status, address, city, state, zip_code, bedrooms, bathrooms, square_feet, monthly_rent, details, highlights, date_available, image_url
) VALUES
('Downtown Duplex', 'duplex', 'available', '123 Main St', 'New York', 'NY', '10001', 3, 2, 2000, 450000.00, 'Beautiful duplex in the heart of downtown with modern amenities.', '[{"icon":"GarageIcon","text":"Spacious layout"},{"icon":"GarageIcon","text":"Modern amenities"}]', '2026-06-24', '/images/properties/duplex1.jpg'),
('Park View Apartment', 'apartment', 'available', '456 Park Ave', 'New York', 'NY', '10002', 2, 1, 1200, 250000.00, 'Cozy apartment with park views and updated fixtures.', '[{"icon":"GarageIcon","text":"Park views"},{"icon":"GarageIcon","text":"Updated fixtures"}]', '2026-06-24', '/images/properties/apt1.jpg');
