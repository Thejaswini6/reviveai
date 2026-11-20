/**
 * SQLite Database Schema for ReviveAI
 * Defines all tables, columns, indexes, and constraints
 */

export const SCHEMA = {
  // Business table
  businesses: `
    CREATE TABLE IF NOT EXISTS businesses (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT,
      website TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `,

  // Leads table
  leads: `
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      business_id TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      message TEXT,
      enquiry_type TEXT,
      potential_value DECIMAL(10, 2),
      status TEXT CHECK(status IN ('NEW', 'STALE', 'CONTACTED', 'RECOVERED', 'ESCALATED', 'DECLINED', 'OPTED_OUT', 'QUOTE_SENT', 'BOOKING_PENDING', 'CALLBACK_REQUESTED', 'CONVERTED')),
      received_at DATETIME NOT NULL,
      last_contacted_at DATETIME,
      follow_up_count INTEGER DEFAULT 0,
      contact_consent TEXT CHECK(contact_consent IN ('CONSENTED', 'OPTED_OUT')) DEFAULT 'CONSENTED',
      preferred_channel TEXT CHECK(preferred_channel IN ('email', 'phone')),
      booking_status TEXT CHECK(booking_status IN ('NOT_BOOKED', 'PENDING', 'CONFIRMED')) DEFAULT 'NOT_BOOKED',
      payment_status TEXT CHECK(payment_status IN ('NOT_PAID', 'PAID')) DEFAULT 'NOT_PAID',
      source TEXT,
      duplicate_of_lead_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (business_id) REFERENCES businesses(id),
      FOREIGN KEY (duplicate_of_lead_id) REFERENCES leads(id)
    )
  `,

  // Agent actions table (audit trail)
  agent_actions: `
    CREATE TABLE IF NOT EXISTS agent_actions (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      action_type TEXT CHECK(action_type IN ('analysis', 'approval_requested', 'email_sent', 'follow_up_scheduled', 'escalation')) NOT NULL,
      status TEXT CHECK(status IN ('pending', 'approved', 'rejected', 'completed', 'failed')) DEFAULT 'pending',
      
      analysis_json TEXT,
      generated_message TEXT,
      
      approval_requested_at DATETIME,
      approved_by TEXT,
      approved_at DATETIME,
      rejection_reason TEXT,
      
      executed_at DATETIME,
      error_message TEXT,
      
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id)
    )
  `,

  // Email logs table
  email_logs: `
    CREATE TABLE IF NOT EXISTS email_logs (
      id TEXT PRIMARY KEY,
      action_id TEXT NOT NULL,
      recipient_email TEXT NOT NULL,
      subject TEXT,
      body TEXT,
      sent_at DATETIME,
      status TEXT CHECK(status IN ('sent', 'failed', 'bounced', 'pending')) DEFAULT 'pending',
      error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (action_id) REFERENCES agent_actions(id)
    )
  `,

  // Outcomes table
  outcomes: `
    CREATE TABLE IF NOT EXISTS outcomes (
      id TEXT PRIMARY KEY,
      lead_id TEXT NOT NULL,
      action_id TEXT NOT NULL,
      outcome TEXT CHECK(outcome IN ('replied', 'booked', 'purchased', 'unsubscribed', 'unknown')),
      recovered_value DECIMAL(10, 2),
      notes TEXT,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (lead_id) REFERENCES leads(id),
      FOREIGN KEY (action_id) REFERENCES agent_actions(id)
    )
  `,
};

export const INDEXES = {
  leads_business_id: `CREATE INDEX IF NOT EXISTS idx_leads_business_id ON leads(business_id)`,
  leads_status: `CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`,
  leads_created_at: `CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(received_at)`,
  leads_contact_consent: `CREATE INDEX IF NOT EXISTS idx_leads_contact_consent ON leads(contact_consent)`,
  leads_payment_status: `CREATE INDEX IF NOT EXISTS idx_leads_payment_status ON leads(payment_status)`,
  leads_duplicate: `CREATE INDEX IF NOT EXISTS idx_leads_duplicate ON leads(duplicate_of_lead_id)`,
  agent_actions_lead_id: `CREATE INDEX IF NOT EXISTS idx_agent_actions_lead_id ON agent_actions(lead_id)`,
  agent_actions_status: `CREATE INDEX IF NOT EXISTS idx_agent_actions_status ON agent_actions(status)`,
  email_logs_action_id: `CREATE INDEX IF NOT EXISTS idx_email_logs_action_id ON email_logs(action_id)`,
  outcomes_lead_id: `CREATE INDEX IF NOT EXISTS idx_outcomes_lead_id ON outcomes(lead_id)`,
};
