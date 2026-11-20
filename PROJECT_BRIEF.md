# ReviveAI — Official Hackathon Project Brief & Submission Dossier

**Competition:** GoDaddy Inclusive Innovation Hackathon 2026 (Round 2: Build Phase)  
**Track / Theme:** Small Business Innovation / AI Agents  
**Live Production URL:** [https://reviveaiapp.com](https://reviveaiapp.com) *(and [https://www.reviveaiapp.com](https://www.reviveaiapp.com))*  
**Domain Mailbox:** `thejaswini@reviveaiapp.com` (Titan Business Email Pro Light)  
**GitHub Repository:** [https://github.com/Thejaswini6/reviveai.git](https://github.com/Thejaswini6/reviveai.git)  
**Branch:** `feature`  
**Hosting Platform:** GoDaddy Node.js PaaS Hosting (`ss-product-id: paas-nodejs-v1`)  

---

## 1. Submission Form Ready-to-Copy Content

### Title
```text
ReviveAI — Autonomous Revenue Recovery Agent for Small Businesses
```

### Theme
```text
Small Business Innovation
```

### Demo Link
```text
https://reviveaiapp.com
```

### Repository URL
```text
https://github.com/Thejaswini6/reviveai.git
```

### Description

```markdown
### Tagline
Turn Silent Leads into Recovered Revenue — AI-Powered Customer Recovery for Small Businesses.

### The Problem
Small service businesses (HVAC, plumbing, electrical contractors) lose 30% to 40% of their annual revenue from prospective customers who request a quote but go silent. In our CoolCare AC Services benchmark dataset, 31.4% of customer inquiries (11 of 35 leads) stalled in a STALE status, leaving ₹3,19,600 of potential pipeline at risk. Business owners are out in the field doing service work and cannot follow up in time, while generic email drip tools send robotic mass spam that risks contacting opted-out clients or active complaints.

### The Solution: ReviveAI
ReviveAI is an autonomous, human-in-the-loop revenue recovery agent powered by Anthropic Claude Sonnet 5.5, deployed on GoDaddy Node.js Hosting with a custom GoDaddy domain (reviveaiapp.com) and Titan Business Email (thejaswini@reviveaiapp.com).

### Core Architecture & Key Capabilities
1. **Deterministic Safety Gating (Pre-AI Filter):** 10 strict business safety rules intercept leads before calling the AI. Opted-out customers, duplicate records, converted accounts, premature inquiries (<48h), and active customer complaints are strictly prohibited from automated outreach.
2. **6-Tool Claude Agent:** When analyzing an eligible lead, Claude Sonnet 5.5 executes a structured 6-tool chain (`fetch_lead_context`, `get_interaction_history`, `calculate_revenue_at_risk`, `create_recovery_recommendation`, `generate_recovery_message`, and `request_approval`) to synthesize customer sentiment, apply real business policies (such as CoolCare's free inspection and 90-day warranty), and draft personalized outreach.
3. **Mandatory Human-in-the-Loop Approval:** No message is ever dispatched autonomously. Every draft enters an interactive Approval Queue where the owner inspects the exact AI reasoning, step-by-step tool trace, and generated email preview before approving or rejecting.
4. **GoDaddy Cloud & Mailbox Integration:** Built and published live on GoDaddy Node.js Hosting under https://reviveaiapp.com, connected directly to Titan Business Email (thejaswini@reviveaiapp.com) through GoDaddy's authenticated email gateway.
5. **Persistent Data Layer:** Unified repository architecture supporting GoDaddy Hosted MySQL with connection pooling, parameterized queries, and idempotent migrations.

### Reconciled Business Impact Metrics
- **Gross Open Pipeline at Risk:** ₹3,19,600 across 35 canonical leads
- **Eligible Recovery Opportunity:** ₹2,48,300 across 16 eligible stale leads
- **Confirmed Recovered Revenue:** ₹50,200 across successfully won customers
- **Lead Conversion Rate:** 22.9% (8 of 35 leads converted)
- **Revenue Recovery Rate:** 20.2% (₹50,200 recovered / ₹2,48,300 eligible opportunity)
- **Domain Independence:** Multi-business engine verified across both HVAC (CoolCare) and Plumbing (FlowFix) profiles.
```

---

## 2. End-to-End Approval & Email Workflow (Deep Dive)

### When an Approval is Triggered — How does it work?

```
[Customer Inquiry] ──▶ Ingested into ReviveAI Pipeline (Status: NEW / STALE)
                             │
                             ▼
                 [Deterministic Safety Check]
              (Filters out Opt-outs, Complaints, etc.)
                             │
                             ▼
                 [Claude Sonnet 5.5 Agent]
               (Executes 6-step tool chain)
                             │
                             ▼
                  [Approval Queue Staged]
               (Status: PENDING_APPROVAL)
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
      [OWNER REJECTS]                  [OWNER APPROVES]
    Status: REJECTED                 Status: CONTACTED
    Feedback logged                  Timestamp updated
    No email sent                    Outbound Email Dispatched
                                              │
                                              ▼
                             [GoDaddy / Titan Email Gateway]
                             Container Port 2525 / Titan Mailbox
                                              │
                                              ▼
                                 [Delivered to Customer]
```

#### Detailed Execution Steps:
1. **Agent Formulation:**
   When an eligible lead (e.g. `RV-2001`, Rajesh Mehta) undergoes AI analysis, the Claude agent executes:
   - `fetch_lead_context`: Loads customer data, CoolCare terms (free inspection, 90-day warranty, GST compliance).
   - `get_interaction_history`: Identifies 7 days of inactivity following an initial quotation for a 3-ton cassette AC installation.
   - `calculate_revenue_at_risk`: Computes ₹15,000 potential pipeline.
   - `create_recovery_recommendation`: Selects technical reassurance and free site inspection as the winning angle.
   - `generate_recovery_message`: Drafts a professional, contextual email.
   - `request_approval`: Staged in the database with status `pending`.

2. **Owner Review in Approval Queue:**
   The business owner navigates to the **Approval Queue** in the web app:
   - Sees the customer name, potential value (₹15,000), and AI confidence score.
   - Clicks "View Full Analysis & Trace" to expand the exact 6-step agent tool trace showing every tool call, input, and output.
   - Reviews the generated subject and body.

3. **Approval Execution:**
   - When the owner clicks **"✓ Approve"**, the frontend sends `POST /api/agent/actions/:id/approve`.
   - The backend runs a final **pre-send safety verification** (verifying consent has not changed, lead is not opted out).
   - The lead's status is atomically changed to `CONTACTED`, and `last_contacted_at` is stamped.
   - Outbound dispatch is invoked via `sendRecoveryOutreach()`:
     - Synthetic demo leads (e.g., Rajesh Mehta, Priya Nair) are protected by strictly simulated dispatch logs to prevent accidental outbound spam.
     - Outbound contact inquiries from the website form use real GoDaddy Node.js Container Email Gateway (`http://127.0.0.1:2525/api/email/send`) delivering to `thejaswini@reviveaiapp.com`.

4. **Rejection Execution:**
   - If the owner clicks **"✕ Reject"**, the action status changes to `rejected`.
   - No email is sent.
   - The lead remains in its previous state with an audit trail entry.

---

## 3. How to Perform End-to-End (E2E) Testing

### Testing Strategy:
E2E testing is divided into **Automated E2E**, **Browser Smoke E2E**, and **Live Public Domain Verification**:

### A. Automated E2E Test Suite (Local CLI)
```bash
# 1. Production Build & Smoke Test
cmd.exe /c "node packages/server/scripts/test-prod-smoke.js"

# 2. 40-Point API & Contract Verification
cmd.exe /c "npx tsx packages/server/scripts/verify-api.ts"

# 3. 10 Core Safety Regression Scenarios
cmd.exe /c "npx tsx packages/server/scripts/verify-scenarios.ts"

# 4. 50-Point Claude Agent & Tool Verification
cmd.exe /c "npx tsx packages/server/scripts/test-agent.ts"
```

### B. Manual Interactive E2E Verification (On `https://reviveaiapp.com`)

1. **Test Contact Us Form (Domain Mailbox Delivery):**
   - Navigate to `https://reviveaiapp.com` and click **"Contact Us"** in the sidebar navigation or public footer.
   - Fill in:
     - Name: `Hackathon Evaluator`
     - Email: `evaluator@godaddy.com`
     - Subject: `ReviveAI Live Test`
     - Message: `Testing GoDaddy Node.js hosting email gateway to domain mailbox.`
   - Click **"✉️ Send Message"**.
   - **Expected Result:** Instant confirmation card: *"Thank you! Your message has been sent to our team at thejaswini@reviveaiapp.com."*

2. **Test Lead Ingestion (+ New Inquiry):**
   - Click **"Dashboard"** → Click purple **"+ New Inquiry"** button in header.
   - Click the preset **"⚡ Urgent AC Repair"** (auto-fills Ananya Deshmukh, ₹4,500).
   - Click **"+ Ingest Lead"**.
   - **Expected Result:** Toast appears: *"Lead RV-XXXX successfully added to pipeline!"*, modal closes, and Ananya Deshmukh appears at the top of the lead table with status `NEW`.

3. **Test AI Recovery Analysis:**
   - On the Dashboard, find stale lead **Rajesh Mehta (RV-2001)** → Click **"View →"**.
   - Click **"🤖 Run AI Recovery Analysis"**.
   - **Expected Result:** Claude agent executes the 6-step tool chain, displays the recovery strategy (technical reassurance, free inspection), and stages the action in the Approval Queue.

4. **Test Approval Queue:**
   - Click **"Approval Queue"** in the sidebar → Inspect Rajesh Mehta's recommendation.
   - Click **"✓ Approve"**.
   - **Expected Result:** Status transitions to `approved`, and lead status updates to `CONTACTED`.

5. **Test Privacy Gating:**
   - Navigate to **Meera Joshi (RV-1006)** (Opted-Out customer).
   - Attempt recovery analysis or approval.
   - **Expected Result:** System blocks the operation with deterministic safety banner: *"Customer has explicitly opted out of communications."*

---

## 4. GoDaddy Hosted MySQL & Database Safety Guide

### How to Export SQL Backup via GoDaddy Dashboard:
1. Log in to the **GoDaddy Node.js Hosting** dashboard.
2. Navigate to the **Databases** or **Hosted Database** tab.
3. Select your database instance (`DB_NAME`).
4. Click **Export SQL** or **Backup Database** to download a `.sql` snapshot to your local computer.
5. Once downloaded, your database state is safely backed up.

### Idempotent, Additive Migration Guarantee:
- The application uses `CREATE TABLE IF NOT EXISTS` for all tables (`businesses`, `leads`, `agent_actions`, `email_logs`, `_migrations`).
- Tables and records are **never dropped or truncated** on startup.
- The 35 canonical leads are seeded **only if `SELECT COUNT(*) FROM leads` is 0**. Existing records and approval states are permanently preserved across restarts.
