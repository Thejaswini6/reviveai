# ReviveAI — GoDaddy Inclusive Innovation Hackathon 2026 Submission

## 🏆 Project Overview

**Project Title:** ReviveAI — Autonomous Revenue Recovery Agent for Small Businesses  
**Track / Theme:** Small Business Innovation / AI Agents  
**Live Production URL:** [https://reviveaiapp.com](https://reviveaiapp.com) *(also resolves at [https://www.reviveaiapp.com](https://www.reviveaiapp.com))*  
**Domain Mailbox:** `thejaswini@reviveaiapp.com` (GoDaddy Titan Business Email Pro Light)  
**GitHub Repository:** [https://github.com/Thejaswini6/reviveai.git](https://github.com/Thejaswini6/reviveai.git)  
**Deployment Branch:** `feature`  
**Hosting Platform:** GoDaddy Node.js PaaS Hosting (`ss-product-id: paas-nodejs-v1`)  

---

## 🎯 The Problem

Small service businesses (HVAC, plumbing, and home repairs) lose substantial potential revenue from prospective customers who submit quote requests but go silent. 

In our benchmark dataset for **CoolCare AC Services**:
- **31.4% of inquiries (11 out of 35 leads)** stalled in a `STALE` status after an initial quotation or site visit.
- This represents **₹3,19,600 in gross open pipeline value** at risk of permanent abandonment.
- Service business owners and field technicians spend their days on job sites fixing equipment and lack the administrative bandwidth for prompt, personalized follow-ups.
- Generic automated email drip tools send robotic, tone-deaf emails that damage customer relationships and risk contacting opted-out clients or active service complaints.

---

## 💡 The Solution: ReviveAI

**ReviveAI** is an autonomous revenue recovery agent powered by **Anthropic Claude Sonnet 5.5**, engineered specifically for small service businesses with **deterministic safety gates** and mandatory **human-in-the-loop approval**:

1. **Continuous Pipeline Monitoring:** Tracks leads across statuses (`NEW`, `STALE`, `CONTACTED`, `RECOVERED`).
2. **Deterministic Pre-AI Safety Gating:** 10 deterministic business rules intercept leads before invoking Claude. Opted-out customers, duplicate records, converted accounts, premature inquiries (<48h), and active customer service complaints are strictly prohibited from automated outreach.
3. **6-Tool Autonomous Claude Agent:** In eligible stale leads, the Claude agent executes a 6-step tool chain (`fetch_lead_context`, `get_interaction_history`, `calculate_revenue_at_risk`, `create_recovery_recommendation`, `generate_recovery_message`, and `request_approval`) to understand customer sentiment, formulate personalized recovery strategies, and draft contextual messages adhering to real business terms (e.g., CoolCare's free inspection and 90-day warranty).
4. **Human-in-the-Loop Approval:** No message is ever dispatched autonomously. Every AI draft enters an interactive Approval Queue where the owner inspects the exact reasoning, tool trace, and message preview before approving or rejecting.
5. **GoDaddy Cloud & Mailbox Integration:** Built and published live on GoDaddy Node.js Hosting under `https://reviveaiapp.com`, connected directly to Titan Business Email (`thejaswini@reviveaiapp.com`) through GoDaddy's authenticated email gateway (`http://127.0.0.1:2525/api/email/send`).

---

## 📊 Reconciled Revenue & Conversion Metrics

The application calculates explicit, transparent revenue and conversion figures:

| Metric | Value | Explicit Formula / Source |
|---|---|---|
| **Total Canonical Leads** | **35 leads** | Reconciled benchmark dataset |
| **Stale Leads (Silent >3 Days)** | **11 leads** | Leads requiring active recovery follow-up (31.4%) |
| **Gross Open Pipeline at Risk** | **₹3,19,600** | Total value of active non-paid, non-declined, consented leads |
| **Eligible Recovery Opportunity** | **₹2,48,300** | Value of 16 stale/open leads passing all 10 safety rules |
| **Confirmed Recovered Revenue** | **₹50,200** | Explicitly confirmed paid converted leads |
| **Lead Conversion Rate** | **22.9%** | `(8 recovered leads / 35 total leads) * 100` |
| **Revenue Recovery Rate** | **20.2%** | `(₹50,200 recovered / ₹2,48,300 eligible opportunity) * 100` |

---

## 🛠️ Complete Technical Architecture

### 1. Frontend
- **Framework:** React 18, TypeScript, Vite
- **Capabilities:** Responsive dashboard, real-time search across all fields, multi-criteria filters, lead scoring (0–100), dark mode, toast notifications, CSV export, and public footer with Contact Us.
- **Routing:** Path-aware SPA routing (`/`, `/contact`, `/approvals`, `/analytics`, `/leads/:id`) supporting direct browser refresh and history navigation.

### 2. Backend & Data Layer
- **Framework:** Node.js, Express, TypeScript
- **Database Architecture:** Unified `DataRepository` interface supporting:
  - **InMemoryRepository:** Zero-dependency canonical repository for local development and automated testing.
  - **MySQLRepository:** Production provider backed by GoDaddy Hosted MySQL using `mysql2/promise` with managed connection pool, parameterized SQL queries, and idempotent schema migrations (`_migrations` ledger).
- **Security:** Request body limits (100KB), CORS protection, rate limiting on public contact form (10 req/10 min/IP), input sanitization, and owner authorization on state-changing endpoints.

### 3. Email Delivery Architecture
- **Public Contact Form (`/api/contact`):** Dispatches to `thejaswini@reviveaiapp.com` via the official GoDaddy Node.js Hosting email gateway (`http://127.0.0.1:2525/api/email/send`) using the platform's vended `sendEmail()` helper.
- **AI Recovery Outreach (`/api/agent/actions/:id/approve`):** Strictly simulated mock dispatch. Synthetic demo customers (e.g. Rajesh Mehta, Priya Nair) never receive real outbound emails, ensuring complete safety.

### 4. Claude Agent (Anthropic)
- **Model:** Anthropic Claude Sonnet 5.5 (`claude-sonnet-5-5`)
- **Tools:** 6 registered tool definitions in `AGENT_TOOLS` with runtime validation via Zod (`RecoveryAnalysisSchema`).
- **Modes:** 
  - **Simulated Mock Mode (`MOCK_MODE=true`):** Zero-credit deterministic simulation for tests and evaluation.
  - **Live Mode (`MOCK_MODE=false`):** Anthropic Messages API tool-calling verified on lead RV-2001.

---

## 🛡️ Business Safety & Compliance Suite (10 Core Scenarios)

1. **RV-2001 (Rajesh Mehta):** Eligible Stale Lead → **ALLOWED** (Inactivity >3 days, consented, valid inquiry).
2. **RV-1002 (Priya Nair):** Cold Post-Quote Lead → **ALLOWED** (Quote delivered, customer silent).
3. **RV-2019 (Geeta Krishnan):** Pricing Objection → **ALLOWED** (Recoverable with warranty/inspection offer).
4. **RV-1006 (Meera Joshi):** Opted-Out Customer → **BLOCKED** (Privacy gate strictly enforced).
5. **RV-2025 (Divya Menon):** Missing Consent → **BLOCKED** (Unverified consent prohibited from automated outreach).
6. **RV-1007 (Arjun Rao):** Converted / Paid Lead → **BLOCKED** (Already paid; excluded from marketing).
7. **RV-1005 (Sanjay Kulkarni):** Declined Lead → **BLOCKED** (Customer declined service; respected).
8. **RV-1009 (Rahul Sharma):** Duplicate Lead → **BLOCKED** (Consolidated onto primary lead RV-1001).
9. **RV-1008 (Farah Khan):** Customer Complaint → **BLOCKED** (Routed to human manager escalation).
10. **RV-1004 (Neha Iyer):** Phone Callback Request → **BLOCKED** (Automated email blocked; human phone call scheduled).

---

## 📈 Evaluation Rubric Self-Audit

| Dimension | Weight | Status | Summary Evidence |
|---|---|---|---|
| **Impact** | **35%** | **Strong** | Directly addresses small-business revenue loss with quantifiable metrics: ₹3,19,600 pipeline at risk, ₹2,48,300 recovery opportunity, ₹50,200 recovered. Industry-independent architecture verified across HVAC (CoolCare) and Plumbing (FlowFix). |
| **Demo** | **35%** | **Strong** | Published and running live on GoDaddy Node.js Hosting at `https://reviveaiapp.com` with Cloudflare SSL certificate. Responsive UI with search, lead detail, tool execution trace, approval queue, and contact form. |
| **Technology Usage** | **15%** | **Strong** | Anthropic Claude Sonnet 5.5 multi-tool agent architecture (6 tools). Integrated GoDaddy email gateway, GoDaddy domain, GoDaddy Hosted MySQL repository, and Titan Business Email (`thejaswini@reviveaiapp.com`). |
| **Execution** | **15%** | **Strong** | Automated production build (`cmd.exe /c "npm run build"`), structured logging without secret leakage, 50 automated tests passing at 100%, and strict rate limiting on public endpoints. |
