# ReviveAI – Implementation Tasks (P0 MVP)

## PHASE 1: PROJECT FOUNDATION & CSV SEEDING

### Task 1.1: Monorepo Setup
**Status:** [ ] Not Started  
**Estimated:** 30 minutes

Create root-level configuration for monorepo workspace.

**Acceptance Criteria:**
- [ ] Root `package.json` with `pnpm-workspace.yaml` configured
- [ ] `pnpm install` works from root, installs all dependencies
- [ ] Build script: `pnpm run build` builds client + server
- [ ] Start script: `pnpm run start` runs production server
- [ ] Dev script: `pnpm run dev` starts both client and server with hot reload

**Files to Create:**
```
package.json                 # Root, shared scripts
pnpm-workspace.yaml         # Monorepo config
packages/server/package.json
packages/client/package.json
.gitignore
```

---

### Task 1.2: TypeScript & Environment Configuration
**Status:** [ ] Not Started  
**Estimated:** 20 minutes

Set up TypeScript, environment validation, shared types.

**Acceptance Criteria:**
- [ ] `tsconfig.json` configured with shared paths
- [ ] `packages/server/tsconfig.json` extends root config
- [ ] `packages/client/tsconfig.json` for React + Vite
- [ ] `packages/server/src/env.ts` validates environment variables
- [ ] `.env.example` created with all required variables
- [ ] `packages/server/src/types/index.ts` exports shared types

**Files to Create:**
```
tsconfig.json
packages/server/src/env.ts
packages/server/src/types/index.ts
packages/server/.env.example
packages/client/.env.example
.gitignore
```

---

### Task 1.3: SQLite Database Schema
**Status:** [ ] Not Started  
**Estimated:** 45 minutes

Create database schema, initialization, and query helpers.

**Acceptance Criteria:**
- [ ] SQLite schema includes tables: businesses, leads, agent_actions, email_logs, outcomes
- [ ] Indexes created on frequently-filtered columns
- [ ] `packages/server/src/db/schema.ts` exports table definitions
- [ ] `packages/server/src/db/init.ts` initializes database file
- [ ] `packages/server/src/db/queries.ts` exports query helpers
- [ ] `packages/server/src/utils/dates.ts` date utility functions
- [ ] Database file at `./data/reviveai.db` can be initialized

**Files to Create:**
```
packages/server/src/db/schema.ts
packages/server/src/db/init.ts
packages/server/src/db/queries.ts
packages/server/src/utils/dates.ts
packages/server/src/utils/errors.ts
packages/server/migrations/001_initial_schema.sql
```

---

### Task 1.4: CSV Import System
**Status:** [ ] Not Started  
**Estimated:** 1.5 hours

Create CSV parser, Zod validation, duplicate detection, seed script.

**Acceptance Criteria:**
- [ ] CSV file stored at `packages/server/data/reviveai_demo_leads.csv`
- [ ] `packages/server/src/services/csvImporter.ts` implements parser + validation
- [ ] Zod schema validates all 20 CSV columns (types, enums, formats)
- [ ] Duplicate detection: email + service_type + date proximity matching
- [ ] Date parsing: ISO 8601 + IST timezone handling
- [ ] Currency parsing: ₹ symbol removal, INR conversion
- [ ] Seed script: `pnpm run db:seed` imports CSV and creates leads
- [ ] Import report shows: imported count, skipped count, errors with reasons, duplicates flagged
- [ ] All 10 leads (or 9 if RV-1009 skipped) seeded successfully
- [ ] `packages/server/data/DATA_DICTIONARY.md` created and accurate

**Files to Create:**
```
packages/server/data/reviveai_demo_leads.csv
packages/server/data/DATA_DICTIONARY.md
packages/server/src/services/csvImporter.ts
packages/server/scripts/seed.ts
```

