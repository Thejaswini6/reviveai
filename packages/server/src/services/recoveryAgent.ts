/**
 * ReviveAI Recovery Agent Service
 * Implements genuine 6-tool Claude agent workflow using Anthropic Messages API
 * Supports both real Anthropic tool-calling and deterministic simulated mock mode
 */

import { Anthropic } from '@anthropic-ai/sdk';
import { z } from 'zod';
import { ENV } from '../env.js';
import { logger } from '../utils/logger.js';
import { MOCK_LEADS, MOCK_TIMELINE_EVENTS, MOCK_AGENT_ACTIONS, Lead, AgentAction } from '../data/mockData.js';
import { getBusinessProfile, BusinessProfile } from './businessConfig.js';
import { checkLeadEligibility, validateActionApproval, EligibilityResult } from './eligibility.js';
import { RecoveryAnalysis, RecoveryAnalysisSchema, buildRecoveryPromptContext } from './agentPrompts.js';

// ============================================================================
// 1. ANTHROPIC TOOL DEFINITIONS (Part 3)
// ============================================================================

export const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: 'fetch_lead_context',
    description: 'Retrieve authoritative lead profile, customer contact info, requested service, estimated value, consent status, business policies, and backend eligibility.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'The unique lead identifier (e.g. RV-2001)' }
      },
      required: ['lead_id']
    }
  },
  {
    name: 'get_interaction_history',
    description: 'Retrieve the verified chronological customer interaction timeline, quotations, follow-up count, and inactivity context. Never invent unrecorded history.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'The unique lead identifier (e.g. RV-2001)' }
      },
      required: ['lead_id']
    }
  },
  {
    name: 'calculate_revenue_at_risk',
    description: 'Calculate authoritative gross open pipeline value, eligible recovery opportunity, and confirmed recovered revenue based strictly on backend verified data.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'The unique lead identifier (e.g. RV-2001)' }
      },
      required: ['lead_id']
    }
  },
  {
    name: 'create_recovery_recommendation',
    description: 'Record an industry-appropriate recovery recommendation grounded strictly in retrieved context, customer intent, and root causes of inactivity.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'The unique lead identifier' },
        customer_intent: { type: 'string', description: 'Specific interest and intent of the customer' },
        likely_reason_for_inactivity: { type: 'string', description: 'Plausible reason customer stopped responding' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'], description: 'Assigned priority for outreach' },
        priority_reason: { type: 'string', description: 'Justification for the priority assignment' },
        recommended_action: { type: 'string', enum: ['email', 'phone', 'escalation', 'do_not_contact'], description: 'Proposed recovery action type' },
        strategy_explanation: { type: 'string', description: 'Detailed explanation of the recovery strategy' }
      },
      required: ['lead_id', 'customer_intent', 'likely_reason_for_inactivity', 'priority', 'priority_reason', 'recommended_action', 'strategy_explanation']
    }
  },
  {
    name: 'generate_recovery_message',
    description: 'Generate a personalized follow-up message strictly using real business policies, services, customer context, and preferred communication channel.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'The unique lead identifier' },
        channel: { type: 'string', enum: ['email', 'phone'], description: 'Target communication channel' },
        subject: { type: 'string', description: 'Email subject line' },
        body: { type: 'string', description: 'Personalized message body referencing real business context and policies' },
        rationale: { type: 'string', description: 'Reasoning behind the suggested wording and tone' }
      },
      required: ['lead_id', 'channel', 'subject', 'body', 'rationale']
    }
  },
  {
    name: 'request_approval',
    description: 'Submit the proposed recovery action and message for mandatory human review. Creates a pending approval record. MUST NEVER execute or dispatch contact directly.',
    input_schema: {
      type: 'object',
      properties: {
        lead_id: { type: 'string', description: 'The unique lead identifier' },
        summary: { type: 'string', description: 'Brief summary of the recovery proposal for the human reviewer' },
        priority: { type: 'string', enum: ['high', 'medium', 'low'] },
        proposed_channel: { type: 'string', enum: ['email', 'phone'] },
        proposed_message: { type: 'string', description: 'The exact proposed message to review' },
        email_subject: { type: 'string', description: 'Subject line if email channel' }
      },
      required: ['lead_id', 'summary', 'priority', 'proposed_channel', 'proposed_message']
    }
  }
];

