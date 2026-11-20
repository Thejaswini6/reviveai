/**
 * API Client for ReviveAI Backend
 * Handles all communication with the Express server
 */

const API_BASE = 'http://localhost:5000/api';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  potential_value: number;
  received_at: string;
  last_contacted_at?: string;
  contact_consent: string;
  payment_status: string;
}

export interface Analytics {
  total_leads: number;
  new_leads: number;
  stale_leads: number;
  recovered_leads: number;
  declined_leads: number;
  opted_out_leads: number;
  recovery_rate_percent: number;
}

/**
 * Fetch all leads
 */
export async function getLeads(limit = 50, offset = 0): Promise<{ leads: Lead[]; total: number }> {
  try {
    const response = await fetch(`${API_BASE}/leads?limit=${limit}&offset=${offset}`);
    if (!response.ok) throw new Error('Failed to fetch leads');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching leads:', error);
    return { leads: [], total: 0 };
  }
}

/**
 * Fetch single lead with history
 */
export async function getLead(leadId: string): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}/leads/${leadId}`);
    if (!response.ok) throw new Error('Failed to fetch lead');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching lead:', error);
    return null;
  }
}

/**
 * Get stale leads
 */
export async function getStaleleads(): Promise<Lead[]> {
  try {
    const response = await fetch(`${API_BASE}/internal/leads/stale`);
    if (!response.ok) throw new Error('Failed to fetch stale leads');
    const data = await response.json();
    return data.data.stale_leads;
  } catch (error) {
    console.error('Error fetching stale leads:', error);
    return [];
  }
}

/**
 * Get analytics summary
 */
export async function getAnalytics(): Promise<Analytics> {
  try {
    const response = await fetch(`${API_BASE}/analytics/summary`);
    if (!response.ok) throw new Error('Failed to fetch analytics');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return {
      total_leads: 0,
      new_leads: 0,
      stale_leads: 0,
      recovered_leads: 0,
      declined_leads: 0,
      opted_out_leads: 0,
      recovery_rate_percent: 0,
    };
  }
}

/**
 * Opt out a lead
 */
export async function optOutLead(leadId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/leads/${leadId}/opt-out`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Failed to opt out lead');
    return true;
  } catch (error) {
    console.error('Error opting out lead:', error);
    return false;
  }
}

/**
 * Update lead status
 */
export async function updateLead(leadId: string, updates: any): Promise<Lead | null> {
  try {
    const response = await fetch(`${API_BASE}/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update lead');
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating lead:', error);
    return null;
  }
}
