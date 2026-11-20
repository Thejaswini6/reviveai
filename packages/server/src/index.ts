/**
 * ReviveAI Server
 * Express.js backend for autonomous revenue recovery agent
 */

import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import { ENV } from './env.js';
import { logger } from './utils/logger.js';
import { getRepository, DataRepository } from './db/repository.js';
import { checkLeadEligibility, validateActionApproval } from './services/eligibility.js';
import { getBusinessProfile } from './services/businessConfig.js';
import { executeRecoveryAnalysis } from './services/recoveryAgent.js';
import { sendRecoveryOutreach, sendContactEmail } from './services/emailService.js';

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
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-owner-key');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
});

// Demo / Owner Authorization for State-Changing Operations
const DEMO_OWNER_KEY = process.env.OWNER_API_KEY || 'reviveai-owner-2026';

function requireOwnerAuth(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  const keyHeader = req.headers['x-owner-key'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (keyHeader as string);

  const origin = (req.headers.origin as string) || (req.headers.referer as string) || '';
  const isDashboardUI = !origin || origin.includes('reviveaiapp.com') || origin.includes('localhost') || origin.includes('127.0.0.1');

  if (token === DEMO_OWNER_KEY || isDashboardUI) {
    return next();
  }

  logger.warn(`🛑 Unauthorized state-changing request blocked to ${req.method} ${req.path}`);
  return res.status(401).json({
    success: false,
    error: 'Unauthorized. Owner authorization required for state-changing operations.',
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

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

// READ: Get all leads (with search & status filters)
app.get('/api/leads', async (req, res) => {
  const { status, search } = req.query;
  const repo = await getRepository();
  const { leads, total } = await repo.getLeads({
    status: typeof status === 'string' ? status : undefined,
    search: typeof search === 'string' ? search : undefined,
  });

  res.json({
    leads,
    total,
    page: 1,
  });
});

// READ: Get single lead detail
app.get('/api/leads/:id', async (req, res) => {
  const { id } = req.params;
  const repo = await getRepository();
  const lead = await repo.getLeadById(id);

  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }

  const timeline = await repo.getTimelineEvents(id);
  const eligibility = checkLeadEligibility(lead as any);

  res.json({
    success: true,
    lead,
    timeline,
    eligibility,
    interactions: [],
    emails: [],
    outcomes: [],
  });
});

// CREATE: Add new customer inquiry / lead (Owner-authorized CRM intake)
const CreateLeadSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email required').max(150),
  phone: z.string().max(25).optional(),
  service: z.string().max(100).optional(),
  potential_value: z.number().min(0).max(1000000).optional(),
  message: z.string().max(2000).optional(),
});

app.post('/api/leads', requireOwnerAuth, async (req, res) => {
  const parsed = CreateLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  }

  const { name, email, phone, service, message, potential_value } = parsed.data;
  const repo = await getRepository();

  const newLead = await repo.createLead({
    name,
    email,
    phone: phone || '+91-98765-00000',
    enquiry_type: service || 'AC servicing',
    potential_value: potential_value || 5000,
    message: message || 'Inbound service request',
    status: 'NEW',
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
  });

  res.status(201).json({
    success: true,
    message: `Customer enquiry ${newLead.id} created successfully.`,
    lead_id: newLead.id,
    lead: newLead,
  });
});

// UPDATE: Edit permitted lead details
const UpdateLeadSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(25).optional(),
  message: z.string().max(2000).optional(),
  enquiry_type: z.string().max(100).optional(),
  potential_value: z.number().min(0).max(1000000).optional(),
  status: z.enum(['NEW', 'STALE', 'CONTACTED', 'RECOVERED', 'ESCALATED', 'DECLINED', 'OPTED_OUT', 'QUOTE_SENT', 'BOOKING_PENDING', 'CALLBACK_REQUESTED', 'CONVERTED']).optional(),
  preferred_channel: z.enum(['email', 'phone']).optional(),
  booking_status: z.enum(['NOT_BOOKED', 'PENDING', 'CONFIRMED']).optional(),
  payment_status: z.enum(['NOT_PAID', 'PAID']).optional(),
});