// ============================================================================
// 2. AGENT EXECUTION TRACE & RESULT TYPES (Part 4, 8, 10)
// ============================================================================

export interface AgentTraceStep {
  step_number: number;
  type: 'tool_call' | 'backend_validation' | 'decision';
  tool_name: string;
  description: string;
  input: any;
  output: any;
  duration_ms: number;
  timestamp: string;
  source: 'claude_tool_call' | 'backend_guard' | 'mock_simulation';
}

export interface AgentTokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
}

export interface AgentExecutionResult {
  success: boolean;
  lead_id: string;
  action_id: string;
  status: 'pending';
  mode: 'real_claude' | 'simulated_mock';
  model: string;
  duration_ms: number;
  token_usage?: AgentTokenUsage;
  trace: AgentTraceStep[];
  analysis: RecoveryAnalysis;
  eligibility: EligibilityResult;
}

// Pricing rates per 1,000 tokens for cost estimation
const MODEL_PRICING: Record<string, { inputPerK: number; outputPerK: number }> = {
  'claude-sonnet-5-5': { inputPerK: 0.003, outputPerK: 0.015 },
  'claude-3-5-sonnet-20241022': { inputPerK: 0.003, outputPerK: 0.015 },
  'claude-haiku-4-5': { inputPerK: 0.0008, outputPerK: 0.004 },
  'default': { inputPerK: 0.003, outputPerK: 0.015 },
};

function calculateTokenCost(model: string, inputTokens: number, outputTokens: number): number {
  const rates = MODEL_PRICING[model] || MODEL_PRICING['default'];
  const cost = (inputTokens / 1000) * rates.inputPerK + (outputTokens / 1000) * rates.outputPerK;
  return Math.round(cost * 10000) / 10000;
}

// ============================================================================
// 3. SECURE BACKEND TOOL HANDLERS (Allowlist Execution)
// ============================================================================

export class ToolExecutionEngine {
  private lead: Lead;
  private business: BusinessProfile;
  private timeline: any[];
  private eligibility: EligibilityResult;

  // Staged state accumulated by the agent tools
  public recommendationState?: any;
  public messageState?: any;
  public approvalAction?: AgentAction;

  constructor(lead: Lead) {
    this.lead = lead;
    this.business = getBusinessProfile(lead.business_id);
    this.timeline = MOCK_TIMELINE_EVENTS[lead.id] || [];
    this.eligibility = checkLeadEligibility(lead);
  }

