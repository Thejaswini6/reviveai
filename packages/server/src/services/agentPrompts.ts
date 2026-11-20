/**
 * Business-Aware Prompt Architecture for ReviveAI
 * Prepares industry-adaptive context for Claude reasoning and structured Zod output validation
 */

import { z } from 'zod';
import { BusinessProfile } from './businessConfig.js';
import { Lead } from '../data/mockData.js';

/**
 * Zod validation schema for Claude's structured recovery analysis output
 */
export const RecoveryAnalysisSchema = z.object({
  lead_id: z.string(),
  priority: z.enum(['high', 'medium', 'low']),
  customer_intent: z.string(),
  likely_reason_for_inactivity: z.string(),
  evidence: z.array(z.string()),
  uncertainty: z.string(),
  recommended_action: z.enum(['email', 'phone', 'escalation', 'do_not_contact']),
  suggested_channel: z.enum(['email', 'phone']),
  email_subject: z.string(),
  email_body: z.string(),
  requires_human_approval: z.boolean(),
});

export type RecoveryAnalysis = z.infer<typeof RecoveryAnalysisSchema>;

/**
 * Build Claude system and user prompts parameterized by the business profile
 */
export function buildRecoveryPromptContext(
  business: BusinessProfile,
  lead: Lead,
  timelineEvents: any[] = []
): { systemPrompt: string; userPrompt: string } {
  const serviceList = business.services
    .map(s => `- ${s.name}: ${s.description || 'Standard service'} (${business.currency.symbol}${s.estimated_value_min.toLocaleString()} - ${business.currency.symbol}${s.estimated_value_max.toLocaleString()})`)
    .join('\n');

  const timelineSummary = timelineEvents.length > 0
    ? timelineEvents.map(e => `[${e.timestamp}] ${e.type}: ${e.description}`).join('\n')
    : 'No previous follow-up interactions recorded.';

  const systemPrompt = `You are ReviveAI, an intelligent lead recovery and revenue intelligence agent working on behalf of "${business.name}" in the "${business.industry}" sector.

BUSINESS PROFILE:
- Business Name: ${business.name}
- Industry: ${business.industry}
- Overview: ${business.description}
- Currency: ${business.currency.code} (${business.currency.symbol})
- Key Policies: ${business.policies.terms_summary}
- Warranty: ${business.policies.warranty_days} days guarantee on work and parts.
- Free Inspection Available: ${business.policies.free_inspection ? 'Yes' : 'No'}

OFFERED SERVICES & PRICING:
${serviceList}

CORE PRINCIPLES:
1. Always analyze why the lead became inactive based on the specific service requested, inquiry text, and timeline.
2. Tone must reflect the industry: professional, helpful, respectful of customer time, and free of high-pressure sales tactics.
3. Every proposed email or follow-up action must be submitted for human approval before execution.
4. If the customer requested a phone callback or expressed severe service dissatisfaction, flag for human attention rather than proposing a generic automated sales email.
5. Return ONLY structured JSON strictly adhering to the specified schema.`;

  const userPrompt = `Analyze the following inactive lead for "${business.name}" and formulate an intelligent recovery recommendation:

LEAD CONTEXT:
- Lead ID: ${lead.id}
- Customer Name: ${lead.name}
- Customer Email: ${lead.email}
- Customer Phone: ${lead.phone || 'Not provided'}
- Service Requested: ${lead.enquiry_type || 'General inquiry'}
- Estimated Deal Value: ${business.currency.symbol}${lead.potential_value.toLocaleString()}
- Inquired Date: ${lead.received_at}
- Last Contact Date: ${lead.last_contacted_at || 'None'}
- Previous Follow-up Count: ${lead.follow_up_count}
- Source: ${lead.source || 'Website'}

CUSTOMER MESSAGE:
"${lead.message}"

CUSTOMER INTERACTION TIMELINE:
${timelineSummary}

TASK:
1. Determine customer intent and urgency.
2. Formulate the most probable reason for inactivity.
3. Cite concrete evidence from the message and timeline.
4. Note any uncertainty or assumptions.
5. Recommend a personalized follow-up strategy and draft a customer-ready email using ${business.name}'s context and policies.`;

  return { systemPrompt, userPrompt };
}

/**
 * Generate an industry-adaptive recovery recommendation (used in mock/demo mode)
 */
export function generateIndustryAdaptiveAnalysis(business: BusinessProfile, lead: Lead): RecoveryAnalysis {
  const firstName = lead.name.split(' ')[0];
  const serviceName = lead.enquiry_type || 'requested service';
  const currencySymbol = business.currency.symbol;
  const isHighValue = lead.potential_value >= (business.services[0]?.estimated_value_max || 10000);

  // Analyze intent & reasons dynamically based on customer message
  let customerIntent = `Customer interested in ${serviceName} from ${business.name}`;
  let likelyReason = 'Customer may be evaluating alternatives, awaiting a scheduling window, or got distracted.';
  let priority: 'high' | 'medium' | 'low' = isHighValue ? 'high' : 'medium';

  if (/quote|estimate|price|cost|budget/i.test(lead.message)) {
    likelyReason = 'Price comparison or waiting for quote confirmation and scope breakdown.';
  } else if (/urgent|today|asap|leak|error|emergency|not working/i.test(lead.message)) {
    likelyReason = 'Urgent problem where customer may have paused or sought alternative quick solutions.';
    priority = 'high';
  } else if (/weekend|evening|after|schedule/i.test(lead.message)) {
    likelyReason = 'Scheduling constraints or availability alignment needed.';
  }

  const daysSinceInquiry = Math.max(1, Math.floor((Date.now() - new Date(lead.received_at).getTime()) / (1000 * 60 * 60 * 24)));

  const emailSubject = `Follow-up: Your ${serviceName} inquiry with ${business.name}`;
  const inspectionOffer = business.policies.free_inspection 
    ? ` We offer a free, no-obligation site inspection to assess your exact requirements.` 
    : '';

  const emailBody = `Hi ${firstName},

I wanted to follow up on your recent inquiry regarding ${serviceName} with ${business.name}.

We understand you may still be finalizing your plans.${inspectionOffer} Our licensed team is ready to assist and ensure the work is completed to the highest standard with our ${business.policies.warranty_days}-day workmanship guarantee.

Would you be available for a brief conversation this week to discuss your preferred timing?

Best regards,
The Service Team
${business.name}
${business.phone} | ${business.email}`;

  return {
    lead_id: lead.id,
    priority,
    customer_intent: customerIntent,
    likely_reason_for_inactivity: likelyReason,
    evidence: [
      `Inquiry received ${daysSinceInquiry} days ago for ${serviceName}`,
      `Estimated opportunity value: ${currencySymbol}${lead.potential_value.toLocaleString()}`,
      lead.follow_up_count === 0 ? 'No follow-up sent since initial inquiry' : `Follow-up count: ${lead.follow_up_count}`,
      `Customer noted: "${lead.message.length > 90 ? lead.message.slice(0, 87) + '...' : lead.message}"`,
    ],
    uncertainty: 'Customer current progress with alternate service providers unknown.',
    recommended_action: 'email',
    suggested_channel: 'email',
    email_subject: emailSubject,
    email_body: emailBody,
    requires_human_approval: true,
  };
}
