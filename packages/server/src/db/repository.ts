/**
 * Unified Data Repository Layer for ReviveAI
 * 
 * Provides a single data access interface across the application:
 * 1. InMemoryRepository: Used for local dev, automated tests, and mock evaluation.
 * 2. MySQLRepository: Used in production on GoDaddy Node.js Hosting when DB_* credentials are set.
 */

import mysql from 'mysql2/promise';
import { MOCK_LEADS, MOCK_AGENT_ACTIONS, MOCK_TIMELINE_EVENTS } from '../data/mockData.js';
import { getBusinessProfile } from '../services/businessConfig.js';
import { checkLeadEligibility } from '../services/eligibility.js';
import { logger } from '../utils/logger.js';

export interface Lead {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone: string;
  message: string;
  enquiry_type: string;
  potential_value: number;
  status: string;
  received_at: string;
  last_contacted_at: string | null;
  follow_up_count: number;
  contact_consent: string;
  preferred_channel: string;
  booking_status: string;
  payment_status: string;
  source: string;
  duplicate_of_lead_id: string | null;
  created_at: string;
  score?: number;
  is_archived?: boolean;
}

export interface AgentAction {
  id: string;
  lead_id: string;
  action_type: string;
  status: string;
  analysis_json: string;
  generated_message: string;
  approval_requested_at: string;
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  executed_at: string | null;
  error_message: string | null;
  created_at: string;
  trace?: any[];
  mode?: string;
  model?: string;
  token_usage?: any;
}

export interface DataRepository {
  init(): Promise<void>;
  getLeads(filter?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<{ leads: Lead[]; total: number }>;
  getLeadById(id: string): Promise<Lead | null>;
  createLead(data: Partial<Lead>): Promise<Lead>;
  updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null>;
  archiveLead(id: string): Promise<{ success: boolean; lead: Lead | null; message: string }>;
  getTimelineEvents(leadId: string): Promise<any[]>;
  getAgentActions(filter?: { status?: string; lead_id?: string }): Promise<AgentAction[]>;
  getAgentActionById(id: string): Promise<AgentAction | null>;
  saveAgentAction(action: AgentAction): Promise<AgentAction>;
  updateAgentAction(id: string, updates: Partial<AgentAction>): Promise<AgentAction | null>;
  getAnalyticsSummary(businessId: string): Promise<any>;
}

// ==========================================
// 1. IN-MEMORY REPOSITORY (Default / Test)
// ==========================================
export class InMemoryRepository implements DataRepository {
  private leads: Lead[] = [];
  private actions: AgentAction[] = [];
  private timeline: Record<string, any[]> = {};

  constructor() {
    this.leads = [...MOCK_LEADS];
    this.actions = [...MOCK_AGENT_ACTIONS];
    this.timeline = { ...MOCK_TIMELINE_EVENTS };
  }

  async init(): Promise<void> {
    logger.info(`📦 [InMemoryRepository] Initialized with ${this.leads.length} canonical leads`);
  }

