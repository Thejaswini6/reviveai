/**
 * Shared TypeScript types and interfaces
 */

// Business
export interface Business {
  id: string;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  created_at: string;
}

// Lead status enum
export enum LeadStatus {
  NEW = 'NEW',
  STALE = 'STALE',
  CONTACTED = 'CONTACTED',
  RECOVERED = 'RECOVERED',
  ESCALATED = 'ESCALATED',
  DECLINED = 'DECLINED',
  OPTED_OUT = 'OPTED_OUT',
}

// Contact consent enum
export enum ContactConsent {
  CONSENTED = 'CONSENTED',
  OPTED_OUT = 'OPTED_OUT',
}

// Lead interface
export interface Lead {
  id: string;
  business_id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  enquiry_type?: string;
  potential_value: number;
  status: LeadStatus;
  received_at: string;
  last_contacted_at?: string;
  follow_up_count: number;
  contact_consent: ContactConsent;
  preferred_channel: 'email' | 'phone';
  booking_status: 'NOT_BOOKED' | 'PENDING' | 'CONFIRMED';
  payment_status: 'NOT_PAID' | 'PAID';
  source?: string;
  duplicate_of_lead_id?: string;
  created_at: string;
}

// Agent action types
export enum AgentActionType {
  ANALYSIS = 'analysis',
  APPROVAL_REQUESTED = 'approval_requested',
  EMAIL_SENT = 'email_sent',
  FOLLOW_UP_SCHEDULED = 'follow_up_scheduled',
  ESCALATION = 'escalation',
}

export enum AgentActionStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

// Claude analysis output structure
export interface ClaudeAnalysis {
  lead_id: string;
  priority: 'high' | 'medium' | 'low';
  customer_intent: string;
  likely_reason_for_inactivity: string;
  evidence: string[];
  uncertainty: string;
  recommended_action: string;
  suggested_channel: 'email' | 'phone' | 'sms';
  email_subject: string;
  email_body: string;
  requires_human_approval: boolean;
}

// Agent action interface
export interface AgentAction {
  id: string;
  lead_id: string;
  action_type: AgentActionType;
  status: AgentActionStatus;
  analysis_json?: string;
  generated_message?: string;
  approval_requested_at?: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  executed_at?: string;
  error_message?: string;
  created_at: string;
}

// Email log interface
export interface EmailLog {
  id: string;
  action_id: string;
  recipient_email: string;
  subject?: string;
  body?: string;
  sent_at?: string;
  status: 'sent' | 'failed' | 'bounced' | 'pending';
  error?: string;
  created_at: string;
}

// Outcome interface
export interface Outcome {
  id: string;
  lead_id: string;
  action_id: string;
  outcome: 'replied' | 'booked' | 'purchased' | 'unsubscribed' | 'unknown';
  recovered_value?: number;
  notes?: string;
  recorded_at: string;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ListResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

// CSV import types
export interface CsvLead {
  lead_id: string;
  business_name: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  service_type: string;
  enquiry_text: string;
  estimated_value_inr: string;
  lead_status: string;
  created_at: string;
  last_contacted_at?: string;
  quote_sent_at?: string;
  follow_up_count: string;
  contact_consent: string;
  preferred_channel: string;
  booking_status: string;
  payment_status: string;
  source: string;
  interaction_history: string;
  duplicate_of_lead_id?: string;
}

// Token usage tracking
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  timestamp: string;
}