app.patch('/api/leads/:id', requireOwnerAuth, async (req, res) => {
  const { id } = req.params;
  const parsed = UpdateLeadSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  }

  const repo = await getRepository();
  const existing = await repo.getLeadById(id);
  if (!existing) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }

  // Prevent editing converted or paid records in ways that violate financial audit trails
  if (existing.payment_status === 'PAID' && parsed.data.payment_status === 'NOT_PAID') {
    return res.status(400).json({ success: false, error: 'Cannot revert payment status of a confirmed paid lead.' });
  }

  const updated = await repo.updateLead(id, parsed.data);
  res.json({ success: true, lead: updated });
});

// DELETE: Archive / soft-delete lead
app.delete('/api/leads/:id', requireOwnerAuth, async (req, res) => {
  const { id } = req.params;
  const repo = await getRepository();
  const result = await repo.archiveLead(id);

  if (!result.success) {
    return res.status(400).json({ success: false, error: result.message });
  }

  res.json({ success: true, message: result.message, lead: result.lead });
});

// Trigger AI recovery analysis on a lead
app.post('/api/agent/analyze-lead/:lead_id', requireOwnerAuth, async (req, res) => {
  const { lead_id } = req.params;
  const { force } = req.body || {};
  const repo = await getRepository();
  const lead = await repo.getLeadById(lead_id);

  if (!lead) {
    return res.status(404).json({ success: false, error: 'Lead not found' });
  }

  // Backend Eligibility & Business Safety Check
  const eligibility = checkLeadEligibility(lead as any);
  if (!eligibility.is_eligible) {
    return res.status(400).json({
      success: false,
      error: 'Lead is ineligible for recovery outreach',
      reasons: eligibility.reasons,
      recommended_handling: eligibility.recommended_handling,
      flags: eligibility.flags,
    });
  }

  // Check if pending action exists (unless force requested)
  if (!force) {
    const existingActions = await repo.getAgentActions({ lead_id, status: 'pending' });
    if (existingActions.length > 0) {
      const existing = existingActions[0];
      return res.json({
        success: true,
        action_id: existing.id,
        status: existing.status,
        message: 'Analysis already exists for this lead',
        eligibility,
        analysis: JSON.parse(existing.analysis_json),
        trace: existing.trace,
        mode: existing.mode,
        model: existing.model,
        token_usage: existing.token_usage,
      });
    }
  }

  try {
    const result = await executeRecoveryAnalysis(lead_id);
    res.json({
      success: true,
      action_id: result.action_id,
      status: result.status,
      message: 'Analysis completed successfully',
      eligibility,
      analysis: result.analysis,
      trace: result.trace,
      mode: result.mode,
      model: result.model,
      token_usage: result.token_usage,
      duration_ms: result.duration_ms,
    });
  } catch (error: any) {
    logger.error(`Error analyzing lead ${lead_id}:`, error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze lead',
    });
  }
});

// Get pending agent actions (for approval queue)
app.get('/api/agent/actions', async (req, res) => {
  const { status, lead_id } = req.query;
  const repo = await getRepository();
  const actions = await repo.getAgentActions({
    status: typeof status === 'string' ? status : undefined,
    lead_id: typeof lead_id === 'string' ? lead_id : undefined,
  });

  res.json({
    success: true,
    actions,
    total: actions.length,
  });
});

// Approve an action (Owner-authorized)
app.post('/api/agent/actions/:id/approve', requireOwnerAuth, async (req, res) => {
  const { id } = req.params;
  const repo = await getRepository();
  const action = await repo.getAgentActionById(id);

  if (!action) {
    return res.status(404).json({ success: false, error: 'Action not found' });
  }

  const lead = await repo.getLeadById(action.lead_id);
  if (!lead) {
    return res.status(404).json({ success: false, error: 'Target lead not found for this action' });
  }

  const approvalCheck = validateActionApproval(lead as any);
  if (!approvalCheck.allowed) {
    return res.status(400).json({
      success: false,
      error: approvalCheck.error || 'Approval blocked by business safety policy',
    });
  }

  // Update action state
  action.status = 'approved';
  action.approved_by = 'user-001';
  action.approved_at = new Date().toISOString();
  action.executed_at = new Date().toISOString();
  await repo.saveAgentAction(action);

  // Update lead state
  await repo.updateLead(lead.id, {
    status: 'CONTACTED',
    last_contacted_at: new Date().toISOString(),
    follow_up_count: (lead.follow_up_count || 0) + 1,
  });

  // Simulated email dispatch record (CRITICAL: synthetic demo leads never receive real outbound mail)
  let subject = 'Follow-up regarding your service request';
  try {
    const analysis = JSON.parse(action.analysis_json || '{}');
    if (analysis.recovery_message?.subject) {
      subject = analysis.recovery_message.subject;
    }
  } catch {
    // fallback
  }

  const emailResult = await sendRecoveryOutreach({
    to: lead.email,
    customerName: lead.name,
    subject,
    body: action.generated_message,
  });

  res.json({
    success: true,
    action,
    email_log: {
      id: emailResult.messageId,
      status: 'simulated',
      sent_at: new Date().toISOString(),
      recipient: lead.email,
      channel: 'email (simulated)',
    },
  });
});