**Testing Checklist:**
- [ ] `pnpm run db:seed` completes without errors
- [ ] 10 leads in database with correct status, revenue, dates
- [ ] RV-1009 flagged as duplicate of RV-1001
- [ ] Dates correctly parsed and stored as UTC
- [ ] Revenue values correct (₹4000, ₹8500, etc.)
- [ ] Opted-out leads have contact_consent = OPTED_OUT
- [ ] Error reporting clear and helpful

---

### Task 1.5: Express App & Middleware
**Status:** [ ] Not Started  
**Estimated:** 45 minutes

Set up Express app, middleware, error handling, CORS.

**Acceptance Criteria:**
- [ ] `packages/server/src/index.ts` creates Express app
- [ ] Middleware: CORS (allow localhost:5173), error handling, logging
- [ ] Health check endpoint: `GET /health` returns 200 OK
- [ ] Static file serving: production build of React from Express
- [ ] Environment validation runs at startup
- [ ] App listens on `process.env.PORT` (default 5000)
- [ ] No hardcoded secrets in code

**Files to Create:**
```
packages/server/src/index.ts
packages/server/src/utils/logger.ts
packages/server/src/api/middleware.ts
```

---

## PHASE 2: CORE API & DASHBOARD BACKEND

### Task 2.1: Lead CRUD API
**Status:** [ ] Not Started  
**Estimated:** 1.5 hours

Implement lead management endpoints.

**Acceptance Criteria:**
- [ ] GET /api/leads – List leads with filters (status, days_old, sort)
- [ ] GET /api/leads/:id – Get lead detail + full interaction history
- [ ] PATCH /api/leads/:id – Update status, opted_out, notes
- [ ] POST /api/leads/:id/opt-out – Mark lead as opted-out
- [ ] All responses return proper HTTP status codes (200, 400, 404, 500)
- [ ] Input validation using Zod
- [ ] Responses are paginated (default 50 per page)

**Files to Create:**
```
packages/server/src/api/leads.ts
packages/server/src/utils/validators.ts  # Zod schemas for input
```

---

### Task 2.2: Stale Lead Detection (Deterministic)
**Status:** [ ] Not Started  
**Estimated:** 1 hour

Implement backend deterministic checks for stale lead eligibility.

**Acceptance Criteria:**
- [ ] Stale query: leads >3 days old, no contact, not opted-out, not declined, not paid
- [ ] Returns only: RV-1001, RV-1002 (from 10 demo leads)
- [ ] Excludes: RV-1003 (borderline), RV-1004 (callback), RV-1005 (declined), RV-1006 (opted-out), RV-1007 (paid), RV-1008 (complaint), RV-1009 (duplicate), RV-1010 (too recent)
- [ ] POST /api/internal/leads/mark-stale – marks eligible leads as stale
- [ ] GET /api/internal/leads/eligible-for-analysis – returns analysis-eligible leads
- [ ] Duplicate check: if lead is duplicate_of_lead_id set, skip

**Files to Modify:**
```
packages/server/src/db/queries.ts  # Add stale detection query
```

**Testing Checklist:**
- [ ] Query returns exactly RV-1001, RV-1002 after import
- [ ] RV-1009 not returned (duplicate)
- [ ] RV-1006 not returned (opted-out)
- [ ] RV-1005 not returned (declined)
- [ ] RV-1007 not returned (paid)

---

### Task 2.3: Analytics Endpoints
**Status:** [ ] Not Started  
**Estimated:** 30 minutes

Implement dashboard summary metrics.

**Acceptance Criteria:**
- [ ] GET /api/analytics/summary – returns: total_leads, new_leads, stale_leads, total_revenue_at_risk, recovery_rate, pending_approvals
- [ ] GET /api/analytics/timeline – activity grouped by date (last 30 days)
- [ ] Responses accurate based on current database state
- [ ] Results update in real-time as leads change status

**Files to Create:**
```
packages/server/src/api/analytics.ts
```

---