  public async executeTool(name: string, input: any): Promise<any> {
    switch (name) {
      case 'fetch_lead_context': {
        return {
          lead_id: this.lead.id,
          customer_name: this.lead.name,
          customer_email: this.lead.email,
          customer_phone: this.lead.phone || null,
          service_requested: this.lead.enquiry_type || 'General Service',
          potential_value: this.lead.potential_value,
          currency: this.business.currency,
          status: this.lead.status,
          contact_consent: this.lead.contact_consent,
          preferred_channel: this.lead.preferred_channel,
          received_at: this.lead.received_at,
          last_contacted_at: this.lead.last_contacted_at || null,
          follow_up_count: this.lead.follow_up_count,
          source: this.lead.source,
          customer_message: this.lead.message,
          business_profile: {
            id: this.business.id,
            name: this.business.name,
            industry: this.business.industry,
            warranty_days: this.business.policies.warranty_days,
            free_inspection: this.business.policies.free_inspection,
            terms_summary: this.business.policies.terms_summary,
          },
          eligibility: {
            is_eligible: this.eligibility.is_eligible,
            can_auto_recover: this.eligibility.can_auto_recover,
            recommended_handling: this.eligibility.recommended_handling,
            reasons: this.eligibility.reasons,
          }
        };
      }

      case 'get_interaction_history': {
        const daysInactive = Math.max(1, Math.floor((Date.now() - new Date(this.lead.received_at).getTime()) / (1000 * 60 * 60 * 24)));
        return {
          lead_id: this.lead.id,
          lead_status: this.lead.status,
          timeline_events: this.timeline,
          total_events: this.timeline.length,
          days_inactive: daysInactive,
          last_contacted_at: this.lead.last_contacted_at || 'Never contacted after initial inquiry',
          follow_up_count: this.lead.follow_up_count,
          has_unresponded_quote: this.timeline.some(t => t.type?.toLowerCase().includes('quote') || t.status === 'QUOTE_SENT')
        };
      }

      case 'calculate_revenue_at_risk': {
        const isEligible = this.eligibility.is_eligible;
        const isPaid = this.lead.payment_status === 'PAID' || this.lead.status === 'RECOVERED' || this.lead.status === 'CONVERTED';
        
        return {
          lead_id: this.lead.id,
          currency: this.business.currency.code,
          currency_symbol: this.business.currency.symbol,
          lead_potential_value: this.lead.potential_value,
          potential_value: this.lead.potential_value,
          is_eligible: isEligible,
          gross_open_pipeline_value: isPaid ? 0 : this.lead.potential_value,
          eligible_recovery_opportunity: isEligible ? this.lead.potential_value : 0,
          confirmed_recovered_revenue: isPaid ? this.lead.potential_value : 0,
          eligibility_exclusions: isEligible ? [] : this.eligibility.reasons,
          calculation_authority: 'Backend Authoritative Ledger'
        };
      }

      case 'create_recovery_recommendation': {
        this.recommendationState = {
          lead_id: input.lead_id,
          customer_intent: input.customer_intent,
          likely_reason_for_inactivity: input.likely_reason_for_inactivity,
          priority: input.priority || 'medium',
          priority_reason: input.priority_reason,
          recommended_action: input.recommended_action || 'email',
          strategy_explanation: input.strategy_explanation,
          created_at: new Date().toISOString()
        };
        return {
          status: 'recorded',
          recommendation: this.recommendationState
        };
      }

      case 'generate_recovery_message': {
        this.messageState = {
          lead_id: input.lead_id,
          channel: input.channel || 'email',
          subject: input.subject,
          body: input.body,
          rationale: input.rationale,
          generated_at: new Date().toISOString()
        };
        return {
          status: 'generated',
          message: this.messageState
        };
      }

      case 'request_approval': {
        // Enforce safety before creating approval action
        if (!this.eligibility.is_eligible && this.eligibility.recommended_handling === 'do_not_contact') {
          throw new Error(`Cannot request approval: Lead is ineligible for outreach (${this.eligibility.reasons.join('; ')})`);
        }

        const actionId = `action-${Date.now()}`;
        const newAction: AgentAction = {
          id: actionId,
          lead_id: this.lead.id,
          lead_name: this.lead.name,
          action_type: 'analysis',
          status: 'pending',
          analysis_json: JSON.stringify({
            lead_id: this.lead.id,
            priority: input.priority || this.recommendationState?.priority || 'medium',
            customer_intent: this.recommendationState?.customer_intent || `Interest in ${this.lead.enquiry_type}`,
            likely_reason_for_inactivity: this.recommendationState?.likely_reason_for_inactivity || 'Inactivity under evaluation',
            evidence: [
              `Lead potential: ${this.business.currency.symbol}${this.lead.potential_value}`,
              `Inquiry date: ${this.lead.received_at}`,
              `Service: ${this.lead.enquiry_type}`
            ],
            uncertainty: 'Customer response timing subject to schedule alignment',
            recommended_action: input.proposed_channel || 'email',
            suggested_channel: input.proposed_channel || 'email',
            email_subject: input.email_subject || this.messageState?.subject || `Follow-up on ${this.lead.enquiry_type} with ${this.business.name}`,
            email_body: input.proposed_message || this.messageState?.body || '',
            requires_human_approval: true
          }),
          generated_message: input.proposed_message || this.messageState?.body || '',
          approval_requested_at: new Date().toISOString(),
          approved_by: null,
          approved_at: null,
          rejection_reason: null,
          executed_at: null,
          error_message: null,
          created_at: new Date().toISOString(),
          mode: 'real_claude',
        };

        // Remove any prior pending action for this lead
        const existingIdx = MOCK_AGENT_ACTIONS.findIndex(a => a.lead_id === this.lead.id && a.status === 'pending');
        if (existingIdx >= 0) {
          MOCK_AGENT_ACTIONS.splice(existingIdx, 1);
        }
        MOCK_AGENT_ACTIONS.push(newAction);
        this.approvalAction = newAction;

        return {
          status: 'approval_requested',
          action_id: actionId,
          summary: input.summary,
          priority: input.priority,
          message_preview: input.proposed_message?.slice(0, 100) + '...',
          requires_human_approval: true
        };
      }

      default:
        throw new Error(`Unknown tool: "${name}". Tool is not permitted by ReviveAI security allowlist.`);
    }
  }
}

