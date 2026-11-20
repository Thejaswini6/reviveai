/**
 * Automated Test Suite for ReviveAI Claude Tool Calling Recovery Agent
 * Verifies:
 *  1. 6 Tools execution & input/output contracts
 *  2. Security allowlist: rejection of unpermitted tools
 *  3. Ineligibility safety gating: blocked before agent execution
 *  4. Deterministic Simulated Agent: full 6-step loop, trace, Zod schema validation
 *  5. Multi-business adaptability: CoolCare AC (RV-2001) & FlowFix Plumbing (RV-2025)
 *  6. API Credit Conservation: Asserts $0.00 spent during automated tests
 */

import { 
  ToolExecutionEngine, 
  AGENT_TOOLS, 
  executeRecoveryAnalysis, 
  runSimulatedRecoveryAgent 
} from '../src/services/recoveryAgent.js';
import { MOCK_LEADS, MOCK_AGENT_ACTIONS } from '../src/data/mockData.js';
import { RecoveryAnalysisSchema } from '../src/services/agentPrompts.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}${details ? ` -> ${details}` : ''}`);
  }
}

async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🤖 REVIVEAI PHASE 3: COMPREHENSIVE AGENT & TOOL TEST SUITE');
  console.log('================================================================\n');

  // Test 1: Verify all 6 Anthropic Tool definitions exist
  console.log('--- TEST GROUP 1: Anthropic Tool Definitions Schema ---');
  assert(AGENT_TOOLS.length === 6, 'Exactly 6 tools defined in AGENT_TOOLS');
  
  const toolNames = AGENT_TOOLS.map(t => t.name);
  const requiredTools = [
    'fetch_lead_context',
    'get_interaction_history',
    'calculate_revenue_at_risk',
    'create_recovery_recommendation',
    'generate_recovery_message',
    'request_approval'
  ];
  for (const req of requiredTools) {
    assert(toolNames.includes(req), `Tool "${req}" defined in AGENT_TOOLS`);
  }

  // Test 2: Tool Execution Engine - Individual Tool Contract Verification
  console.log('\n--- TEST GROUP 2: ToolExecutionEngine Contracts ---');
  const testLead = MOCK_LEADS.find(l => l.id === 'RV-2001')!;
  assert(Boolean(testLead), 'Test lead RV-2001 located in canonical dataset');

  const engine = new ToolExecutionEngine(testLead);

  // Tool 1: fetch_lead_context
  const ctx = await engine.executeTool('fetch_lead_context', { lead_id: testLead.id });
  assert(ctx.lead_id === 'RV-2001', 'fetch_lead_context returns correct lead id');
  assert(ctx.business_profile.name === 'CoolCare AC Services', 'fetch_lead_context returns correct business profile');
  assert(ctx.currency.code === 'INR', 'fetch_lead_context returns correct currency code');

  // Tool 2: get_interaction_history
  const hist = await engine.executeTool('get_interaction_history', { lead_id: testLead.id });
  assert(Array.isArray(hist.timeline_events), 'get_interaction_history returns timeline events array');
  assert(typeof hist.days_inactive === 'number', 'get_interaction_history calculates inactivity days');
  assert(hist.lead_status === 'STALE', 'get_interaction_history returns correct lead status');

  // Tool 3: calculate_revenue_at_risk
  const rev = await engine.executeTool('calculate_revenue_at_risk', { lead_id: testLead.id });
  assert(rev.potential_value === testLead.potential_value, 'calculate_revenue_at_risk returns potential value');
  assert(rev.is_eligible === true, 'calculate_revenue_at_risk confirms lead eligibility');
  assert(rev.eligible_recovery_opportunity === testLead.potential_value, 'calculate_revenue_at_risk accurately calculates recovery opportunity');

  // Tool 4: create_recovery_recommendation
  const recInput = {
    lead_id: testLead.id,
    customer_intent: 'Needs AC repair for master bedroom unit',
    likely_reason_for_inactivity: 'Customer postponed service due to work travel',
    priority: 'high',
    priority_reason: 'High potential value with 14 days since initial request',
    recommended_action: 'email',
    strategy_explanation: 'Professional follow-up with guarantee'
  };
  const rec = await engine.executeTool('create_recovery_recommendation', recInput);
  assert(rec.status === 'recorded', 'create_recovery_recommendation records recommendation');
  assert(engine.recommendationState?.priority === 'high', 'Engine saves recommendation state');

  // Tool 5: generate_recovery_message
  const msgInput = {
    lead_id: testLead.id,
    channel: 'email',
    subject: 'Follow-up on your AC repair with CoolCare AC',
    body: 'Hi Rajesh, We wanted to check if you still need AC repair assistance. All our repairs include a 90-day guarantee.',
    rationale: 'Friendly, policy-backed reminder'
  };
  const msg = await engine.executeTool('generate_recovery_message', msgInput);
  assert(msg.status === 'generated', 'generate_recovery_message generates message');
  assert(engine.messageState?.subject === msgInput.subject, 'Engine saves message state');

  // Tool 6: request_approval
  const approvalInput = {
    lead_id: testLead.id,
    summary: 'Email follow-up for Rajesh Kumar',
    priority: 'high',
    proposed_channel: 'email',
    proposed_message: msgInput.body,
    email_subject: msgInput.subject
  };
  const app = await engine.executeTool('request_approval', approvalInput);
  assert(app.status === 'approval_requested', 'request_approval registers pending approval');
  assert(Boolean(app.action_id), 'request_approval creates action ID');
  assert(app.requires_human_approval === true, 'request_approval enforces human-in-the-loop requirement');

  // Test 3: Security Allowlist & Error Handling
  console.log('\n--- TEST GROUP 3: Security Allowlist & Safety Gating ---');
  let rejectedUnknownTool = false;
  try {
    await engine.executeTool('execute_arbitrary_shell_command', { cmd: 'rm -rf /' });
  } catch (err: any) {
    rejectedUnknownTool = true;
    assert(err.message.includes('not permitted by ReviveAI security allowlist'), 'Engine strictly rejects unpermitted tool calls');
  }
  assert(rejectedUnknownTool, 'Disallowed tool call blocked by security check');

  // Ineligible lead safety gating: lead RV-1004 (declined service)
  const declinedLead = MOCK_LEADS.find(l => l.id === 'RV-1004')!;
  assert(Boolean(declinedLead), 'Declined lead RV-1004 found');
  let safetyGated = false;
  try {
    await runSimulatedRecoveryAgent(declinedLead);
  } catch (err: any) {
    safetyGated = true;
    assert(err.message.includes('Agent stopped by safety policy'), 'Agent halts immediately if lead is ineligible');
  }
  assert(safetyGated, 'Safety policy stopped ineligible lead prior to agent execution');

  // Test 4: Full Multi-Step Simulated Agent Execution (Deterministic Mock Mode)
  console.log('\n--- TEST GROUP 4: Full Simulated Recovery Agent Execution ---');
  const agentResult = await executeRecoveryAnalysis('RV-2002', { forceMock: true });
  assert(agentResult.success === true, 'Agent executes successfully on eligible lead RV-2002');
  assert(agentResult.mode === 'simulated_mock', 'Truthful mode reported as simulated_mock');
  assert(agentResult.model === 'simulated-agent-v1', 'Truthful model reported');
  assert(agentResult.token_usage.estimated_cost_usd === 0, 'Zero API credits ($0.00) consumed in mock mode');
  assert(agentResult.trace.length === 6, 'Agent trace captures exactly 6 tool execution steps');

  const traceToolNames = agentResult.trace.map(t => t.tool_name);
  assert(traceToolNames.includes('fetch_lead_context'), 'Trace includes fetch_lead_context');
  assert(traceToolNames.includes('get_interaction_history'), 'Trace includes get_interaction_history');
  assert(traceToolNames.includes('calculate_revenue_at_risk'), 'Trace includes calculate_revenue_at_risk');
  assert(traceToolNames.includes('create_recovery_recommendation'), 'Trace includes create_recovery_recommendation');
  assert(traceToolNames.includes('generate_recovery_message'), 'Trace includes generate_recovery_message');
  assert(traceToolNames.includes('request_approval'), 'Trace includes request_approval');

  // Test 5: Zod Schema Validation
  console.log('\n--- TEST GROUP 5: Zod RecoveryAnalysisSchema Validation ---');
  const parsedAnalysis = RecoveryAnalysisSchema.safeParse(agentResult.analysis);
  assert(parsedAnalysis.success === true, 'Recovery analysis strictly passes RecoveryAnalysisSchema zod parse');
  if (parsedAnalysis.success) {
    assert(parsedAnalysis.data.lead_id === 'RV-2002', 'Parsed analysis contains correct lead_id');
    assert(parsedAnalysis.data.requires_human_approval === true, 'Analysis enforces requires_human_approval');
    assert(Boolean(parsedAnalysis.data.email_body), 'Analysis contains non-empty recovery email body');
  }

  // Test 6: Multi-Business & Industry Independence
  console.log('\n--- TEST GROUP 6: Industry-Independent Multi-Business Execution ---');
  const dAgo = (days: number) => new Date(Date.now() - days * 86400000).toISOString();
  const eligiblePlumbingLead = {
    id: 'PL-3001',
    business_id: 'business-002',
    name: 'Vikram Joshi',
    email: 'vikram.j@domain.invalid',
    phone: '+91-98765-30001',
    message: 'Main water supply pipe leaking under kitchen sink. Need emergency plumber.',
    enquiry_type: 'Emergency leak repair',
    potential_value: 3500,
    status: 'STALE',
    received_at: dAgo(5),
    last_contacted_at: dAgo(5),
    follow_up_count: 1,
    contact_consent: 'CONSENTED',
    preferred_channel: 'email',
    booking_status: 'NOT_BOOKED',
    payment_status: 'NOT_PAID',
    source: 'WEBSITE',
    duplicate_of_lead_id: null,
    created_at: dAgo(5),
  };

  const plumbingResult = await runSimulatedRecoveryAgent(eligiblePlumbingLead as any);
  assert(plumbingResult.success === true, 'Agent executes successfully on FlowFix Plumbing lead');
  assert(plumbingResult.analysis.email_body.includes('FlowFix Plumbing & Drains'), 'Message correctly uses FlowFix Plumbing branding');
  assert(plumbingResult.analysis.email_body.includes('60-day'), 'Message dynamically includes FlowFix 60-day guarantee policy');

  // Test 7: Human Approval Queue Integration
  console.log('\n--- TEST GROUP 7: Action Storage & Trace Preservation ---');
  const storedAction = MOCK_AGENT_ACTIONS.find(a => a.lead_id === 'RV-2002' && a.status === 'pending');
  assert(Boolean(storedAction), 'Pending action stored in MOCK_AGENT_ACTIONS for RV-2002');
  assert(storedAction?.trace?.length === 6, 'Stored action preserves full 6-step tool trace');
  assert(storedAction?.mode === 'simulated_mock', 'Stored action records truthful mode');

  console.log('\n================================================================');
  console.log(`📊 TEST SUMMARY: ${passedTests} / ${totalTests} tests passed (${Math.round((passedTests/totalTests)*100)}%)`);
  console.log(`💳 TOTAL ANTHROPIC CREDITS CONSUMED: $0.0000 (100% Mock Safe)`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite failed unexpectedly:', err);
  process.exit(1);
});