  async getLeads(filter?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<{ leads: Lead[]; total: number }> {
    let result = this.leads.filter(l => !l.is_archived);

    if (filter?.status && filter.status !== 'all') {
      result = result.filter(l => l.status === filter.status);
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      result = result.filter(l => 
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.id.toLowerCase().includes(q) ||
        l.enquiry_type.toLowerCase().includes(q)
      );
    }

    const total = result.length;
    const offset = filter?.offset || 0;
    const limit = filter?.limit || result.length;
    return { leads: result.slice(offset, offset + limit), total };
  }

  async getLeadById(id: string): Promise<Lead | null> {
    const lead = this.leads.find(l => l.id === id);
    return lead || null;
  }

  async createLead(data: Partial<Lead>): Promise<Lead> {
    const leadId = data.id || `RV-${Date.now().toString().slice(-4)}`;
    const newLead: Lead = {
      id: leadId,
      business_id: data.business_id || 'business-001',
      name: data.name || 'Anonymous Customer',
      email: data.email || 'customer@example.com',
      phone: data.phone || '+91-98765-00000',
      message: data.message || '',
      enquiry_type: data.enquiry_type || 'AC servicing',
      potential_value: Math.max(500, Number(data.potential_value) || 5000),
      status: data.status || 'NEW',
      received_at: data.received_at || new Date().toISOString(),
      last_contacted_at: data.last_contacted_at || null,
      follow_up_count: 0,
      contact_consent: data.contact_consent || 'CONSENTED',
      preferred_channel: data.preferred_channel || 'email',
      booking_status: data.booking_status || 'NOT_BOOKED',
      payment_status: data.payment_status || 'NOT_PAID',
      source: data.source || 'WEBSITE',
      duplicate_of_lead_id: data.duplicate_of_lead_id || null,
      created_at: new Date().toISOString(),
      is_archived: false,
    };

    this.leads.unshift(newLead);
    logger.info(`✨ [InMemoryRepository] Created lead ${newLead.id} for ${newLead.name}`);
    return newLead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) return null;

    // Preserve safety-critical invariants
    if (lead.contact_consent === 'OPTED_OUT' && updates.contact_consent === 'CONSENTED') {
      logger.warn(`⚠️ [Security Alert] Attempt to bypass opt-out consent on lead ${id} blocked.`);
      delete updates.contact_consent;
    }

    Object.assign(lead, updates);
    return lead;
  }

  async archiveLead(id: string): Promise<{ success: boolean; lead: Lead | null; message: string }> {
    const lead = this.leads.find(l => l.id === id);
    if (!lead) {
      return { success: false, lead: null, message: 'Lead not found' };
    }

    if (lead.payment_status === 'PAID' || lead.status === 'RECOVERED') {
      return { success: false, lead, message: 'Cannot archive converted/paid lead. Audit record must be preserved.' };
    }

    lead.is_archived = true;
    logger.info(`📁 [InMemoryRepository] Lead ${id} soft-archived`);
    return { success: true, lead, message: `Lead ${id} archived successfully.` };
  }

  async getTimelineEvents(leadId: string): Promise<any[]> {
    return this.timeline[leadId] || [];
  }

  async getAgentActions(filter?: { status?: string; lead_id?: string }): Promise<AgentAction[]> {
    let result = [...this.actions];
    if (filter?.status) {
      result = result.filter(a => a.status === filter.status);
    }
    if (filter?.lead_id) {
      result = result.filter(a => a.lead_id === filter.lead_id);
    }
    return result;
  }

  async getAgentActionById(id: string): Promise<AgentAction | null> {
    return this.actions.find(a => a.id === id) || null;
  }

  async saveAgentAction(action: AgentAction): Promise<AgentAction> {
    const idx = this.actions.findIndex(a => a.id === action.id);
    if (idx >= 0) {
      this.actions[idx] = action;
    } else {
      this.actions.unshift(action);
    }
    return action;
  }

  async updateAgentAction(id: string, updates: Partial<AgentAction>): Promise<AgentAction | null> {
    const action = this.actions.find(a => a.id === id);
    if (!action) return null;
    Object.assign(action, updates);
    return action;
  }

