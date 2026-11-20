/**
 * Pre-prepared Single Real Lead Claude Test
 * TARGET: Synthetic lead RV-2001 only (Rajesh Mehta, CoolCare AC Services)
 * RESTRICTION: Isolated single-lead execution, zero email delivery, max 1 API cycle
 * DO NOT RUN WITHOUT EXPLICIT USER APPROVAL.
 */

import { runClaudeRecoveryAgent } from '../src/services/recoveryAgent.js';
import { MOCK_LEADS } from '../src/data/mockData.js';
import { ENV } from '../src/env.js';
import { RecoveryAnalysisSchema } from '../src/services/agentPrompts.js';

async function main() {
  console.log('\n================================================================');
  console.log('⚡ REVIVEAI: SINGLE-LEAD LIVE CLAUDE SONNET TEST');
  console.log('================================================================\n');

  const apiKey = process.env.ANTHROPIC_API_KEY || ENV.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ABORTED: ANTHROPIC_API_KEY is not configured in process or .env.');
    process.exit(1);
  }

  // Strictly target RV-2001 only
  const targetLeadId = 'RV-2001';
  const lead = MOCK_LEADS.find(l => l.id === targetLeadId);

  if (!lead) {
    console.error(`❌ ABORTED: Synthetic lead ${targetLeadId} not found.`);
    process.exit(1);
  }

  console.log(`🎯 Target Lead: ${lead.id} (${lead.name})`);
  console.log(`💼 Enquiry: ${lead.enquiry_type} | Potential Value: ₹${lead.potential_value}`);
  console.log(`🤖 Model: ${ENV.ANTHROPIC_MODEL}`);
  console.log(`🛡️ Email Safeguard: SIMULATED (No real emails will be sent)`);
  console.log(`🔒 Lead Boundary: EXACTLY 1 LEAD (${lead.id}). No batch processing.\n`);

  console.log('🚀 Initiating Messages API tool-use cycle with Claude...');
  const startTime = Date.now();

  try {
    const result = await runClaudeRecoveryAgent(lead, apiKey, ENV.ANTHROPIC_MODEL);
    const duration = Date.now() - startTime;

    // Verify final Zod response schema validation
    const zodValidation = RecoveryAnalysisSchema.safeParse(result.analysis);

    console.log('\n✅ EXECUTION COMPLETED SUCCESSFULLY');
    console.log('----------------------------------------------------------------');
    console.log(`🤖 Model ID: ${result.model}`);
    console.log(`⏱️ Duration: ${duration} ms`);
    console.log(`🔤 Input Tokens: ${result.token_usage?.input_tokens}`);
    console.log(`🔤 Output Tokens: ${result.token_usage?.output_tokens}`);
    console.log(`🔤 Total Tokens: ${result.token_usage?.total_tokens}`);
    console.log(`💵 Estimated API Cost: $${result.token_usage?.estimated_cost_usd?.toFixed(4)} USD`);
    console.log(`🛡️ Zod Schema Validation: ${zodValidation.success ? 'PASSED (Strict RecoveryAnalysisSchema match)' : 'FAILED'}`);
    console.log(`📝 Generated Action ID: ${result.action_id}`);
    console.log(`🔍 Tool Turns & Trace Steps Recorded: ${result.trace.length}`);
    console.log('\n📋 Tool Execution Trace:');
    result.trace.forEach(step => {
      console.log(`   Step #${step.step_number}: [${step.tool_name || step.type}] ${step.description} (${step.duration_ms} ms)`);
    });

    console.log('\n📄 Final Validated Recovery Strategy:');
    console.log(`   Customer Intent: ${result.analysis.customer_intent}`);
    console.log(`   Inactivity Reason: ${result.analysis.likely_reason_for_inactivity}`);
    console.log(`   Priority: ${result.analysis.priority}`);
    console.log(`   Subject: ${result.analysis.email_subject}`);
    console.log(`   Body:\n${result.analysis.email_body.split('\n').map(l => '     ' + l).join('\n')}`);
    console.log('================================================================\n');
  } catch (err: any) {
    console.error('\n❌ API Execution Failed:', err.message);
    process.exit(1);
  }
}

main();
