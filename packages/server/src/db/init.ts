/**
 * Database initialization and connection management
 * Uses sql.js for cross-platform SQLite support (no native compilation)
 */

import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { SCHEMA, INDEXES } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, '../../data/reviveai.db');
const DATA_DIR = path.dirname(DB_PATH);

let db: SqlJsDatabase | null = null;
let SQL: any = null;

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export function getDbPath(): string {
  return DB_PATH;
}

export async function initDb(): Promise<SqlJsDatabase> {
  if (db) {
    return db;
  }

  try {
    // Initialize sql.js
    SQL = await initSqlJs();

    // Load existing database if it exists
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH);
      db = new SQL.Database(data);
      console.log(`📊 Connected to existing database: ${DB_PATH}`);
    } else {
      db = new SQL.Database();
      console.log(`📊 Created new database`);
    }

    // Enable foreign keys
    db.run('PRAGMA foreign_keys = ON');

    // Create tables
    const tableNames = Object.keys(SCHEMA) as Array<keyof typeof SCHEMA>;
    for (const tableName of tableNames) {
      const sql = SCHEMA[tableName];
      try {
        db.run(sql);
        console.log(`✅ Table '${tableName}' initialized`);
      } catch (err: any) {
        // Table might already exist, that's OK
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }

    // Create indexes
    const indexKeys = Object.keys(INDEXES) as Array<keyof typeof INDEXES>;
    for (const indexKey of indexKeys) {
      const sql = INDEXES[indexKey];
      try {
        db.run(sql);
      } catch (err: any) {
        // Index might already exist
        if (!err.message.includes('already exists')) {
          throw err;
        }
      }
    }
    console.log(`✅ ${indexKeys.length} indexes ready`);

    // Save to disk
    saveDb();

    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export function saveDb(): void {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
    console.log(`💾 Database saved to: ${DB_PATH}`);
  } catch (err) {
    console.error('❌ Failed to save database:', err);
  }
}

export function closeDb(): void {
  if (db) {
    try {
      saveDb();
      db.close();
      db = null;
      console.log('🔌 Database connection closed');
    } catch (err) {
      console.error('❌ Error closing database:', err);
    }
  }
}

export async function seedDatabase(leads: Array<any>): Promise<{ imported: number; skipped: number; errors: Array<any> }> {
  const database = getDb();
  const errors: Array<any> = [];
  let imported = 0;
  let skipped = 0;

  try {
    // Ensure default business exists
    database.run(
      `INSERT OR IGNORE INTO businesses (id, name, email, phone, website)
       VALUES (?, ?, ?, ?, ?)`,
      ['business-001', 'CoolCare AC Services', 'support@coolcare.invalid', '+91-12345-67890', 'https://coolcare.invalid']
    );
    console.log('✅ Default business created');

    // Insert each lead
    for (const lead of leads) {
      try {
        const receivedAt = new Date(lead.created_at).toISOString();
        const lastContactedAt = lead.last_contacted_at ? new Date(lead.last_contacted_at).toISOString() : null;

        database.run(
          `INSERT INTO leads (
            id, business_id, name, email, phone, message, enquiry_type, 
            potential_value, status, received_at, last_contacted_at, 
            follow_up_count, contact_consent, preferred_channel, 
            booking_status, payment_status, source, duplicate_of_lead_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lead.lead_id,
            'business-001',
            lead.customer_name,
            lead.customer_email,
            lead.customer_phone,
            lead.enquiry_text,
            lead.service_type,
            parseFloat(lead.estimated_value_inr),
            lead.lead_status,
            receivedAt,
            lastContactedAt,
            parseInt(lead.follow_up_count),
            lead.contact_consent,
            lead.preferred_channel,
            lead.booking_status,
            lead.payment_status,
            lead.source,
            lead.duplicate_of_lead_id || null,
          ]
        );

        imported++;
      } catch (err: any) {
        errors.push({
          lead_id: lead.lead_id,
          error: err.message,
        });
        skipped++;
      }
    }

    saveDb();
    console.log(`✅ Seeding complete: ${imported} imported, ${skipped} skipped`);
    return { imported, skipped, errors };
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}