## PHASE 3: FRONTEND DASHBOARD

### Task 3.1: React Vite Setup
**Status:** [ ] Not Started  
**Estimated:** 30 minutes

Initialize React + Vite + TypeScript scaffold.

**Acceptance Criteria:**
- [ ] `pnpm run dev` in packages/client starts Vite on port 5173
- [ ] React 18 + TypeScript configured
- [ ] Basic layout component with navigation
- [ ] Routing (React Router) set up for: Dashboard, LeadDetail, ApprovalQueue, Analytics
- [ ] API client wrapper: `packages/client/src/api/client.ts`
- [ ] Shared types from backend available in client

**Files to Create:**
```
packages/client/src/main.tsx
packages/client/src/App.tsx
packages/client/vite.config.ts
packages/client/tsconfig.json
packages/client/src/api/client.ts
packages/client/index.html
```

---

### Task 3.2: Dashboard Page
**Status:** [ ] Not Started  
**Estimated:** 1 hour

Build main dashboard showing all leads.

**Acceptance Criteria:**
- [ ] Lead table: name, email, status, received_at, revenue_at_risk, actions
- [ ] Summary cards: total leads, revenue at risk, recovery rate, pending approvals
- [ ] Filters: by status, date range (optional for MVP)
- [ ] Sort: by received date, revenue, status
- [ ] Click row → navigate to Lead Detail page
- [ ] "Trigger Analysis" button on each row
- [ ] Responsive design (works on mobile)

**Files to Create:**
```
packages/client/src/pages/Dashboard.tsx
packages/client/src/components/LeadTable.tsx
packages/client/src/components/SummaryCards.tsx
packages/client/src/utils/formatters.ts  # Currency, date formatting
```

---

### Task 3.3: Lead Detail Page
**Status:** [ ] Not Started  
**Estimated:** 1 hour

Build lead detail view with full history.

**Acceptance Criteria:**
- [ ] Lead info card: name, email, phone, message, enquiry_type, revenue
- [ ] Interaction timeline: all agent_actions, emails, approvals (chronological)
- [ ] Status badge: current status with color coding
- [ ] "Trigger Analysis" button (if eligible)
- [ ] "Opt-out" button (if not already opted-out)
- [ ] Back button to Dashboard

**Files to Create:**
```
packages/client/src/pages/LeadDetail.tsx
packages/client/src/components/InteractionTimeline.tsx
```

---

### Task 3.4: Approval Queue Page
**Status:** [ ] Not Started  
**Estimated:** 1.5 hours

Build approval workflow UI.

**Acceptance Criteria:**
- [ ] List of pending approvals (status = approval_requested)
- [ ] Card per approval: lead name, suggested message, recommended action
- [ ] Approve button → POST /api/agent/actions/:id/approve
- [ ] Reject button → POST /api/agent/actions/:id/reject (with reason input)
- [ ] Real-time status update after approve/reject
- [ ] Show message preview in a modal or expandable section
- [ ] Timestamp of when approval was requested

**Files to Create:**
```
packages/client/src/pages/ApprovalQueue.tsx
packages/client/src/components/ApprovalCard.tsx
packages/client/src/components/ApprovalModal.tsx
```

---

## PHASE 4: CLAUDE AGENT ANALYSIS

### Task 4.1: Claude Integration & Mock Provider
**Status:** [ ] Not Started  
**Estimated:** 1.5 hours

Create Claude API wrapper and mock provider.

**Acceptance Criteria:**
- [ ] `packages/server/src/agent/claude.ts` wraps Anthropic SDK
- [ ] Mock mode provider: deterministic outputs for 10 demo leads
- [ ] Toggle: MOCK_MODE=true/false in .env
- [ ] Mock outputs match same Zod schema as real Claude output
- [ ] Token tracking: input_tokens, output_tokens, cost calculation
- [ ] Error handling: retry logic, fallback to mock on failure
- [ ] No API calls when MOCK_MODE=true

