# ReviveAI – Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     REVIVEAI ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  FRONTEND (React + Vite)                                 │   │
│  │  ┌─────────────┬────────────────┬──────────────────┐     │   │
│  │  │ Dashboard   │ Lead Detail    │ Approval Queue   │     │   │
│  │  └─────────────┴────────────────┴──────────────────┘     │   │
│  │         │              │                  │              │   │
│  │         └──────────────┼──────────────────┘              │   │
│  │                        ↓                                 │   │
│  │         API Client (TypeScript)                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          ↕ HTTP/JSON                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  BACKEND (Express + TypeScript)                          │   │
│  │  ┌─────────────────────────────────────────────────────┐ │   │
│  │  │ API Routes (leads, agent actions, analytics)        │ │   │
│  │  ├─────────────────────────────────────────────────────┤ │   │
│  │  │ Agent Orchestrator (Claude Integration)             │ │   │
│  │  │ ├─ Safety Checks (opted-out, declined, paid, etc.)  │ │   │
│  │  │ ├─ Claude API Wrapper (Haiku 4.5, mock mode)        │ │   │
│  │  │ ├─ Tool Handlers (6 core tools)                     │ │   │
│  │  │ └─ Structured Output Validation (Zod)               │ │   │
│  │  ├─────────────────────────────────────────────────────┤ │   │
│  │  │ Services                                             │ │   │
│  │  │ ├─ Email Adapter (mock → real SMTP)                 │ │   │
│  │  │ ├─ Approval Workflow                                │ │   │
│  │  │ ├─ Recovery Calculations                            │ │   │
│  │  │ └─ Audit Trail Logging                              │ │   │
│  │  ├─────────────────────────────────────────────────────┤ │   │
│  │  │ Database Layer (SQLite)                             │ │   │
│  │  │ ├─ businesses table                                 │ │   │
│  │  │ ├─ leads table                                      │ │   │
│  │  │ ├─ agent_actions table                              │ │   │
│  │  │ ├─ email_logs table                                 │ │   │
│  │  │ └─ outcomes table                                   │ │   │
│  │  └─────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ EXTERNAL SERVICES                                        │   │
│  │ ├─ Claude API (Anthropic)                               │   │
│  │ └─ Email SMTP (GoDaddy domain, P1)                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Model

### Businesses Table
```sql
CREATE TABLE businesses (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  website TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```
**Purpose:** Multi-tenant support (future: multiple businesses in one instance)

### Leads Table
```sql
CREATE TABLE leads (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  enquiry_type TEXT,  -- 'inquiry', 'quotation', 'booking', 'callback', 'decline', 'complaint'
  potential_value DECIMAL,
  status TEXT,  -- 'new', 'stale', 'contacted', 'recovered', 'escalated', 'declined'
  received_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_contacted_at DATETIME,
  opted_out BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (business_id) REFERENCES businesses(id)
);
```
**Purpose:** Core lead record with status tracking

### Agent Actions Table
```sql
CREATE TABLE agent_actions (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  action_type TEXT,  -- 'analysis', 'approval_requested', 'email_sent', 'follow_up_scheduled'
  status TEXT,  -- 'pending', 'approved', 'rejected', 'completed', 'failed'
  
  -- Analysis results (from Claude)
  analysis_json TEXT,  -- Structured: { priority, customer_intent, inactivity_reason, etc. }
  generated_message TEXT,
  
  -- Approval workflow
  approval_requested_at DATETIME,
  approved_by TEXT,  -- user ID or 'system'
  approved_at DATETIME,
  rejection_reason TEXT,
  
  -- Execution
  executed_at DATETIME,
  error_message TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id)
);
```
**Purpose:** Audit trail for all agent actions

### Email Logs Table
```sql
CREATE TABLE email_logs (
  id TEXT PRIMARY KEY,
  action_id TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  subject TEXT,
  body TEXT,
  sent_at DATETIME,
  status TEXT,  -- 'sent', 'failed', 'bounced', 'pending'
  error TEXT,
  
  FOREIGN KEY (action_id) REFERENCES agent_actions(id)
);
```
**Purpose:** Track email delivery and failures

### Outcomes Table
```sql
CREATE TABLE outcomes (
  id TEXT PRIMARY KEY,
  lead_id TEXT NOT NULL,
  action_id TEXT NOT NULL,
  outcome TEXT,  -- 'replied', 'booked', 'purchased', 'unsubscribed', 'unknown'
  recovered_value DECIMAL,
  notes TEXT,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (lead_id) REFERENCES leads(id),
  FOREIGN KEY (action_id) REFERENCES agent_actions(id)
);
```
**Purpose:** Track recovery success

---

## API Endpoints

### Lead Management

