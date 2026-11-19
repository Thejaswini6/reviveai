/**
 * Realistic Mock Data for ReviveAI Demo
 * Includes edge cases and diverse scenarios
 */

export interface Lead {
  id: string
  business_id: string
  name: string
  email: string
  phone: string
  message: string
  enquiry_type: string
  potential_value: number
  status: string
  received_at: string
  last_contacted_at: string | null
  follow_up_count: number
  contact_consent: string
  preferred_channel: string
  booking_status: string
  payment_status: string
  source: string
  duplicate_of_lead_id: string | null
  created_at: string
}

export interface AgentAction {
  id: string
  lead_id: string
  lead_name: string
  action_type: string
  status: string
  analysis_json: string
  generated_message: string
  approval_requested_at: string
  approved_by: string | null
  approved_at: string | null
  rejection_reason: string | null
  executed_at: string | null
  error_message: string | null
  created_at: string
}

// Helper to get date N days ago
const daysAgo = (days: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString()
}

// Helper to get date N hours ago
const hoursAgo = (hours: number): string => {
  const date = new Date()
  date.setHours(date.getHours() - hours)
  return date.toISOString()
}

/**
 * REALISTIC MOCK LEADS WITH EDGE CASES
 * Total: 25 leads covering various scenarios
 */
export const MOCK_LEADS: Lead[] = [
  // ===== HIGH-VALUE OPPORTUNITIES (Stale, Need Immediate Attention) =====
  {
    id: 'RV-2001',
    business_id: 'business-001',
    name: 'Rajesh Mehta',
    email: 'rajesh.mehta@techcorp.invalid',
    phone: '+91-98765-10001',
    message: 'Need urgent central AC maintenance for our office (1200 sq ft). Last service was 8 months ago. System showing error codes E1 and E3. Budget approved up to ₹15,000. Please send detailed quote with timeline.',
    enquiry_type: 'AC servicing',
    potential_value: 15000,
    status: 'STALE',
    received_at: daysAgo(6),
    last_contacted_at: daysAgo(6),
    follow_up_count: 1,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(6)
  },
  
  {
    id: 'RV-2002',
    business_id: 'business-001',
    name: 'Priya Venkatesh',
    email: 'priya.v@homemail.invalid',
    phone: '+91-98765-10002',
    message: 'Interested in installing 3 new split ACs (1.5 ton each) in my newly constructed home. Rooms are on 2nd floor. Need complete installation including copper piping, stand, and electrical work. When can you visit for site inspection? Prefer weekends.',
    enquiry_type: 'AC installation',
    potential_value: 42000,
    status: 'STALE',
    received_at: daysAgo(8),
    last_contacted_at: null,
    follow_up_count: 0,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'REFERRAL',
    duplicate_of_lead_id: null,
    created_at: daysAgo(8)
  },

  // ===== MEDIUM-PRIORITY STALE LEADS =====
  {
    id: 'RV-2003',
    business_id: 'business-001',
    name: 'Amit Kumar Singh',
    email: 'amit.k.singh@email.invalid',
    phone: '+91-98765-10003',
    message: 'My bedroom AC (Samsung 1 ton) stopped cooling suddenly. Compressor is running but no cold air. Unit is 3 years old, under extended warranty. Can you check if warranty covers this repair?',
    enquiry_type: 'AC repair',
    potential_value: 3500,
    status: 'STALE',
    received_at: daysAgo(5),
    last_contacted_at: daysAgo(4),
    follow_up_count: 1,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(5)
  },

  {
    id: 'RV-2004',
    business_id: 'business-001',
    name: 'Sneha Reddy',
    email: 'sneha.reddy22@webmail.invalid',
    phone: '+91-98765-10004',
    message: 'Got your quote for AC gas refilling (₹2,800). Just want to confirm - is R-32 gas included? Also, do you provide same-day service? My AC stopped cooling 2 days back and it\'s really hot.',
    enquiry_type: 'AC repair',
    potential_value: 2800,
    status: 'STALE',
    received_at: daysAgo(4),
    last_contacted_at: daysAgo(4),
    follow_up_count: 1,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'PHONE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(4)
  },

  {
    id: 'RV-2005',
    business_id: 'business-001',
    name: 'Vikram Joshi',
    email: 'vikramjoshi@fastmail.invalid',
    phone: '+91-98765-10005',
    message: 'AC making loud rattling noise when starting. Otherwise cooling is fine. Is this serious? Can it wait or should I get it checked immediately? Also, rough estimate for diagnosis?',
    enquiry_type: 'AC repair',
    potential_value: 4200,
    status: 'STALE',
    received_at: daysAgo(7),
    last_contacted_at: null,
    follow_up_count: 0,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(7)
  },

  // ===== BORDERLINE CASES (3 days old - threshold) =====
  {
    id: 'RV-2006',
    business_id: 'business-001',
    name: 'Kavita Sharma',
    email: 'kavita.sharma@inbox.invalid',
    phone: '+91-98765-10006',
    message: 'Looking for annual maintenance contract for 2 ACs (home). What does your AMC package include? Any seasonal discounts available?',
    enquiry_type: 'AC servicing',
    potential_value: 6500,
    status: 'NEW',
    received_at: daysAgo(3),
    last_contacted_at: null,
    follow_up_count: 0,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(3)
  },

  // ===== VERY FRESH LEADS (Should NOT be analyzed yet) =====
  {
    id: 'RV-2007',
    business_id: 'business-001',
    name: 'Arjun Nair',
    email: 'arjun.nair@cloudmail.invalid',
    phone: '+91-98765-10007',
    message: 'AC remote not working. Tried changing batteries but no luck. Do you repair remotes or only ACs?',
    enquiry_type: 'AC repair',
    potential_value: 800,
    status: 'NEW',
    received_at: hoursAgo(18),
    last_contacted_at: null,
    follow_up_count: 0,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: hoursAgo(18)
  },

  {
    id: 'RV-2008',
    business_id: 'business-001',
    name: 'Deepa Iyer',
    email: 'deepa.iyer@mailservice.invalid',
    phone: '+91-98765-10008',
    message: 'Just bought a new 2-ton window AC. Need installation. Building is 15 years old, not sure about electrical capacity. Can you assess and install?',
    enquiry_type: 'AC installation',
    potential_value: 3500,
    status: 'NEW',
    received_at: hoursAgo(6),
    last_contacted_at: null,
    follow_up_count: 0,
    contact_consent: 'CONSENTED',
    preferred_channel: 'phone',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: hoursAgo(6)
  },

  // ===== CALLBACK REQUESTS (Should escalate to phone team) =====
  {
    id: 'RV-2009',
    business_id: 'business-001',
    name: 'Suresh Patil',
    email: 'suresh.patil@businessmail.invalid',
    phone: '+91-98765-10009',
    message: 'URGENT: Water leaking from indoor AC unit into living room! Please call me ASAP between 9 AM - 6 PM. Need emergency service today.',
    enquiry_type: 'AC repair',
    potential_value: 5500,
    status: 'NEW',
    received_at: hoursAgo(3),
    last_contacted_at: null,
    follow_up_count: 0,
    contact_consent: 'CONSENTED',
    preferred_channel: 'phone',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'PHONE',
    duplicate_of_lead_id: null,
    created_at: hoursAgo(3)
  },

  {
    id: 'RV-2010',
    business_id: 'business-001',
    name: 'Meena Desai',
    email: 'meena.d@webportal.invalid',
    phone: '+91-98765-10010',
    message: 'Please call after 7 PM. Want to discuss commercial AC installation for small shop (300 sq ft). Prefer voice discussion for pricing.',
    enquiry_type: 'AC installation',
    potential_value: 35000,
    status: 'NEW',
    received_at: daysAgo(2),
    last_contacted_at: null,
    follow_up_count: 0,
    contact_consent: 'CONSENTED',
    preferred_channel: 'phone',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(2)
  },

  // ===== OPTED OUT (DO NOT CONTACT) =====
  {
    id: 'RV-2011',
    business_id: 'business-001',
    name: 'Ramesh Gupta',
    email: 'ramesh.gupta@emailhost.invalid',
    phone: '+91-98765-10011',
    message: 'Received your quote. Thanks but no longer interested. Please remove me from your mailing list.',
    enquiry_type: 'AC servicing',
    potential_value: 7000,
    status: 'OPTED_OUT',
    received_at: daysAgo(5),
    last_contacted_at: daysAgo(4),
    follow_up_count: 2,
    contact_consent: 'OPTED_OUT',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(5)
  },

  // ===== EXPLICITLY DECLINED =====
  {
    id: 'RV-2012',
    business_id: 'business-001',
    name: 'Lakshmi Rao',
    email: 'lakshmi.rao@postbox.invalid',
    phone: '+91-98765-10012',
    message: 'Thanks for the quote but I\'ve decided to go with another service provider who gave a better price. Appreciate your time.',
    enquiry_type: 'AC repair',
    potential_value: 3200,
    status: 'DECLINED',
    received_at: daysAgo(4),
    last_contacted_at: daysAgo(3),
    follow_up_count: 1,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'REFERRAL',
    duplicate_of_lead_id: null,
    created_at: daysAgo(4)
  },

  // ===== COMPLAINT/ESCALATION CASES =====
  {
    id: 'RV-2013',
    business_id: 'business-001',
    name: 'Anil Verma',
    email: 'anil.verma@workplace.invalid',
    phone: '+91-98765-10013',
    message: 'Very disappointed! Technician came late yesterday and left work incomplete. AC still not cooling properly. Need supervisor to visit and fix this properly. Not happy with service quality.',
    enquiry_type: 'AC repair',
    potential_value: 4800,
    status: 'ESCALATED',
    received_at: daysAgo(3),
    last_contacted_at: daysAgo(1),
    follow_up_count: 2,
    contact_consent: 'CONSENTED',
    preferred_channel: 'phone',
    booking_status: 'PENDING',
    payment_status: 'NOT_PAID',
    source: 'PHONE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(3)
  },

  // ===== SUCCESSFULLY RECOVERED/CONVERTED =====
  {
    id: 'RV-2014',
    business_id: 'business-001',
    name: 'Pooja Menon',
    email: 'pooja.menon@techmail.invalid',
    phone: '+91-98765-10014',
    message: 'Great service! AC repair completed yesterday and working perfectly now. Payment made via UPI. Thank you!',
    enquiry_type: 'AC repair',
    potential_value: 5200,
    status: 'RECOVERED',
    received_at: daysAgo(8),
    last_contacted_at: daysAgo(2),
    follow_up_count: 3,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'CONFIRMED',
    payment_status: 'PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(8)
  },

  {
    id: 'RV-2015',
    business_id: 'business-001',
    name: 'Karthik Subramanian',
    email: 'karthik.sub@inbox.invalid',
    phone: '+91-98765-10015',
    message: 'Installation completed successfully. All 2 units working great. Paid ₹38,000 via bank transfer. Very professional team!',
    enquiry_type: 'AC installation',
    potential_value: 38000,
    status: 'RECOVERED',
    received_at: daysAgo(12),
    last_contacted_at: daysAgo(5),
    follow_up_count: 4,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'CONFIRMED',
    payment_status: 'PAID',
    source: 'REFERRAL',
    duplicate_of_lead_id: null,
    created_at: daysAgo(12)
  },

  // ===== IN-PROGRESS / CONTACTED =====
  {
    id: 'RV-2016',
    business_id: 'business-001',
    name: 'Nisha Patel',
    email: 'nisha.patel@mailservice.invalid',
    phone: '+91-98765-10016',
    message: 'Discussed service details over phone. Scheduled visit for this Saturday 10 AM. Looking forward to it.',
    enquiry_type: 'AC servicing',
    potential_value: 4500,
    status: 'CONTACTED',
    received_at: daysAgo(2),
    last_contacted_at: hoursAgo(12),
    follow_up_count: 1,
    contact_consent: 'CONSENTED',
    preferred_channel: 'phone',
    booking_status: 'PENDING',
    payment_status: 'NOT_PAID',
    source: 'PHONE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(2)
  },

  // ===== DUPLICATE LEAD (Edge case) =====
  {
    id: 'RV-2017',
    business_id: 'business-001',
    name: 'Rajesh Mehta',
    email: 'rajesh.mehta@techcorp.invalid',
    phone: '+91-98765-10001',
    message: 'Following up on my earlier inquiry about office AC maintenance. Haven\'t heard back yet. Please respond.',
    enquiry_type: 'AC servicing',
    potential_value: 15000,
    status: 'NEW',
    received_at: daysAgo(3),
    last_contacted_at: null,
    follow_up_count: 0,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: 'RV-2001',
    created_at: daysAgo(3)
  },

  // ===== COMPLEX/MULTI-PART INQUIRIES =====
  {
    id: 'RV-2018',
    business_id: 'business-001',
    name: 'Sanjay Reddy',
    email: 'sanjay.reddy@bizmail.invalid',
    phone: '+91-98765-10018',
    message: 'Need comprehensive solution for 4-bedroom villa: (1) Service 2 existing ACs, (2) Install 2 new 2-ton split ACs, (3) AMC for all 4 units. Can you provide package deal? Also need quotation breakdown.',
    enquiry_type: 'AC installation',
    potential_value: 65000,
    status: 'STALE',
    received_at: daysAgo(9),
    last_contacted_at: daysAgo(8),
    follow_up_count: 1,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'REFERRAL',
    duplicate_of_lead_id: null,
    created_at: daysAgo(9)
  },

  // ===== PRICE-SENSITIVE CUSTOMER =====
  {
    id: 'RV-2019',
    business_id: 'business-001',
    name: 'Geeta Krishnan',
    email: 'geeta.k@homenet.invalid',
    phone: '+91-98765-10019',
    message: 'Your quote (₹3,800) seems high for gas refill. Can you match competitor price of ₹2,500? Otherwise will have to go with them. Please respond.',
    enquiry_type: 'AC repair',
    potential_value: 3800,
    status: 'STALE',
    received_at: daysAgo(5),
    last_contacted_at: daysAgo(5),
    follow_up_count: 1,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(5)
  },

  // ===== WARRANTY/TECHNICAL QUERY =====
  {
    id: 'RV-2020',
    business_id: 'business-001',
    name: 'Harish Kumar',
    email: 'harish.kumar@techpost.invalid',
    phone: '+91-98765-10020',
    message: 'Had service done 6 months back. Issue returned (same problem - not cooling). Is this covered under service warranty? Don\'t want to pay again for same problem.',
    enquiry_type: 'AC repair',
    potential_value: 0,
    status: 'STALE',
    received_at: daysAgo(6),
    last_contacted_at: daysAgo(6),
    follow_up_count: 1,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'PHONE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(6)
  },

  // ===== SEASONAL/TIMING SPECIFIC =====
  {
    id: 'RV-2021',
    business_id: 'business-001',
    name: 'Anjali Jain',
    email: 'anjali.jain@quickmail.invalid',
    phone: '+91-98765-10021',
    message: 'Planning ahead for summer season. Want to service all 3 ACs in March (2 months from now). Can you schedule in advance? Any early-bird discounts?',
    enquiry_type: 'AC servicing',
    potential_value: 9000,
    status: 'NEW',
    received_at: daysAgo(2),
    last_contacted_at: null,
    follow_up_count: 0,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(2)
  },

  // ===== INDECISIVE/COMPARISON SHOPPING =====
  {
    id: 'RV-2022',
    business_id: 'business-001',
    name: 'Prasad Iyengar',
    email: 'prasad.iyengar@netmail.invalid',
    phone: '+91-98765-10022',
    message: 'Got quotes from 3 vendors including you. Your pricing is mid-range. What differentiates your service? Any customer testimonials? Need to decide by this week.',
    enquiry_type: 'AC installation',
    potential_value: 28000,
    status: 'STALE',
    received_at: daysAgo(4),
    last_contacted_at: daysAgo(4),
    follow_up_count: 1,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(4)
  },

  // ===== QUESTION ABOUT QUESTION (Meta-inquiry) =====
  {
    id: 'RV-2023',
    business_id: 'business-001',
    name: 'Revathi Nambiar',
    email: 'revathi.n@homeportal.invalid',
    phone: '+91-98765-10023',
    message: 'Before I book: Do you handle inverter ACs? Mine is LG Dual Inverter 1.5 ton. Also, do technicians carry common spare parts or need to order separately?',
    enquiry_type: 'AC servicing',
    potential_value: 5500,
    status: 'STALE',
    received_at: daysAgo(5),
    last_contacted_at: null,
    follow_up_count: 0,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(5)
  },

  // ===== CORPORATE/BULK OPPORTUNITY =====
  {
    id: 'RV-2024',
    business_id: 'business-001',
    name: 'Rohit Bhatia',
    email: 'rohit.bhatia@corpsolutions.invalid',
    phone: '+91-98765-10024',
    message: 'Corporate inquiry: Annual maintenance contract for 12 office ACs across 3 floors. Need GST invoice, payment terms 30 days. Can you send formal quotation with service level agreement?',
    enquiry_type: 'AC servicing',
    potential_value: 48000,
    status: 'STALE',
    received_at: daysAgo(7),
    last_contacted_at: daysAgo(7),
    follow_up_count: 1,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'REFERRAL',
    duplicate_of_lead_id: null,
    created_at: daysAgo(7)
  },

  // ===== WEEKEND-ONLY AVAILABILITY =====
  {
    id: 'RV-2025',
    business_id: 'business-001',
    name: 'Divya Menon',
    email: 'divya.menon@webspace.invalid',
    phone: '+91-98765-10025',
    message: 'Working professional - only available on Saturdays and Sundays. Can you schedule AC repair visit on coming weekend? Flexible with morning or afternoon.',
    enquiry_type: 'AC repair',
    potential_value: 4200,
    status: 'NEW',
    received_at: daysAgo(1),
    last_contacted_at: null,
    follow_up_count: 0,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: daysAgo(1)
  }
]