// ============================================================================
// 4. REAL ANTHROPIC TOOL-CALLING CYCLE (Part 4)
// ============================================================================

export async function runClaudeRecoveryAgent(
  lead: Lead,
  anthropicApiKey: string,
  model = ENV.ANTHROPIC_MODEL || 'claude-sonnet-5-5'
): Promise<AgentExecutionResult> {
  const startTime = Date.now();
  const business = getBusinessProfile(lead.business_id);
  const eligibility = checkLeadEligibility(lead);

  // Safety gate: Stop before initiating Claude request if lead is ineligible
  if (!eligibility.is_eligible) {
    throw new Error(`Agent stopped by safety policy: Lead ${lead.id} is ineligible (${eligibility.reasons.join('; ')})`);
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });
  const toolEngine = new ToolExecutionEngine(lead);
  const trace: AgentTraceStep[] = [];

  const { systemPrompt, userPrompt } = buildRecoveryPromptContext(business, lead, MOCK_TIMELINE_EVENTS[lead.id] || []);

  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: userPrompt }
  ];

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let stepNumber = 1;
  const MAX_TURNS = 8;
  let turn = 0;
  let finalAssistantText = '';

  while (turn < MAX_TURNS) {
    turn++;
    const turnStart = Date.now();

    const response = await anthropic.messages.create({
      model,
      max_tokens: 2048,
      system: systemPrompt,
      tools: AGENT_TOOLS,
      messages,
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

    // Check assistant content
    const toolUseBlocks = response.content.filter((c): c is Anthropic.ToolUseBlock => c.type === 'tool_use');
    const textBlocks = response.content.filter((c): c is Anthropic.TextBlock => c.type === 'text');

    if (textBlocks.length > 0) {
      finalAssistantText = textBlocks.map(t => t.text).join('\n');
    }

    // Append assistant's turn to message history
    messages.push({
      role: 'assistant',
      content: response.content
    });

    // If Claude did not invoke tools or completed
    if (response.stop_reason !== 'tool_use' || toolUseBlocks.length === 0) {
      break;
    }

    // Process each tool call sequentially
    const toolResultBlocks: Anthropic.ToolResultBlockParam[] = [];

    for (const toolUse of toolUseBlocks) {
      const toolStart = Date.now();
      let toolResult: any;
      let isError = false;

      try {
        toolResult = await toolEngine.executeTool(toolUse.name, toolUse.input);
      } catch (err: any) {
        isError = true;
        toolResult = { error: err.message };
      }

      const toolDuration = Date.now() - toolStart;

      trace.push({
        step_number: stepNumber++,
        type: 'tool_call',
        tool_name: toolUse.name,
        description: getToolDescription(toolUse.name, toolUse.input, toolResult),
        input: toolUse.input,
        output: toolResult,
        duration_ms: toolDuration,
        timestamp: new Date().toISOString(),
        source: 'claude_tool_call'
      });

      toolResultBlocks.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: JSON.stringify(toolResult),
        is_error: isError
      });
    }

    // Feed tool results back to Claude
    messages.push({
      role: 'user',
      content: toolResultBlocks
    });
  }

  const durationMs = Date.now() - startTime;
  const tokenCost = calculateTokenCost(model, totalInputTokens, totalOutputTokens);

  // Validate or construct final structured output using Zod
  const analysis = assembleAndValidateAnalysis(lead, business, toolEngine, finalAssistantText);

  if (!toolEngine.approvalAction) {
    const fallbackActionId = `action-${Date.now()}`;
    const fallbackAction: AgentAction = {
      id: fallbackActionId,
      lead_id: lead.id,
      lead_name: lead.name,
      action_type: 'analysis',
      status: 'pending',
      analysis_json: JSON.stringify(analysis),
      generated_message: analysis.email_body,
      approval_requested_at: new Date().toISOString(),
      approved_by: null,
      approved_at: null,
      rejection_reason: null,
      executed_at: null,
      error_message: null,
      created_at: new Date().toISOString(),
      mode: 'real_claude',
      model,
      token_usage: {
        input_tokens: totalInputTokens,
        output_tokens: totalOutputTokens,
        total_tokens: totalInputTokens + totalOutputTokens,
        estimated_cost_usd: tokenCost
      },
      trace
    };
    const existingIdx = MOCK_AGENT_ACTIONS.findIndex(a => a.lead_id === lead.id && a.status === 'pending');
    if (existingIdx >= 0) {
      MOCK_AGENT_ACTIONS.splice(existingIdx, 1);
    }
    MOCK_AGENT_ACTIONS.push(fallbackAction);
    toolEngine.approvalAction = fallbackAction;
  } else {
    toolEngine.approvalAction.trace = trace;
    toolEngine.approvalAction.mode = 'real_claude';
    toolEngine.approvalAction.model = model;
    toolEngine.approvalAction.token_usage = {
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      total_tokens: totalInputTokens + totalOutputTokens,
      estimated_cost_usd: tokenCost
    };
    toolEngine.approvalAction.analysis_json = JSON.stringify(analysis);
  }

  const actionId = toolEngine.approvalAction.id;

  return {
    success: true,
    lead_id: lead.id,
    action_id: actionId,
    status: 'pending',
    mode: 'real_claude',
    model,
    duration_ms: durationMs,
    token_usage: {
      input_tokens: totalInputTokens,
      output_tokens: totalOutputTokens,
      total_tokens: totalInputTokens + totalOutputTokens,
      estimated_cost_usd: tokenCost
    },
    trace,
    analysis,
    eligibility
  };
}