**Files to Create:**
```
packages/server/src/agent/claude.ts
packages/server/src/agent/mock.ts
packages/server/src/agent/prompts.ts  # System prompt
```

---

### Task 4.2: Agent Tools & Safety Checks
**Status:** [ ] Not Started  
**Estimated:** 2 hours

Define tools and implement deterministic safety checks.

**Acceptance Criteria:**
- [ ] 6 tools defined: fetch_lead_context, get_interaction_history, calculate_revenue_at_risk, create_recovery_recommendation, generate_recovery_message, request_approval
- [ ] Safety checks BEFORE Claude call:
  - [ ] Opted-out? → skip
  - [ ] Declined? → skip
  - [ ] Already paid? → skip
  - [ ] Duplicate? → skip
  - [ ] Too recent (<3 days)? → skip
  - [ ] Recently analyzed? → return cached result
- [ ] Tool handlers implemented in TypeScript (deterministic, no randomness)
- [ ] Structured output schema defined with Zod
- [ ] Output validation before returning to frontend

**Files to Create:**
```
packages/server/src/agent/tools.ts
packages/server/src/agent/orchestrator.ts  # Main loop
packages/server/src/utils/validators.ts  # Add agent schemas
```

---

### Task 4.3: Agent Orchestrator
**Status:** [ ] Not Started  
**Estimated:** 1.5 hours

Implement main agent loop.

**Acceptance Criteria:**
- [ ] Main function: analyzeLeadAsync(lead_id)
- [ ] Run deterministic checks → return error if any fail
- [ ] Check cache → return cached result if recent analysis exists
- [ ] Call Claude (mock or real) with structured prompt
- [ ] Handle tool calls from Claude
- [ ] Parse and validate Claude output with Zod
- [ ] Store analysis result in agent_actions table
- [ ] Return structured response to API

**Files to Create:**
```
packages/server/src/agent/orchestrator.ts  # Already started above
```

---

### Task 4.4: Agent Action API Endpoints
**Status:** [ ] Not Started  
**Estimated:** 1 hour

Implement agent-related API endpoints.

**Acceptance Criteria:**
- [ ] POST /api/agent/analyze-lead/:lead_id – triggers analysis
- [ ] GET /api/agent/actions – list pending approvals
- [ ] GET /api/agent/actions/:id – action detail
- [ ] Returns: action_id, status, analysis JSON, tokens_used, cost
- [ ] Proper error handling and validation

**Files to Create:**
```
packages/server/src/api/agent.ts
```

---

## PHASE 5: APPROVAL WORKFLOW & MOCK EMAIL

### Task 5.1: Approval Workflow
**Status:** [ ] Not Started  
**Estimated:** 1 hour

Implement approval/rejection workflow.

**Acceptance Criteria:**
- [ ] POST /api/agent/actions/:id/approve – stores approval metadata, prepares email
- [ ] POST /api/agent/actions/:id/reject – stores rejection, logs reason
- [ ] Duplicate send prevention: check if lead already contacted in past N days
- [ ] Update lead status: NEW → CONTACTED (on approve)
- [ ] Record in agent_actions: status = email_sent (on approve)

**Files to Create:**
```
packages/server/src/services/approval.ts
```

---

### Task 5.2: Mock Email Adapter
**Status:** [ ] Not Started  
**Estimated:** 45 minutes

Implement mock email sending (console + database logging).

**Acceptance Criteria:**
- [ ] Mock adapter logs to console: "[MOCK EMAIL] To: X, Subject: Y, Body: Z"
- [ ] Logs entry in email_logs table (status: sent)
- [ ] Returns: { id, status: 'sent', sent_at }
- [ ] No actual SMTP calls (mock mode only)
- [ ] Email interface supports both mock and real (future P1)

