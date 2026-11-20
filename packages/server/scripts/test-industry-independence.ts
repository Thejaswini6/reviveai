/**
 * Industry Independence & Multi-Category Architectural Verification
 * Validates that ReviveAI core logic is decoupled from HVAC and operates seamlessly on plumbing services
 */

import { FLOWFIX_PLUMBING_PROFILE, COOLCARE_AC_PROFILE } from '../src/services/businessConfig.js';
import { buildRecoveryPromptContext, generateIndustryAdaptiveAnalysis } from '../src/services/agentPrompts.js';
import { checkLeadEligibility, validateActionApproval } from '../src/services/eligibility.js';
import { Lead } from '../src/data/mockData.js';

function daysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export function runIndustryIndependenceTests(): boolean {
  console.log('================================================================');
  console.log('  REVIVEAI - INDUSTRY INDEPENDENCE & ARCHITECTURE VERIFICATION');
  console.log('================================================================\n');

  let allPassed = true;

  // 1. Verify Configuration Flexibility
  console.log('--- 1. Testing Business Profile Configuration ---');
  const plumb = FLOWFIX_PLUMBING_PROFILE;
  const configPass = 
    plumb.industry === 'Plumbing & Drainage' &&
    plumb.services.length === 4 &&
    plumb.policies.warranty_days === 60 &&
    plumb.currency.symbol === '₹';
  
  console.log(`${configPass ? '✅ PASS' : '❌ FAIL'} Plumbing profile loaded: "${plumb.name}" (${plumb.industry})`);
  console.log(`   Configured Services: ${plumb.services.map(s => s.name).join(', ')}`);
  console.log(`   Policies: ${plumb.policies.warranty_days}-day warranty, Free inspection: ${plumb.policies.free_inspection}\n`);
  if (!configPass) allPassed = false;

  // 2. Verify Shared Lead Model Supports Plumbing Enquiries
  console.log('--- 2. Testing Shared Lead Model on Plumbing Inquiries ---');
  const plumbingLead: Lead = {
    id: 'PL-3001',
    business_id: 'business-002',
    name: 'Vikram Joshi',
    email: 'vikram.j@domain.invalid',
    phone: '+91-98765-30001',
    message: 'Main water supply pipe leaking under kitchen sink. Water shut off at meter. Need an emergency plumber to replace copper fitting.',
    enquiry_type: 'Emergency leak repair',
    potential_value: 3500,
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
    created_at: daysAgo(5),
  };

  const leadCheck = checkLeadEligibility(plumbingLead);
  const leadPass = leadCheck.is_eligible && leadCheck.can_auto_recover && leadCheck.recommended_handling === 'automated_recovery';
  console.log(`${leadPass ? '✅ PASS' : '❌ FAIL'} Plumbing lead accepted by shared eligibility rules:`);
  console.log(`   Lead: ${plumbingLead.id} (${plumbingLead.name}) -> ${leadCheck.recommended_handling}`);
  console.log(`   Reasons: ${leadCheck.reasons[0]}\n`);
  if (!leadPass) allPassed = false;

  // 3. Verify Business-Context Prompt & Reasoning Adaptation
  console.log('--- 3. Testing Business-Aware Context & Recommendation Formulation ---');
  const { systemPrompt, userPrompt } = buildRecoveryPromptContext(plumb, plumbingLead);
  const promptPass = 
    systemPrompt.includes('FlowFix Plumbing & Drains') &&
    systemPrompt.includes('Plumbing & Drainage') &&
    systemPrompt.includes('60 days guarantee') &&
    userPrompt.includes('Emergency leak repair');
  
  console.log(`${promptPass ? '✅ PASS' : '❌ FAIL'} Prompt injected business context dynamically:`);
  console.log(`   System Prompt Business Header: "${plumb.name}" in "${plumb.industry}"`);

  const analysis = generateIndustryAdaptiveAnalysis(plumb, plumbingLead);
  const analysisPass = 
    analysis.email_body.includes('FlowFix Plumbing & Drains') &&
    analysis.email_body.includes('Emergency leak repair') &&
    analysis.email_body.includes('60-day workmanship guarantee') &&
    analysis.email_subject.includes('Emergency leak repair inquiry with FlowFix Plumbing & Drains');

  console.log(`${analysisPass ? '✅ PASS' : '❌ FAIL'} Generated recommendation adapted to plumbing business:`);
  console.log(`   Subject: "${analysis.email_subject}"`);
  console.log(`   Priority: ${analysis.priority} | Intent: "${analysis.customer_intent}"`);
  console.log(`   Reason: "${analysis.likely_reason_for_inactivity}"\n`);
  if (!promptPass || !analysisPass) allPassed = false;

  // 4. Verify Shared Safety Rules Apply Identically to Plumbing
  console.log('--- 4. Testing Universal Safety Rules on Plumbing Domain ---');

  // Opted out plumbing customer
  const optOutPlumbingLead: Lead = {
    ...plumbingLead,
    id: 'PL-3002',
    name: 'Ananya Sharma',
    contact_consent: 'OPTED_OUT',
  };
  const optOutCheck = checkLeadEligibility(optOutPlumbingLead);
  const optOutPass = !optOutCheck.is_eligible && optOutCheck.recommended_handling === 'do_not_contact';
  console.log(`${optOutPass ? '✅ PASS' : '❌ FAIL'} Opt-Out Protection: PL-3002 blocked (${optOutCheck.reasons[0]})`);

  // Missing consent plumbing customer
  const missingConsentLead: Lead = {
    ...plumbingLead,
    id: 'PL-3003',
    name: 'Rohan Gupta',
    contact_consent: 'UNKNOWN',
  };
  const missingConsentCheck = checkLeadEligibility(missingConsentLead);
  const missingConsentPass = !missingConsentCheck.is_eligible && missingConsentCheck.recommended_handling === 'do_not_contact';
  console.log(`${missingConsentPass ? '✅ PASS' : '❌ FAIL'} Consent Enforcement: PL-3003 blocked (${missingConsentCheck.reasons[0]})`);

  // Already paid plumbing customer
  const paidPlumbingLead: Lead = {
    ...plumbingLead,
    id: 'PL-3004',
    name: 'Deepak Verma',
    status: 'RECOVERED',
    payment_status: 'PAID',
    booking_status: 'CONFIRMED',
  };
  const paidCheck = checkLeadEligibility(paidPlumbingLead);
  const paidPass = !paidCheck.is_eligible && paidCheck.flags.is_converted_or_paid;
  console.log(`${paidPass ? '✅ PASS' : '❌ FAIL'} Paid Lead Exclusion: PL-3004 blocked (${paidCheck.reasons[0]})`);

  // Complaint plumbing customer
  const complaintPlumbingLead: Lead = {
    ...plumbingLead,
    id: 'PL-3005',
    name: 'Karan Mehra',
    message: 'The plumber left a mess and water is still dripping from pipe. I want the owner or manager to call me back immediately.',
    status: 'ESCALATED',
  };
  const complaintCheck = checkLeadEligibility(complaintPlumbingLead);
  const complaintPass = !complaintCheck.can_auto_recover && complaintCheck.recommended_handling === 'manager_escalation';
  console.log(`${complaintPass ? '✅ PASS' : '❌ FAIL'} Complaint Safeguard: PL-3005 escalated (${complaintCheck.reasons[0]})`);

  // Phone callback preference
  const phonePlumbingLead: Lead = {
    ...plumbingLead,
    id: 'PL-3006',
    name: 'Sunil Nair',
    preferred_channel: 'phone',
    status: 'CALLBACK_REQUESTED',
  };
  const phoneCheck = checkLeadEligibility(phonePlumbingLead);
  const phonePass = !phoneCheck.can_auto_recover && phoneCheck.recommended_handling === 'human_callback';
  console.log(`${phonePass ? '✅ PASS' : '❌ FAIL'} Channel Safeguard: PL-3006 flagged for phone call (${phoneCheck.reasons[0]})`);

  const safetyAllPass = optOutPass && missingConsentPass && paidPass && complaintPass && phonePass;
  if (!safetyAllPass) allPassed = false;

  console.log('\n================================================================');
  console.log(`  INDUSTRY INDEPENDENCE SUMMARY: ${allPassed ? 'ALL TESTS PASSED (100% GENERIC ARCHITECTURE)' : 'SOME TESTS FAILED'}`);
  console.log('================================================================\n');

  return allPassed;
}

runIndustryIndependenceTests();