#### GET /api/leads
**List all leads with filters**
```typescript
// Query params
{
  status?: 'new' | 'stale' | 'contacted' | 'recovered' | 'escalated' | 'declined'
  days_old_min?: number
  days_old_max?: number
  sort_by?: 'received_at' | 'revenue' | 'status'
  page?: number
  limit?: number
}

// Response
{
  leads: Lead[]
  total: number
  page: number
}
```

#### GET /api/leads/:id
**Get lead detail with full history**
```typescript
// Response
{
  lead: Lead
  interactions: AgentAction[]
  emails: EmailLog[]
  outcomes: Outcome[]
  timeline: TimelineEvent[]
}
```

#### PATCH /api/leads/:id
**Update lead (status, opt-out, etc.)**
```typescript
// Body
{
  status?: string
  opted_out?: boolean
  notes?: string
}

// Response
{ success: true, lead: Lead }
```

#### POST /api/leads/:id/opt-out
**Mark lead as opted-out**
```typescript
// Response
{ success: true }
```

### Agent Analysis

#### POST /api/agent/analyze-lead/:lead_id
**Trigger Claude analysis on a lead**
```typescript
// Response
{
  action_id: string
  status: 'pending' | 'approved' | 'rejected'
  analysis: {
    lead_id: string
    priority: 'high' | 'medium' | 'low'
    customer_intent: string
    likely_reason_for_inactivity: string
    evidence: string[]
    uncertainty: string
    recommended_action: string
    suggested_channel: 'email' | 'phone' | 'sms'
    email_subject: string
    email_body: string
    requires_human_approval: true
  }
  tokens_used: {
    input: number
    output: number
    estimated_cost_usd: number
  }
}
```

#### GET /api/agent/actions
**List pending approvals**
```typescript
// Response
{
  actions: AgentAction[]
  total: number
}
```

#### POST /api/agent/actions/:id/approve
**Approve and execute action**
```typescript
// Body
{ override_reason?: string }

// Response
{
  success: true
  action: AgentAction
  email_log: EmailLog
}
```

#### POST /api/agent/actions/:id/reject
**Reject message**
```typescript
// Body
{ reason: string }

// Response
{ success: true }
```

### Analytics

#### GET /api/analytics/summary
**Dashboard summary metrics**
```typescript
// Response
{
  total_leads: number
  new_leads: number
  stale_leads: number
  total_revenue_at_risk: number
  recovery_rate_percent: number
  pending_approvals: number
  emails_sent: number
}
```

#### GET /api/analytics/timeline
**Activity timeline**
```typescript
// Query params
{ days: number = 30 }

// Response
{
  events: {
    date: string
    actions: number
    emails_sent: number
    revenue_recovered: number
  }[]
}
```

---

## Agent Design

### Single Agent Architecture

ReviveAI uses one well-defined agent with clear tool boundaries (not multi-agent).

### Tool Definitions

The agent has 6 core tools:

#### 1. fetch_lead_context
```typescript
{
  name: 'fetch_lead_context',
  description: 'Get detailed context for a lead',
  input_schema: {
    properties: {
      lead_id: { type: 'string', description: 'Lead UUID' }
    }
  }
}

// Returns: { lead, past_interactions, relevant_dates }
```

#### 2. get_interaction_history
```typescript
{
  name: 'get_interaction_history',
  description: 'Retrieve all past agent actions and emails for a lead',
  input_schema: {
    properties: {
      lead_id: { type: 'string' }
    }
  }
}

// Returns: AgentAction[]
```

#### 3. calculate_revenue_at_risk
```typescript
{
  name: 'calculate_revenue_at_risk',
  description: 'Calculate potential value of a lead based on type and age',
  input_schema: {
    properties: {
      lead_id: { type: 'string' }
    }
  }
}

// Returns: { lead_id, value, confidence }
```

#### 4. create_recovery_recommendation
```typescript
{
  name: 'create_recovery_recommendation',
  description: 'Analyze lead and recommend recovery strategy',
  input_schema: {
    properties: {
      lead_id: { type: 'string' },
      analysis_context: { type: 'object' }
    }
  }
}

// Returns: { strategy, tone, channel, priority }
```

#### 5. generate_recovery_message
```typescript
{
  name: 'generate_recovery_message',
  description: 'Create personalized recovery message (email)',
  input_schema: {
    properties: {
      lead_id: { type: 'string' },
      strategy: { type: 'string' },
      tone: { type: 'string' }
    }
  }
}

// Returns: { subject, body, fallback_if_rejected }
```

#### 6. request_approval
```typescript
{
  name: 'request_approval',
  description: 'Submit message for human review (does NOT send)',
  input_schema: {
    properties: {
      lead_id: { type: 'string' },
      message: { type: 'string' },
      strategy_summary: { type: 'string' }
    }
  }
}

// Returns: { action_id, status: 'pending_approval' }
```

