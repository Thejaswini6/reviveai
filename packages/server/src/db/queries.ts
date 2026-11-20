/**
 * Database Query Helpers - sql.js Edition
 * Simplified queries for sql.js compatibility
 */

import { getDb } from './init.js';
import { Lead, AgentAction, EmailLog, Outcome, LeadStatus } from '../types/index.js';

// Helper to convert sql.js results to typed objects
function sqlResultsToObjects<T>(results: any[], columns: string[]): T[] {
  const objects: T[] = [];
  for (const row of results) {
    const obj: any = {};
    for (let i = 0; i < columns.length; i++) {
      obj[columns[i]] = row[i];
    }
    objects.push(obj as T);
  }
  return objects;
}

/**
 * Get all leads with optional filters
 */
export function getLeads(options?: any): { leads: Lead[]; total: number } {
  try {
    const db = getDb();
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    // Get total count
    const countResults = db.exec('SELECT COUNT(*) as count FROM leads');
    const total = countResults?.[0]?.values?.[0]?.[0] as number || 0;

    // Get leads with pagination
    const query = `SELECT * FROM leads ORDER BY received_at DESC LIMIT ? OFFSET ?`;
    const results = db.exec(query, [limit, offset]);

    if (!results || results.length === 0) {
      return { leads: [], total };
    }

    const leads = sqlResultsToObjects<Lead>(results[0].values, results[0].columns);
    return { leads, total };
  } catch (err) {
    console.error('Error in getLeads:', err);
    return { leads: [], total: 0 };
  }
}

/**
 * Get lead by ID
 */
export function getLeadById(leadId: string): Lead | null {
  try {
    const db = getDb();
    const results = db.exec('SELECT * FROM leads WHERE id = ?', [leadId]);

    if (!results || results.length === 0 || results[0].values.length === 0) {
      return null;
    }

    const leads = sqlResultsToObjects<Lead>(results[0].values, results[0].columns);
    return leads[0] || null;
  } catch (err) {
    console.error('Error in getLeadById:', err);
    return null;
  }
}

/**
 * Get lead with full history
 */
export function getLeadWithHistory(leadId: string): {
  lead: Lead | null;
  interactions: AgentAction[];
  emails: EmailLog[];
  outcomes: Outcome[];
} {
  try {
    const lead = getLeadById(leadId);

    if (!lead) {
      return {
        lead: null,
        interactions: [],
        emails: [],
        outcomes: [],
      };
    }

    const db = getDb();

    const interactionResults = db.exec('SELECT * FROM agent_actions WHERE lead_id = ? ORDER BY timestamp DESC', [leadId]);
    const interactions = interactionResults?.[0] ? sqlResultsToObjects<AgentAction>(interactionResults[0].values, interactionResults[0].columns) : [];

    const emailResults = db.exec('SELECT * FROM email_logs WHERE lead_id = ? ORDER BY sent_at DESC', [leadId]);
    const emails = emailResults?.[0] ? sqlResultsToObjects<EmailLog>(emailResults[0].values, emailResults[0].columns) : [];

    const outcomeResults = db.exec('SELECT * FROM outcomes WHERE lead_id = ?', [leadId]);
    const outcomes = outcomeResults?.[0] ? sqlResultsToObjects<Outcome>(outcomeResults[0].values, outcomeResults[0].columns) : [];

    return { lead, interactions, emails, outcomes };
  } catch (err) {
    console.error('Error in getLeadWithHistory:', err);
    return { lead: null, interactions: [], emails: [], outcomes: [] };
  }
}

/**
 * Update lead
 */
export function updateLead(leadId: string, updates: Partial<Lead>): Lead | null {
  try {
    const db = getDb();
    const lead = getLeadById(leadId);

    if (!lead) {
      return null;
    }

    const fields: string[] = [];
    const values: any[] = [];

    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.contact_consent !== undefined) {
      fields.push('contact_consent = ?');
      values.push(updates.contact_consent);
    }
    if (updates.payment_status !== undefined) {
      fields.push('payment_status = ?');
      values.push(updates.payment_status);
    }
    if (updates.last_contacted_at !== undefined) {
      fields.push('last_contacted_at = ?');
      values.push(updates.last_contacted_at);
    }
    if (updates.follow_up_count !== undefined) {
      fields.push('follow_up_count = ?');
      values.push(updates.follow_up_count);
    }

    if (fields.length === 0) {
      return lead;
    }

    values.push(leadId);
    const query = `UPDATE leads SET ${fields.join(', ')} WHERE id = ?`;
    db.run(query, values);

    // Return updated lead
    return getLeadById(leadId);
  } catch (err) {
    console.error('Error in updateLead:', err);
    return null;
  }
}

/**
 * Mark lead as opted out
 */
export function optOutLead(leadId: string): boolean {
  try {
    const db = getDb();
    db.run('UPDATE leads SET contact_consent = ? WHERE id = ?', ['OPTED_OUT', leadId]);
    return true;
  } catch (err) {
    console.error('Error in optOutLead:', err);
    return false;
  }
}

/**
 * Get stale leads (>3 days old, no contact, consented, not declined)
 */
export function getStaleLeads(thresholdDays: number = 3): Lead[] {
  try {
    const db = getDb();
    const thresholdDate = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000).toISOString();

    const query = `
      SELECT * FROM leads 
      WHERE status IN ('NEW', 'STALE', 'CONTACTED')
      AND contact_consent = 'CONSENTED'
      AND payment_status = 'NOT_PAID'
      AND received_at < ?
      AND (last_contacted_at IS NULL OR last_contacted_at < ?)
      AND duplicate_of_lead_id IS NULL
      ORDER BY received_at ASC
    `;

    const results = db.exec(query, [thresholdDate, thresholdDate]);

    if (!results || results.length === 0) {
      return [];
    }

    return sqlResultsToObjects<Lead>(results[0].values, results[0].columns);
  } catch (err) {
    console.error('Error in getStaleLeads:', err);
    return [];
  }
}