// ============================================================================
// 5. DETERMINISTIC SIMULATED AGENT (Mock Mode for Credit Conservation)
// ============================================================================

export async function runSimulatedRecoveryAgent(lead: Lead): Promise<AgentExecutionResult> {
  const startTime = Date.now();
  const business = getBusinessProfile(lead.business_id);
  const eligibility = checkLeadEligibility(lead);

  if (!eligibility.is_eligible) {
    throw new Error(`Agent stopped by safety policy: Lead ${lead.id} is ineligible (${eligibility.reasons.join('; ')})`);
  }

  const toolEngine = new ToolExecutionEngine(lead);
  const trace: AgentTraceStep[] = [];
  let stepNumber = 1;

  // Simulate Step 1: fetch_lead_context
  const t1Start = Date.now();
  const context = await toolEngine.executeTool('fetch_lead_context', { lead_id: lead.id });
  trace.push({
    step_number: stepNumber++,
    type: 'tool_call',
    tool_name: 'fetch_lead_context',
    description: `Retrieved lead profile for ${lead.name} (${business.name})`,
    input: { lead_id: lead.id },
    output: context,
    duration_ms: Date.now() - t1Start,
    timestamp: new Date().toISOString(),
    source: 'mock_simulation'
  });

  // Simulate Step 2: get_interaction_history
  const t2Start = Date.now();
  const history = await toolEngine.executeTool('get_interaction_history', { lead_id: lead.id });
  trace.push({
    step_number: stepNumber++,
    type: 'tool_call',
    tool_name: 'get_interaction_history',
    description: `Analyzed customer timeline (${history.timeline_events.length} events, ${history.days_inactive} days inactive)`,
    input: { lead_id: lead.id },
    output: history,
    duration_ms: Date.now() - t2Start,
    timestamp: new Date().toISOString(),
    source: 'mock_simulation'
  });

  // Simulate Step 3: calculate_revenue_at_risk
  const t3Start = Date.now();
  const revenue = await toolEngine.executeTool('calculate_revenue_at_risk', { lead_id: lead.id });
  trace.push({
    step_number: stepNumber++,
    type: 'tool_call',
    tool_name: 'calculate_revenue_at_risk',
    description: `Authoritative revenue calculation: ${revenue.currency_symbol}${revenue.eligible_recovery_opportunity} recovery opportunity`,
    input: { lead_id: lead.id },
    output: revenue,
    duration_ms: Date.now() - t3Start,
    timestamp: new Date().toISOString(),
    source: 'mock_simulation'
  });

  // Formulate recommendation parameters
  const isUrgent = /urgent|leak|error|asap|today|emergency/i.test(lead.message);
  const isHighValue = lead.potential_value >= 15000;
  const priority = isHighValue || isUrgent ? 'high' : 'medium';

  let likelyReason = 'Customer evaluating options or awaiting schedule window.';
  if (/quote|estimate|price/i.test(lead.message)) likelyReason = 'Price comparison or waiting for quote breakdown.';
  if (isUrgent) likelyReason = 'Urgent service issue needing direct confirmation of technician arrival.';

  // Simulate Step 4: create_recovery_recommendation
  const t4Start = Date.now();
  const recInput = {
    lead_id: lead.id,
    customer_intent: `Inquiry regarding ${lead.enquiry_type}`,
    likely_reason_for_inactivity: likelyReason,
    priority,
    priority_reason: `${isHighValue ? 'High opportunity value' : 'Qualified inquiry'} with ${history.days_inactive} days since contact`,
    recommended_action: 'email',
    strategy_explanation: `Personalized follow-up offering ${business.policies.free_inspection ? 'free inspection and ' : ''}${business.policies.warranty_days}-day warranty reassurance`
  };
  const recResult = await toolEngine.executeTool('create_recovery_recommendation', recInput);
  trace.push({
    step_number: stepNumber++,
    type: 'tool_call',
    tool_name: 'create_recovery_recommendation',
    description: `Formulated ${priority}-priority recovery strategy: ${likelyReason}`,
    input: recInput,
    output: recResult,
    duration_ms: Date.now() - t4Start,
    timestamp: new Date().toISOString(),
    source: 'mock_simulation'
  });

  // Simulate Step 5: generate_recovery_message
  const t5Start = Date.now();
  const firstName = lead.name.split(' ')[0];
  const emailSubject = `Follow-up on your ${lead.enquiry_type} inquiry — ${business.name}`;
  const inspectionText = business.policies.free_inspection 
    ? ' We would be happy to provide a complimentary site inspection to assess your exact setup.' 
    : '';

  const emailBody = `Hi ${firstName},

I wanted to follow up on your recent inquiry regarding ${lead.enquiry_type} with ${business.name}.

We understand you may still be considering your options.${inspectionText} All of our work includes our standard ${business.policies.warranty_days}-day workmanship guarantee, and our team is ready to assist.

Could we schedule a convenient time this week to discuss your requirements?

Best regards,
Customer Care Team
${business.name}
${business.phone} | ${business.email}`;

  const msgInput = {
    lead_id: lead.id,
    channel: 'email',
    subject: emailSubject,
    body: emailBody,
    rationale: `Professional, policy-backed tone emphasizing ${business.policies.warranty_days}-day guarantee and convenient scheduling`
  };
  const msgResult = await toolEngine.executeTool('generate_recovery_message', msgInput);
  trace.push({
    step_number: stepNumber++,
    type: 'tool_call',
    tool_name: 'generate_recovery_message',
    description: `Drafted compliant personalized message for review (Subject: "${emailSubject}")`,
    input: msgInput,
    output: msgResult,
    duration_ms: Date.now() - t5Start,
    timestamp: new Date().toISOString(),
    source: 'mock_simulation'
  });

  // Simulate Step 6: request_approval
  const t6Start = Date.now();
  const approvalInput = {
    lead_id: lead.id,
    summary: `Re-engagement email for ${lead.name} regarding ${lead.enquiry_type}`,
    priority,
    proposed_channel: 'email',
    proposed_message: emailBody,
    email_subject: emailSubject
  };
  const approvalResult = await toolEngine.executeTool('request_approval', approvalInput);
  trace.push({
    step_number: stepNumber++,
    type: 'tool_call',
    tool_name: 'request_approval',
    description: `Submitted action to Human Approval Queue (Action ID: ${approvalResult.action_id})`,
    input: approvalInput,
    output: approvalResult,
    duration_ms: Date.now() - t6Start,
    timestamp: new Date().toISOString(),
    source: 'mock_simulation'
  });

  const durationMs = Date.now() - startTime;
  const analysis = assembleAndValidateAnalysis(lead, business, toolEngine, '');

  if (toolEngine.approvalAction) {
    toolEngine.approvalAction.trace = trace;
    toolEngine.approvalAction.mode = 'simulated_mock';
    toolEngine.approvalAction.model = 'simulated-agent-v1';
    toolEngine.approvalAction.token_usage = {
      input_tokens: 650,
      output_tokens: 380,
      total_tokens: 1030,
      estimated_cost_usd: 0.0000
    };
    toolEngine.approvalAction.analysis_json = JSON.stringify(analysis);
  }

  return {
    success: true,
    lead_id: lead.id,
    action_id: approvalResult.action_id,
    status: 'pending',
    mode: 'simulated_mock',
    model: 'simulated-agent-v1',
    duration_ms: durationMs,
    token_usage: {
      input_tokens: 650,
      output_tokens: 380,
      total_tokens: 1030,
      estimated_cost_usd: 0.0000 // Zero API credits consumed in mock mode
    },
    trace,
    analysis,
    eligibility
  };
}

