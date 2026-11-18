# ReviveAI – Requirements

## Functional Requirements

### Lead Management

| ID | Requirement | Status |
|----|-------------|--------|
| R1.1 | Store customer enquiries with name, email, phone, message, type | P0 |
| R1.2 | Assign potential revenue value to each lead | P0 |
| R1.3 | Track lead status: new → stale → contacted → recovered/escalated | P0 |
| R1.4 | Filter leads by status, date range, revenue range | P0 |
| R1.5 | View full interaction history per lead (timeline) | P0 |
| R1.6 | Mark leads as opted-out (no further contact) | P0 |

### Stale Lead Detection

| ID | Requirement | Status |
|----|-------------|--------|
| R2.1 | Identify leads with no response >3 days old | P0 |
| R2.2 | Exclude opted-out leads from detection | P0 |
| R2.3 | Exclude declined leads | P0 |
| R2.4 | Exclude already-paid/converted leads | P0 |
| R2.5 | Exclude duplicate enquiries | P0 |
| R2.6 | Flag suspicious duplicates for review | P0 |

### Claude AI Analysis

| ID | Requirement | Status |
|----|-------------|--------|
| R3.1 | Use Claude Haiku 4.5 model only | P0 |
| R3.2 | Run deterministic safety checks BEFORE calling Claude | P0 |
| R3.3 | Analyze lead context and determine likely reason for inactivity | P0 |
| R3.4 | Recommend recovery strategy and contact channel | P0 |
| R3.5 | Support mock mode (zero API calls) for development | P0 |
| R3.6 | Cache analysis results so unchanged leads don't need re-analysis | P1 |
| R3.7 | Track input/output tokens and estimated cost per request | P0 |
| R3.8 | Limit Claude output to ~500 tokens | P0 |

### Recovery Recommendations

| ID | Requirement | Status |
|----|-------------|--------|
| R4.1 | Generate structured analysis: priority, intent, inactivity reason, recommended action | P0 |
| R4.2 | Recommend contact channel (email preferred for MVP) | P0 |
| R4.3 | Claude never invents customer details, quotations, or revenue amounts | P0 |
| R4.4 | Different demo leads receive different recommendations | P0 |

### Message Generation & Approval

| ID | Requirement | Status |
|----|-------------|--------|
| R5.1 | Claude generates personalized recovery email (subject + body) | P0 |
| R5.2 | All messages require explicit business owner approval before sending | P0 |
| R5.3 | Business owner can view suggested message before approving | P0 |
| R5.4 | Business owner can reject message without sending | P0 |
| R5.5 | Prevent duplicate sends (warn if lead contacted in past N days) | P0 |

### Email & Execution

| ID | Requirement | Status |
|----|-------------|--------|
| R6.1 | Mock email adapter logs to console + database during development | P0 |
| R6.2 | Real email adapter via SMTP when domain email is configured | P1 |
| R6.3 | Email logs stored with delivery status (sent/failed/bounced) | P0 |
| R6.4 | No email sent without prior explicit approval | P0 |

### Public Contact Form

| ID | Requirement | Status |
|----|-------------|--------|
| R7.1 | Public form endpoint (no authentication) | P1 |
| R7.2 | Form captures name, email, phone, message, enquiry type | P1 |
| R7.3 | Form submission creates lead in database | P1 |
| R7.4 | Form sends confirmation email to business mailbox (when SMTP configured) | P1 |
| R7.5 | Form accessible from website and embeddable in HTML | P1 |

### Dashboard & UI

| ID | Requirement | Status |
|----|-------------|--------|
| R8.1 | Lead table with name, email, status, received_at, revenue_at_risk | P0 |
| R8.2 | Summary cards: total leads, revenue at risk, recovery rate, pending approvals | P0 |
| R8.3 | Lead detail view: full enquiry, interaction history, timeline | P0 |
| R8.4 | Approval queue: pending messages with suggested actions | P0 |
| R8.5 | Responsive design (works on mobile) | P1 |
| R8.6 | Analytics dashboard: recovery trends, channel performance | P1 |

### Audit & Compliance

| ID | Requirement | Status |
|----|-------------|--------|
| R9.1 | Log all agent actions: analysis requested, message generated, approved, sent | P0 |
| R9.2 | Store approval metadata: who approved, when, reason if rejected | P0 |
| R9.3 | Complete timeline per lead (all interactions visible) | P0 |
| R9.4 | Audit log exportable for compliance | P2 |

### Deployment