**Files to Create:**
```
packages/server/src/services/email.ts  # Adapter interface
packages/server/src/services/email/mock.ts  # Mock implementation
packages/server/src/services/email/real.ts  # Real SMTP (stub for P1)
```

---

### Task 5.3: Audit Trail Logging
**Status:** [ ] Not Started  
**Estimated:** 45 minutes

Implement comprehensive audit logging.

**Acceptance Criteria:**
- [ ] Every action logged: timestamp, action_type, user, result, lead_id
- [ ] Agent action creation logged
- [ ] Approval logged with who approved, when
- [ ] Email sent/failed logged
- [ ] Audit records stored in agent_actions, email_logs tables
- [ ] Complete timeline viewable per lead

**Files to Create:**
```
packages/server/src/services/audit.ts
```

---

## PHASE 6: INTEGRATION & TESTING

### Task 6.1: End-to-End Workflow
**Status:** [ ] Not Started  
**Estimated:** 1.5 hours

Validate complete flow: CSV → dashboard → analysis → approval → email.

**Acceptance Criteria:**
- [ ] CSV import successful (10 leads seeded)
- [ ] Dashboard shows all leads
- [ ] Stale detection identifies RV-1001, RV-1002
- [ ] Click "Trigger Analysis" → Claude generates recommendation (mock or real)
- [ ] Approval Queue shows pending message
- [ ] Approve → message sent (mock email), lead status updated
- [ ] Timeline shows all actions
- [ ] No errors in browser console or server logs

**Manual Testing Checklist:**
- [ ] Import CSV: `pnpm run db:seed`
- [ ] Start dev: `pnpm run dev`
- [ ] Load dashboard: http://localhost:5173
- [ ] Filter to stale leads
- [ ] Click RV-1001 → "Trigger Analysis"
- [ ] Verify recommendation returned
- [ ] Approve → check Approval Queue updated
- [ ] View timeline

---

### Task 6.2: Safety Check Validation
**Status:** [ ] Not Started  
**Estimated:** 1 hour

Test all deterministic safety rules with 10 demo leads.

**Acceptance Criteria:**
- [ ] RV-1006 (opted-out) blocked from analysis
- [ ] RV-1005 (declined) blocked from analysis
- [ ] RV-1007 (converted + paid) blocked from analysis
- [ ] RV-1004 (callback requested) escalated to human
- [ ] RV-1008 (complaint) escalated to human
- [ ] RV-1009 (duplicate) flagged and skipped
- [ ] RV-1010 (too recent) blocked from analysis
- [ ] RV-1003 (borderline 3 days) behavior documented

**Testing Script:**
```typescript
// For each lead:
POST /api/agent/analyze-lead/:lead_id
// Verify expected behavior
```

---

### Task 6.3: Mock Mode Validation
**Status:** [ ] Not Started  
**Estimated:** 30 minutes

Ensure mock mode works correctly without API calls.

**Acceptance Criteria:**
- [ ] Set MOCK_MODE=true
- [ ] Trigger analysis on RV-1001
- [ ] Verify no API calls made (check network tab)
- [ ] Mock output returned instantly
- [ ] Output valid JSON matching schema
- [ ] Cost displayed as $0
- [ ] Switch to MOCK_MODE=false
- [ ] Trigger analysis (if API key set)
- [ ] Real Claude API called (visible in network tab)
- [ ] Tokens tracked and logged

---

### Task 6.4: Different Recommendations per Lead
**Status:** [ ] Not Started  
**Estimated:** 45 minutes

Validate that Claude generates different recommendations for different scenarios.

**Acceptance Criteria:**
- [ ] RV-1001 (simple inquiry): "friendly re-engagement"
- [ ] RV-1002 (quote with question): "address specific concern"
- [ ] RV-1003 (booking pending): "confirm booking"
- [ ] Recommendations differ meaningfully (not generic)
- [ ] Mock provider hardcodes unique outputs per lead
- [ ] Real Claude generates contextually appropriate messages

---