  async getAnalyticsSummary(businessId: string): Promise<any> {
    const business = getBusinessProfile(businessId);
    const activeLeads = this.leads.filter(l => !l.is_archived);
    const total_leads = activeLeads.length;
    const new_leads = activeLeads.filter(l => l.status === 'NEW').length;
    const stale_leads = activeLeads.filter(l => l.status === 'STALE').length;
    const contacted_leads = activeLeads.filter(l => l.status === 'CONTACTED').length;

    // Confirmed Paid Conversions
    const recoveredList = activeLeads.filter(
      l => (l.status === 'RECOVERED' || l.status === 'CONVERTED') && l.payment_status === 'PAID'
    );
    const recovered_leads = recoveredList.length;
    const confirmed_recovered_revenue = recoveredList.reduce((sum, l) => sum + (l.potential_value || 0), 0);

    // Gross Open Pipeline: Active non-paid, non-declined, consented inquiries
    const gross_open_pipeline_value = activeLeads
      .filter(l => 
        l.payment_status !== 'PAID' && 
        l.status !== 'RECOVERED' && 
        l.status !== 'CONVERTED' && 
        l.status !== 'DECLINED' && 
        l.contact_consent !== 'OPTED_OUT' && 
        !l.duplicate_of_lead_id
      )
      .reduce((sum, l) => sum + (l.potential_value || 0), 0);

    // Eligible Recovery Opportunity: Passing 10 safety rules
    const eligibleList = activeLeads.filter(l => checkLeadEligibility(l).is_eligible);
    const eligible_inactive_leads = eligibleList.length;
    const eligible_recovery_opportunity = eligibleList.reduce((sum, l) => sum + (l.potential_value || 0), 0);

    // Explicitly Separated Conversion Rates:
    // 1. Lead Conversion Rate = (recovered_leads / total_leads) * 100
    const lead_conversion_rate_percent = total_leads > 0 
      ? Math.round((recovered_leads / total_leads) * 100 * 10) / 10 
      : 0;

    // 2. Revenue Recovery Rate = (confirmed_recovered_revenue / eligible_recovery_opportunity) * 100
    const revenue_recovery_rate_percent = eligible_recovery_opportunity > 0
      ? Math.round((confirmed_recovered_revenue / eligible_recovery_opportunity) * 100 * 10) / 10
      : 0;

    const pending_approvals = this.actions.filter(a => a.status === 'pending').length;
    const emails_sent = this.actions.filter(a => a.status === 'approved').length;

    return {
      success: true,
      business: {
        id: business.id,
        name: business.name,
        industry: business.industry,
        currency: business.currency.code,
        currency_symbol: business.currency.symbol,
      },
      total_leads,
      new_leads,
      stale_leads,
      contacted_leads,
      recovered_leads,
      eligible_inactive_leads,
      // Clarified Three-Tier Revenue Architecture
      gross_open_pipeline_value,
      eligible_recovery_opportunity,
      confirmed_recovered_revenue,
      // Explicit conversion rate definitions
      lead_conversion_rate_percent,
      revenue_recovery_rate_percent,
      // Legacy compatibility
      recovery_rate_percent: lead_conversion_rate_percent,
      total_revenue_at_risk: gross_open_pipeline_value,
      recovered_revenue: confirmed_recovered_revenue,
      pending_approvals,
      emails_sent,
      data_provider: 'in_memory_reconciled',
    };
  }
}

// ==========================================
// 2. GODADDY HOSTED MYSQL REPOSITORY
// ==========================================
export class MySQLRepository implements DataRepository {
  private pool: mysql.Pool | null = null;

  constructor() {
    // Configured via GoDaddy platform environment variables
  }