// ============================================================================
// 6. HELPER & VALIDATION UTILITIES (Part 5)
// ============================================================================

function assembleAndValidateAnalysis(
  lead: Lead,
  business: BusinessProfile,
  engine: ToolExecutionEngine,
  assistantText: string
): RecoveryAnalysis {
  const rec = engine.recommendationState;
  const msg = engine.messageState;

  const raw = {
    lead_id: lead.id,
    priority: rec?.priority || 'medium',
    customer_intent: rec?.customer_intent || `Customer inquired about ${lead.enquiry_type}`,
    likely_reason_for_inactivity: rec?.likely_reason_for_inactivity || 'Customer awaiting follow-up or comparing options',
    evidence: [
      `Potential deal value: ${business.currency.symbol}${lead.potential_value}`,
      `Service requested: ${lead.enquiry_type}`,
      `Previous follow-up count: ${lead.follow_up_count}`
    ],
    uncertainty: 'Customer timeline and availability to be confirmed via outreach',
    recommended_action: rec?.recommended_action || 'email',
    suggested_channel: msg?.channel || 'email',
    email_subject: msg?.subject || `Follow-up: Your ${lead.enquiry_type} Inquiry`,
    email_body: msg?.body || assistantText || `Hi ${lead.name},\n\nWe wanted to follow up on your recent inquiry. Best regards,\n${business.name}`,
    requires_human_approval: true
  };

  return RecoveryAnalysisSchema.parse(raw);
}