## PHASE 7: DEPLOYMENT READINESS

### Task 7.1: Build & Start Scripts
**Status:** [ ] Not Started  
**Estimated:** 30 minutes

Finalize production build and start scripts.

**Acceptance Criteria:**
- [ ] Root `pnpm run build` builds client + server
- [ ] Root `pnpm run start` starts production server
- [ ] Server listens on process.env.PORT (default 5000)
- [ ] React app served from Express at /
- [ ] API endpoints work at /api/*
- [ ] No errors on startup
- [ ] Build output is minimal and optimized

**Files to Verify:**
```
package.json (root)
packages/server/package.json
packages/client/package.json
```

---

### Task 7.2: Production Configuration
**Status:** [ ] Not Started  
**Estimated:** 30 minutes

Ensure secrets and configuration are production-ready.

**Acceptance Criteria:**
- [ ] No hardcoded secrets in code
- [ ] .env.example template created
- [ ] Environment validation required at startup
- [ ] Frontend code has no access to backend .env
- [ ] API calls from React use relative URLs
- [ ] Build script in .gitignore (dist/, node_modules/)
- [ ] .env files in .gitignore

**Files to Create/Verify:**
```
.gitignore
packages/server/.env.example
packages/client/.env.example
```

---

### Task 7.3: Documentation
**Status:** [ ] Not Started  
**Estimated:** 1 hour

Finalize all documentation files.

**Acceptance Criteria:**
- [ ] README.md – quick start, features, structure
- [ ] requirements.md – feature requirements (R1–R10, NF1–NF12)
- [ ] architecture.md – technical design, data model, API, agent design
- [ ] claude-budget.md – token tracking, cost model, conservation rules
- [ ] demo-plan.md – 10 lead scenarios, walkthrough, success criteria
- [ ] deployment.md – GoDaddy setup, environment config, monitoring
- [ ] DATA_DICTIONARY.md – CSV column definitions, lead analysis
- [ ] All files cross-linked and up-to-date

**Files to Verify:**
```
README.md
docs/requirements.md
docs/architecture.md
docs/claude-budget.md
docs/demo-plan.md
docs/deployment.md
packages/server/data/DATA_DICTIONARY.md
```

---

### Task 7.4: GoDaddy Dry Run
**Status:** [ ] Not Started  
**Estimated:** 1 hour

Test deployment to GoDaddy (or local simulation).

**Acceptance Criteria:**
- [ ] `pnpm run build` completes without errors
- [ ] `PORT=5000 pnpm run start` runs successfully
- [ ] Frontend accessible at http://localhost:5000
- [ ] API endpoints respond at http://localhost:5000/api/*
- [ ] Database seeded with demo leads
- [ ] Dashboard shows all leads
- [ ] Stale detection works
- [ ] Claude analysis works (mock mode)
- [ ] Approval workflow works
- [ ] No errors in logs

---

## Summary

**Total Estimated Time:** ~20 hours of focused work  
**Recommended Timeline:** 6–7 days (Hackathon Days 1–7)  
**Parallel Tasks:** Tasks can run in parallel (e.g., API + Frontend simultaneously)

### Phase Breakdown

| Phase | Tasks | Time | Days |
|-------|-------|------|------|
| **1: Foundation** | 1.1–1.5 | 4.5 hrs | Day 1 |
| **2: Backend** | 2.1–2.3 | 3 hrs | Day 2 |
| **3: Frontend** | 3.1–3.4 | 4 hrs | Days 2–3 |
| **4: Agent** | 4.1–4.4 | 6 hrs | Days 3–4 |
| **5: Approval** | 5.1–5.3 | 2.5 hrs | Day 5 |
| **6: Testing** | 6.1–6.4 | 3.5 hrs | Day 5–6 |
| **7: Deploy** | 7.1–7.4 | 3 hrs | Day 6–7 |

---

Last Updated: November 19, 2026