/**
 * Get leads eligible for Claude analysis (stale + specific conditions)
 */
export function getLeadsEligibleForAnalysis(thresholdDays: number = 3): Lead[] {
  try {
    const db = getDb();
    const thresholdDate = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000).toISOString();

    const query = `
      SELECT * FROM leads 
      WHERE status IN ('NEW', 'STALE', 'CONTACTED')
      AND contact_consent = 'CONSENTED'
      AND payment_status = 'NOT_PAID'
      AND received_at < ?
      AND last_contacted_at IS NULL
      ORDER BY received_at ASC
    `;

    const results = db.exec(query, [thresholdDate]);

    if (!results || results.length === 0) {
      return [];
    }

    return sqlResultsToObjects<Lead>(results[0].values, results[0].columns);
  } catch (err) {
    console.error('Error in getLeadsEligibleForAnalysis:', err);
    return [];
  }
}

/**
 * Check if a specific lead is eligible for analysis
 */
export function isLeadEligibleForAnalysis(leadId: string, thresholdDays: number = 3): { eligible: boolean; reason: string } {
  try {
    const lead = getLeadById(leadId);

    if (!lead) {
      return { eligible: false, reason: 'Lead not found' };
    }

    // Check 1: Contact consent
    if (lead.contact_consent !== 'CONSENTED') {
      return { eligible: false, reason: 'Lead has not consented to contact' };
    }

    // Check 2: Already paid
    if (lead.payment_status === 'PAID') {
      return { eligible: false, reason: 'Lead already paid' };
    }

    // Check 3: Lead age
    const ageInDays = (Date.now() - new Date(lead.received_at).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays <= thresholdDays) {
      return { eligible: false, reason: `Lead too recent (${Math.floor(ageInDays)} days old)` };
    }

    return { eligible: true, reason: 'Lead is eligible for analysis' };
  } catch (err) {
    console.error('Error in isLeadEligibleForAnalysis:', err);
    return { eligible: false, reason: 'Error checking eligibility' };
  }
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary(): any {
  try {
    const db = getDb();

    // Get counts by status
    const countsResults = db.exec(`
      SELECT status, COUNT(*) as count 
      FROM leads 
      GROUP BY status
    `);

    const counts: Record<string, number> = {};
    if (countsResults?.[0]) {
      for (const row of countsResults[0].values) {
        counts[row[0]] = row[1];
      }
    }

    // Get total leads
    const totalResults = db.exec('SELECT COUNT(*) as count FROM leads');
    const total = totalResults?.[0]?.values?.[0]?.[0] || 0;

    // Get new leads
    const newResults = db.exec("SELECT COUNT(*) as count FROM leads WHERE status = 'NEW'");
    const newLeads = newResults?.[0]?.values?.[0]?.[0] || 0;

    // Get stale leads
    const staleLeads = getStaleLeads(3).length;

    // Get recovered (paid)
    const recoveredResults = db.exec("SELECT COUNT(*) as count FROM leads WHERE payment_status = 'PAID'");
    const recovered = recoveredResults?.[0]?.values?.[0]?.[0] || 0;

    // Calculate recovery rate
    const recoveryRate = total > 0 ? ((recovered / total) * 100).toFixed(1) : '0.0';

    return {
      total_leads: total,
      new_leads: newLeads,
      stale_leads: staleLeads,
      recovered_leads: recovered,
      declined_leads: counts['DECLINED'] || 0,
      opted_out_leads: counts['OPTED_OUT'] || 0,
      recovery_rate_percent: parseFloat(recoveryRate),
      status_breakdown: counts,
    };
  } catch (err) {
    console.error('Error in getAnalyticsSummary:', err);
    return {
      total_leads: 0,
      new_leads: 0,
      stale_leads: 0,
      recovered_leads: 0,
      declined_leads: 0,
      opted_out_leads: 0,
      recovery_rate_percent: 0,
    };
  }
}

/**
 * Get activity timeline (daily summary)
 */
export function getActivityTimeline(days: number = 7): any[] {
  try {
    const db = getDb();
    const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const query = `
      SELECT 
        DATE(received_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'RECOVERED' THEN 1 ELSE 0 END) as recovered,
        SUM(CASE WHEN status = 'DECLINED' THEN 1 ELSE 0 END) as declined
      FROM leads
      WHERE received_at >= ?
      GROUP BY DATE(received_at)
      ORDER BY date DESC
    `;

    const results = db.exec(query, [sinceDate + 'T00:00:00.000Z']);

    if (!results || results.length === 0) {
      return [];
    }

    return sqlResultsToObjects<any>(results[0].values, results[0].columns);
  } catch (err) {
    console.error('Error in getActivityTimeline:', err);
    return [];
  }
}


/**
 * Mark stale leads with STALE status
 */
export function markLeadsAsStale(thresholdDays: number = 3): number {
  try {
    const db = getDb();
    const thresholdDate = new Date(Date.now() - thresholdDays * 24 * 60 * 60 * 1000).toISOString();

    const query = `
      UPDATE leads 
      SET status = 'STALE'
      WHERE status IN ('NEW', 'CONTACTED')
      AND contact_consent = 'CONSENTED'
      AND payment_status = 'NOT_PAID'
      AND received_at < ?
    `;

    db.run(query, [thresholdDate]);
    
    // Return count of affected rows (approximate)
    const stalLeads = getStaleLeads(thresholdDays);
    return stalLeads.length;
  } catch (err) {
    console.error('Error in markLeadsAsStale:', err);
    return 0;
  }
}