### Claude Analysis Workflow

```
1. User clicks "Trigger Analysis" on stale lead
   ↓
2. Backend runs deterministic checks:
   - Opted-out? → skip
   - Declined? → skip
   - Already paid? → skip
   - Duplicate? → skip
   - Too recent? → skip
   - Already analyzed recently? → return cached result
   ↓
3. Safe to proceed → call Claude
   ↓
4. Claude calls tools (fetch_lead_context, get_interaction_history, etc.)
   ↓
5. Claude generates structured JSON:
   {
     lead_id,
     priority,
     customer_intent,
     likely_reason_for_inactivity,
     evidence,
     uncertainty,
     recommended_action,
     suggested_channel,
     email_subject,
     email_body,
     requires_human_approval: true
   }
   ↓
6. Backend validates output with Zod
   ↓
7. Backend creates AgentAction (status: pending_approval)
   ↓
8. Frontend shows in Approval Queue
   ↓
9. User approves → call POST /api/agent/actions/:id/approve
   ↓
10. Backend sends email (mock or real) and logs result
   ↓
11. Timeline updated, lead status → contacted
```

### Safety Checks (Deterministic, TypeScript)

**Before Claude is called, verify:**
- ✅ Lead exists and is in stale status
- ✅ Lead not opted-out
- ✅ Lead not declined
- ✅ Lead not already paid/converted
- ✅ Lead not a duplicate
- ✅ Lead >3 days old
- ✅ Lead not analyzed in past 24 hours (cache hit)
- ✅ Enquiry type appropriate for follow-up (not 'complaint' or 'manual_callback')

**If any check fails:** Return error or skip, no Claude call.

### Structured Output (Zod Validation)

```typescript
const AnalysisSchema = z.object({
  lead_id: z.string().uuid(),
  priority: z.enum(['high', 'medium', 'low']),
  customer_intent: z.string().min(1).max(200),
  likely_reason_for_inactivity: z.string().min(1).max(300),
  evidence: z.array(z.string()).min(1),
  uncertainty: z.string().min(0).max(200),
  recommended_action: z.enum(['email', 'phone_call', 'escalate']),
  suggested_channel: z.enum(['email', 'phone', 'sms']),
  email_subject: z.string().min(5).max(100),
  email_body: z.string().min(50).max(1000),
  requires_human_approval: z.boolean().default(true),
});
```

Claude output parsed and validated before use. If validation fails, error logged and user notified.

---

## Claude Integration

### Model: Claude Haiku 4.5
- **Why:** Cost-optimized, fast, sufficient for lead analysis
- **Max output tokens:** 500
- **Temperature:** 0.7 (balanced creativity and consistency)

### Modes

#### Mock Mode (Default)
```typescript
// MOCK_MODE=true in .env
// Returns deterministic outputs per lead
// Zero API calls, zero cost
// Used during development and testing
```

#### Real Mode
```typescript
// MOCK_MODE=false + valid ANTHROPIC_API_KEY
// Real Claude API calls
// Tokens tracked and logged
// Estimated cost calculated
```

### Token Tracking

Each request logs:
```typescript
{
  request_id: string
  lead_id: string
  model: string
  input_tokens: number
  output_tokens: number
  total_tokens: number
  estimated_cost_usd: number  // Based on Anthropic pricing
  timestamp: datetime
}
```

Sum tracked in claude-budget.md to stay within $50 limit.

### Error Handling

```
Claude API Error
  ↓
Log error + retry once with exponential backoff
  ↓
If still fails → Return to user as "Analysis unavailable"
  ↓
User can manually review lead and create message
```

---

## Email Adapter

### Mock Mode (P0)
```typescript
// Mock adapter
send(to: string, subject: string, body: string) {
  console.log(`[MOCK EMAIL] To: ${to}`)
  console.log(`Subject: ${subject}`)
  console.log(`Body: ${body}`)
  
  // Log to database
  emailLog = {
    status: 'sent',
    sent_at: now()
  }
  
  return { id, status: 'sent' }
}
```

### Real Mode (P1)
```typescript
// Real SMTP adapter (via GoDaddy domain mailbox)
send(to: string, subject: string, body: string) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,      // mail.yourdomain.com
    port: process.env.SMTP_PORT,      // 587
    secure: true,
    auth: {
      user: process.env.SMTP_USER,    // support@yourdomain.com
      pass: process.env.SMTP_PASSWORD
    }
  })
  
  return transporter.sendMail({
    from: process.env.SMTP_FROM,
    to,
    subject,
    html: body
  })
}
```

---

## Deployment Architecture

### Local Development
```bash
# Backend: ts-node auto-reload, port 5000
# Frontend: Vite dev server, port 5173
pnpm run dev
```

