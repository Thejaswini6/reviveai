# ReviveAI – Demo Plan & Lead Scenarios

## 10 Demo Leads: CoolCare AC Services

All leads are fictional AC repair business customers with realistic scenarios.

### Demo Lead #1: RV-1001 – Rahul Sharma (Primary Recovery Candidate)

**Status:** NEW / Stale  
**Service:** AC repair  
**Created:** 15 Nov 2026 (4 days old)  
**Revenue at Risk:** ₹4,000  
**Contact:** email (rahul.demo@example.invalid)

**Customer Message:**
> "My split AC is running but not cooling. Can someone visit this week?"

**Situation:** Straightforward repair inquiry, no response yet.

**Expected Claude Recommendation:**
- Priority: HIGH
- Likely reason: Possibly reached out to competitors, waiting for cheaper quote
- Suggested action: Confirm technician availability, emphasize rapid service
- Tone: Professional, reassuring
- Channel: Email
- Sample message: "Hi Rahul, we're ready to help with your AC cooling issue. Our technician can visit this week—would Tuesday or Wednesday suit you?"

**Test Objective:** Validate Claude generates relevant, personalized recovery message for straightforward inquiry.

---

### Demo Lead #2: RV-1002 – Priya Nair (Recovery with Complexity)

**Status:** QUOTE_SENT / Stale  
**Service:** AC servicing  
**Created:** 14 Nov 2026 (5 days old)  
**Quote Sent:** 15 Nov 2026  
**Revenue at Risk:** ₹8,500 (highest value)  
**Contact:** email (priya.demo@example.invalid)  
**Follow-ups:** 1

**Customer Message:**
> "Please share the quote for a full AC service and confirm whether gas pressure checking is included."

**Quote Status:** Sent, but customer asked specific question ("gas pressure checking").

**Expected Claude Recommendation:**
- Priority: VERY HIGH (high value, specific concern)
- Likely reason: Wants confirmation before booking, comparing with other providers
- Suggested action: Answer specific question, provide detailed service breakdown
- Tone: Helpful, informative, professional
- Channel: Email
- Sample message: "Hi Priya, thanks for your interest. Our ₹8,500 service includes gas pressure checking—see attached detailed breakdown. Ready to confirm your booking?"

**Test Objective:** Validate Claude addresses specific customer concerns in follow-up, not generic message.

---

### Demo Lead #3: RV-1003 – Amit Verma (Borderline Stale)

**Status:** BOOKING_PENDING  
**Service:** AC installation  
**Created:** 16 Nov 2026 (3 days old)  
**Last Contacted:** 16 Nov 2026 (same day)  
**Revenue at Risk:** ₹2,500  
**Contact:** email (amit.demo@example.invalid)

**Customer Message:**
> "I want to install an AC in the bedroom. I have selected a unit but need an installation slot."

**Situation:** Tentative slot discussed but not confirmed. Exactly 3 days old (threshold question).

**Expected Behavior:**
- **System Check:** Is this stale enough? (Depends on threshold: >3 days or ≥3 days)
- **If >3 days only:** Not yet recommended for Claude
- **If ≥3 days:** Marginal candidate
- Claude recommendation: Confirm installation date, offer specific time slots
- Tone: Confirmatory, helpful
- Sample message: "Hi Amit, confirming your bedroom AC installation. We have availability Tuesday 2-4 PM or Wednesday 10 AM-12 PM. Which works?"

**Test Objective:** Validate stale detection threshold behavior. 3 days is a boundary case.

---

### Demo Lead #4: RV-1004 – Neha Iyer (Callback Request – Escalate)

**Status:** CALLBACK_REQUESTED  
**Service:** AC repair  
**Created:** 18 Nov 2026 (1 day old)  
**Preferred Channel:** PHONE (NOT email)  
**Revenue at Risk:** ₹5,000  
**Contact:** neha.demo@example.invalid

**Customer Message:**
> "The AC is making a rattling noise. Please call me after 6 PM to discuss a visit."

**Situation:** Customer explicitly requested phone callback after 6 PM. Recent inquiry.

**Expected Behavior:**
- **Deterministic Check:** FAILS – Callback requested + phone preference
- **Result:** DO NOT SEND EMAIL. Flag for human handling.
- **Action Required:** Route to phone callback queue, schedule call after 6 PM
- **System Output:** "Escalate to human – preferred contact: phone (after 6 PM)"