function getToolDescription(name: string, input: any, output: any): string {
  switch (name) {
    case 'fetch_lead_context':
      return `Retrieved lead & business context for ${input.lead_id}`;
    case 'get_interaction_history':
      return `Retrieved interaction history (${output.total_events || 0} events recorded)`;
    case 'calculate_revenue_at_risk':
      return `Calculated revenue at risk (${output.currency_symbol || '₹'}${output.eligible_recovery_opportunity || 0} eligible opportunity)`;
    case 'create_recovery_recommendation':
      return `Created recovery recommendation (Priority: ${input.priority || 'medium'})`;
    case 'generate_recovery_message':
      return `Drafted recovery message via ${input.channel || 'email'}`;
    case 'request_approval':
      return `Submitted proposal to Human Approval Queue (Action ID: ${output.action_id || 'pending'})`;
    default:
      return `Executed tool ${name}`;
  }
}

/**
 * Main Entry Point for Recovery Analysis
 * Dispatches to real Claude if ANTHROPIC_API_KEY is present and MOCK_MODE is false;
 * otherwise executes the deterministic simulated mock agent (zero credits spent)
 */
export async function executeRecoveryAnalysis(
  leadId: string,
  options?: { forceMock?: boolean }
): Promise<AgentExecutionResult> {
  const lead = MOCK_LEADS.find(l => l.id === leadId);
  if (!lead) {
    throw new Error(`Lead not found: "${leadId}"`);
  }

  const useRealClaude = !ENV.MOCK_MODE && Boolean(ENV.ANTHROPIC_API_KEY) && !options?.forceMock;

  if (useRealClaude) {
    logger.info(`🤖 Starting Real Claude Agent for lead ${leadId} using model ${ENV.ANTHROPIC_MODEL}`);
    return runClaudeRecoveryAgent(lead, ENV.ANTHROPIC_API_KEY!, ENV.ANTHROPIC_MODEL);
  } else {
    logger.info(`🎭 Starting Simulated Mock Agent for lead ${leadId} (Zero credits consumed)`);
    return runSimulatedRecoveryAgent(lead);
  }
}
