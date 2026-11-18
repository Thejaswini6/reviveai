# ReviveAI Demo Leads – CSV Data Dictionary

**File:** `reviveai_demo_leads.csv`  
**Records:** 10 fictional AC repair business leads  
**Business:** CoolCare AC Services  
**Scope:** Comprehensive test scenarios for deterministic safety checks and Claude analysis

---

## CSV Column Reference

### Identification & Contact

| Column | Type | Required | Description | Example | Validation |
|--------|------|----------|-------------|---------|-----------|
| **lead_id** | STRING | YES | Unique lead identifier | RV-1001 | Format: `RV-NNNN`, case-sensitive, no duplicates (unless duplicate_of_lead_id set) |
| **business_name** | STRING | YES | Company name | CoolCare AC Services | Fixed value, must match business; used for filtering/reporting |
| **customer_name** | STRING | YES | Customer full name | Rahul Sharma | Non-empty, max 100 chars |
| **customer_email** | STRING | YES | Customer email | rahul.demo@example.invalid | Valid email format; .invalid used for demo (prevents accidental real sends) |
| **customer_phone** | STRING | YES | Customer phone | +91-00000-00001 | Indian format: `+91-XXXXX-NNNNN` where X=area, N=number |

### Service & Enquiry Details

| Column | Type | Required | Description | Example | Validation |
|--------|------|----------|-------------|---------|-----------|
| **service_type** | STRING | YES | Service category | AC repair | Enum: `AC repair`, `AC servicing`, `AC installation` |
| **enquiry_text** | STRING | YES | Customer's original message | "My split AC is not cooling..." | Non-empty, max 500 chars; verbatim customer text (not paraphrased) |
| **estimated_value_inr** | INTEGER | YES | Potential revenue (Indian Rupees) | 4000 | Positive integer, range 1500–10000, represents potential deal value |

### Lead Status & History

| Column | Type | Required | Description | Example | Validation |
|--------|------|----------|-------------|---------|-----------|
| **lead_status** | STRING | YES | Current lead state | NEW | Enum: `NEW`, `QUOTE_SENT`, `BOOKING_PENDING`, `CALLBACK_REQUESTED`, `DECLINED`, `CONVERTED`, `OPTED_OUT` |
| **created_at** | DATETIME | YES | When enquiry was received | 2026-11-15T10:15:00+05:30 | ISO 8601 + timezone (+05:30 IST); stored as UTC in DB |
| **last_contacted_at** | DATETIME | NO | Last business/agent contact | 2026-11-15T11:00:00+05:30 | ISO 8601 + timezone or NULL; must be ≥ created_at if set |
| **quote_sent_at** | DATETIME | NO | When quote was sent | 2026-11-15T11:00:00+05:30 | ISO 8601 + timezone or NULL; must be ≥ created_at if set |

### Follow-up Tracking

| Column | Type | Required | Description | Example | Validation |
|--------|------|----------|-------------|---------|-----------|
| **follow_up_count** | INTEGER | YES | Number of follow-ups attempted | 1 | Range: 0–10; incremented each time business contacts customer |
| **contact_consent** | STRING | YES | Opt-in/out status | CONSENTED | Enum: `CONSENTED` (can contact), `OPTED_OUT` (do not contact) |
| **preferred_channel** | STRING | YES | Customer's preferred contact method | email | Enum: `email`, `phone`; must be respected in recovery outreach |

### Transaction Status

| Column | Type | Required | Description | Example | Validation |
|--------|------|----------|-------------|---------|-----------|
| **booking_status** | STRING | YES | Booking confirmation state | NOT_BOOKED | Enum: `NOT_BOOKED`, `PENDING`, `CONFIRMED` |
| **payment_status** | STRING | YES | Payment received | NOT_PAID | Enum: `NOT_PAID`, `PAID` |

### Source & Context

| Column | Type | Required | Description | Example | Validation |
|--------|------|----------|-------------|---------|-----------|
| **source** | STRING | YES | How lead originated | WEBSITE | Enum: `WEBSITE`, `PHONE`, `REFERRAL` |
| **interaction_history** | STRING | YES | Human-readable activity log | "Quote sent 15 Nov..." | Narrative of all interactions (max 500 chars); used for context |
| **duplicate_of_lead_id** | STRING | NO | If duplicate, parent lead ID | RV-1001 | References another lead_id (if this is a duplicate) or NULL (if original) |

