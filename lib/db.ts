import crypto from 'node:crypto';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { hashPassword } from '@/lib/password';
import {
  buildSupabasePublicObjectUrl,
  getSupabaseAdminClient,
  getSupabaseDbBucket,
  getSupabaseDbObjectPath,
  getSupabaseImageBucket,
  getSupabaseImagePrefix,
  getSupabaseUrl,
  isSupabaseStorageConfigured,
} from '@/lib/supabase-storage';

function resolveDbPath(): string {
  const configuredPath = process.env.SQLITE_DB_PATH?.trim();
  const runtimeTempPath = path.join(os.tmpdir(), 'phia-property-rental.db');

  if (configuredPath) {
    const resolvedConfiguredPath = path.isAbsolute(configuredPath)
      ? configuredPath
      : path.join(process.cwd(), configuredPath);

    if (process.env.VERCEL === '1' && !resolvedConfiguredPath.startsWith(`${os.tmpdir()}${path.sep}`)) {
      console.warn(`SQLITE_DB_PATH must point to /tmp on Vercel. Falling back to ${runtimeTempPath}.`);
      return runtimeTempPath;
    }

    return resolvedConfiguredPath;
  }

  if (process.env.VERCEL === '1' || isSupabaseStorageConfigured()) {
    return runtimeTempPath;
  }

  return path.join(process.cwd(), 'database', 'phia-property-rental.db');
}

const dbPath = resolveDbPath();
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

type DbRuntimeState = {
  db: Database.Database | null;
  initialized: boolean;
  ready: boolean;
  ensureReadyPromise: Promise<void> | null;
  persistQueue: Promise<void>;
};

const dbGlobal = globalThis as typeof globalThis & { phiaDbState?: DbRuntimeState };
const state: DbRuntimeState = dbGlobal.phiaDbState ?? {
  db: null,
  initialized: false,
  ready: false,
  ensureReadyPromise: null,
  persistQueue: Promise.resolve(),
};
dbGlobal.phiaDbState = state;

function createConnection(): Database.Database {
  const database = new Database(dbPath);
  database.pragma('journal_mode = WAL');
  database.pragma('foreign_keys = ON');
  return database;
}

function getTableColumns(database: Database.Database, tableName: string): Set<string> {
  const rows = database.prepare(`PRAGMA table_info(${tableName})`).all() as { name: string }[];
  return new Set(rows.map((row) => row.name));
}

function addColumnIfMissing(
  database: Database.Database,
  columns: Set<string>,
  tableName: string,
  columnName: string,
  definition: string
): void {
  if (!columns.has(columnName)) {
    database.exec(`ALTER TABLE ${tableName} ADD COLUMN ${definition}`);
    columns.add(columnName);
  }
}

function getTableCreateSql(database: Database.Database, tableName: string): string {
  const row = database
    .prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(tableName) as { sql?: string } | undefined;
  return row?.sql || '';
}