**Test Objective:** Validate that callback requests are honored (don't email), preferred channel respected, escalation works.

---

### Demo Lead #5: RV-1005 – Sanjay Kulkarni (Declined – Respect)

**Status:** DECLINED  
**Service:** AC repair  
**Created:** 15 Nov 2026 (4 days old)  
**Last Contacted:** 16 Nov 2026  
**Revenue at Risk:** ₹3,000 (not at risk – decision made)  
**Contact:** email (sanjay.demo@example.invalid)

**Customer Message:**
> "Thanks for the estimate. I have decided not to proceed at this time."

**Situation:** Customer explicitly declined. Clear, respectful refusal.

**Expected Behavior:**
- **Deterministic Check:** FAILS – Status = DECLINED
- **Result:** DO NOT GENERATE RECOVERY MESSAGE
- **System Output:** "Lead declined. Respect customer decision. No further outreach."
- **Action:** Monitor for future inquiries, do not pursue this lead

**Test Objective:** Validate that declined leads are never proposed for recovery, respecting customer autonomy.

---

### Demo Lead #6: RV-1006 – Meera Joshi (Opted Out – Compliance)

**Status:** QUOTE_SENT  
**Service:** AC servicing  
**Created:** 13 Nov 2026 (6 days old)  
**Contact Consent:** OPTED_OUT  
**Revenue at Risk:** ₹6,000 (not at risk – opted out)  
**Contact:** email (meera.demo@example.invalid)

**Customer Message:**
> "Please send the annual maintenance package details."

**Situation:** Quote sent, but customer has opted out of promotional/follow-up emails.

**Expected Behavior:**
- **Deterministic Check:** FAILS – Contact consent = OPTED_OUT
- **Result:** DO NOT CONTACT. Legal compliance required.
- **System Output:** "Customer opted out. No further email contact permitted. Respect unsubscribe."
- **Action:** Do not generate any outreach, comply with privacy preferences

**Test Objective:** Validate that opted-out customers are never contacted (GDPR/privacy compliance).

---

### Demo Lead #7: RV-1007 – Arjun Rao (Success – Exclude)

**Status:** CONVERTED  
**Service:** AC repair  
**Created:** 13 Nov 2026 (6 days old)  
**Last Contacted:** 17 Nov 2026  
**Booking Status:** CONFIRMED  
**Payment Status:** PAID  
**Revenue at Risk:** ₹0 (already recovered)  
**Contact:** email (arjun.demo@example.invalid)

**Customer Message:**
> "The technician completed the repair. Thank you."

**Situation:** Job completed, payment received. This is a success, not a recovery opportunity.

**Expected Behavior:**
- **Deterministic Checks:** FAILS – Status = CONVERTED + Payment = PAID
- **Result:** DO NOT CONTACT. This lead is already won.
- **System Output:** "Lead converted and paid. Job complete. Exclude from recovery outreach."
- **Action:** Include in success metrics, not recovery metrics

**Test Objective:** Validate that already-converted, paid leads are excluded from recovery analysis (avoid bothering satisfied customers).

---

### Demo Lead #8: RV-1008 – Farah Khan (Complaint – Escalate to Manager)

**Status:** CALLBACK_REQUESTED  
**Service:** AC repair  
**Created:** 17 Nov 2026 (2 days old)  
**Last Contacted:** 18 Nov 2026  
**Preferred Channel:** PHONE  
**Revenue at Risk:** ₹4,500 (potential, requires manual handling)  
**Contact:** email (farah.demo@example.invalid)

**Customer Message:**
> "The technician arrived late last time and I am unhappy with the service. I want a manager to call me."

**Situation:** Dissatisfied customer, explicit manager callback request. This is a complaint, not a simple recovery.

**Expected Behavior:**
- **Deterministic Checks:** FAILS – Callback requested + complaint sentiment
- **Result:** ESCALATE TO MANAGER. Do not send cheerful sales message.
- **System Output:** "Complaint detected. Preferred action: manager callback. Route to human."
- **Action:** Flag for senior staff, schedule manager call, address service issue

**Test Objective:** Validate that complaints are escalated (not auto-replied), manager intervention triggered, preferred channel honored.

---

### Demo Lead #9: RV-1009 – Rahul Sharma (Duplicate – Flag & Skip)

**Status:** NEW  
**Service:** AC repair  
**Created:** 16 Nov 2026 (3 days old)  
**Revenue at Risk:** ₹4,000  
**Contact:** email (rahul.demo@example.invalid)  
**Duplicate Of:** RV-1001

**Customer Message:**
> "Following up on my AC repair enquiry. Can you confirm whether a technician is available?"

**Situation:** Same customer (Rahul Sharma, same email), same service type, 1 day after RV-1001. Likely duplicate or follow-up from same person.

**Expected Behavior:**
- **Duplicate Detection:** Flags as duplicate of RV-1001 (same email + service + date proximity)
- **Result:** DO NOT CREATE SEPARATE RECOVERY SEQUENCE
- **System Output:** "Duplicate detected. Linked to RV-1001. Merge or skip."
- **Action:** Log in duplicate_of_lead_id, consolidate interactions, single recovery plan

**Test Objective:** Validate duplicate detection (email + service + date matching), prevent double-contacting same customer twice.

---

### Demo Lead #10: RV-1010 – Kavya Menon (Too Recent – Monitor)

**Status:** NEW  
**Service:** AC installation  
**Created:** 19 Nov 2026 (0 days old – TODAY)  
**Revenue at Risk:** ₹3,500  
**Contact:** email (kavya.demo@example.invalid)

**Customer Message:**
> "I am comparing installation options. Could you explain what is included in the installation fee?"

**Situation:** Brand new inquiry, received today. Comparison shopping, not yet stale.

**Expected Behavior:**
- **Deterministic Check:** NOT STALE (<3 days old)
- **Result:** DO NOT ANALYZE YET. Too premature for recovery follow-up.
- **System Output:** "Lead too recent. Monitor. Eligible for analysis in 3 days (22 Nov)."
- **Action:** Hold for later, monitor for natural response from customer

**Test Objective:** Validate that recent leads are protected from premature follow-up (don't spam fresh inquiries).

---

## Demo Workflow: End-to-End

### Scenario: Dashboard Load & Stale Detection

**Step 1: Dashboard Initial Load**
```
GET /api/leads
→ Display all 10 leads in table
→ Summary cards: 10 leads, ₹45,500 total revenue at risk, X pending approvals
```

**Expected Display:**
- All 10 leads visible in table
- Status column: NEW, QUOTE_SENT, BOOKING_PENDING, CALLBACK_REQUESTED, DECLINED, CONVERTED, OPTED_OUT
- Revenue column: Individual values
- "Trigger Analysis" button on each row

---

### Scenario: Stale Lead Detection Query

**Step 2: Backend Stale Detection**
```
POST /api/internal/leads/mark-stale
→ Query for leads >3 days old, no contact, not opted-out, not declined, not paid
```

**Expected Results:**
- ✅ RV-1001 (Rahul Sharma) – 4 days, NEW, stale
- ✅ RV-1002 (Priya Nair) – 5 days, QUOTE_SENT, stale
- ❌ RV-1003 (Amit Verma) – 3 days, exactly at threshold (depends on > vs ≥)
- ❌ RV-1004 (Neha Iyer) – 1 day, callback requested
- ❌ RV-1005 (Sanjay Kulkarni) – DECLINED
- ❌ RV-1006 (Meera Joshi) – OPTED_OUT
- ❌ RV-1007 (Arjun Rao) – CONVERTED
- ❌ RV-1008 (Farah Khan) – Callback + complaint
- ❌ RV-1009 (Rahul Sharma) – Duplicate of RV-1001
- ❌ RV-1010 (Kavya Menon) – 0 days, too recent

**Marked Stale:** RV-1001, RV-1002 (definitely)

---

### Scenario: Claude Analysis – RV-1001

**Step 3: User Clicks "Trigger Analysis" on RV-1001**
```
POST /api/agent/analyze-lead/RV-1001
```

**Deterministic Checks:**
- ✅ Not opted-out
- ✅ Not declined
- ✅ Not paid
- ✅ Not duplicate (standalone)
- ✅ Not callback request
- ✅ >3 days old
- → **PASS** – Call Claude

**Claude (Mock or Real):**
```
Analysis:
{
  "lead_id": "RV-1001",
  "priority": "high",
  "customer_intent": "AC repair service needed",
  "likely_reason_for_inactivity": "Possibly waiting for response or got quote from competitor",
  "evidence": ["No contact in 4 days", "Specific week preference stated"],
  "uncertainty": "Unknown if customer received initial quote or not",
  "recommended_action": "email",
  "suggested_channel": "email",
  "email_subject": "Your AC Repair – Technician Available This Week",
  "email_body": "Hi Rahul, Thanks for reaching out about your cooling issue. We're ready to help! Our technician can visit your home Tuesday or Wednesday this week. Please confirm your preferred date and time. [Link to confirm]",
  "requires_human_approval": true
}
```

**Tokens Used (Mock):** 0 (mock mode, no cost)  
**Tokens Used (Real):** ~1200 input, ~400 output = ~$0.0028

---

### Scenario: Approval Workflow – Approve RV-1001

**Step 4: Business Owner Reviews Message**
```
GET /api/agent/actions
→ Shows pending approval: RV-1001 message
→ Business owner reads suggested message
```

**Step 5: Business Owner Approves**
```
POST /api/agent/actions/:action_id/approve
```

**Backend Actions:**
- ✅ Mark action as approved (approved_at = now, approved_by = user)
- ✅ Send email (mock or real):
  ```
  To: rahul.demo@example.invalid
  Subject: Your AC Repair – Technician Available This Week
  Body: [approved message]
  ```
- ✅ Log email in email_logs table (status: sent)
- ✅ Update lead status: NEW → CONTACTED
- ✅ Record in agent_actions: status = "email_sent"

**Step 6: Timeline Updated**
```
GET /api/leads/RV-1001
→ interaction_history now shows:
  • 15 Nov: Website enquiry received
  • 19 Nov: Analysis requested
  • 19 Nov: Recovery message approved
  • 19 Nov: Email sent to customer
```

---

### Scenario: Reject & Try Different Message

**Alternate Step 5: Business Owner Rejects**
```
POST /api/agent/actions/:action_id/reject
Body: { reason: "Message too formal, needs friendlier tone" }
```

**Backend Actions:**
- ✅ Mark action as rejected (status = "rejected", reason stored)
- ✅ Do NOT send email
- ✅ Allow user to request new analysis or manually craft message

---

### Scenario: Try Unsafe Actions – Verify They're Blocked

**Test: Try to Analyze RV-1006 (Opted-Out)**
```
POST /api/agent/analyze-lead/RV-1006
```
**Expected Response:**
```json
{
  "success": false,
  "error": "Lead not eligible for analysis",
  "reason": "Customer has opted out of follow-up communications"
}
```

---

**Test: Try to Analyze RV-1005 (Declined)**
```
POST /api/agent/analyze-lead/RV-1005
```
**Expected Response:**
```json
{
  "success": false,
  "error": "Lead not eligible for analysis",
  "reason": "Customer declined this service"
}
```

---

**Test: Try to Analyze RV-1007 (Already Converted)**
```
POST /api/agent/analyze-lead/RV-1007
```
**Expected Response:**
```json
{
  "success": false,
  "error": "Lead not eligible for analysis",
  "reason": "Customer has already converted and paid"
}
```

---

**Test: Try to Analyze RV-1004 (Callback Requested)**
```
POST /api/agent/analyze-lead/RV-1004
```
**Expected Response:**
```json
{
  "success": false,
  "error": "Lead requires manual escalation",
  "reason": "Customer requested phone callback (preferred channel: phone). Route to phone queue.",
  "escalation": "callback_requested"
}
```

---

**Test: Try to Analyze RV-1009 (Duplicate)**
```
POST /api/agent/analyze-lead/RV-1009
```
**Expected Response:**
```json
{
  "success": false,
  "error": "Duplicate lead detected",
  "reason": "This lead is a duplicate of RV-1001",
  "suggestion": "Consolidate with parent lead RV-1001 instead"
}
```

---

## Success Criteria – Demo Validation

✅ **Import:** All 10 leads seeded without errors  
✅ **Dashboard:** All leads visible, correct status/revenue  
✅ **Stale Detection:** Only RV-1001, RV-1002 marked as stale  
✅ **Claude Analysis:** Different recommendations for RV-1001 vs RV-1002  
✅ **Safety Checks:** RV-1005, RV-1006, RV-1007, RV-1008, RV-1009 blocked  
✅ **Approval Workflow:** Message reviewed, approved, sent, logged  
✅ **Timeline:** All actions recorded in interaction history  
✅ **Audit Trail:** Complete activity log for compliance  

---

Last Updated: November 19, 2026
