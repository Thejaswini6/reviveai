import { useState, useEffect } from 'react'
import './LeadDetail.css'

interface LeadDetailProps {
  leadId: string
  onBack: () => void
}

interface Lead {
  id: string
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
  duplicate_of_lead_id?: string | null
}

interface TimelineEvent {
  id: string
  type: string
  description: string
  timestamp: string
  status?: string
}

interface EligibilityInfo {
  is_eligible: boolean
  can_auto_recover: boolean
  reasons: string[]
  recommended_handling: string
}

interface AgentTraceStep {
  step_number: number
  type: 'tool_call' | 'thought' | 'result'
  tool_name?: string
  description: string
  input?: any
  output?: any
  duration_ms?: number
  timestamp: string
  source?: string
}

interface RecoveryAnalysis {
  lead_id: string
  priority: string
  customer_intent: string
  likely_reason_for_inactivity: string
  evidence: string[]
  uncertainty?: string
  recommended_action: string
  suggested_channel: string
  email_subject: string
  email_body: string
  requires_human_approval: boolean
}

interface AnalysisResult {
  action_id: string
  status: string
  mode: 'real_claude' | 'simulated_mock'
  model: string
  token_usage: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    estimated_cost_usd: number
  }
  duration_ms: number
  trace: AgentTraceStep[]
  analysis: RecoveryAnalysis
}

