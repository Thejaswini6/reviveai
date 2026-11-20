/**
 * ReviveAI - 10 Core Regression & Business Safety Verification Test Suite
 * Tests business rules, privacy compliance, and eligibility enforcement
 */

import { MOCK_LEADS } from '../src/data/mockData.js';
import { checkLeadEligibility, validateActionApproval } from '../src/services/eligibility.js';

interface TestResult {
  scenarioNumber: number;
  scenarioName: string;
  leadId: string;
  customerName: string;
  expectedStatus: 'ALLOWED' | 'BLOCKED';
  expectedHandling: string;
  passed: boolean;
  notes: string;
}

export function runRegressionTests(): { passed: boolean; results: TestResult[] } {
  console.log('================================================================');
  console.log('  REVIVEAI - 10 CORE REGRESSION & BUSINESS SAFETY SUITE');
  console.log('================================================================\n');

  const results: TestResult[] = [];

  // Scenario 1: Eligible Stale Lead
  // RV-2001 (Rajesh Mehta): Stale for 6 days, consented, high value (₹15,000)
  const lead1 = MOCK_LEADS.find(l => l.id === 'RV-2001')!;
  const check1 = checkLeadEligibility(lead1);
  const pass1 = check1.is_eligible && check1.can_auto_recover && check1.recommended_handling === 'automated_recovery';
  results.push({
    scenarioNumber: 1,
    scenarioName: 'Eligible Stale Lead',
    leadId: lead1.id,
    customerName: lead1.name,
    expectedStatus: 'ALLOWED',
    expectedHandling: 'automated_recovery',
    passed: pass1,
    notes: check1.reasons[0]
  });

  // Scenario 2: Lead That Stopped Responding After Quote
  // RV-1002 (Priya Nair): Quote sent 5 days ago, customer stopped responding
  const lead2 = MOCK_LEADS.find(l => l.id === 'RV-1002')!;
  const check2 = checkLeadEligibility(lead2);
  const pass2 = check2.is_eligible && check2.can_auto_recover && check2.recommended_handling === 'automated_recovery';
  results.push({
    scenarioNumber: 2,
    scenarioName: 'Lead Stopped Responding After Quote',
    leadId: lead2.id,
    customerName: lead2.name,
    expectedStatus: 'ALLOWED',
    expectedHandling: 'automated_recovery',
    passed: pass2,
    notes: check2.reasons[0]
  });

  // Scenario 3: Lead With a Pricing Objection
  // RV-2019 (Geeta Krishnan): Price sensitive / comparing quotes, consented
  const lead3 = MOCK_LEADS.find(l => l.id === 'RV-2019')!;
  const check3 = checkLeadEligibility(lead3);
  const pass3 = check3.is_eligible && check3.can_auto_recover && check3.recommended_handling === 'automated_recovery';
  results.push({
    scenarioNumber: 3,
    scenarioName: 'Lead With Pricing Objection (Recoverable)',
    leadId: lead3.id,
    customerName: lead3.name,
    expectedStatus: 'ALLOWED',
    expectedHandling: 'automated_recovery',
    passed: pass3,
    notes: check3.reasons[0]
  });

  // Scenario 4: Opted-Out Lead (Privacy Compliance)
  // RV-1006 (Meera Joshi): Customer opted out
  const lead4 = MOCK_LEADS.find(l => l.id === 'RV-1006')!;
  const check4 = checkLeadEligibility(lead4);
  const pass4 = !check4.is_eligible && check4.flags.is_opted_out && check4.recommended_handling === 'do_not_contact';
  results.push({
    scenarioNumber: 4,
    scenarioName: 'Opted-Out Customer (Privacy Gate)',
    leadId: lead4.id,
    customerName: lead4.name,
    expectedStatus: 'BLOCKED',
    expectedHandling: 'do_not_contact',
    passed: pass4,
    notes: check4.reasons.join('; ')
  });

  // Scenario 5: Missing or Unknown Consent
  // RV-2025 (Divya Menon): Web form inquiry with UNKNOWN contact consent
  const lead5 = MOCK_LEADS.find(l => l.id === 'RV-2025')!;
  const check5 = checkLeadEligibility(lead5);
  const pass5 = !check5.is_eligible && check5.flags.is_missing_consent && check5.recommended_handling === 'do_not_contact';
  results.push({
    scenarioNumber: 5,
    scenarioName: 'Missing or Unknown Consent (GDPR/Compliance Gate)',
    leadId: lead5.id,
    customerName: lead5.name,
    expectedStatus: 'BLOCKED',
    expectedHandling: 'do_not_contact',
    passed: pass5,
    notes: check5.reasons.join('; ')
  });

  // Scenario 6: Already Paid or Converted Customer
  // RV-1007 (Arjun Rao): Service completed, payment received (PAID)
  const lead6 = MOCK_LEADS.find(l => l.id === 'RV-1007')!;
  const check6 = checkLeadEligibility(lead6);
  const pass6 = !check6.is_eligible && check6.flags.is_converted_or_paid && check6.recommended_handling === 'do_not_contact';
  results.push({
    scenarioNumber: 6,
    scenarioName: 'Already Paid / Converted Customer (Exclude From Outreach)',
    leadId: lead6.id,
    customerName: lead6.name,
    expectedStatus: 'BLOCKED',
    expectedHandling: 'do_not_contact',
    passed: pass6,
    notes: check6.reasons.join('; ')
  });

  // Scenario 7: Declined Customer
  // RV-1005 (Sanjay Kulkarni): Customer explicitly refused/declined quote
  const lead7 = MOCK_LEADS.find(l => l.id === 'RV-1005')!;
  const check7 = checkLeadEligibility(lead7);
  const pass7 = !check7.is_eligible && check7.flags.is_declined && check7.recommended_handling === 'do_not_contact';
  results.push({
    scenarioNumber: 7,
    scenarioName: 'Declined Customer (Respect Customer Decision)',
    leadId: lead7.id,
    customerName: lead7.name,
    expectedStatus: 'BLOCKED',
    expectedHandling: 'do_not_contact',
    passed: pass7,
    notes: check7.reasons.join('; ')
  });

  // Scenario 8: Duplicate Lead
  // RV-1009 (Rahul Sharma): Duplicate of RV-1001
  const lead8 = MOCK_LEADS.find(l => l.id === 'RV-1009')!;
  const check8 = checkLeadEligibility(lead8);
  const pass8 = !check8.is_eligible && check8.flags.is_duplicate && check8.recommended_handling === 'do_not_contact';
  results.push({
    scenarioNumber: 8,
    scenarioName: 'Duplicate Lead (Consolidation Gate)',
    leadId: lead8.id,
    customerName: lead8.name,
    expectedStatus: 'BLOCKED',
    expectedHandling: 'do_not_contact',
    passed: pass8,
    notes: check8.reasons.join('; ')
  });

  // Scenario 9: Customer Complaint / Escalation
  // RV-1008 (Farah Khan): Technician late, customer unhappy, requested manager
  const lead9 = MOCK_LEADS.find(l => l.id === 'RV-1008')!;
  const check9 = checkLeadEligibility(lead9);
  const pass9 = !check9.can_auto_recover && check9.flags.is_complaint && check9.recommended_handling === 'manager_escalation';
  results.push({
    scenarioNumber: 9,
    scenarioName: 'Customer Complaint (Manager Escalation Gate)',
    leadId: lead9.id,
    customerName: lead9.name,
    expectedStatus: 'BLOCKED',
    expectedHandling: 'manager_escalation',
    passed: pass9,
    notes: check9.reasons.join('; ')
  });

  // Scenario 10: Explicit Phone Callback Request
  // RV-1004 (Neha Iyer): Customer requested phone callback after 6 PM
  const lead10 = MOCK_LEADS.find(l => l.id === 'RV-1004')!;
  const check10 = checkLeadEligibility(lead10);
  const pass10 = !check10.can_auto_recover && check10.flags.is_callback_requested && check10.recommended_handling === 'human_callback';
  results.push({
    scenarioNumber: 10,
    scenarioName: 'Explicit Callback Request (Channel Preference Gate)',
    leadId: lead10.id,
    customerName: lead10.name,
    expectedStatus: 'BLOCKED',
    expectedHandling: 'human_callback',
    passed: pass10,
    notes: check10.reasons.join('; ')
  });

  // Print formatted test results
  let allPassed = true;
  for (const r of results) {
    const symbol = r.passed ? '✅ PASS' : '❌ FAIL';
    if (!r.passed) allPassed = false;
    console.log(`${symbol} [Scenario ${r.scenarioNumber}] ${r.scenarioName}`);
    console.log(`   Lead: ${r.leadId} (${r.customerName}) | Expected: ${r.expectedStatus} [${r.expectedHandling}]`);
    console.log(`   Safety Reason: ${r.notes}\n`);
  }

  // Pre-execution approval guard tests
  console.log('--- Pre-Execution Approval Guard Tests ---');
  const approvalTestBlocked = validateActionApproval(lead4);
  const approvalPass1 = !approvalTestBlocked.allowed;
  console.log(`${approvalPass1 ? '✅ PASS' : '❌ FAIL'} Approval correctly blocked for opted-out lead RV-1006: "${approvalTestBlocked.error}"`);

  const approvalTestComplaint = validateActionApproval(lead9);
  const approvalPass2 = !approvalTestComplaint.allowed;
  console.log(`${approvalPass2 ? '✅ PASS' : '❌ FAIL'} Approval correctly blocked for complaint lead RV-1008: "${approvalTestComplaint.error}"`);

  const approvalTestAllowed = validateActionApproval(lead1);
  const approvalPass3 = approvalTestAllowed.allowed;
  console.log(`${approvalPass3 ? '✅ PASS' : '❌ FAIL'} Approval correctly permitted for eligible lead RV-2001`);

  allPassed = allPassed && approvalPass1 && approvalPass2 && approvalPass3;

  console.log('\n================================================================');
  console.log(`  SUMMARY: ${allPassed ? 'ALL 10 SCENARIOS & APPROVAL GUARDS PASSED (100%)' : 'SOME TESTS FAILED'}`);
  console.log('================================================================\n');

  return { passed: allPassed, results };
}

// Execute if run directly
runRegressionTests();