| ID | Requirement | Status |
|----|-------------|--------|
| R10.1 | Listen on process.env.PORT | P0 |
| R10.2 | Build script: `pnpm run build` | P0 |
| R10.3 | Start script: `pnpm run start` | P0 |
| R10.4 | All secrets outside codebase (.env in GoDaddy config) | P0 |
| R10.5 | Compatible with GoDaddy Node.js hosting | P0 |
| R10.6 | SQLite persistence documented for GoDaddy | P0 |

---

## Non-Functional Requirements

### Performance

| ID | Requirement | Status |
|----|-------------|--------|
| NF1 | Dashboard loads in <2 seconds | P0 |
| NF2 | Lead analysis completes in <10 seconds (Claude + overhead) | P0 |
| NF3 | Support 10,000+ leads before performance degradation | MVP |

### Security

| ID | Requirement | Status |
|----|-------------|--------|
| NF2 | No API keys or secrets in GitHub | P0 |
| NF3 | Frontend never exposes backend secrets | P0 |
| NF4 | CORS configured for allowed origins | P0 |
| NF5 | Input validation on all endpoints | P0 |

### Reliability

| ID | Requirement | Status |
|----|-------------|--------|
| NF6 | Error handling for Claude API failures (graceful fallback) | P0 |
| NF7 | Email send failures logged and retryable | P0 |
| NF8 | Database transactions prevent partial updates | P1 |

### Cost Control

| ID | Requirement | Status |
|----|-------------|--------|
| NF9 | Claude API usage tracked and logged | P0 |
| NF10 | Mock mode by default (zero API calls) | P0 |
| NF11 | One analysis per eligible lead when requested (no re-analysis) | P0 |
| NF12 | Estimated cost per request displayed to user | P1 |

---

## Success Criteria – MVP (P0)

✅ **Complete by Day 6:**

1. CSV import: 10 demo leads seeded successfully
2. Dashboard: shows all leads, filters by status, displays revenue at risk
3. Lead detail: full enquiry, interaction history, timeline
4. Stale detection: correctly identifies leads >3 days old (excluding opted-out, declined, paid)
5. Claude analysis: generates structured recommendation (mock or real)
6. Approval workflow: business owner can review and approve/reject message
7. Audit trail: complete timeline of all actions
8. Mock email: logs approved messages without sending
9. Deterministic checks: opted-out, declined, paid, duplicates all properly excluded
10. Different leads get different recommendations (validate with 10 demo leads)
11. GoDaddy compatible: builds, starts, listens on process.env.PORT
12. Documentation: README, requirements, architecture, demo plan, deployment guide

---

## Success Criteria – P1 (Post-MVP)

- Real email sending via SMTP (GoDaddy domain mailbox)
- Public contact form fully integrated
- Analytics dashboard with recovery trends
- CSV upload interface (UI for importing new leads)
- Response time optimizations

---

## Success Criteria – P2 (If Time)

- WhatsApp integration
- External CRM connectors
- Multiple agents for different strategies
- Advanced analytics and forecasting
- Automated background lead detection

---

## Demo Data Requirements

**10 fictional AC repair business leads:**

| Lead | Type | Days Old | Status | Revenue | Special Condition |
|------|------|----------|--------|---------|------------------|
| 1 | Inquiry | 5 | Stale | ₹4,000 | No response yet |
| 2 | Quotation | 7 | Stale | ₹8,500 | Sent quote, no reply |
| 3 | Booking | 4 | Stale | ₹2,500 | Incomplete booking |
| 4 | Callback | 2 | New | ₹5,000 | Requested callback |
| 5 | Declined | 10 | Declined | ₹3,000 | Service declined |
| 6 | Inquiry | 1 | New | ₹6,000 | Very recent |
| 7 | Quotation | 6 | Stale | ₹9,500 | High-value quote |
| 8 | Complaint | 3 | Escalated | ₹0 | Complaint message |
| 9 | Duplicate | 4 | Stale | ₹4,000 | Duplicate of lead 1 |
| 10 | Inquiry | 8 | Stale | ₹7,200 | Old inquiry, no contact |

**Validation:**
- Different leads receive different Claude recommendations
- Opted-out/declined leads are never proposed for contact
- Recent leads (<3 days) are not suggested for follow-up
- Duplicates are flagged during import
- Complaint leads are flagged for manual handling

---

## Out of Scope (Post-Hackathon)

- Multi-language support
- Integration with accounting software (QuickBooks, etc.)
- Advanced ML predictions
- Real-time notifications/webhooks
- Mobile app (web responsive only)