function LeadDetail({ leadId, onBack }: LeadDetailProps) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [eligibility, setEligibility] = useState<EligibilityInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null)
  const [expandedTraceStep, setExpandedTraceStep] = useState<number | null>(null)
  const [actionProcessing, setActionProcessing] = useState(false)

  useEffect(() => {
    fetchLeadDetail()
  }, [leadId])

  const fetchLeadDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/leads/${leadId}`)
      const data = await res.json()
      
      setLead(data.lead || null)
      setTimeline(data.timeline || [])
      setEligibility(data.eligibility || null)

      // Check if an analysis action already exists for this lead
      const actionsRes = await fetch('/api/agent/actions')
      if (actionsRes.ok) {
        const actionsData = await actionsRes.json()
        const existing = (actionsData.actions || []).find((a: any) => a.lead_id === leadId)
        if (existing) {
          try {
            setAnalysisResult({
              action_id: existing.id,
              status: existing.status,
              mode: existing.mode || 'simulated_mock',
              model: existing.model || 'simulated-agent-v1',
              token_usage: existing.token_usage || {
                input_tokens: 650,
                output_tokens: 380,
                total_tokens: 1030,
                estimated_cost_usd: 0
              },
              duration_ms: existing.duration_ms || 420,
              trace: existing.trace || [],
              analysis: typeof existing.analysis_json === 'string' ? JSON.parse(existing.analysis_json) : existing.analysis_json
            })
          } catch (e) {
            console.error('Failed to parse existing action analysis', e)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching lead detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async (force = false) => {
    setAnalyzing(true)
    try {
      const res = await fetch(`/api/agent/analyze-lead/${leadId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force })
      })
      const data = await res.json()
      
      if (data.success) {
        setAnalysisResult({
          action_id: data.action_id,
          status: data.status,
          mode: data.mode || 'simulated_mock',
          model: data.model || 'simulated-agent-v1',
          token_usage: data.token_usage || {
            input_tokens: 650,
            output_tokens: 380,
            total_tokens: 1030,
            estimated_cost_usd: 0
          },
          duration_ms: data.duration_ms || 350,
          trace: data.trace || [],
          analysis: data.analysis
        })
        fetchLeadDetail()
      } else {
        const reasonText = data.reasons?.length ? '\n\nSafety Policy Reasons:\n• ' + data.reasons.join('\n• ') : ''
        alert(`Analysis Blocked (${data.error || 'Ineligible lead'})${reasonText}`)
      }
    } catch (error) {
      console.error('Error analyzing lead:', error)
      alert('Failed to analyze lead. Please try again.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleApproveAction = async () => {
    if (!analysisResult) return
    if (!confirm('Approve and send this recovery message to the customer?')) return

    setActionProcessing(true)
    try {
      const res = await fetch(`/api/agent/actions/${analysisResult.action_id}/approve`, {
        method: 'POST'
      })
      const data = await res.json()
      if (data.success) {
        alert('Recovery message approved and sent successfully!')
        setAnalysisResult(prev => prev ? { ...prev, status: 'approved' } : null)
        fetchLeadDetail()
      } else {
        alert(`Approval blocked: ${data.error || 'Policy restriction'}`)
      }
    } catch (err) {
      console.error('Error approving action:', err)
      alert('Failed to approve action.')
    } finally {
      setActionProcessing(false)
    }
  }

  const handleRejectAction = async () => {
    if (!analysisResult) return
    const reason = prompt('Please provide reason for rejection:')
    if (!reason) return

    setActionProcessing(true)
    try {
      const res = await fetch(`/api/agent/actions/${analysisResult.action_id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      const data = await res.json()
      if (data.success) {
        alert('Action rejected.')
        setAnalysisResult(prev => prev ? { ...prev, status: 'rejected' } : null)
        fetchLeadDetail()
      } else {
        alert(`Rejection error: ${data.error || 'Unknown error'}`)
      }
    } catch (err) {
      console.error('Error rejecting action:', err)
    } finally {
      setActionProcessing(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="lead-detail">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading lead details...</p>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="lead-detail">
        <div className="error-state">
          <p>Lead not found</p>
          <button className="btn-primary" onClick={onBack}>Back to Dashboard</button>
        </div>
      </div>
    )
  }

  return (
    <div className="lead-detail">
      <div className="lead-detail-header">
        <button className="btn-back" onClick={onBack}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 5l-7 7 7 7"/>
          </svg>
          Back
        </button>

        <div className="header-actions">
          <button 
            className="btn-primary" 
            onClick={() => handleAnalyze(Boolean(analysisResult))}
            disabled={analyzing || lead.status === 'OPTED_OUT' || lead.status === 'DECLINED'}
          >
            {analyzing ? 'Analyzing with Agent...' : analysisResult ? '🔄 Re-run Recovery Agent' : '🤖 Trigger Recovery Agent'}
          </button>
        </div>
      </div>

      <div className="lead-detail-content">
        {/* Lead Info Card */}
        <div className="info-card">
          <div className="card-header">
            <div className="customer-info">
              <div className="customer-avatar-large">
                {lead.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2>{lead.name}</h2>
                <p className="lead-id">{lead.id}</p>
              </div>
            </div>
            <span className={`status-badge status-${lead.status.toLowerCase()}`}>
              {lead.status}
            </span>
          </div>

          <div className="info-grid">
            <div className="info-item">
              <label>Email</label>
              <div>{lead.email}</div>
            </div>
            <div className="info-item">
              <label>Phone</label>
              <div>{lead.phone}</div>
            </div>
            <div className="info-item">
              <label>Service Type</label>
              <div>{lead.enquiry_type}</div>
            </div>
            <div className="info-item">
              <label>Potential Value</label>
              <div className="value-highlight">{formatCurrency(lead.potential_value)}</div>
            </div>
            <div className="info-item">
              <label>Received At</label>
              <div>{formatDateTime(lead.received_at)}</div>
            </div>
            <div className="info-item">
              <label>Last Contacted</label>
              <div>{lead.last_contacted_at ? formatDateTime(lead.last_contacted_at) : 'Never'}</div>
            </div>
            <div className="info-item">
              <label>Follow-up Count</label>
              <div>{lead.follow_up_count}</div>
            </div>
            <div className="info-item">
              <label>Preferred Channel</label>
              <div className="channel-badge">{lead.preferred_channel}</div>
            </div>
          </div>

          {lead.contact_consent === 'OPTED_OUT' && (
            <div className="alert alert-warning">
              ⚠️ This customer has opted out of communications. Outreach prohibited.
            </div>
          )}
          {lead.contact_consent === 'UNKNOWN' && (
            <div className="alert alert-warning">
              ⚠️ Contact consent is unverified. Automated outreach prohibited until consent is confirmed.
            </div>
          )}
          {lead.duplicate_of_lead_id && (
            <div className="alert alert-warning">
              ℹ️ Duplicate inquiry linked to primary lead {lead.duplicate_of_lead_id}. Outreach consolidated.
            </div>
          )}
          {lead.status === 'DECLINED' && (
            <div className="alert alert-warning">
              🚫 Customer explicitly declined service. Further contact is prohibited.
            </div>
          )}
          {(lead.status === 'CONVERTED' || lead.status === 'RECOVERED') && (
            <div className="alert alert-success" style={{ background: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '10px 14px', borderRadius: '6px', marginTop: '12px' }}>
              ✅ Service completed & paid. Lead successfully converted. Excluded from recovery outreach.
            </div>
          )}
          {lead.status === 'ESCALATED' && (
            <div className="alert alert-warning">
              🚨 Service complaint flagged. Requires human manager attention, not automated sales outreach.
            </div>
          )}
          {lead.status === 'CALLBACK_REQUESTED' && (
            <div className="alert alert-warning">
              📞 Customer requested phone callback. Automated emails prohibited.
            </div>
          )}
          {eligibility && eligibility.is_eligible && (
            <div className="alert alert-success" style={{ background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe', padding: '10px 14px', borderRadius: '6px', marginTop: '12px' }}>
              ✨ Lead is eligible for AI revenue recovery outreach.
            </div>
          )}
        </div>

        {/* Message Card */}
        <div className="message-card">
          <h3>Customer Inquiry Message</h3>
          <div className="message-content">
            {lead.message}
          </div>
        </div>

        {/* AGENT EXECUTION TRACE & RECOVERY PROPOSAL */}
        {analysisResult && (
          <div className="agent-analysis-card">
            <div className="agent-card-header">
              <div className="agent-title-group">
                <h3>Autonomous Agent Execution & Strategy</h3>
                <span className={`mode-badge ${analysisResult.mode === 'real_claude' ? 'mode-real' : 'mode-simulated'}`}>
                  {analysisResult.mode === 'real_claude' ? (
                    <>⚡ Real Claude Agent ({analysisResult.model})</>
                  ) : (
                    <>🎭 Simulated Mock Agent (Zero Credits Used)</>
                  )}
                </span>
              </div>
              <div className="agent-telemetry">
                <span className="telemetry-pill">
                  ⏱️ {analysisResult.duration_ms} ms
                </span>
                <span className="telemetry-pill">
                  🔤 {analysisResult.token_usage?.total_tokens || 0} tokens
                </span>
                <span className="telemetry-pill">
                  💵 ${analysisResult.token_usage?.estimated_cost_usd?.toFixed(4) || '0.0000'} USD
                </span>
                <span className={`status-pill status-${analysisResult.status}`}>
                  {analysisResult.status.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Proposal Details */}
            <div className="proposal-section">
              <div className="proposal-grid">
                <div className="proposal-item">
                  <label>Customer Intent</label>
                  <p>{analysisResult.analysis.customer_intent}</p>
                </div>
                <div className="proposal-item">
                  <label>Inactivity Reason Identified</label>
                  <p>{analysisResult.analysis.likely_reason_for_inactivity}</p>
                </div>
                <div className="proposal-item">
                  <label>Strategy Priority</label>
                  <span className={`priority-badge priority-${analysisResult.analysis.priority}`}>
                    {analysisResult.analysis.priority.toUpperCase()}
                  </span>
                </div>
                <div className="proposal-item">
                  <label>Proposed Channel</label>
                  <p>{analysisResult.analysis.suggested_channel.toUpperCase()}</p>
                </div>
              </div>

              {/* Draft Message Preview */}
              <div className="draft-message-box">
                <div className="draft-header">
                  <strong>Subject:</strong> {analysisResult.analysis.email_subject}
                </div>
                <div className="draft-body">
                  <pre>{analysisResult.analysis.email_body}</pre>
                </div>
              </div>

              {/* Action Controls */}
              {analysisResult.status === 'pending' && (
                <div className="agent-action-bar">
                  <div className="agent-safety-notice">
                    🔒 <strong>Human-in-the-Loop Safeguard:</strong> This recovery message requires business owner approval before any communication is dispatched.
                  </div>
                  <div className="action-buttons">
                    <button 
                      className="btn-reject" 
                      onClick={handleRejectAction}
                      disabled={actionProcessing}
                    >
                      {actionProcessing ? 'Processing...' : 'Reject Action'}
                    </button>
                    <button 
                      className="btn-approve" 
                      onClick={handleApproveAction}
                      disabled={actionProcessing}
                    >
                      {actionProcessing ? 'Processing...' : '✓ Approve & Dispatch Recovery Message'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Step-by-Step Tool Execution Trace */}
            <div className="trace-section">
              <h4>Tool Execution Trace ({analysisResult.trace.length} Steps)</h4>
              <p className="trace-subtitle">
                Truthful step-by-step record of Anthropic Messages tool calling and validation:
              </p>

              <div className="trace-timeline">
                {analysisResult.trace.map((step) => {
                  const isExpanded = expandedTraceStep === step.step_number
                  return (
                    <div key={step.step_number} className="trace-step-item">
                      <div className="trace-step-header">
                        <span className="step-num">Step {step.step_number}</span>
                        <span className="tool-tag">{step.tool_name || step.type}</span>
                        <span className="step-desc">{step.description}</span>
                        {step.duration_ms !== undefined && (
                          <span className="step-duration">{step.duration_ms} ms</span>
                        )}
                        {(step.input || step.output) && (
                          <button 
                            className="btn-trace-toggle"
                            onClick={() => setExpandedTraceStep(isExpanded ? null : step.step_number)}
                          >
                            {isExpanded ? 'Hide Payload ▲' : 'Inspect Payload ▼'}
                          </button>
                        )}
                      </div>

                      {isExpanded && (
                        <div className="trace-step-body">
                          {step.input && (
                            <div className="payload-block">
                              <span className="payload-label">Tool Input:</span>
                              <pre>{JSON.stringify(step.input, null, 2)}</pre>
                            </div>
                          )}
                          {step.output && (
                            <div className="payload-block">
                              <span className="payload-label">Tool Output:</span>
                              <pre>{JSON.stringify(step.output, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Activity Timeline Card */}
        <div className="timeline-card">
          <h3>Lead Activity Timeline</h3>
          {timeline.length === 0 ? (
            <div className="timeline-empty">
              <p>No activity yet</p>
              <span>Trigger an AI analysis to start the recovery process</span>
            </div>
          ) : (
            <div className="timeline">
              {timeline.map((event) => (
                <div key={event.id} className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="timeline-content">
                    <div className="timeline-header">
                      <span className="timeline-type">{event.type}</span>
                      <span className="timeline-time">{formatDateTime(event.timestamp)}</span>
                    </div>
                    <p className="timeline-description">{event.description}</p>
                    {event.status && (
                      <span className={`timeline-status status-${event.status.toLowerCase()}`}>
                        {event.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default LeadDetail