---

## Lead-by-Lead Analysis

### Lead RV-1001: Rahul Sharma – Simple Inquiry (STALE, ELIGIBLE)

**Status:** NEW  
**Days Old:** 4 (created 15 Nov)  
**Revenue:** ₹4,000  

**Characteristics:**
- Straightforward AC repair request
- No response yet (no follow-ups)
- No contact request constraints
- Opted in, consented to contact

**Deterministic Checks:**
- ✅ Not opted out
- ✅ Not declined
- ✅ Not paid/converted
- ✅ Not a duplicate
- ✅ Not a callback request
- ✅ >3 days old

**Expected Action:** ✅ **ELIGIBLE for Claude analysis**

**Claude Should Recommend:** Friendly re-engagement, confirm availability, short turnaround

**Reason Stale:** No response in 4 days likely means customer lost interest, waiting for response, or contacted competitors

---

### Lead RV-1002: Priya Nair – Quote with Unanswered Question (STALE, ELIGIBLE)

**Status:** QUOTE_SENT  
**Days Old:** 5 (last contact 15 Nov)  
**Revenue:** ₹8,500 (highest value)  

**Characteristics:**
- Quote sent but customer has unresolved question
- Customer asked: "Does service include gas pressure checking?"
- One follow-up already attempted
- Opted in, consented

**Deterministic Checks:**
- ✅ Not opted out
- ✅ Not declined
- ✅ Not paid
- ✅ No duplicate
- ✅ Not callback request
- ✅ >3 days old

**Expected Action:** ✅ **ELIGIBLE for Claude analysis**

**Claude Should Recommend:** Answer specific question, provide detailed breakdown, address uncertainty, encourage booking

**Reason Stale:** Quote submitted but customer's concern not answered; risk of losing high-value deal (₹8,500)

---

### Lead RV-1003: Amit Verma – Booking Pending (BORDERLINE STALE)

**Status:** BOOKING_PENDING  
**Days Old:** 3 (created 16 Nov, last contact same day)  
**Revenue:** ₹2,500  

**Characteristics:**
- Installation service, tentative slot discussed
- Not yet confirmed
- Exactly 3 days old (threshold edge case)

**Deterministic Checks:**
- ✅ Not opted out
- ✅ Not declined
- ✅ Not paid
- ⚠️ Exactly 3 days old (depends on > vs ≥ threshold)

**Expected Action:** ⚠️ **MARGINAL – depends on threshold interpretation**

**If Threshold = >3 days (strictly greater):** NOT eligible  
**If Threshold = ≥3 days (greater or equal):** ELIGIBLE (marginal)

**Claude Should Recommend (if eligible):** Confirm booking slot, offer specific dates, remove friction

**Reason Stale (if eligible):** Customer is ready to book but hasn't confirmed; risk of losing momentum

---

### Lead RV-1004: Neha Iyer – Callback Request (ESCALATE, NOT ELIGIBLE)

**Status:** CALLBACK_REQUESTED  
**Preferred Channel:** PHONE (not email)  
**Days Old:** 1 (very recent)  
**Revenue:** ₹5,000  

**Characteristics:**
- Customer explicitly requested phone callback
- Specific time preference: "after 6 PM"
- Recent inquiry
- Opted in, but prefers phone

**Deterministic Checks:**
- ✅ Not opted out
- ✅ Not declined
- ✅ Not paid
- ❌ **CALLBACK_REQUESTED + PHONE preference**

**Expected Action:** ❌ **DO NOT SEND EMAIL. ESCALATE TO HUMAN for phone callback**

**System Response:** "Lead requires manual phone callback. Route to phone queue, schedule call after 6 PM."

**Reason to Skip:** Customer explicitly requested phone contact. Sending email violates preference and wastes Claude tokens. Route to phone team.

---

### Lead RV-1005: Sanjay Kulkarni – Explicit Decline (DO NOT CONTACT)

