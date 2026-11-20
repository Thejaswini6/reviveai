/**
 * ReviveAI Server
 * Express.js backend for autonomous revenue recovery agent
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, closeDb } from './db/init.js';
import { ENV } from './env.js';
import { logger } from './utils/logger.js';
import { MOCK_LEADS, MOCK_AGENT_ACTIONS, MOCK_TIMELINE_EVENTS } from './data/mockData.js';
import { checkLeadEligibility, validateActionApproval } from './services/eligibility.js';
import { getBusinessProfile } from './services/businessConfig.js';
import { generateIndustryAdaptiveAnalysis } from './services/agentPrompts.js';
import { executeRecoveryAnalysis } from './services/recoveryAgent.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware — body size limit prevents large-payload DoS attacks
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// CORS
app.use((req, res, next) => {
  const allowedOrigins = ENV.CORS_ORIGIN.split(',').map((o) => o.trim());
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
// API root
app.get('/api', (req, res) => {
  res.json({
    name: 'ReviveAI Server',
    version: '0.1.0',
    environment: ENV.NODE_ENV,
    mockMode: ENV.MOCK_MODE,
  });
});

// Get business configuration profile
app.get('/api/business/profile', (req, res) => {
  const businessId = (req.query.business_id as string) || ENV.DEFAULT_BUSINESS_ID || 'business-001';
  const profile = getBusinessProfile(businessId);
  res.json({
    success: true,
    profile,
  });
});

// Get all leads (with optional status filter)
app.get('/api/leads', (req, res) => {
  const { status } = req.query;
  
  let leads = [...MOCK_LEADS];
  
  // Filter by status if provided
  if (status && status !== 'all') {
    leads = leads.filter(lead => lead.status === status);
  }
  
  res.json({
    leads,
    total: leads.length,
    page: 1
  });
});

// Get single lead detail
app.get('/api/leads/:id', (req, res) => {
  const { id } = req.params;
  const lead = MOCK_LEADS.find(l => l.id === id);
  
  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }
  
  const timeline = MOCK_TIMELINE_EVENTS[id] || [];
  const eligibility = checkLeadEligibility(lead);
  
  res.json({
    success: true,
    lead,
    timeline,
    eligibility,
    interactions: [],
    emails: [],
    outcomes: []
  });
});

// Trigger AI recovery analysis on a lead using Claude Agent (or deterministic simulated agent in mock mode)
app.post('/api/agent/analyze-lead/:lead_id', async (req, res) => {
  const { lead_id } = req.params;
  const { force } = req.body || {};
  const lead = MOCK_LEADS.find(l => l.id === lead_id);
  
  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }
  
  // Backend Eligibility & Business Safety Check (Always enforced before agent execution)
  const eligibility = checkLeadEligibility(lead);
  if (!eligibility.is_eligible) {
    return res.status(400).json({ 
      success: false, 
      error: 'Lead is ineligible for recovery outreach',
      reasons: eligibility.reasons,
      recommended_handling: eligibility.recommended_handling,
      flags: eligibility.flags
    });
  }
  
  // Check if pending action already exists for this lead (unless force requested)
  if (!force) {
    const existingAction = MOCK_AGENT_ACTIONS.find(a => a.lead_id === lead_id && a.status === 'pending');
    if (existingAction) {
      return res.json({
        success: true,
        action_id: existingAction.id,
        status: existingAction.status,
        message: 'Analysis already exists for this lead',
        eligibility,
        analysis: JSON.parse(existingAction.analysis_json),
        trace: existingAction.trace,
        mode: existingAction.mode,
        model: existingAction.model,
        token_usage: existingAction.token_usage
      });
    }
  }

  try {
    const result = await executeRecoveryAnalysis(lead_id);
    res.json({
      success: true,
      action_id: result.action_id,
      status: result.status,
      message: 'Analysis complete. Approval required.',
      eligibility: result.eligibility,
      analysis: result.analysis,
      trace: result.trace,
      mode: result.mode,
      model: result.model,
      token_usage: result.token_usage,
      duration_ms: result.duration_ms
    });
  } catch (err: any) {
    logger.error(`Error analyzing lead ${lead_id}:`, err);
    res.status(500).json({
      success: false,
      error: err.message || 'Failed to analyze lead'
    });
  }
});

// Get pending agent actions
app.get('/api/agent/actions', (req, res) => {
  const { status } = req.query;
  
  let actions = [...MOCK_AGENT_ACTIONS];
  
  if (status) {
    actions = actions.filter(a => a.status === status);
  }
  
  res.json({
    actions,
    total: actions.length
  });
});

// Approve an action (re-checks safety rules before execution)
app.post('/api/agent/actions/:id/approve', (req, res) => {
  const { id } = req.params;
  const action = MOCK_AGENT_ACTIONS.find(a => a.id === id);
  
  if (!action) {
    return res.status(404).json({ success: false, error: 'Action not found' });
  }

  // Pre-execution safety re-check
  const lead = MOCK_LEADS.find(l => l.id === action.lead_id);
  if (!lead) {
    return res.status(404).json({ success: false, error: 'Target lead not found for this action' });
  }

  const approvalCheck = validateActionApproval(lead);
  if (!approvalCheck.allowed) {
    return res.status(400).json({
      success: false,
      error: approvalCheck.error || 'Approval blocked by business safety policy'
    });
  }
  
  // Update action status
  action.status = 'approved';
  action.approved_by = 'user-001';
  action.approved_at = new Date().toISOString();
  action.executed_at = new Date().toISOString();
  
  // Update lead status
  lead.status = 'CONTACTED';
  lead.last_contacted_at = new Date().toISOString();
  lead.follow_up_count += 1;
  
  res.json({
    success: true,
    action,
    email_log: {
      id: `email-${Date.now()}`,
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipient: lead.email,
      channel: 'email (simulated)'
    }
  });
});

// Reject an action
app.post('/api/agent/actions/:id/reject', (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const action = MOCK_AGENT_ACTIONS.find(a => a.id === id);
  
  if (!action) {
    return res.status(404).json({ success: false, error: 'Action not found' });
  }
  
  action.status = 'rejected';
  action.rejection_reason = reason || 'Rejected by user';
  
  res.json({
    success: true,
    message: 'Action rejected'
  });
});

// Trustworthy Analytics Summary with Industry-Independent Metrics
app.get('/api/analytics/summary', (req, res) => {
  const businessId = (req.query.business_id as string) || ENV.DEFAULT_BUSINESS_ID || 'business-001';
  const business = getBusinessProfile(businessId);

  const total_leads = MOCK_LEADS.length;
  const new_leads = MOCK_LEADS.filter(l => l.status === 'NEW').length;
  const stale_leads = MOCK_LEADS.filter(l => l.status === 'STALE').length;
  const contacted_leads = MOCK_LEADS.filter(l => l.status === 'CONTACTED').length;
  
  // 1. Confirmed Recovered Leads & Revenue (Only explicitly confirmed paid conversions)
  const recoveredLeadsList = MOCK_LEADS.filter(
    l => (l.status === 'RECOVERED' || l.status === 'CONVERTED') && l.payment_status === 'PAID'
  );
  const recovered_leads = recoveredLeadsList.length;
  const confirmed_recovered_revenue = recoveredLeadsList.reduce((sum, l) => sum + (l.potential_value || 0), 0);

  // 2. Gross Open Pipeline Value: Active inquiries excluding already paid, declined, opted-out, & duplicates
  const gross_open_pipeline_value = MOCK_LEADS
    .filter(l => 
      l.payment_status !== 'PAID' && 
      l.status !== 'RECOVERED' && 
      l.status !== 'CONVERTED' && 
      l.status !== 'DECLINED' && 
      l.contact_consent !== 'OPTED_OUT' && 
      !l.duplicate_of_lead_id
    )
    .reduce((sum, l) => sum + (l.potential_value || 0), 0);
  
  // 3. Eligible Recovery Opportunity: Strictly inactive leads passing ALL safety rules (consent confirmed, non-duplicate, non-cooldown, non-complaint)
  const eligibleLeadsList = MOCK_LEADS.filter(l => checkLeadEligibility(l).is_eligible);
  const eligible_inactive_leads = eligibleLeadsList.length;
  const eligible_recovery_opportunity = eligibleLeadsList.reduce((sum, l) => sum + (l.potential_value || 0), 0);
  
  const recovery_rate_percent = total_leads > 0 
    ? Math.round((recovered_leads / total_leads) * 100 * 10) / 10 
    : 0;
  
  const pending_approvals = MOCK_AGENT_ACTIONS.filter(a => a.status === 'pending').length;
  const emails_sent = MOCK_AGENT_ACTIONS.filter(a => a.status === 'approved').length;
  
  res.json({
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
    // Clarified Three-Tier Revenue Architecture:
    gross_open_pipeline_value,
    eligible_recovery_opportunity,
    confirmed_recovered_revenue,
    // Maintained UI Compatibility Keys:
    total_revenue_at_risk: gross_open_pipeline_value,
    recovered_revenue: confirmed_recovered_revenue,
    recovery_rate_percent,
    pending_approvals,
    emails_sent,
    data_provider: 'canonical_in_memory_reconciled'
  });
});

// Mount agent catch-all (Phase 4-5 placeholder for other agent endpoints)
app.use('/api/agent', (req, res) => {
  res.status(501).json({
    success: false,
    error: 'Not implemented',
    message: 'Agent endpoints will be implemented in Phase 4-5',
  });
});

// Static files — serve React production assets whenever client dist exists
const staticPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(staticPath)) {
  logger.info(`📁 Serving static assets from ${staticPath}`);
  app.use(express.static(staticPath));

  app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  // SPA fallback for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  logger.warn(`⚠️ Client static path not found at ${staticPath} — React frontend will not be served`);
}

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: ENV.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
  });
});

// Server startup
async function start() {
  try {
    // Initialize database
    if (!ENV.MOCK_MODE) {
      await initDb();
      logger.info('✅ Database initialized');
    } else {
      logger.info('🤖 Mock mode active - using in-memory mock data store');
    }

    // Start server
    const port = ENV.PORT;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📊 Environment: ${ENV.NODE_ENV}`);
      logger.info(`🤖 Mock mode: ${ENV.MOCK_MODE}`);
      logger.info(`🔑 Claude model: ${ENV.ANTHROPIC_MODEL}`);
      logger.info(`📦 Mock data loaded: ${MOCK_LEADS.length} leads`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  closeDb();
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  closeDb();
  process.exit(0);
});

start();

export default app;