function ensurePropertiesStatusConstraint(database: Database.Database): void {
  const propertiesCreateSql = getTableCreateSql(database, 'properties');
  const needsStatusMigration = !propertiesCreateSql.includes("'removed'");
  const needsSnakeCaseMigration = [
    'zipCode',
    'squareFeet',
    'monthlyRent',
    'dateAvailable',
    'createdAt',
    'updatedAt',
  ].some((columnName) => propertiesCreateSql.includes(columnName));

  if (!needsStatusMigration && !needsSnakeCaseMigration) {
    return;
  }

  database.pragma('foreign_keys = OFF');
  try {
    database.exec('BEGIN');
    database.exec(`
      CREATE TABLE properties_next (
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
    `);
    const sourceColumns = getTableColumns(database, 'properties');
    const zipCodeColumn = sourceColumns.has('zip_code') ? 'zip_code' : 'zipCode';
    const squareFeetColumn = sourceColumns.has('square_feet') ? 'square_feet' : 'squareFeet';
    const monthlyRentColumn = sourceColumns.has('monthly_rent') ? 'monthly_rent' : 'monthlyRent';
    const dateAvailableColumn = sourceColumns.has('date_available') ? 'date_available' : 'dateAvailable';
    const createdAtColumn = sourceColumns.has('created_at')
      ? 'created_at'
      : sourceColumns.has('createdAt')
        ? 'createdAt'
        : "datetime('now')";
    const updatedAtColumn = sourceColumns.has('updated_at')
      ? 'updated_at'
      : sourceColumns.has('updatedAt')
        ? 'updatedAt'
        : "datetime('now')";
    database.exec(`
      INSERT INTO properties_next (
        id, name, type, status, address, city, state, zip_code, bedrooms, bathrooms,
        square_feet, monthly_rent, details, highlights, date_available, image_url, created_at, updated_at
      )
      SELECT
        id, name, type, status, address, city, state, ${zipCodeColumn}, bedrooms, bathrooms,
        ${squareFeetColumn}, ${monthlyRentColumn}, details, highlights, ${dateAvailableColumn}, image_url, ${createdAtColumn}, ${updatedAtColumn}
      FROM properties;
    `);
    database.exec('DROP TABLE properties');
    database.exec('ALTER TABLE properties_next RENAME TO properties');
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  } finally {
    database.pragma('foreign_keys = ON');
  }

  database.exec('CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(type)');
  database.exec('CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city)');
  database.exec('CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status)');
  database.exec('CREATE INDEX IF NOT EXISTS idx_properties_monthly_rent ON properties(monthly_rent)');
  database.exec(`
    CREATE TRIGGER IF NOT EXISTS trg_properties_updated_at
    AFTER UPDATE ON properties
    FOR EACH ROW
    BEGIN
      UPDATE properties SET updated_at = datetime('now') WHERE id = NEW.id;
    END;
  `);
}

function ensurePropertyImagesForeignKeyConstraint(database: Database.Database): void {
  const propertyImagesCreateSql = getTableCreateSql(database, 'property_images');
  const needsFkMigration = propertyImagesCreateSql.includes('properties_legacy_status');
  const needsSnakeCaseMigration = propertyImagesCreateSql.includes('createdAt');
  if (!needsFkMigration && !needsSnakeCaseMigration) {
    return;
  }

  database.pragma('foreign_keys = OFF');
  try {
    database.exec('BEGIN');
    database.exec('ALTER TABLE property_images RENAME TO property_images_legacy_fk');
    database.exec(`
      CREATE TABLE property_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        image_url TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        sort_order INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE,
        UNIQUE(property_id, image_url)
      );
    `);
    const sourceColumns = getTableColumns(database, 'property_images_legacy_fk');
    const createdAtColumn = sourceColumns.has('created_at')
      ? 'created_at'
      : sourceColumns.has('createdAt')
        ? 'createdAt'
        : "datetime('now')";
    const descriptionColumn = sourceColumns.has('description') ? 'description' : "''";
    database.exec(`
      INSERT INTO property_images (id, property_id, image_url, description, sort_order, created_at)
      SELECT id, property_id, image_url, ${descriptionColumn}, sort_order, ${createdAtColumn}
      FROM property_images_legacy_fk;
    `);
    database.exec('DROP TABLE property_images_legacy_fk');
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  } finally {
    database.pragma('foreign_keys = ON');
  }

  database.exec('CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id)');
  database.exec('CREATE INDEX IF NOT EXISTS idx_property_images_sort_order ON property_images(property_id, sort_order, id)');
}

