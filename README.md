# 🚀 ReviveAI — Autonomous Revenue Recovery Agent

> Turn silent leads into recovered revenue with Claude-powered, human-approved customer recovery for small service businesses.

[![Hackathon](https://img.shields.io/badge/GoDaddy-Inclusive%20Innovation%20Hackathon%202026-00A4A6)](https://reviveaiapp.com)
[![Status](https://img.shields.io/badge/status-production--ready-success)](https://reviveaiapp.com)
[![AI](https://img.shields.io/badge/AI-Claude%20Sonnet%205.5-purple)](https://www.anthropic.com)
[![Domain](https://img.shields.io/badge/domain-reviveaiapp.com-blue)](https://reviveaiapp.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

---

## 🌐 Live Deployment & Project Links

- **Live Production URL:** [https://reviveaiapp.com](https://reviveaiapp.com) *(also available at [https://www.reviveaiapp.com](https://www.reviveaiapp.com))*
- **Domain Mailbox:** `thejaswini@reviveaiapp.com` (GoDaddy Titan Business Email Pro Light)
- **GitHub Repository:** [https://github.com/Thejaswini6/reviveai.git](https://github.com/Thejaswini6/reviveai.git)
- **Deployment Branch:** `feature`
- **Hosting Platform:** GoDaddy Node.js PaaS Hosting (`ss-product-id: paas-nodejs-v1`)

---

## 🎯 The Problem

Small service businesses lose **30% to 40% of their annual revenue** to prospective customers who submit quote inquiries but go silent. For an independent HVAC, plumbing, or electrical contractor handling 40–80 inquiries a month, each stalled lead represents ₹3,000 to ₹50,000 in lost pipeline.

Why leads go cold:
1. **Unanswered technical questions or fear of hidden costs.**
2. **Delayed follow-up:** Service technicians are on-site fixing equipment, leaving inquiries unanswered for days.
3. **Impersonal, robotic mass spam:** Generic bulk drip campaigns trigger customer unsubscribe requests.
4. **Fear of autonomous errors:** Business owners cannot trust black-box AI sending unverified promises, unauthorized discounts, or contacting opted-out customers.

---

## 💡 The ReviveAI Solution

**ReviveAI** is a multi-tool autonomous revenue recovery agent powered by **Anthropic Claude Sonnet 5.5**, architected with strict **deterministic safety gates** and a mandatory **human-in-the-loop approval workflow**:

1. **Continuous Pipeline Monitoring:** Continuously evaluates canonical leads across statuses (`NEW`, `STALE`, `CONTACTED`, `RECOVERED`).
2. **Deterministic Safety Gating:** Pre-filters all leads *before* invoking AI — strictly blocking opted-out users, converted customers, active complaints, and premature inquiries.
3. **Multi-Tool Autonomous Analysis:** In eligible stale leads, the Claude agent executes a 6-step tool chain to inspect interaction history, calculate revenue-at-risk, formulate personalized recovery strategies, and draft empathetic outreach messages.
4. **Human-in-the-Loop Approval:** No message is ever dispatched autonomously. Every AI recommendation enters an interactive Approval Queue where the owner reviews the exact reasoning, tool trace, and message preview before approving or rejecting.
5. **Integrated Domain Email Delivery:** Outbound communications are routed through GoDaddy's authenticated email gateway and Titan Business Email (`thejaswini@reviveaiapp.com`).

---

## 📊 Live Metrics (CoolCare AC Services Reference Profile)

The reference benchmark dataset contains **35 reconciled canonical leads** representing a typical metropolitan AC service business:

- **Gross Open Pipeline at Risk:** **₹3,19,600** across 35 leads
- **Eligible Recovery Opportunity:** **₹2,48,300** across 16 eligible stale/open leads
- **Confirmed Recovered Revenue:** **₹50,200** across successfully won customers
- **Overall Recovery Conversion Rate:** **22.8%**

---

## 🛠️ Complete Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, TypeScript, Vite | Single-page application with responsive CSS, dark mode, toast notifications, search, filter, lead score badges, and quick presets |
| **Backend** | Node.js, Express, TypeScript | REST API with rate limiting, input sanitization, deterministic safety rules, and SPA static asset fallback |
| **AI Agent** | Anthropic Claude Sonnet 5.5 | Multi-tool autonomous agent (`AGENT_TOOLS`) with 6 distinct tool execution contracts |
| **Safety Engine** | Deterministic Pre-Gating + Zod | Strict schema validation (`RecoveryAnalysisSchema`) and zero-tolerance policy gates |
| **Data Provider** | In-memory Canonical Reconciled + SQLite Schema | High-performance in-memory state with 35 canonical leads; SQLite migration ready |
| **Email Delivery** | GoDaddy Node.js Email Gateway + Titan SMTP | Outbound delivery via container gateway (`127.0.0.1:2525`) and Titan Mailbox (`thejaswini@reviveaiapp.com`) |
| **Cloud Hosting** | GoDaddy Node.js Hosting | Cloud container platform with Cloudflare SSL certificate |

---

## 🤖 Claude Multi-Tool Agent Architecture

The ReviveAI agent operates via 6 strictly defined tools:

1. `fetch_lead_context(lead_id)`: Retrieves customer profile, business policies (free inspection, 90-day warranty, GST terms), and currency.
2. `get_interaction_history(lead_id)`: Fetches past timeline interactions, computes exact inactivity days, and identifies customer sentiment.
3. `calculate_revenue_at_risk(lead_id)`: Calculates gross pipeline value and assesses net recovery opportunity.
4. `create_recovery_recommendation(lead_id, strategy, priority)`: Synthesizes high/medium/low priority recommendations.
5. `generate_recovery_message(lead_id, subject, body, tone)`: Drafts contextual, high-conversion email outreach adhering to business policies.
6. `request_approval(lead_id, action_summary)`: Stages the generated action in the pending approval queue for human verification.

### Zero-Credit Simulated Mock Mode vs. Live Anthropic Mode
- **Simulated Mock Mode (`MOCK_MODE=true`):** Enabled by default for safe evaluation and testing without consuming Anthropic API credits. Generates deterministic 6-step traces and full analyses.
- **Live Mode (`MOCK_MODE=false`):** Calls Anthropic Claude Sonnet 5.5 (`claude-sonnet-5-5`) using the configured `ANTHROPIC_API_KEY`. Verified live on lead RV-2001 (Rajesh Mehta).

---

## 🛡️ Business Safety & Compliance Matrix

ReviveAI enforces a 10-scenario business safety test suite before any agent or email action:

| Scenario | Lead ID | Type | Action Taken | Reason Enforced |
|---|---|---|---|---|
| 1 | RV-2001 | Eligible Stale Lead | **Allowed** | Inactivity >3 days, consented, valid inquiry |
| 2 | RV-1002 | Cold Post-Quote Lead | **Allowed** | Quote delivered, customer silent |
| 3 | RV-2019 | Pricing Objection | **Allowed** | Recoverable with free inspection / warranty offer |
| 4 | RV-1006 | Opted-Out Customer | **BLOCKED** | GDPR / Customer privacy gate strictly enforced |
| 5 | RV-2025 | Missing Consent | **BLOCKED** | Unverified consent prohibited from automated outreach |
| 6 | RV-1007 | Converted / Paid Lead | **BLOCKED** | Already paid; excluded from marketing outreach |
| 7 | RV-1005 | Declined Lead | **BLOCKED** | Customer explicitly declined service; respected |
| 8 | RV-1009 | Duplicate Lead | **BLOCKED** | Consolidated onto primary lead RV-1001 |
| 9 | RV-1008 | Customer Complaint | **BLOCKED** | Routed to human manager escalation |
| 10 | RV-1004 | Phone Callback Request| **BLOCKED** | Automated email blocked; scheduled for human phone call |

---

## 🚀 Running the Project Locally

```bash
# Clone the repository
git clone https://github.com/Thejaswini6/reviveai.git
cd reviveai
git checkout feature

# Install dependencies
npm install

# Build client and server
npm run build

# Start production server (serves both API and React frontend on port 5000)
npm start
# Open http://localhost:5000 in your browser
```

### Running Test Verification Suites

```bash
# Production smoke test (health, API, leads, analytics, contact form, SPA fallback)
node packages/server/scripts/test-prod-smoke.js

# 40-point API and business logic verification
npx tsx packages/server/scripts/verify-api.ts

# 10 core safety regression scenarios
npx tsx packages/server/scripts/verify-scenarios.ts

# 50-point comprehensive agent & tool test suite
npx tsx packages/server/scripts/test-agent.ts
```

---

## 📬 Contact & Support

For questions or inquiries regarding ReviveAI:
- Visit the live contact form: [https://reviveaiapp.com/contact](https://reviveaiapp.com)
- Email: **thejaswini@reviveaiapp.com**
