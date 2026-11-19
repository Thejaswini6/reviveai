/**
 * ReviveAI Server
 * Express.js backend for autonomous revenue recovery agent
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, closeDb } from './db/init.js';
import { ENV } from './env.js';
import { logger } from './utils/logger.js';
import { MOCK_LEADS, MOCK_AGENT_ACTIONS, MOCK_TIMELINE_EVENTS } from './data/mockData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
app.get('/api', (req, res) => {
  res.json({
    name: 'ReviveAI Server',
    version: '0.1.0',
    environment: ENV.NODE_ENV,
    mockMode: ENV.MOCK_MODE,
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
  
  res.json({
    lead,
    timeline,
    interactions: [],
    emails: [],
    outcomes: []
  });
});

// Trigger AI analysis on a lead
app.post('/api/agent/analyze-lead/:lead_id', (req, res) => {
  const { lead_id } = req.params;
  const lead = MOCK_LEADS.find(l => l.id === lead_id);
  
  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }
  
  // Check if lead is eligible for analysis
  if (lead.contact_consent === 'OPTED_OUT') {
    return res.status(400).json({ 
      success: false, 
      error: 'Cannot analyze opted-out lead' 
    });
  }
  
  if (lead.status === 'DECLINED') {
    return res.status(400).json({ 
      success: false, 
      error: 'Cannot analyze declined lead' 
    });
  }
  
  // Check if action already exists for this lead
  const existingAction = MOCK_AGENT_ACTIONS.find(a => a.lead_id === lead_id);
  
  if (existingAction) {
    return res.json({
      success: true,
      action_id: existingAction.id,
      status: existingAction.status,
      message: 'Analysis already exists for this lead',
      analysis: JSON.parse(existingAction.analysis_json)
    });
  }
  
  // Create new mock action
  const newAction = {
    id: `action-${Date.now()}`,
    lead_id: lead.id,
    lead_name: lead.name,
    action_type: 'analysis',
    status: 'pending',
    analysis_json: JSON.stringify({
      lead_id: lead.id,
      priority: 'medium',
      customer_intent: `Customer interested in ${lead.enquiry_type}`,
      likely_reason_for_inactivity: 'Customer may be comparing options or waiting for response',
      evidence: [
        `Inquiry received ${Math.floor((Date.now() - new Date(lead.received_at).getTime()) / (1000 * 60 * 60 * 24))} days ago`,
        `Potential value: ₹${lead.potential_value}`,
        `No follow-ups yet`
      ],
      uncertainty: 'Customer interest level unknown',
      recommended_action: 'email',
      suggested_channel: 'email',
      email_subject: `Follow-up: Your ${lead.enquiry_type} Inquiry`,
      email_body: `Hi ${lead.name.split(' ')[0]},\n\nI wanted to follow up on your recent inquiry about ${lead.enquiry_type}.\n\nWe'd love to help you with this. Our team is ready to assist.\n\nCould we schedule a convenient time to discuss your requirements?\n\nBest regards,\nCoolCare AC Services`,
      requires_human_approval: true
    }),
    generated_message: `Hi ${lead.name.split(' ')[0]},\n\nI wanted to follow up on your recent inquiry about ${lead.enquiry_type}.\n\nWe'd love to help you with this. Our team is ready to assist.\n\nCould we schedule a convenient time to discuss your requirements?\n\nBest regards,\nCoolCare AC Services`,
    approval_requested_at: new Date().toISOString(),
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    executed_at: null,
    error_message: null,
    created_at: new Date().toISOString()
  };
  
  MOCK_AGENT_ACTIONS.push(newAction as any);
  
  res.json({
    success: true,
    action_id: newAction.id,
    status: 'pending',
    message: 'Analysis complete. Approval required.',
    analysis: JSON.parse(newAction.analysis_json)
  });
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

// Approve an action
app.post('/api/agent/actions/:id/approve', (req, res) => {
  const { id } = req.params;
  const action = MOCK_AGENT_ACTIONS.find(a => a.id === id);
  
  if (!action) {
    return res.status(404).json({ success: false, error: 'Action not found' });
  }
  
  // Update action status
  action.status = 'approved';
  action.approved_by = 'user-001';
  action.approved_at = new Date().toISOString();
  action.executed_at = new Date().toISOString();
  
  // Update lead status
  const lead = MOCK_LEADS.find(l => l.id === action.lead_id);
  if (lead) {
    lead.status = 'CONTACTED';
    lead.last_contacted_at = new Date().toISOString();
    lead.follow_up_count += 1;
  }
  
  res.json({
    success: true,
    action,
    email_log: {
      id: `email-${Date.now()}`,
      status: 'sent',
      sent_at: new Date().toISOString()
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

// Analytics summary
app.get('/api/analytics/summary', (req, res) => {
  const total_leads = MOCK_LEADS.length;
  const new_leads = MOCK_LEADS.filter(l => l.status === 'NEW').length;
  const stale_leads = MOCK_LEADS.filter(l => l.status === 'STALE').length;
  const contacted_leads = MOCK_LEADS.filter(l => l.status === 'CONTACTED').length;
  const recovered_leads = MOCK_LEADS.filter(l => l.status === 'RECOVERED').length;
  
  const total_revenue_at_risk = MOCK_LEADS
    .filter(l => l.status === 'STALE' || l.status === 'NEW')
    .reduce((sum, l) => sum + l.potential_value, 0);
  
  const recovered_revenue = MOCK_LEADS
    .filter(l => l.status === 'RECOVERED' && l.payment_status === 'PAID')
    .reduce((sum, l) => sum + l.potential_value, 0);
  
  const recovery_rate_percent = total_leads > 0 
    ? (recovered_leads / total_leads) * 100 
    : 0;
  
  const pending_approvals = MOCK_AGENT_ACTIONS.filter(a => a.status === 'pending').length;
  const emails_sent = MOCK_AGENT_ACTIONS.filter(a => a.status === 'approved').length;
  
  res.json({
    total_leads,
    new_leads,
    stale_leads,
    contacted_leads,
    recovered_leads,
    total_revenue_at_risk,
    recovered_revenue,
    recovery_rate_percent,
    pending_approvals,
    emails_sent
  });
});

// Static files (production)
if (ENV.NODE_ENV === 'production') {
  const staticPath = path.join(__dirname, '../../client/dist');
  app.use(express.static(staticPath));

  app.get('/', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });

  // SPA fallback
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
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
    await initDb();
    logger.info('✅ Database initialized');

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