function ensureApplicationsStatusConstraint(database: Database.Database): void {
  const applicationsCreateSql = getTableCreateSql(database, 'applications');
  const needsSnakeCaseMigration = applicationsCreateSql.includes('createdAt');
  if (
    applicationsCreateSql.includes('approve-archived') &&
    !applicationsCreateSql.includes('properties_legacy_status') &&
    !needsSnakeCaseMigration
  ) {
    return;
  }

  database.pragma('foreign_keys = OFF');
  try {
    database.exec('BEGIN');
    database.exec('ALTER TABLE applications RENAME TO applications_legacy_status');
    database.exec(`
      CREATE TABLE applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        property_id INTEGER NOT NULL,
        property_name TEXT NOT NULL,
        applicant_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        current_address_street TEXT,
        current_address_city TEXT,
        current_address_state TEXT,
        current_address_zip TEXT,
        current_address_since_date TEXT,
        household_income REAL NOT NULL,
        move_in_date TEXT NOT NULL,
        total_occupancy INTEGER,
        landlord_name TEXT,
        landlord_phone TEXT,
        additional_info TEXT,
        status TEXT NOT NULL DEFAULT '' CHECK(status IN ('', 'pending', 'approved', 'approve-archived', 'declined', 'deleted')),
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
      );
    `);
    const sourceColumns = getTableColumns(database, 'applications_legacy_status');
    const createdAtColumn = sourceColumns.has('created_at') ? 'created_at' : 'createdAt';
    database.exec(`
      INSERT INTO applications (
        id, property_id, property_name, applicant_name, email, phone,
        current_address_street, current_address_city, current_address_state, current_address_zip,
        current_address_since_date, household_income, move_in_date, total_occupancy, landlord_name,
        landlord_phone, additional_info, status, created_at
      )
      SELECT
        id, property_id, property_name, applicant_name, email, phone,
        current_address_street, current_address_city, current_address_state, current_address_zip,
        current_address_since_date, household_income, move_in_date, total_occupancy, landlord_name,
        landlord_phone, additional_info, status, ${createdAtColumn}
      FROM applications_legacy_status;
    `);
    database.exec('DROP TABLE applications_legacy_status');
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  } finally {
    database.pragma('foreign_keys = ON');
  }

  database.exec('CREATE INDEX IF NOT EXISTS idx_applications_property_id ON applications(property_id)');
  database.exec('CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email)');
  database.exec('CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status)');
}

function ensureUsersSnakeCase(database: Database.Database): void {
  const usersCreateSql = getTableCreateSql(database, 'users');
  if (!usersCreateSql.includes('createdAt')) {
    return;
  }

  database.pragma('foreign_keys = OFF');
  try {
    database.exec('BEGIN');
    database.exec('ALTER TABLE users RENAME TO users_legacy_case');
    database.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL DEFAULT '',
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);
    const sourceColumns = getTableColumns(database, 'users_legacy_case');
    const nameColumn = sourceColumns.has('name') ? 'name' : "''";
    const createdAtColumn = sourceColumns.has('created_at') ? 'created_at' : 'createdAt';
    database.exec(`
      INSERT INTO users (id, name, email, password_hash, role, created_at)
      SELECT id, ${nameColumn}, email, password_hash, role, ${createdAtColumn}
      FROM users_legacy_case;
    `);
    database.exec('DROP TABLE users_legacy_case');
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  } finally {
    database.pragma('foreign_keys = ON');
  }

  database.exec('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
}