// Reject an action (Owner-authorized)
app.post('/api/agent/actions/:id/reject', requireOwnerAuth, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const repo = await getRepository();
  const action = await repo.getAgentActionById(id);

  if (!action) {
    return res.status(404).json({ success: false, error: 'Action not found' });
  }

  action.status = 'rejected';
  action.rejection_reason = reason || 'Rejected by user';
  await repo.saveAgentAction(action);

  res.json({
    success: true,
    message: 'Action rejected',
  });
});

// Rate limiter map for public contact form (max 10 requests per 10 minutes per IP)
const contactRateLimits = new Map<string, { count: number; resetAt: number }>();

// Public Contact Form Endpoint (Sends message directly to thejaswini@reviveaiapp.com)
// Uses GoDaddy Node.js Email Gateway (http://127.0.0.1:2525/api/email/send) via sendEmail() helper
const ContactFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Valid email is required').max(150),
  subject: z.string().max(200).optional(),
  message: z.string().min(1, 'Message is required').max(5000),
});

app.post('/api/contact', async (req, res) => {
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const rateLimitWindow = 10 * 60 * 1000; // 10 minutes
  const maxRequests = 10;

  const clientLimit = contactRateLimits.get(clientIp);
  if (clientLimit && now < clientLimit.resetAt) {
    if (clientLimit.count >= maxRequests) {
      logger.warn(`⚠️ Rate limit exceeded for contact form from IP: ${clientIp}`);
      return res.status(429).json({
        success: false,
        error: 'Too many messages sent. Please wait a few minutes before trying again.',
      });
    }
    clientLimit.count += 1;
  } else {
    contactRateLimits.set(clientIp, { count: 1, resetAt: now + rateLimitWindow });
  }

  const parsed = ContactFormSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.errors[0].message });
  }

  const { name, email, subject, message } = parsed.data;

  // Dispatch email to fixed domain mailbox (thejaswini@reviveaiapp.com)
  const delivery = await sendContactEmail({
    name: name.trim(),
    email: email.trim(),
    subject: subject?.trim() || 'General Inquiry',
    message: message.trim(),
  });

  res.json({
    success: true,
    message: 'Thank you! Your message has been sent to our team at thejaswini@reviveaiapp.com.',
    delivery: {
      recipient: delivery.recipient,
      channel: delivery.channel,
      status: delivery.success ? 'sent' : 'logged',
    },
  });
});

// Trustworthy Analytics Summary with Explicit Conversion Metrics
app.get('/api/analytics/summary', async (req, res) => {
  const businessId = (req.query.business_id as string) || ENV.DEFAULT_BUSINESS_ID || 'business-001';
  const repo = await getRepository();
  const summary = await repo.getAnalyticsSummary(businessId);
  res.json(summary);
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

// Server startup
async function start() {
  try {
    const repo = await getRepository();
    await repo.init();
    logger.info('✅ Database repository initialized');

    const port = ENV.PORT;
    app.listen(port, () => {
      logger.info(`🚀 Server running on port ${port}`);
      logger.info(`📊 Environment: ${ENV.NODE_ENV}`);
      logger.info(`🤖 Mock mode: ${ENV.MOCK_MODE}`);
      logger.info(`🔑 Claude model: ${ENV.ANTHROPIC_MODEL}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully...');
  process.exit(0);
});

start();

export default app;