/**
 * REALISTIC AGENT ACTIONS WITH VARIED SCENARIOS
 */
export const MOCK_AGENT_ACTIONS: AgentAction[] = [
  // High-value office AC opportunity
  {
    id: 'action-2001',
    lead_id: 'RV-2001',
    lead_name: 'Rajesh Mehta',
    action_type: 'analysis',
    status: 'pending',
    analysis_json: JSON.stringify({
      lead_id: 'RV-2001',
      priority: 'high',
      customer_intent: 'Business customer with urgent AC maintenance need and approved budget',
      likely_reason_for_inactivity: 'Corporate decision-making process or waiting for competitive quotes. May have contacted multiple vendors.',
      evidence: [
        'High-value opportunity (₹15,000)',
        'Budget pre-approved indicating serious intent',
        'Specific technical issues mentioned (error codes E1, E3)',
        'Office/corporate client with formal procurement process',
        '6 days since last contact - longer than typical response time'
      ],
      uncertainty: 'Unknown if they received other competitive quotes or if budget approval is still valid',
      recommended_action: 'email',
      suggested_channel: 'email',
      email_subject: 'Your Office AC Maintenance Quote - CoolCare Response',
      email_body: `Dear Rajesh,

Thank you for your inquiry regarding central AC maintenance for your 1200 sq ft office space.

I understand you're experiencing E1 and E3 error codes, which typically indicate:
• E1: Temperature sensor malfunction
• E3: High/low pressure protection issue

**Our Comprehensive Service Package (₹14,500):**
✓ Complete system diagnostics with error code resolution
✓ Full cleaning of indoor & outdoor units
✓ Refrigerant pressure check and gas top-up (if required)
✓ Filter replacement and duct inspection
✓ Electrical connection testing
✓ Performance testing & certification
✓ 90-day service warranty
✓ GST invoice provided

**Timeline:** We can schedule within 48 hours of confirmation, with service completion in 1 working day.

**Corporate Benefits:**
- Flexible payment terms (15 days)
- Annual maintenance contracts available
- Priority emergency support

Would you like to schedule a preliminary inspection this week? We can adjust our quotation after assessment if needed.

Looking forward to serving your business!

Best regards,
Ravi Kumar
Service Manager, CoolCare AC Services
+91-12345-67890`,
      requires_human_approval: true
    }),
    generated_message: `Dear Rajesh,

Thank you for your inquiry regarding central AC maintenance for your 1200 sq ft office space.

I understand you're experiencing E1 and E3 error codes, which typically indicate:
• E1: Temperature sensor malfunction
• E3: High/low pressure protection issue

**Our Comprehensive Service Package (₹14,500):**
✓ Complete system diagnostics with error code resolution
✓ Full cleaning of indoor & outdoor units
✓ Refrigerant pressure check and gas top-up (if required)
✓ Filter replacement and duct inspection
✓ Electrical connection testing
✓ Performance testing & certification
✓ 90-day service warranty
✓ GST invoice provided

**Timeline:** We can schedule within 48 hours of confirmation, with service completion in 1 working day.

**Corporate Benefits:**
- Flexible payment terms (15 days)
- Annual maintenance contracts available
- Priority emergency support

Would you like to schedule a preliminary inspection this week? We can adjust our quotation after assessment if needed.

Looking forward to serving your business!

Best regards,
Ravi Kumar
Service Manager, CoolCare AC Services
+91-12345-67890`,
    approval_requested_at: daysAgo(0),
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    executed_at: null,
    error_message: null,
    created_at: daysAgo(0)
  },

  // High-value residential installation
  {
    id: 'action-2002',
    lead_id: 'RV-2002',
    lead_name: 'Priya Venkatesh',
    action_type: 'analysis',
    status: 'pending',
    analysis_json: JSON.stringify({
      lead_id: 'RV-2002',
      priority: 'high',
      customer_intent: 'New construction home owner ready to invest in complete AC solution',
      likely_reason_for_inactivity: 'Comparison shopping for best installation package, or waiting for construction completion milestone',
      evidence: [
        'Very high value - ₹42,000 (3 AC units)',
        'Detailed inquiry showing research and planning',
        'Specific requirements (2nd floor, copper piping, electrical work)',
        'Weekend preference indicates working professional with disposable income',
        '8 days without any contact - high risk of losing to competitor'
      ],
      uncertainty: 'Construction timeline unknown, budget may be stretched across other home expenses',
      recommended_action: 'email',
      suggested_channel: 'email',
      email_subject: 'Complete AC Installation Solution for Your New Home',
      email_body: `Hi Priya,

Congratulations on your new home! I'd be delighted to help you with a complete AC installation solution.

**Your Requirement:**
- 3 x 1.5 Ton Split ACs (2nd floor installation)
- Complete installation with copper piping, stands, and electrical work
- Site inspection on weekend

**Our Comprehensive Package (₹39,500):**

**Installation Includes:**
✓ 3 units complete installation with wall mounting
✓ Copper piping (up to 15 ft per unit)
✓ Outdoor unit stands/brackets
✓ Electrical wiring assessment and setup
✓ Condensate drainage system
✓ Testing and commissioning
✓ 1-year installation warranty

**Free Services:**
• Pre-installation site inspection
• Load calculation for optimal placement
• Electrical capacity assessment
• Post-installation support (3 months)

**This Weekend Availability:**
I can schedule our technical team for a free site inspection either Saturday or Sunday at your convenience. The inspection takes about 45 minutes, and we'll provide:
- Room-wise AC capacity recommendations
- Installation plan with exact quotation
- Timeline and payment terms

**Why Choose CoolCare:**
- 12+ years in business
- Certified technicians
- Quality materials (ISI marked copper pipes)
- Transparent pricing - no hidden charges
- 1000+ happy customers

Can I schedule the site visit for this weekend? Please share your preferred day and time (morning 9-12 or afternoon 2-5).

Looking forward to making your home comfortable!

Best regards,
Priya Nambiar
Installation Specialist, CoolCare AC Services
+91-12345-67890`,
      requires_human_approval: true
    }),
    generated_message: `Hi Priya,

Congratulations on your new home! I'd be delighted to help you with a complete AC installation solution.

**Your Requirement:**
- 3 x 1.5 Ton Split ACs (2nd floor installation)
- Complete installation with copper piping, stands, and electrical work
- Site inspection on weekend

**Our Comprehensive Package (₹39,500):**

**Installation Includes:**
✓ 3 units complete installation with wall mounting
✓ Copper piping (up to 15 ft per unit)
✓ Outdoor unit stands/brackets
✓ Electrical wiring assessment and setup
✓ Condensate drainage system
✓ Testing and commissioning
✓ 1-year installation warranty

**Free Services:**
• Pre-installation site inspection
• Load calculation for optimal placement
• Electrical capacity assessment
• Post-installation support (3 months)

**This Weekend Availability:**
I can schedule our technical team for a free site inspection either Saturday or Sunday at your convenience. The inspection takes about 45 minutes, and we'll provide:
- Room-wise AC capacity recommendations
- Installation plan with exact quotation
- Timeline and payment terms

**Why Choose CoolCare:**
- 12+ years in business
- Certified technicians
- Quality materials (ISI marked copper pipes)
- Transparent pricing - no hidden charges
- 1000+ happy customers

Can I schedule the site visit for this weekend? Please share your preferred day and time (morning 9-12 or afternoon 2-5).

Looking forward to making your home comfortable!

Best regards,
Priya Nambiar
Installation Specialist, CoolCare AC Services
+91-12345-67890`,
    approval_requested_at: daysAgo(0),
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    executed_at: null,
    error_message: null,
    created_at: daysAgo(0)
  },

  // Price-sensitive customer
  {
    id: 'action-2019',
    lead_id: 'RV-2019',
    lead_name: 'Geeta Krishnan',
    action_type: 'analysis',
    status: 'pending',
    analysis_json: JSON.stringify({
      lead_id: 'RV-2019',
      priority: 'medium',
      customer_intent: 'Price-conscious customer comparing competitive quotes',
      likely_reason_for_inactivity: 'Waiting for price match or better offer, may switch to cheaper competitor',
      evidence: [
        'Explicit price comparison mentioned',
        'Competitor quote of ₹2,500 vs our ₹3,800',
        'Direct threat to go with competitor',
        '5 days of inactivity suggests may have already booked elsewhere',
        'Moderate value but high risk of loss'
      ],
      uncertainty: 'Quality vs price perception - may not understand value difference',
      recommended_action: 'email',
      suggested_channel: 'email',
      email_subject: 'Re: AC Gas Refill - Understanding the Price Difference',
      email_body: `Hi Geeta,

Thank you for considering CoolCare for your AC gas refill service.

I understand price is important, and I'd like to explain our ₹3,800 quotation vs the ₹2,500 offer you received:

**Our Service Includes:**
✓ Genuine R-32/R-410A refrigerant (not mixed/recycled gas)
✓ Complete leak detection using electronic detector
✓ Pressure testing before and after refill
✓ Filter cleaning and basic servicing
✓ Performance testing with temperature measurement
✓ 3-month service warranty
✓ Free follow-up visit if issue persists

**Why Lower Prices Can Cost More:**
Many competitors use:
- Recycled or mixed refrigerant (damages compressor)
- Skip leak detection (problem returns quickly)
- No warranty or follow-up support

**Our Special Offer for You:**
I can offer ₹3,200 (₹600 discount) if you book within 48 hours. This includes everything above with our quality guarantee.

**Customer Testimonial:**
"Initially went with cheaper service (₹2,400). Gas leaked again in 2 weeks. CoolCare found and fixed the root cause. Paying more upfront saved money long-term!" - Ramesh K., Bangalore

Would you like to proceed at ₹3,200? We can schedule as early as tomorrow.

Best regards,
Suresh Kumar
Service Coordinator, CoolCare AC Services
+91-12345-67890`,
      requires_human_approval: true
    }),
    generated_message: `Hi Geeta,

Thank you for considering CoolCare for your AC gas refill service.

I understand price is important, and I'd like to explain our ₹3,800 quotation vs the ₹2,500 offer you received:

**Our Service Includes:**
✓ Genuine R-32/R-410A refrigerant (not mixed/recycled gas)
✓ Complete leak detection using electronic detector
✓ Pressure testing before and after refill
✓ Filter cleaning and basic servicing
✓ Performance testing with temperature measurement
✓ 3-month service warranty
✓ Free follow-up visit if issue persists

**Why Lower Prices Can Cost More:**
Many competitors use:
- Recycled or mixed refrigerant (damages compressor)
- Skip leak detection (problem returns quickly)
- No warranty or follow-up support

**Our Special Offer for You:**
I can offer ₹3,200 (₹600 discount) if you book within 48 hours. This includes everything above with our quality guarantee.

**Customer Testimonial:**
"Initially went with cheaper service (₹2,400). Gas leaked again in 2 weeks. CoolCare found and fixed the root cause. Paying more upfront saved money long-term!" - Ramesh K., Bangalore

Would you like to proceed at ₹3,200? We can schedule as early as tomorrow.

Best regards,
Suresh Kumar
Service Coordinator, CoolCare AC Services
+91-12345-67890`,
    approval_requested_at: daysAgo(0),
    approved_by: null,
    approved_at: null,
    rejection_reason: null,
    executed_at: null,
    error_message: null,
    created_at: daysAgo(0)
  }
]