function ensureAuthSessionsSnakeCase(database: Database.Database): void {
  const sessionsCreateSql = getTableCreateSql(database, 'auth_sessions');
  const needsSnakeCaseMigration = sessionsCreateSql.includes('expiresAt') || sessionsCreateSql.includes('createdAt');
  if (!needsSnakeCaseMigration) {
    return;
  }

  database.pragma('foreign_keys = OFF');
  try {
    database.exec('BEGIN');
    database.exec('ALTER TABLE auth_sessions RENAME TO auth_sessions_legacy_case');
    database.exec(`
      CREATE TABLE auth_sessions (
        token TEXT PRIMARY KEY,
        user_id INTEGER NOT NULL,
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);
    const sourceColumns = getTableColumns(database, 'auth_sessions_legacy_case');
    const expiresAtColumn = sourceColumns.has('expires_at') ? 'expires_at' : 'expiresAt';
    const createdAtColumn = sourceColumns.has('created_at')
      ? 'created_at'
      : sourceColumns.has('createdAt')
        ? 'createdAt'
        : "datetime('now')";
    database.exec(`
      INSERT INTO auth_sessions (token, user_id, expires_at, created_at)
      SELECT token, user_id, ${expiresAtColumn}, ${createdAtColumn}
      FROM auth_sessions_legacy_case;
    `);
    database.exec('DROP TABLE auth_sessions_legacy_case');
    database.exec('COMMIT');
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  } finally {
    database.pragma('foreign_keys = ON');
  }

  database.exec('CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id)');
  database.exec('CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at)');
}

function initializeSchema(database: Database.Database): void {
  if (state.initialized) {
    return;
  }

  database.exec(`
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

    CREATE TABLE IF NOT EXISTS applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      property_name TEXT NOT NULL,
      applicant_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      current_address_street TEXT NOT NULL,
      current_address_city TEXT NOT NULL,
      current_address_state TEXT NOT NULL,
      current_address_zip TEXT NOT NULL,
      current_address_since_date TEXT NOT NULL,
      household_income REAL NOT NULL,
      move_in_date TEXT NOT NULL,
      total_occupancy INTEGER NOT NULL,
      landlord_name TEXT NOT NULL,
      landlord_phone TEXT NOT NULL,
      additional_info TEXT,
      status TEXT NOT NULL DEFAULT '' CHECK(status IN ('', 'pending', 'approved', 'approve-archived', 'declined', 'deleted')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_user_id ON auth_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_auth_sessions_expires_at ON auth_sessions(expires_at);
    CREATE INDEX IF NOT EXISTS idx_applications_property_id ON applications(property_id);
    CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
    CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
  `);

  ensurePropertiesStatusConstraint(database);
  ensurePropertyImagesForeignKeyConstraint(database);
  ensureUsersSnakeCase(database);
  ensureAuthSessionsSnakeCase(database);
  ensureApplicationsStatusConstraint(database);

  const propertyColumns = getTableColumns(database, 'properties');
  const propertyImageColumns = getTableColumns(database, 'property_images');
  const userColumns = getTableColumns(database, 'users');
  const applicationColumns = getTableColumns(database, 'applications');

  addColumnIfMissing(database, propertyColumns, 'properties', 'status', "status TEXT DEFAULT 'available'");
  addColumnIfMissing(database, propertyColumns, 'properties', 'monthly_rent', 'monthly_rent REAL DEFAULT 0');
  addColumnIfMissing(database, propertyColumns, 'properties', 'details', 'details TEXT');
  addColumnIfMissing(database, propertyColumns, 'properties', 'highlights', "highlights TEXT DEFAULT '[]'");
  addColumnIfMissing(database, propertyColumns, 'properties', 'date_available', 'date_available TEXT');
  addColumnIfMissing(database, propertyImageColumns, 'property_images', 'description', "description TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(database, userColumns, 'users', 'name', "name TEXT NOT NULL DEFAULT ''");
  addColumnIfMissing(database, applicationColumns, 'applications', 'current_address_street', 'current_address_street TEXT');
  addColumnIfMissing(database, applicationColumns, 'applications', 'current_address_city', 'current_address_city TEXT');
  addColumnIfMissing(database, applicationColumns, 'applications', 'current_address_state', 'current_address_state TEXT');
  addColumnIfMissing(database, applicationColumns, 'applications', 'current_address_zip', 'current_address_zip TEXT');
  addColumnIfMissing(database, applicationColumns, 'applications', 'current_address_since_date', 'current_address_since_date TEXT');
  addColumnIfMissing(database, applicationColumns, 'applications', 'total_occupancy', 'total_occupancy INTEGER');
  addColumnIfMissing(database, applicationColumns, 'applications', 'landlord_name', 'landlord_name TEXT');
  addColumnIfMissing(database, applicationColumns, 'applications', 'landlord_phone', 'landlord_phone TEXT');
  addColumnIfMissing(database, applicationColumns, 'applications', 'additional_info', 'additional_info TEXT');
  addColumnIfMissing(database, applicationColumns, 'applications', 'status', "status TEXT NOT NULL DEFAULT ''");

  database.prepare(`
    UPDATE properties
    SET status = COALESCE(status, ?),
        highlights = COALESCE(NULLIF(highlights, ''), '[]')
  `).run('available');

  database.prepare("UPDATE properties SET date_available = COALESCE(date_available, date('now')) WHERE status = 'available' AND (date_available IS NULL OR date_available = '')").run();

  const propertyCount = database.prepare('SELECT COUNT(*) as count FROM properties').get() as { count: number };
  if (propertyCount.count === 0) {
    const seed = database.prepare(`
      INSERT INTO properties (
        name, type, status, address, city, state, zip_code, bedrooms, bathrooms, square_feet, monthly_rent, details, highlights, date_available, image_url
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

  database.prepare('UPDATE properties SET image_url = ? WHERE image_url = ?')
    .run('/images/properties/duplex1.jpg', '/images/duplex1.jpg');
  database.prepare('UPDATE properties SET image_url = ? WHERE image_url = ?')
    .run('/images/properties/apt1.jpg', '/images/apt1.jpg');

  database.prepare(`
    UPDATE properties
    SET date_available = COALESCE(NULLIF(date_available, ''), date('now')),
        highlights = COALESCE(NULLIF(highlights, ''), '[]'),
        status = COALESCE(NULLIF(status, ''), 'available')
  `).run();

  database.prepare(`
    INSERT OR IGNORE INTO property_images (property_id, image_url, sort_order)
    SELECT id, image_url, 0
    FROM properties
    WHERE image_url IS NOT NULL AND image_url != ''
  `).run();

  const adminEmail = 'thoj.phia@gmail.com';
  const adminName = 'Admin';
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

  database.prepare('INSERT OR IGNORE INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)')
    .run(adminName, adminEmail, hashPassword(adminPassword), 'admin');
  database.prepare('UPDATE users SET role = ? WHERE email = ?').run('admin', adminEmail);
  database.prepare(`
    UPDATE users
    SET name = COALESCE(NULLIF(name, ''), ?)
    WHERE email = ?
  `).run(adminName, adminEmail);

  if (process.env.CMS_ADMIN_PASSWORD) {
    database.prepare('UPDATE users SET password_hash = ? WHERE email = ?')
      .run(hashPassword(adminPassword), adminEmail);
  }

  database.prepare(`DELETE FROM auth_sessions WHERE datetime(expires_at) <= datetime('now')`).run();
  state.initialized = true;
}

export function getDb(): Database.Database {
  if (!state.db) {
    state.db = createConnection();
  }
  return state.db;
}

function isNotFoundStorageError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const candidate = error as { statusCode?: string | number; message?: string };
  if (candidate.statusCode === 404 || candidate.statusCode === '404') {
    return true;
  }

  return Boolean(candidate.message?.toLowerCase().includes('not found'));
}

function getImageContentType(filename: string): string {
  const extension = path.extname(filename).toLowerCase();
  switch (extension) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    case '.gif':
      return 'image/gif';
    default:
      return 'application/octet-stream';
  }
}

function getLegacyLocalImagePathFromUrl(imageUrl: string): string {
  const filename = path.basename(imageUrl.split('?')[0]);
  return path.join(process.cwd(), 'public', 'images', 'properties', filename);
}

function getLocalImageUrlFromSupabaseUrl(imageUrl: string): string | null {
  if (imageUrl.startsWith('/images/properties/')) {
    return null;
  }

  try {
    const parsed = new URL(imageUrl);
    if (!parsed.pathname.includes('/storage/v1/object/public/')) {
      return null;
    }

    const filename = path.basename(parsed.pathname);
    if (!filename) {
      return null;
    }

    return `/images/properties/${filename}`;
  } catch {
    return null;
  }
}

function normalizeImageUrlsForLocalStorage(): boolean {
  if (isSupabaseStorageConfigured()) {
    return false;
  }

  const database = getDb();
  const allImageUrls = database.prepare(`
    SELECT DISTINCT image_url
    FROM (
      SELECT image_url FROM properties
      UNION
      SELECT image_url FROM property_images
    )
    WHERE image_url IS NOT NULL AND image_url != ''
  `).all() as { image_url: string }[];

  if (allImageUrls.length === 0) {
    return false;
  }

  const updatePropertyImage = database.prepare('UPDATE properties SET image_url = ? WHERE image_url = ?');
  const updateGalleryImage = database.prepare('UPDATE property_images SET image_url = ? WHERE image_url = ?');
  let updatedAny = false;

  for (const { image_url: currentUrl } of allImageUrls) {
    const localUrl = getLocalImageUrlFromSupabaseUrl(currentUrl);
    if (!localUrl) {
      continue;
    }

    updatePropertyImage.run(localUrl, currentUrl);
    updateGalleryImage.run(localUrl, currentUrl);
    updatedAny = true;
  }

  return updatedAny;
}

async function migrateLegacyLocalImagesToSupabase(): Promise<boolean> {
  if (!isSupabaseStorageConfigured()) {
    return false;
  }

  const database = getDb();
  const allImageUrls = database.prepare(`
    SELECT DISTINCT image_url
    FROM (
      SELECT image_url FROM properties
      UNION
      SELECT image_url FROM property_images
    )
    WHERE image_url IS NOT NULL AND image_url != ''
  `).all() as { image_url: string }[];

  if (allImageUrls.length === 0) {
    return false;
  }

  const supabase = getSupabaseAdminClient();
  const imageBucket = getSupabaseImageBucket();
  const imagePrefix = getSupabaseImagePrefix();
  const publicBase = `${getSupabaseUrl()}/storage/v1/object/public/${imageBucket}/`;
  const updatePropertyImage = database.prepare('UPDATE properties SET image_url = ? WHERE image_url = ?');
  const updateGalleryImage = database.prepare('UPDATE property_images SET image_url = ? WHERE image_url = ?');
  const existingObjectRows = await supabase.storage.from(imageBucket).list(imagePrefix, {
    limit: 1000,
    offset: 0,
  });
  if (existingObjectRows.error) {
    throw new Error(`Failed listing image bucket during migration: ${existingObjectRows.error.message}`);
  }
  const existingObjectPaths = new Set(
    existingObjectRows.data.map((entry) => (imagePrefix ? `${imagePrefix}/${entry.name}` : entry.name))
  );

  let migratedAny = false;

  for (const { image_url: currentUrl } of allImageUrls) {
    const isLegacyLocalUrl = currentUrl.startsWith('/images/properties/');
    const isSupabasePublicUrl = currentUrl.startsWith(publicBase);
    if (!isLegacyLocalUrl && !isSupabasePublicUrl) {
      continue;
    }

    const objectPath = isLegacyLocalUrl
      ? (() => {
          const filename = path.basename(currentUrl.split('?')[0]);
          return imagePrefix ? `${imagePrefix}/${filename}` : filename;
        })()
      : decodeURIComponent(currentUrl.split('?')[0].slice(publicBase.length));

    if (!objectPath) {
      continue;
    }

    const filename = path.basename(objectPath);
    const localImagePath = getLegacyLocalImagePathFromUrl(filename);
    const publicUrl = buildSupabasePublicObjectUrl(imageBucket, objectPath);

    const needsObjectUpload = !existingObjectPaths.has(objectPath);
    const needsUrlRewrite = currentUrl !== publicUrl;

    if (!needsObjectUpload && !needsUrlRewrite) {
      continue;
    }

    if (!fs.existsSync(localImagePath)) {
      continue;
    }

    if (needsObjectUpload) {
      const fileBuffer = await fsp.readFile(localImagePath);
      const { error } = await supabase.storage.from(imageBucket).upload(
        objectPath,
        fileBuffer,
        {
          upsert: true,
          contentType: getImageContentType(filename),
          cacheControl: '3600',
        }
      );

      if (error) {
        throw new Error(`Failed migrating legacy image ${filename} to Supabase: ${error.message}`);
      }
      existingObjectPaths.add(objectPath);
    }

    if (needsUrlRewrite) {
      updatePropertyImage.run(publicUrl, currentUrl);
      updateGalleryImage.run(publicUrl, currentUrl);
    }

    migratedAny = true;
  }

  return migratedAny;
}

function shouldPullDbFromCloudOnBoot(): boolean {
  const override = process.env.SUPABASE_STORAGE_DB_PULL_ON_BOOT?.trim().toLowerCase();
  if (override === 'true') {
    return true;
  }
  if (override === 'false') {
    return false;
  }
  return process.env.NODE_ENV === 'production';
}

async function pullDbFromCloudStorage(): Promise<boolean> {
  if (!isSupabaseStorageConfigured()) {
    return false;
  }

  const supabase = getSupabaseAdminClient();
  const dbBucket = getSupabaseDbBucket();
  const dbObjectPath = getSupabaseDbObjectPath();
  const { data, error } = await supabase.storage.from(dbBucket).download(dbObjectPath);

  if (error) {
    if (isNotFoundStorageError(error)) {
      return false;
    }
    throw new Error(`Failed to download SQLite database from Supabase storage: ${error.message}`);
  }

  const cloudBuffer = Buffer.from(await data.arrayBuffer());
  await fsp.writeFile(dbPath, cloudBuffer);

  await Promise.all([
    fsp.rm(`${dbPath}-shm`, { force: true }),
    fsp.rm(`${dbPath}-wal`, { force: true }),
  ]);
  return true;
}

export async function ensureDbReady(): Promise<void> {
  if (state.ready) {
    return;
  }

  if (!state.ensureReadyPromise) {
    state.ensureReadyPromise = (async () => {
      let downloadedFromCloud = false;
      let normalizedLocalImageUrls = false;
      let migratedLegacyImages = false;
      if (isSupabaseStorageConfigured() && shouldPullDbFromCloudOnBoot()) {
        if (state.db) {
          state.db.close();
          state.db = null;
          state.initialized = false;
        }
        downloadedFromCloud = await pullDbFromCloudStorage();
      }

      initializeSchema(getDb());
      normalizedLocalImageUrls = normalizeImageUrlsForLocalStorage();
      migratedLegacyImages = await migrateLegacyLocalImagesToSupabase();
      if (isSupabaseStorageConfigured() && (!downloadedFromCloud || migratedLegacyImages)) {
        await persistDbToCloudStorageInternal();
      }
      if (normalizedLocalImageUrls) {
        console.info('Normalized Supabase image URLs to local /images/properties paths for local mode.');
      }
      state.ready = true;
    })().finally(() => {
      state.ensureReadyPromise = null;
    });
  }

  await state.ensureReadyPromise;
}

async function persistDbToCloudStorageInternal(): Promise<void> {
  if (!isSupabaseStorageConfigured()) {
    return;
  }

  const tempDbPath = path.join(os.tmpdir(), `phia-property-rental-${crypto.randomUUID()}.db`);
  const database = getDb();

  try {
    await database.backup(tempDbPath);
    const content = await fsp.readFile(tempDbPath);
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.storage.from(getSupabaseDbBucket()).upload(
      getSupabaseDbObjectPath(),
      content,
      {
        upsert: true,
        contentType: 'application/x-sqlite3',
      }
    );

    if (error) {
      throw new Error(`Failed to upload SQLite database to Supabase storage: ${error.message}`);
    }
  } finally {
    await fsp.rm(tempDbPath, { force: true });
  }
}

export async function persistDbToCloudStorage(): Promise<void> {
  const run = state.persistQueue.then(() => persistDbToCloudStorageInternal());
  state.persistQueue = run.catch(() => undefined);
  await run;
}