### Production Build
```bash
# 1. Build frontend (React → static files)
cd packages/client && pnpm run build

# 2. Build backend (TypeScript → JavaScript)
cd packages/server && pnpm run build

# 3. Express serves frontend + API
PORT=5000 pnpm run start
```

### GoDaddy Hosting
- Node.js runtime
- Listens on `process.env.PORT`
- SQLite DB persisted to disk (writable filesystem required)
- Environment variables configured in GoDaddy panel
- No hardcoded secrets in code

---

## Directory Structure

```
packages/server/
├── src/
│   ├── index.ts                      # Express app
│   ├── env.ts                        # Environment validation
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript types
│   ├── db/
│   │   ├── schema.ts                 # SQLite schema
│   │   ├── init.ts                   # Database initialization
│   │   └── queries.ts                # Query helpers
│   ├── api/
│   │   ├── leads.ts                  # Lead CRUD routes
│   │   ├── contact.ts                # Public contact form (P1)
│   │   ├── agent.ts                  # Agent action routes
│   │   ├── analytics.ts              # Analytics routes
│   │   └── middleware.ts             # Auth, CORS, logging
│   ├── agent/
│   │   ├── orchestrator.ts           # Main agentic loop
│   │   ├── tools.ts                  # Tool definitions & handlers
│   │   ├── claude.ts                 # Claude API wrapper
│   │   ├── prompts.ts                # Claude system prompts
│   │   └── mock.ts                   # Mock agent
│   ├── services/
│   │   ├── email.ts                  # Email adapter (mock + real)
│   │   ├── approval.ts               # Approval workflow
│   │   ├── recovery.ts               # Revenue calculations
│   │   └── audit.ts                  # Audit logging
│   └── utils/
│       ├── logger.ts                 # Logging
│       ├── errors.ts                 # Error types
│       ├── dates.ts                  # Date helpers
│       └── validators.ts             # Zod schemas
├── data/
│   └── reviveai_demo_leads.csv        # 10 demo leads (user-provided)
├── scripts/
│   └── seed.ts                       # db:seed script
├── migrations/
│   └── 001_initial_schema.sql        # Initial migration
├── tests/
│   ├── setup.ts                      # Test configuration
│   ├── db.test.ts
│   ├── agent.test.ts
│   └── recovery.test.ts
├── package.json
├── tsconfig.json
└── .env.example

packages/client/
├── src/
│   ├── main.tsx                      # Vite entry
│   ├── App.tsx                       # Root component
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── LeadDetail.tsx
│   │   ├── ApprovalQueue.tsx
│   │   └── Analytics.tsx
│   ├── components/
│   │   ├── LeadTable.tsx
│   │   ├── RecoveryCard.tsx
│   │   ├── ApprovalModal.tsx
│   │   └── Charts.tsx
│   ├── api/
│   │   └── client.ts
│   └── utils/
│       └── formatters.ts
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## Technology Stack

| Layer | Tech | Why |
|-------|------|-----|
| **API** | Express 4.x | Lightweight, familiar, fast |
| **Language** | TypeScript | Type safety, better DX |
| **Database** | SQLite3 | Simple, no external DB, sufficient for MVP |
| **Frontend** | React 18 | Modern, component-based |
| **Build** | Vite | Fast dev, optimized prod builds |
| **AI/Agent** | Anthropic Claude API | Claude Haiku 4.5 for cost optimization |
| **Validation** | Zod | TypeScript-first validation |
| **Email** | Nodemailer | Simple SMTP adapter |
| **Monorepo** | pnpm workspaces | Shared types, fast installs |

---

## Security & Compliance

- **No secrets in Git:** All sensitive data in .env (GoDaddy config)
- **Frontend isolation:** React never sees backend .env
- **API validation:** All inputs validated with Zod
- **CORS:** Configured to allowed origins only
- **Audit trail:** All actions logged with timestamp, user, result
- **Human approval:** No automated emails without business owner review
- **Opt-out respect:** Customers can unsubscribe permanently

---

## Performance Optimization

- **Cache Claude results:** Don't re-analyze unchanged leads
- **Limit token output:** Max 500 tokens per analysis
- **Use Haiku:** Fastest, cheapest Claude model
- **Mock mode:** Development without API calls
- **Batch operations:** Fetch multiple leads in single query
- **Index database:** Queries on status, received_at, opted_out

---

## Error Handling & Logging

- **Structured logging:** Timestamp, level, context, error
- **API errors:** 400/422 for input, 500 for server, clear messages
- **Claude errors:** Logged, user notified, fallback options
- **Email errors:** Logged with retry option
- **Database errors:** Transactions prevent partial updates

---

Last Updated: November 19, 2026
