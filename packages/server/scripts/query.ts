/**
 * Query database
 */

import { initDb, getDb } from '../src/db/init.js';

async function query() {
  await initDb();
  const db = getDb();

  // Count leads
  const count = db.exec('SELECT COUNT(*) as count FROM leads');
  console.log('Total leads:', count?.[0]?.values?.[0]?.[0]);

  // List all leads
  const leads = db.exec('SELECT id, name, status, received_at FROM leads ORDER BY id');
  console.log('\nLeads in database:');
  for (const row of leads?.[0]?.values || []) {
    console.log(`  ${row[0]}: ${row[1]} (${row[2]})`);
  }

  // Check stale leads
  const thresholdDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const stale = db.exec(`
    SELECT id, name, status, received_at
    FROM leads
    WHERE status IN ('NEW', 'STALE', 'CONTACTED')
    AND contact_consent = 'CONSENTED'
    AND payment_status = 'NOT_PAID'
    AND received_at < ?
    ORDER BY received_at
  `, [thresholdDate]);
  
  console.log(`\nStale leads (>3 days): ${stale?.[0]?.values?.length || 0}`);
  for (const row of stale?.[0]?.values || []) {
    console.log(`  ${row[0]}: ${row[1]} (${row[2]})`);
  }
}

query();
