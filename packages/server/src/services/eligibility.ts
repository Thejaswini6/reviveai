/**
 * Backend Eligibility & Business Safety Rules Engine
 * Enforces business rules and privacy safeguards before recovery actions
 */

import { Lead } from '../data/mockData.js';

export interface EligibilityResult {
  is_eligible: boolean;
  can_auto_recover: boolean;
  reasons: string[];
  recommended_handling: 'automated_recovery' | 'human_callback' | 'manager_escalation' | 'do_not_contact';
  flags: {
    is_opted_out: boolean;
    is_missing_consent: boolean;
    is_converted_or_paid: boolean;
    is_declined: boolean;
    is_duplicate: boolean;
    is_cooldown: boolean;
    is_complaint: boolean;
    is_callback_requested: boolean;
    preferred_channel: string;
  };
}

/**
 * Check deterministic business eligibility for a lead
 */
export function checkLeadEligibility(lead: Lead): EligibilityResult {
  const reasons: string[] = [];
  const flags = {
    is_opted_out: false,
    is_missing_consent: false,
    is_converted_or_paid: false,
    is_declined: false,
    is_duplicate: false,
    is_cooldown: false,
    is_complaint: false,
    is_callback_requested: false,
    preferred_channel: lead.preferred_channel || 'email',
  };

  // Rule 1: Customer Opted Out (Strict privacy protection)
  if (lead.contact_consent === 'OPTED_OUT' || lead.status === 'OPTED_OUT') {
    flags.is_opted_out = true;
    reasons.push('Customer has explicitly opted out of communications.');
  }

  // Rule 2: Missing or Unknown Consent
  if (!lead.contact_consent || lead.contact_consent === 'UNKNOWN' || lead.contact_consent !== 'CONSENTED') {
    if (!flags.is_opted_out) {
      flags.is_missing_consent = true;
      reasons.push('Required contact consent is missing or unverified. Automated outreach is prohibited.');
    }
  }

  // Rule 3: Already Converted or Paid
  if (
    lead.payment_status === 'PAID' ||
    lead.booking_status === 'CONFIRMED' ||
    lead.status === 'RECOVERED' ||
    lead.status === 'CONVERTED'
  ) {
    flags.is_converted_or_paid = true;
    reasons.push('Customer has already converted or completed payment for this service.');
  }

  // Rule 4: Customer Declined
  if (lead.status === 'DECLINED') {
    flags.is_declined = true;
    reasons.push('Customer explicitly declined the quote or service; further contact must not be attempted.');
  }

  // Rule 5: Duplicate Lead
  if (Boolean(lead.duplicate_of_lead_id)) {
    flags.is_duplicate = true;
    reasons.push(`Duplicate inquiry of lead ${lead.duplicate_of_lead_id}. Outreach must be consolidated on the primary lead.`);
  }

  // Rule 6: Customer Complaint or Escalation (Requires human manager, not automated sales email)
  const complaintKeywords = /unhappy|complaint|dissatisfied|damage|rude|late.*unhappy|manager|escalat/i;
  if (lead.status === 'ESCALATED' || complaintKeywords.test(lead.message || '')) {
    flags.is_complaint = true;
    reasons.push('Customer expressed dissatisfaction or requested manager escalation. Automated sales emails are blocked.');
  }

  // Rule 7: Explicit Callback Requested / Phone Channel Preference
  if (lead.status === 'CALLBACK_REQUESTED' || lead.preferred_channel === 'phone') {
    flags.is_callback_requested = true;
    reasons.push('Customer explicitly requested a phone callback. Automated email recovery is prohibited.');
  }

  // Rule 8: Follow-up Cooldown (Lead too fresh < 48 hours or recently contacted)
  const now = Date.now();
  const receivedTime = new Date(lead.received_at).getTime();
  const hoursSinceReceived = (now - receivedTime) / (1000 * 60 * 60);

  if (lead.status === 'NEW' && hoursSinceReceived < 48) {
    flags.is_cooldown = true;
    reasons.push(`Lead is fresh (${Math.round(hoursSinceReceived)}h old) and still within active response window (<48h). Recovery is premature.`);
  }

  if (lead.last_contacted_at) {
    const contactedTime = new Date(lead.last_contacted_at).getTime();
    const hoursSinceContact = (now - contactedTime) / (1000 * 60 * 60);
    if (hoursSinceContact < 48 && lead.follow_up_count > 0 && lead.status !== 'STALE') {
      flags.is_cooldown = true;
      reasons.push(`Lead was contacted recently (${Math.round(hoursSinceContact)}h ago). Active follow-up cooldown is in effect.`);
    }
  }

  // Determine overall handling recommendation
  if (flags.is_opted_out || flags.is_missing_consent || flags.is_converted_or_paid || flags.is_declined || flags.is_duplicate) {
    return {
      is_eligible: false,
      can_auto_recover: false,
      reasons,
      recommended_handling: 'do_not_contact',
      flags,
    };
  }

  if (flags.is_complaint) {
    return {
      is_eligible: false,
      can_auto_recover: false,
      reasons,
      recommended_handling: 'manager_escalation',
      flags,
    };
  }

  if (flags.is_callback_requested) {
    return {
      is_eligible: false,
      can_auto_recover: false,
      reasons,
      recommended_handling: 'human_callback',
      flags,
    };
  }

  if (flags.is_cooldown) {
    return {
      is_eligible: false,
      can_auto_recover: false,
      reasons,
      recommended_handling: 'do_not_contact',
      flags,
    };
  }

  // Fully eligible for recovery
  return {
    is_eligible: true,
    can_auto_recover: true,
    reasons: ['Lead meets all business safety criteria for AI recovery outreach.'],
    recommended_handling: 'automated_recovery',
    flags,
  };
}

/**
 * Recheck safety before an action can be approved or executed
 */
export function validateActionApproval(lead: Lead): { allowed: boolean; error?: string } {
  const check = checkLeadEligibility(lead);

  if (!check.is_eligible && check.recommended_handling === 'do_not_contact') {
    return {
      allowed: false,
      error: `Safety rule violation: Lead ${lead.id} cannot be contacted (${check.reasons.join('; ')}).`,
    };
  }

  if (check.flags.is_complaint) {
    return {
      allowed: false,
      error: `Action blocked: Lead ${lead.id} is flagged as a customer service complaint and requires direct manager intervention.`,
    };
  }

  if (check.flags.is_callback_requested) {
    return {
      allowed: false,
      error: `Action blocked: Lead ${lead.id} requested a phone call. Automated email dispatch is prohibited.`,
    };
  }

  return { allowed: true };
}