**Status:** DECLINED  
**Days Old:** 4 (declined 16 Nov)  
**Revenue:** ₹3,000 (not at risk – customer declined)  

**Characteristics:**
- Customer explicitly declined: "I have decided not to proceed"
- Clear refusal, not ambiguous
- Decline recorded in history

**Deterministic Checks:**
- ❌ **lead_status = DECLINED**

**Expected Action:** ❌ **DO NOT GENERATE RECOVERY MESSAGE. RESPECT DECISION.**

**System Response:** "Lead declined. Respect customer autonomy. No further outreach. Monitor for future inquiries."

**Reason to Skip:** Customer has explicitly said no. Generating pushy recovery emails would be disrespectful and potentially illegal (depending on jurisdiction). Revenue considered lost for this opportunity.

---

### Lead RV-1006: Meera Joshi – Opted Out (PRIVACY COMPLIANCE)

**Status:** QUOTE_SENT  
**Contact Consent:** OPTED_OUT  
**Days Old:** 6  
**Revenue:** ₹6,000 (not at risk – opted out)  

**Characteristics:**
- Quote sent but customer has opted out
- Opted out of promotional and follow-up emails (compliance flag)
- Cannot contact even though lead is stale

**Deterministic Checks:**
- ❌ **contact_consent = OPTED_OUT**

**Expected Action:** ❌ **DO NOT CONTACT. LEGAL COMPLIANCE REQUIRED.**

**System Response:** "Customer opted out of follow-up communications. No further email contact permitted. Comply with unsubscribe."

**Reason to Skip:** GDPR/privacy compliance. Customer explicitly unsubscribed. Contacting them could result in complaints, penalties, or legal issues. Revenue considered inaccessible due to privacy preference.

---

### Lead RV-1007: Arjun Rao – Success (ALREADY RECOVERED)

**Status:** CONVERTED  
**Booking Status:** CONFIRMED  
**Payment Status:** PAID  
**Days Old:** 6  
**Revenue:** ₹0 (already recovered)  

**Characteristics:**
- Job completed on 17 Nov
- Payment received
- This is a success, not a recovery opportunity

**Deterministic Checks:**
- ❌ **lead_status = CONVERTED**
- ❌ **payment_status = PAID**

**Expected Action:** ❌ **DO NOT CONTACT. EXCLUDE FROM RECOVERY METRICS.**

**System Response:** "Lead already converted and paid. Job complete. Include in success metrics, exclude from recovery analysis."

