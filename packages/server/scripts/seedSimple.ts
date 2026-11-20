/**
 * Simple Database Seeding Script
 * Direct CSV parsing without external dependencies
 */

import { readFileSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getDb, initDb, saveDb, getDbPath } from '../src/db/init.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '../data/reviveai_demo_leads.csv');
const BUSINESS_ID = 'business-001';

async function seed() {
  console.log('🌱 Starting simple database seed...\n');

  try {
    // Initialize database
    await initDb();
    const db = getDb();
    
    // Get the actual DB path
    const dbPath = getDbPath ? getDbPath() : (process.env.DATABASE_URL || path.join(__dirname, '../../data/reviveai.db'));
    console.log(`📊 Database path: ${dbPath}`);
    console.log(`✅ Database initialized\n`);

    // Ensure business exists
    const businessCheck = db.exec('SELECT COUNT(*) as count FROM businesses WHERE id = ?', [BUSINESS_ID]);
    if (businessCheck?.[0]?.values?.[0]?.[0] === 0) {
      db.exec(
        `INSERT INTO businesses (id, name, email, phone, website)
         VALUES (?, ?, ?, ?, ?)`,
        [BUSINESS_ID, 'CoolCare AC Services', 'support@coolcare.invalid', '+91-12345-67890', 'https://coolcare.invalid']
      );
      console.log('✅ Business record created\n');
    } else {
      console.log('✅ Business record already exists\n');
    }

    // Read and parse CSV
    const csvContent = readFileSync(CSV_PATH, 'utf-8');
    const lines = csvContent.split('\n').filter((l) => l.trim());
    const headers = lines[0].split(',');

    console.log(`📖 CSV has ${lines.length - 1} data rows\n`);

    let imported = 0;
    let skipped = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = parseCSVLine(line);
      
      if (values.length !== headers.length) {
        console.log(`⚠️ Line ${i + 1}: Invalid column count (${values.length} vs ${headers.length})`);
        skipped++;
        continue;
      }

      const record = Object.fromEntries(headers.map((h, idx) => [h, values[idx]]));

      try {
        const receivedAt = normalizeDate(record.created_at);
        const lastContactedAt = record.last_contacted_at ? normalizeDate(record.last_contacted_at) : null;

        // Map CSV lead_status to database enum
        const status = mapStatus(record.lead_status);

        const result = db.exec(
          `INSERT INTO leads (
            id, business_id, name, email, phone, message, enquiry_type, 
            potential_value, status, received_at, last_contacted_at, 
            follow_up_count, contact_consent, preferred_channel, 
            booking_status, payment_status, source, duplicate_of_lead_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            record.lead_id,
            BUSINESS_ID,
            record.customer_name,
            record.customer_email,
            record.customer_phone,
            record.enquiry_text,
            record.service_type,
            parseFloat(record.estimated_value_inr),
            status,
            receivedAt,
            lastContactedAt,
            parseInt(record.follow_up_count),
            record.contact_consent,
            record.preferred_channel,
            record.booking_status,
            record.payment_status,
            record.source,
            record.duplicate_of_lead_id || null,
          ]
        );

        imported++;
        console.log(`✅ ${record.lead_id}: ${record.customer_name} - ${record.lead_status}`);
      } catch (err: any) {
        console.log(`❌ ${record.lead_id}: ${err.message}`);
        skipped++;
      }
    }

    console.log(`\n📊 Seeding complete: ${imported} imported, ${skipped} skipped`);

    // Save the database to disk
    saveDb();
    console.log('💾 Database saved to disk');

    // Verify data
    const countResults = db.exec('SELECT COUNT(*) as count FROM leads');
    const total = countResults?.[0]?.values?.[0]?.[0] || 0;
    console.log(`✅ Total leads in database: ${total}`);

    // List all leads
    const allLeads = db.exec('SELECT id, name, status, received_at FROM leads ORDER BY id');
    console.log('\nAll leads:');
    for (const row of allLeads?.[0]?.values || []) {
      console.log(`  - ${row[0]}: ${row[1]} (${row[2]})`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Parse CSV line handling quoted fields
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

// Normalize date to UTC ISO format
function normalizeDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

// Map CSV status to database enum
function mapStatus(status: string): string {
  const mapping: Record<string, string> = {
    'QUOTE_SENT': 'QUOTE_SENT',
    'BOOKING_PENDING': 'BOOKING_PENDING',
    'CALLBACK_REQUESTED': 'CALLBACK_REQUESTED',
    'DECLINED': 'DECLINED',
    'CONVERTED': 'CONVERTED',
    'OPTED_OUT': 'OPTED_OUT',
  };
  return mapping[status] || 'NEW';
}

seed();
