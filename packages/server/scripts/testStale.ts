/**
 * Test stale detection
 */

import { initDb, getDb } from '../src/db/init.js';
import { getStaleLeads } from '../src/db/queries.js';

async function test() {
  await initDb();
  const db = getDb();

  // Check the data
  const leads = db.exec('SELECT id, name, received_at, duplicate_of_lead_id FROM leads');
  console.log('All leads:');
  for (const row of leads?.[0]?.values || []) {
    const receivedAt = new Date(row[2]);
    const ageInDays = (Date.now() - receivedAt.getTime()) / (1000 * 60 * 60 * 24);
    console.log(`  ${row[0]}: ${row[1]} - ${ageInDays.toFixed(1)} days old, duplicate_of=${row[3]}`);
  }

  console.log('\nStale leads (using getStaleLeads):');
  const stale = getStaleLeads(3);
  console.log(`Found: ${stale.length} stale leads`);
  for (const lead of stale) {
    console.log(`  - ${lead.id}: ${lead.name} (${lead.status})`);
  }
}

test();
