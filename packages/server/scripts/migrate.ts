/**
 * Database Migration Script
 * Handles schema updates and maintenance
 */

import { initDb, getDb } from '../src/db/init.js';

async function main() {
  console.log('🔄 Running migrations...\n');

  try {
    await initDb();
    const db = getDb();

    // Migration 001: Initial schema (already handled in initDb)
    console.log('✅ Migration 001: Initial schema already applied');

    // Add more migrations here as needed
    // Example:
    // if (!schemaVersion || schemaVersion < 2) {
    //   db.exec('ALTER TABLE leads ADD COLUMN new_field TEXT');
    //   console.log('✅ Migration 002: Added new_field to leads');
    // }

    console.log('\n✨ All migrations complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
