/**
 * Database initialization and connection management
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import { SCHEMA, INDEXES } from './schema.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DATABASE_URL || path.join(__dirname, '../../data/reviveai.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDb() first.');
  }
  return db;
}

export async function initDb(): Promise<Database.Database> {
  if (db) {
    return db;
  }

  try {
    db = new Database(DB_PATH);
    console.log(`📊 Connected to database: ${DB_PATH}`);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Create tables
    const tableNames = Object.keys(SCHEMA) as Array<keyof typeof SCHEMA>;
    for (const tableName of tableNames) {
      const sql = SCHEMA[tableName];
      db.exec(sql);
      console.log(`✅ Table '${tableName}' initialized`);
    }

    // Create indexes
    const indexKeys = Object.keys(INDEXES) as Array<keyof typeof INDEXES>;
    for (const indexKey of indexKeys) {
      const sql = INDEXES[indexKey];
      db.exec(sql);
    }
    console.log(`✅ ${indexKeys.length} indexes created`);

    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
    console.log('🔌 Database connection closed');
  }
}

export async function seedDatabase(leads: Array<any>): Promise<{ imported: number; skipped: number; errors: Array<any> }> {
  const database = getDb();
  const errors: Array<any> = [];
  let imported = 0;
  let skipped = 0;

  try {
    // Ensure default business exists
    const businessStmt = database.prepare(`
      INSERT OR IGNORE INTO businesses (id, name, email, phone, website)
      VALUES (?, ?, ?, ?, ?)
    `);

    businessStmt.run('business-001', 'CoolCare AC Services', 'support@coolcare.invalid', '+91-12345-67890', 'https://coolcare.invalid');
    console.log('✅ Default business created');

    // Prepare lead insert statement
    const leadStmt = database.prepare(`
      INSERT INTO leads (
        id, business_id, name, email, phone, message, enquiry_type, 
        potential_value, status, received_at, last_contacted_at, 
        follow_up_count, contact_consent, preferred_channel, 
        booking_status, payment_status, source, duplicate_of_lead_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertTxn = database.transaction((lead: any) => {
      try {
        const receivedAt = new Date(lead.created_at).toISOString();
        const lastContactedAt = lead.last_contacted_at ? new Date(lead.last_contacted_at).toISOString() : null;

        leadStmt.run(
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
          lead.duplicate_of_lead_id || null
        );

        imported++;
      } catch (err: any) {
        errors.push({
          lead_id: lead.lead_id,
          error: err.message,
        });
        skipped++;
      }
    });

    for (const lead of leads) {
      insertTxn(lead);
    }

    console.log(`✅ Seeding complete: ${imported} imported, ${skipped} skipped`);
    return { imported, skipped, errors };
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  }
}