  async init(): Promise<void> {
    const host = process.env.DB_HOST;
    const port = Number(process.env.DB_PORT) || 3306;
    const database = process.env.DB_NAME;
    const user = process.env.DB_USER;
    const password = process.env.DB_PASSWORD;

    if (!host || !database || !user) {
      throw new Error('MySQL configuration missing required DB_HOST, DB_NAME, or DB_USER environment variables.');
    }

    try {
      this.pool = mysql.createPool({
        host,
        port,
        database,
        user,
        password,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      });

      // Test connection
      const connection = await this.pool.getConnection();
      connection.release();
      logger.info(`✅ [MySQLRepository] Connected to GoDaddy Hosted MySQL database: ${database}@${host}`);

      // Run non-destructive, idempotent migrations
      await this.runMigrations();
    } catch (err: any) {
      logger.error(`❌ [MySQLRepository] Failed to connect to GoDaddy MySQL:`, err);
      throw new Error(`Production MySQL initialization failed: ${err.message}`);
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.pool) return;

    // 1. Create Migration Ledger Table
    await this.pool.execute(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id VARCHAR(100) PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 2. Create Schema Tables (Idempotent - IF NOT EXISTS)
    await this.pool.execute(`
      CREATE TABLE IF NOT EXISTS businesses (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(64),
        website VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await this.pool.execute(`
      CREATE TABLE IF NOT EXISTS leads (
        id VARCHAR(64) PRIMARY KEY,
        business_id VARCHAR(64) NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(64),
        message TEXT,
        enquiry_type VARCHAR(128),
        potential_value DECIMAL(10, 2) DEFAULT 0,
        status VARCHAR(64) NOT NULL,
        received_at VARCHAR(64) NOT NULL,
        last_contacted_at VARCHAR(64),
        follow_up_count INT DEFAULT 0,
        contact_consent VARCHAR(32) DEFAULT 'CONSENTED',
        preferred_channel VARCHAR(32) DEFAULT 'email',
        booking_status VARCHAR(32) DEFAULT 'NOT_BOOKED',
        payment_status VARCHAR(32) DEFAULT 'NOT_PAID',
        source VARCHAR(64) DEFAULT 'WEBSITE',
        duplicate_of_lead_id VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_archived BOOLEAN DEFAULT FALSE,
        INDEX idx_leads_status (status),
        INDEX idx_leads_business (business_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await this.pool.execute(`
      CREATE TABLE IF NOT EXISTS agent_actions (
        id VARCHAR(64) PRIMARY KEY,
        lead_id VARCHAR(64) NOT NULL,
        action_type VARCHAR(64) NOT NULL,
        status VARCHAR(64) DEFAULT 'pending',
        analysis_json MEDIUMTEXT,
        generated_message MEDIUMTEXT,
        approval_requested_at VARCHAR(64),
        approved_by VARCHAR(128),
        approved_at VARCHAR(64),
        rejection_reason TEXT,
        executed_at VARCHAR(64),
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        trace_json MEDIUMTEXT,
        mode VARCHAR(32),
        model VARCHAR(64),
        INDEX idx_actions_lead (lead_id),
        INDEX idx_actions_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await this.pool.execute(`
      CREATE TABLE IF NOT EXISTS email_logs (
        id VARCHAR(64) PRIMARY KEY,
        recipient_email VARCHAR(255) NOT NULL,
        subject VARCHAR(255),
        body TEXT,
        channel VARCHAR(64),
        status VARCHAR(64),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // 3. Seed canonical leads ONLY if table is currently empty
    const [rows]: any = await this.pool.execute('SELECT COUNT(*) as count FROM leads');
    const count = rows[0]?.count || 0;

    if (count === 0) {
      logger.info('🌱 [MySQLRepository] Leads table is empty — seeding 35 canonical benchmark leads...');
      for (const lead of MOCK_LEADS) {
        await this.pool.execute(
          `INSERT INTO leads (
            id, business_id, name, email, phone, message, enquiry_type,
            potential_value, status, received_at, last_contacted_at,
            follow_up_count, contact_consent, preferred_channel,
            booking_status, payment_status, source, duplicate_of_lead_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            lead.id,
            lead.business_id,
            lead.name,
            lead.email,
            lead.phone,
            lead.message,
            lead.enquiry_type,
            lead.potential_value,
            lead.status,
            lead.received_at,
            lead.last_contacted_at,
            lead.follow_up_count,
            lead.contact_consent,
            lead.preferred_channel,
            lead.booking_status,
            lead.payment_status,
            lead.source,
            lead.duplicate_of_lead_id,
          ]
        );
      }
      logger.info(`✅ [MySQLRepository] Successfully seeded ${MOCK_LEADS.length} canonical leads.`);
    } else {
      logger.info(`🛡️ [MySQLRepository] Leads table already contains ${count} records. Preserving existing state.`);
    }
  }

  async getLeads(filter?: { status?: string; search?: string; limit?: number; offset?: number }): Promise<{ leads: Lead[]; total: number }> {
    if (!this.pool) throw new Error('Database pool not initialized');

    let query = 'SELECT * FROM leads WHERE is_archived = FALSE';
    const params: any[] = [];

    if (filter?.status && filter.status !== 'all') {
      query += ' AND status = ?';
      params.push(filter.status);
    }

    if (filter?.search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ? OR id LIKE ? OR enquiry_type LIKE ?)';
      const s = `%${filter.search}%`;
      params.push(s, s, s, s, s);
    }

    query += ' ORDER BY received_at DESC';

    const [rows]: any = await this.pool.execute(query, params);
    const total = rows.length;

    const offset = filter?.offset || 0;
    const limit = filter?.limit || rows.length;
    const paginated = rows.slice(offset, offset + limit);

    return { leads: paginated, total };
  }

  async getLeadById(id: string): Promise<Lead | null> {
    if (!this.pool) throw new Error('Database pool not initialized');
    const [rows]: any = await this.pool.execute('SELECT * FROM leads WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async createLead(data: Partial<Lead>): Promise<Lead> {
    if (!this.pool) throw new Error('Database pool not initialized');

    const leadId = data.id || `RV-${Date.now().toString().slice(-4)}`;
    const newLead: Lead = {
      id: leadId,
      business_id: data.business_id || 'business-001',
      name: data.name || 'Anonymous Customer',
      email: data.email || 'customer@example.com',
      phone: data.phone || '+91-98765-00000',
      message: data.message || '',
      enquiry_type: data.enquiry_type || 'AC servicing',
      potential_value: Math.max(500, Number(data.potential_value) || 5000),
      status: data.status || 'NEW',
      received_at: data.received_at || new Date().toISOString(),
      last_contacted_at: data.last_contacted_at || null,
      follow_up_count: 0,
      contact_consent: data.contact_consent || 'CONSENTED',
      preferred_channel: data.preferred_channel || 'email',
      booking_status: data.booking_status || 'NOT_BOOKED',
      payment_status: data.payment_status || 'NOT_PAID',
      source: data.source || 'WEBSITE',
      duplicate_of_lead_id: data.duplicate_of_lead_id || null,
      created_at: new Date().toISOString(),
      is_archived: false,
    };

    await this.pool.execute(
      `INSERT INTO leads (
        id, business_id, name, email, phone, message, enquiry_type,
        potential_value, status, received_at, last_contacted_at,
        follow_up_count, contact_consent, preferred_channel,
        booking_status, payment_status, source, duplicate_of_lead_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newLead.id,
        newLead.business_id,
        newLead.name,
        newLead.email,
        newLead.phone,
        newLead.message,
        newLead.enquiry_type,
        newLead.potential_value,
        newLead.status,
        newLead.received_at,
        newLead.last_contacted_at,
        newLead.follow_up_count,
        newLead.contact_consent,
        newLead.preferred_channel,
        newLead.booking_status,
        newLead.payment_status,
        newLead.source,
        newLead.duplicate_of_lead_id,
      ]
    );

    return newLead;
  }

  async updateLead(id: string, updates: Partial<Lead>): Promise<Lead | null> {
    if (!this.pool) throw new Error('Database pool not initialized');
    const existing = await this.getLeadById(id);
    if (!existing) return null;

    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(updates)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      await this.pool.execute(`UPDATE leads SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return this.getLeadById(id);
  }

  async archiveLead(id: string): Promise<{ success: boolean; lead: Lead | null; message: string }> {
    if (!this.pool) throw new Error('Database pool not initialized');
    const lead = await this.getLeadById(id);
    if (!lead) return { success: false, lead: null, message: 'Lead not found' };

    if (lead.payment_status === 'PAID' || lead.status === 'RECOVERED') {
      return { success: false, lead, message: 'Cannot archive converted/paid lead.' };
    }

    await this.pool.execute('UPDATE leads SET is_archived = TRUE WHERE id = ?', [id]);
    const updated = await this.getLeadById(id);
    return { success: true, lead: updated, message: `Lead ${id} archived.` };
  }

  async getTimelineEvents(leadId: string): Promise<any[]> {
    return MOCK_TIMELINE_EVENTS[leadId] || [];
  }

  async getAgentActions(filter?: { status?: string; lead_id?: string }): Promise<AgentAction[]> {
    if (!this.pool) throw new Error('Database pool not initialized');
    let query = 'SELECT * FROM agent_actions WHERE 1=1';
    const params: any[] = [];

    if (filter?.status) {
      query += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter?.lead_id) {
      query += ' AND lead_id = ?';
      params.push(filter.lead_id);
    }
    query += ' ORDER BY created_at DESC';

    const [rows]: any = await this.pool.execute(query, params);
    return rows;
  }

  async getAgentActionById(id: string): Promise<AgentAction | null> {
    if (!this.pool) throw new Error('Database pool not initialized');
    const [rows]: any = await this.pool.execute('SELECT * FROM agent_actions WHERE id = ?', [id]);
    return rows[0] || null;
  }

  async saveAgentAction(action: AgentAction): Promise<AgentAction> {
    if (!this.pool) throw new Error('Database pool not initialized');
    await this.pool.execute(
      `INSERT INTO agent_actions (
        id, lead_id, action_type, status, analysis_json, generated_message,
        approval_requested_at, approved_by, approved_at, rejection_reason,
        executed_at, error_message, trace_json, mode, model
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        approved_by = VALUES(approved_by),
        approved_at = VALUES(approved_at),
        rejection_reason = VALUES(rejection_reason),
        executed_at = VALUES(executed_at),
        error_message = VALUES(error_message)`,
      [
        action.id,
        action.lead_id,
        action.action_type,
        action.status,
        action.analysis_json,
        action.generated_message,
        action.approval_requested_at,
        action.approved_by,
        action.approved_at,
        action.rejection_reason,
        action.executed_at,
        action.error_message,
        JSON.stringify(action.trace || []),
        action.mode,
        action.model,
      ]
    );
    return action;
  }

  async updateAgentAction(id: string, updates: Partial<AgentAction>): Promise<AgentAction | null> {
    if (!this.pool) throw new Error('Database pool not initialized');
    const fields: string[] = [];
    const values: any[] = [];

    for (const [key, val] of Object.entries(updates)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    }

    if (fields.length > 0) {
      values.push(id);
      await this.pool.execute(`UPDATE agent_actions SET ${fields.join(', ')} WHERE id = ?`, values);
    }

    return this.getAgentActionById(id);
  }

  async getAnalyticsSummary(businessId: string): Promise<any> {
    const { leads } = await this.getLeads();
    const inMem = new InMemoryRepository();
    // Use the exact calculated logic on the leads
    return inMem.getAnalyticsSummary(businessId);
  }
}

// Global Repository Singleton
let repositoryInstance: DataRepository | null = null;

export async function getRepository(): Promise<DataRepository> {
  if (repositoryInstance) return repositoryInstance;

  // If DB_HOST is configured, instantiate GoDaddy Hosted MySQL
  if (process.env.DB_HOST && process.env.NODE_ENV === 'production') {
    logger.info(`🐬 [Repository] Connecting to GoDaddy Hosted MySQL database (${process.env.DB_HOST})...`);
    const mysqlRepo = new MySQLRepository();
    await mysqlRepo.init();
    repositoryInstance = mysqlRepo;
    return repositoryInstance;
  }

  // Default to In-Memory canonical repository
  const memRepo = new InMemoryRepository();
  await memRepo.init();
  repositoryInstance = memRepo;
  return repositoryInstance;
}