**Reason to Skip:** This lead is won. Contacting them would be:
1. Unnecessary (they already bought)
2. Annoying (don't spam satisfied customers)
3. Misleading (they're not a recovery case)

Include in success metrics and revenue tracking, not recovery candidate list.

---

### Lead RV-1008: Farah Khan – Complaint/Escalation (HUMAN REVIEW)

**Status:** CALLBACK_REQUESTED  
**Preferred Channel:** PHONE  
**Days Old:** 2  
**Revenue:** ₹4,500 (potential, requires manual handling)  

**Characteristics:**
- Complaint: "Technician arrived late, unhappy with service"
- Requested manager callback
- Explicit escalation request
- Recent inquiry

**Deterministic Checks:**
- ✅ Not opted out
- ⚠️ Not technically declined, but unhappy
- ❌ **CALLBACK_REQUESTED + COMPLAINT sentiment**

**Expected Action:** ❌ **DO NOT SEND CHEERFUL SALES MESSAGE. ESCALATE TO MANAGER.**

**System Response:** "Complaint detected. Preferred channel: phone callback. Escalate to senior staff for manager callback and service recovery."

**Reason to Skip:** This is a complaint resolution, not a sales opportunity. Sending a generic recovery message ("Hi Farah, we'd love to serve you!") would be:
1. Tone-deaf (ignores complaint)
2. Counterproductive (worsens customer relationship)
3. Inappropriate (needs manager, not bot)

Flag for manual handling by senior staff or manager.

---

### Lead RV-1009: Rahul Sharma – Duplicate (FLAG & SKIP)

**Status:** NEW  
**Created:** 16 Nov (3 days old)  
**Duplicate Of:** RV-1001  
**Revenue:** ₹4,000  

**Characteristics:**
- Same customer: Rahul Sharma
- Same email: rahul.demo@example.invalid
- Same service: AC repair
- Created 1 day after RV-1001
- Similar request: "Following up on my AC repair enquiry"

**Duplicate Detection Algorithm:**
```
Same email (rahul.demo@example.invalid) +
Same service (AC repair) +
Date proximity (16 Nov is 1 day after 15 Nov) +
CSV explicitly marks duplicate_of_lead_id = RV-1001
→ DEFINITELY a duplicate
```

**Expected Action:** ❌ **FLAG AS DUPLICATE. DO NOT CREATE SEPARATE RECOVERY SEQUENCE.**

**System Response:** "Duplicate detected. Linked to RV-1001. Consolidate interactions into single lead record."

**Reason to Skip:** 
1. Prevent double-contacting the same customer
2. Consolidate interactions into single record
3. Avoid duplicate revenue calculations
4. RV-1009 is essentially a follow-up message to RV-1001, not a new lead

Merge into RV-1001, update interaction history to show both messages.

---

### Lead RV-1010: Kavya Menon – Too Recent (MONITOR, NOT YET STALE)

**Status:** NEW  
**Created:** 19 Nov (0 days old – TODAY)  
**Revenue:** ₹3,500  

**Characteristics:**
- Brand new enquiry, received today
- Customer comparing installation options
- Likely in research phase, not ready for follow-up yet
- Opted in, no issues

**Deterministic Checks:**
- ✅ Not opted out
- ✅ Not declined
- ✅ Not paid
- ❌ **NOT YET STALE (<3 days old)**

**Expected Action:** ❌ **DO NOT ANALYZE YET. MONITOR FOR LATER.**

**System Response:** "Lead too recent. Monitor. Eligible for analysis in 3 days (22 Nov)."

**Reason to Skip:** Sending a recovery email after 0 hours is:
1. Premature (customer just inquired)
2. Spammy (too aggressive)
3. Counterproductive (risks annoying customer)

Let the customer have time to research. Monitor for natural response. If no response by 22 Nov, then escalate to stale lead recovery.

---

## Import & Validation Summary

### Expected Import Results

| Lead | Import Status | Reason |
|------|---|---|
| RV-1001 | ✅ Imported | Valid, stale, eligible |
| RV-1002 | ✅ Imported | Valid, stale, eligible |
| RV-1003 | ✅ Imported | Valid, borderline stale |
| RV-1004 | ✅ Imported | Valid (callback leads still imported, but flagged for escalation) |
| RV-1005 | ✅ Imported | Valid (declined leads imported, but flagged as no-contact) |
| RV-1006 | ✅ Imported | Valid (opted-out leads imported, but flagged as no-contact) |
| RV-1007 | ✅ Imported | Valid (converted leads imported, but excluded from recovery) |
| RV-1008 | ✅ Imported | Valid (complaint leads imported, but flagged for escalation) |
| RV-1009 | ✅ Imported | Valid, but flagged as duplicate of RV-1001 |
| RV-1010 | ✅ Imported | Valid (new leads imported, but too recent for analysis) |

**Final Count:** 10 leads imported (or 9 if duplicate merge implemented)

### Eligibility for Claude Analysis (Primary MVP Use Case)

| Lead | Eligible | Why |
|------|----------|-----|
| RV-1001 | ✅ YES | Stale, no issues |
| RV-1002 | ✅ YES | Stale, no issues |
| RV-1003 | ⚠️ MAYBE | Borderline (exactly 3 days old) |
| All Others | ❌ NO | Various reasons (callback, declined, opted-out, paid, duplicate, too recent) |

**Primary Test Scenario:** Analyze RV-1001 and RV-1002, verify different recommendations.

---

## Field Mapping: CSV → Database

**CSV Column → Database Table/Column:**

```
lead_id → leads.id (primary key)
business_name → (join to businesses table)
customer_name → leads.name
customer_email → leads.email
customer_phone → leads.phone
service_type → (stored as enum, could be separate column)
enquiry_text → leads.message
estimated_value_inr → leads.potential_value
lead_status → leads.status
created_at → leads.received_at (ISO 8601 UTC)
last_contacted_at → leads.last_contacted_at
quote_sent_at → agent_actions.created_at (for quote action)
follow_up_count → leads.follow_up_count
contact_consent → leads.contact_consent (CONSENTED/OPTED_OUT)
preferred_channel → leads.preferred_channel
booking_status → (could be separate column or encoded in status)
payment_status → leads.payment_status (derived or separate)
source → leads.source
interaction_history → agent_actions.notes (as text summary)
duplicate_of_lead_id → leads.duplicate_of_lead_id
```

---

## Date & Time Handling

### CSV Format
```
2026-11-15T10:15:00+05:30
│         │         │
│         │         └─ Timezone: +05:30 (IST, India Standard Time)
│         └─────────── Time: 10:15 AM
└───────────────────── Date: 15 Nov 2026 (ISO 8601)
```

### Database Storage
- Stored as UTC (Coordinated Universal Time)
- JavaScript: `new Date('2026-11-15T10:15:00+05:30')` automatically converts to UTC
- Display: Converted back to IST (+05:30) for user-facing timestamps

### Age Calculation
```typescript
// Determine if lead is stale (>3 days old)
const ageInDays = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
const isStale = ageInDays > 3
```

**Reference Date for Demo:** 19 Nov 2026 (today)
- RV-1001: 4 days old → stale
- RV-1002: 5 days old → stale
- RV-1003: 3 days old → borderline
- RV-1010: 0 days old → not stale

---

## Currency & Revenue

### Format
- All values in **Indian Rupees (₹)**
- No currency symbol in CSV (just numbers)
- Range: ₹2,500 to ₹9,500 for demo leads

### Display
```typescript
const formatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR'
})
formatter.format(4000)  // "₹4,000"
```

### Parsing
```typescript
const value = parseInt(estimated_value_inr)  // Remove commas, convert to number
```

---

## Validation Rules Summary

### Required Fields
All 20 CSV columns are required (no optional columns in MVP)

### Type Validations
- lead_id: matches `RV-\d{4}` regex
- Emails: valid email format
- Phones: matches `+91-\d{5}-\d{5}` regex
- Dates: valid ISO 8601 datetime
- Numbers: positive integers
- Enums: must match allowed values

### Business Rule Validations
1. If `duplicate_of_lead_id` is set, must reference valid existing lead
2. If `payment_status = PAID`, then `lead_status = CONVERTED`
3. If `contact_consent = OPTED_OUT`, don't generate outreach
4. If `lead_status = DECLINED`, don't generate outreach
5. `created_at` must be before `last_contacted_at`, `quote_sent_at`

---

## Import Error Handling

**Example Error Report:**

```json
{
  "total_records": 10,
  "imported": 9,
  "skipped": 1,
  "errors": [
    {
      "row": 5,
      "lead_id": "RV-1005X",
      "error": "Invalid lead_id format. Expected RV-NNNN",
      "suggestion": "Verify lead_id column. Format must be RV- followed by 4 digits."
    }
  ],
  "duplicates_found": [
    {
      "lead_id": "RV-1009",
      "duplicate_of": "RV-1001",
      "action": "skipped (marked as duplicate, consolidate with parent)"
    }
  ],
  "warnings": [
    "Lead RV-1003 is exactly 3 days old (stale threshold). Will be marked as stale if threshold is >= 3 days."
  ]
}
```

---

## Usage in Tests

### Test Scenario 1: Import & Verify
```bash
pnpm run db:seed
# Expected: "Imported 10 leads successfully"
```

### Test Scenario 2: Stale Detection
```typescript
const staleLeads = await getStaleLeads()
// Expected: [RV-1001, RV-1002]
```

### Test Scenario 3: Safety Check
```typescript
const canAnalyze = await canAnalyzeLead('RV-1006')
// Expected: false (opted out)
```

### Test Scenario 4: Claude Analysis
```typescript
const analysis = await analyzeLeadWithClaude('RV-1001')
// Expected: { priority: 'high', customer_intent: '...', ... }
```

---

Last Updated: November 19, 2026