/**
 * REALISTIC TIMELINE EVENTS
 */
export const MOCK_TIMELINE_EVENTS: Record<string, any[]> = {
  'RV-2001': [
    {
      id: 'timeline-2001-1',
      type: 'Lead Created',
      description: 'Corporate inquiry received via website contact form for office AC maintenance',
      timestamp: daysAgo(6),
      status: 'NEW'
    },
    {
      id: 'timeline-2001-2',
      type: 'Initial Quote Sent',
      description: 'Preliminary quote sent via email (₹15,000 for comprehensive maintenance)',
      timestamp: daysAgo(6),
      status: 'QUOTE_SENT'
    }
  ],
  'RV-2014': [
    {
      id: 'timeline-2014-1',
      type: 'Lead Created',
      description: 'AC repair inquiry received',
      timestamp: daysAgo(8),
      status: 'NEW'
    },
    {
      id: 'timeline-2014-2',
      type: 'Follow-up Email',
      description: 'AI-generated follow-up sent and approved',
      timestamp: daysAgo(6),
      status: 'CONTACTED'
    },
    {
      id: 'timeline-2014-3',
      type: 'Customer Response',
      description: 'Customer responded positively, requested service appointment',
      timestamp: daysAgo(5),
      status: 'CONTACTED'
    },
    {
      id: 'timeline-2014-4',
      type: 'Service Scheduled',
      description: 'Appointment booked for AC repair',
      timestamp: daysAgo(3),
      status: 'CONTACTED'
    },
    {
      id: 'timeline-2014-5',
      type: 'Service Completed',
      description: 'AC repair completed successfully - compressor issue fixed',
      timestamp: daysAgo(2),
      status: 'RECOVERED'
    },
    {
      id: 'timeline-2014-6',
      type: 'Payment Received',
      description: 'Payment of ₹5,200 received via UPI',
      timestamp: daysAgo(2),
      status: 'PAID'
    }
  ],
  'RV-2015': [
    {
      id: 'timeline-2015-1',
      type: 'Lead Created',
      description: 'Multi-unit installation inquiry from referral',
      timestamp: daysAgo(12),
      status: 'NEW'
    },
    {
      id: 'timeline-2015-2',
      type: 'Site Visit',
      description: 'Technical team conducted site inspection',
      timestamp: daysAgo(10),
      status: 'CONTACTED'
    },
    {
      id: 'timeline-2015-3',
      type: 'Detailed Quote',
      description: 'Comprehensive quotation sent with installation plan',
      timestamp: daysAgo(9),
      status: 'QUOTE_SENT'
    },
    {
      id: 'timeline-2015-4',
      type: 'Negotiation',
      description: 'Price negotiation and final terms agreed',
      timestamp: daysAgo(8),
      status: 'CONTACTED'
    },
    {
      id: 'timeline-2015-5',
      type: 'Installation Day 1',
      description: 'Installation started - electrical work and unit mounting',
      timestamp: daysAgo(6),
      status: 'IN_PROGRESS'
    },
    {
      id: 'timeline-2015-6',
      type: 'Installation Completed',
      description: 'All 2 units installed and tested successfully',
      timestamp: daysAgo(5),
      status: 'RECOVERED'
    },
    {
      id: 'timeline-2015-7',
      type: 'Payment Received',
      description: 'Full payment of ₹38,000 received via bank transfer',
      timestamp: daysAgo(5),
      status: 'PAID'
    }
  ],
  'RV-2013': [
    {
      id: 'timeline-2013-1',
      type: 'Lead Created',
      description: 'AC repair request received',
      timestamp: daysAgo(3),
      status: 'NEW'
    },
    {
      id: 'timeline-2013-2',
      type: 'Service Attempted',
      description: 'Technician visited - partial work completed',
      timestamp: daysAgo(2),
      status: 'CONTACTED'
    },
    {
      id: 'timeline-2013-3',
      type: 'Complaint Received',
      description: 'Customer complained about incomplete work and late arrival',
      timestamp: daysAgo(1),
      status: 'ESCALATED'
    },
    {
      id: 'timeline-2013-4',
      type: 'Manager Assigned',
      description: 'Case escalated to service manager for resolution',
      timestamp: daysAgo(1),
      status: 'ESCALATED'
    }
  ]
}
