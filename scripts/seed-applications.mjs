import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = process.env.SQLITE_DB_PATH || path.join(__dirname, '../database/phiarental.db');

// Ensure directory exists
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    passwordHash TEXT NOT NULL,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    location TEXT NOT NULL,
    bedrooms INTEGER,
    bathrooms REAL,
    squareFeet INTEGER,
    type TEXT,
    status TEXT DEFAULT 'available',
    monthlyRent REAL DEFAULT 0,
    details TEXT,
    highlights TEXT DEFAULT '[]',
    dateAvailable TEXT,
    imageUrls TEXT NOT NULL DEFAULT '[]',
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
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
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY(property_id) REFERENCES properties(id) ON DELETE CASCADE
  );
`);

console.log('✓ Database schema initialized');

// Sample applicant data
const sampleApplicants = [
  {
    applicantName: 'John Smith',
    email: 'john.smith@email.com',
    phone: '555-0101',
    currentAddressStreet: '123 Main St',
    currentAddressCity: 'Springfield',
    currentAddressState: 'IL',
    currentAddressZip: '62701',
    currentAddressSinceDate: '2022-03-15',
    householdIncome: 65000,
    moveInDate: '2026-08-01',
    totalOccupancy: 2,
    landlordName: 'Jane Doe',
    landlordPhone: '555-0102',
    additionalInfo: 'Looking for a quiet neighborhood. Very interested in your property.',
  },
  {
    applicantName: 'Maria Garcia',
    email: 'maria.garcia@email.com',
    phone: '555-0103',
    currentAddressStreet: '456 Oak Ave',
    currentAddressCity: 'Chicago',
    currentAddressState: 'IL',
    currentAddressZip: '60601',
    currentAddressSinceDate: '2021-06-20',
    householdIncome: 85000,
    moveInDate: '2026-09-15',
    totalOccupancy: 3,
    landlordName: 'Robert Johnson',
    landlordPhone: '555-0104',
    additionalInfo: 'Relocating for work. Need pet-friendly apartment.',
  },
  {
    applicantName: 'David Williams',
    email: 'david.williams@email.com',
    phone: '555-0105',
    currentAddressStreet: '789 Pine Rd',
    currentAddressCity: 'Bloomington',
    currentAddressState: 'IL',
    currentAddressZip: '61701',
    currentAddressSinceDate: '2020-01-10',
    householdIncome: 95000,
    moveInDate: '2026-07-01',
    totalOccupancy: 4,
    landlordName: 'Susan Miller',
    landlordPhone: '555-0106',
    additionalInfo: '',
  },
  {
    applicantName: 'Emily Chen',
    email: 'emily.chen@email.com',
    phone: '555-0107',
    currentAddressStreet: '321 Elm St',
    currentAddressCity: 'Urbana',
    currentAddressState: 'IL',
    currentAddressZip: '61801',
    currentAddressSinceDate: '2023-09-05',
    householdIncome: 72000,
    moveInDate: '2026-08-15',
    totalOccupancy: 2,
    landlordName: 'Michael Brown',
    landlordPhone: '555-0108',
    additionalInfo: 'Graduate student. Very responsible tenant.',
  },
  {
    applicantName: 'James Anderson',
    email: 'james.anderson@email.com',
    phone: '555-0109',
    currentAddressStreet: '654 Birch Lane',
    currentAddressCity: 'Champaign',
    currentAddressState: 'IL',
    currentAddressZip: '61820',
    currentAddressSinceDate: '2019-11-12',
    householdIncome: 110000,
    moveInDate: '2026-09-01',
    totalOccupancy: 5,
    landlordName: 'Patricia Davis',
    landlordPhone: '555-0110',
    additionalInfo: 'Family of 5. Looking for spacious home with yard.',
  },
];

// Sample properties (in case they don't exist)
const sampleProperties = [
  {
    name: 'Cozy Downtown Apartment',
    location: 'Springfield, IL',
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 850,
    type: 'Apartment',
    status: 'available',
    monthlyRent: 1200,
    details: 'Modern downtown apartment with parking',
  },
  {
    name: 'Spacious Family Home',
    location: 'Chicago, IL',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1400,
    type: 'House',
    status: 'available',
    monthlyRent: 2000,
    details: 'Beautiful family home with backyard',
  },
  {
    name: 'Luxury Loft',
    location: 'Urbana, IL',
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 900,
    type: 'Loft',
    status: 'available',
    monthlyRent: 1500,
    details: 'Modern loft with high ceilings',
  },
];

try {
  // Check if we need to insert sample properties
  const propertyCount = db.prepare('SELECT COUNT(*) as count FROM properties').get();

  if (propertyCount.count === 0) {
    console.log('No properties found. Creating sample properties...');
    const insertProp = db.prepare(`
      INSERT INTO properties (name, location, bedrooms, bathrooms, squareFeet, type, status, monthlyRent, details, imageUrls)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, '[]')
    `);

    for (const prop of sampleProperties) {
      insertProp.run(
        prop.name,
        prop.location,
        prop.bedrooms,
        prop.bathrooms,
        prop.squareFeet,
        prop.type,
        prop.status,
        prop.monthlyRent,
        prop.details
      );
    }
    console.log(`✓ Created ${sampleProperties.length} sample properties`);
  } else {
    console.log(`✓ Found ${propertyCount.count} existing properties`);
  }

  // Get all properties
  const properties = db.prepare('SELECT id, name FROM properties').all();

  if (properties.length === 0) {
    console.log('❌ No properties found.');
    process.exit(1);
  }

  console.log(`Using ${properties.length} properties for applications...`);

  // Clear existing applications
  db.prepare('DELETE FROM applications').run();
  console.log('✓ Cleared existing applications');

  // Insert sample applications
  const insertStmt = db.prepare(`
    INSERT INTO applications (
      property_id,
      property_name,
      applicant_name,
      email,
      phone,
      current_address_street,
      current_address_city,
      current_address_state,
      current_address_zip,
      current_address_since_date,
      household_income,
      move_in_date,
      total_occupancy,
      landlord_name,
      landlord_phone,
      additional_info
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  let count = 0;
  for (let i = 0; i < sampleApplicants.length; i++) {
    const applicant = sampleApplicants[i];
    const property = properties[i % properties.length];

    insertStmt.run(
      property.id,
      property.name,
      applicant.applicantName,
      applicant.email,
      applicant.phone,
      applicant.currentAddressStreet,
      applicant.currentAddressCity,
      applicant.currentAddressState,
      applicant.currentAddressZip,
      applicant.currentAddressSinceDate,
      applicant.householdIncome,
      applicant.moveInDate,
      applicant.totalOccupancy,
      applicant.landlordName,
      applicant.landlordPhone,
      applicant.additionalInfo
    );
    count++;
  }

  console.log(`✓ Created ${count} sample applications`);
  console.log('\n✨ Sample applications seeded successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Error seeding applications:', error.message);
  process.exit(1);
} finally {
  db.close();
}
