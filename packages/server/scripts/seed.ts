/**
 * Database Seeding Script
 * Imports demo leads from CSV and populates the database
 */

import path from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { initDb, seedDatabase, getDb } from '../src/db/init.js';
import { CsvImporter } from '../src/services/csvImporter.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CSV_PATH = path.join(__dirname, '../data/reviveai_demo_leads.csv');

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Initialize database
    await initDb();
    console.log('✅ Database initialized\n');

    // Read and parse CSV
    console.log('📖 Reading CSV file...');
    const csvContent = readFileSync(CSV_PATH, 'utf-8');
    const records = parse(csvContent, {
      columns: true,
      skip_empty_lines: true,
    });

    console.log(`✅ CSV parsed: ${records.length} records found\n`);

    // Validate using CSV importer
    console.log('🔍 Validating records...');
    const importer = new CsvImporter();

    // Manual validation (since we already have parsed records)
    const db = getDb();
    const businessStmt = db.prepare(`
      INSERT OR IGNORE INTO businesses (id, name, email, phone, website)
      VALUES (?, ?, ?, ?, ?)
    `);

    businessStmt.run('business-001', 'CoolCare AC Services', 'support@coolcare.invalid', '+91-12345-67890', 'https://coolcare.invalid');
    console.log('✅ Default business created\n');

    // Insert leads
    console.log('💾 Inserting leads...');
    const leadStmt = db.prepare(`
      INSERT INTO leads (
        id, business_id, name, email, phone, message, enquiry_type, 
        potential_value, status, received_at, last_contacted_at, 
        follow_up_count, contact_consent, preferred_channel, 
        booking_status, payment_status, source, duplicate_of_lead_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let imported = 0;
    let skipped = 0;
    const errors: any[] = [];
    const duplicates: any[] = [];

    for (const record of records) {
      try {
        // Map CSV status to database status
        let dbStatus = record.lead_status;
        if (record.lead_status === 'QUOTE_SENT' && !record.last_contacted_at) {
          // If quote sent but not contacted, still NEW
          dbStatus = 'NEW';
        }

        // Check for stale (apply after import)
        const receivedAt = new Date(record.created_at);
        const ageInDays = (Date.now() - receivedAt.getTime()) / (1000 * 60 * 60 * 24);
        if (ageInDays > 3 && !record.last_contacted_at && ['NEW', 'QUOTE_SENT'].includes(record.lead_status)) {
          // Will be marked stale later in separate query
        }

        const lastContactedAt = record.last_contacted_at ? new Date(record.last_contacted_at).toISOString() : null;

        leadStmt.run(
          record.lead_id,
          'business-001',
          record.customer_name,
          record.customer_email,
          record.customer_phone,
          record.enquiry_text,
          record.service_type,
          parseFloat(record.estimated_value_inr),
          record.lead_status,
          receivedAt.toISOString(),
          lastContactedAt,
          parseInt(record.follow_up_count),
          record.contact_consent,
          record.preferred_channel,
          record.booking_status,
          record.payment_status,
          record.source,
          record.duplicate_of_lead_id || null
        );

        imported++;

        // Track duplicates
        if (record.duplicate_of_lead_id) {
          duplicates.push({
            lead_id: record.lead_id,
            duplicate_of: record.duplicate_of_lead_id,
          });
        }
      } catch (err: any) {
        errors.push({
          lead_id: record.lead_id,
          error: err.message,
        });
        skipped++;
      }
    }

    console.log(`✅ ${imported} leads imported`);
    if (skipped > 0) {
      console.log(`⚠️ ${skipped} leads skipped due to errors`);
      console.log('\nErrors:');
      errors.forEach((e) => console.log(`  - ${e.lead_id}: ${e.error}`));
    }
    if (duplicates.length > 0) {
      console.log(`\n📋 ${duplicates.length} duplicates detected:`);
      duplicates.forEach((d) => console.log(`  - ${d.lead_id} → ${d.duplicate_of}`));
    }

    // Query for stale leads
    console.log('\n🔎 Checking for stale leads...');
    const staleThresholdDays = 3;
    const staleQuery = db.prepare(`
      SELECT id, name, status, 
             CAST((julianday('now') - julianday(received_at)) AS INTEGER) as days_old
      FROM leads
      WHERE (julianday('now') - julianday(received_at)) > ?
        AND last_contacted_at IS NULL
        AND contact_consent = 'CONSENTED'
        AND status NOT IN ('DECLINED', 'CONVERTED', 'OPTED_OUT')
      ORDER BY received_at DESC
    `);

    const staleLeads = staleQuery.all(staleThresholdDays) as any[];
    console.log(`✅ Found ${staleLeads.length} stale leads (>3 days old, no contact):`);
    staleLeads.forEach((lead) => {
      console.log(`  - ${lead.id} (${lead.name}): ${lead.days_old} days old, status=${lead.status}`);
    });

    // Summary
    console.log('\n📊 Seed Summary:');
    console.log(`  Total records in CSV: ${records.length}`);
    console.log(`  Successfully imported: ${imported}`);
    console.log(`  Skipped/Errors: ${skipped}`);
    console.log(`  Duplicates detected: ${duplicates.length}`);
    console.log(`  Stale leads identified: ${staleLeads.length}`);

    console.log('\n✨ Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
