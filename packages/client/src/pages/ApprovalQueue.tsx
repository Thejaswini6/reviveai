import { useState, useEffect } from 'react'
import './ApprovalQueue.css'

interface ApprovalQueueProps {
  onViewLead: (leadId: string) => void
}

interface AgentAction {
  id: string
  lead_id: string
  lead_name: string
  action_type: string
  status: string
  analysis_json: string
  generated_message: string
  approval_requested_at: string
  mode?: string
  model?: string
  token_usage?: {
    input_tokens: number
    output_tokens: number
    total_tokens: number
    estimated_cost_usd: number
  }
  trace?: Array<{
    step_number: number
    type: string
    tool_name?: string
    description: string
    duration_ms?: number
    input?: any
    output?: any
  }>
}

function ApprovalQueue({ onViewLead }: ApprovalQueueProps) {
  const [actions, setActions] = useState<AgentAction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null)
  const [expandedTraceActionId, setExpandedTraceActionId] = useState<string | null>(null)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  useEffect(() => {
    fetchActions()
  }, [])

  const fetchActions = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/agent/actions?status=pending')
      const data = await res.json()
      setActions(data.actions || [])
    } catch (error) {
      console.error('Error fetching actions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (actionId: string) => {
    if (!confirm('Are you sure you want to approve and send this message?')) {
      return
    }

    setProcessingAction(actionId)
    try {
      const res = await fetch(`/api/agent/actions/${actionId}/approve`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success) {
        alert('Message approved and sent successfully!')
        fetchActions()
        setSelectedAction(null)
      } else {
        alert('Failed to approve message: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error approving action:', error)
      alert('Failed to approve message. Please try again.')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleReject = async (actionId: string) => {
    const reason = prompt('Please provide a reason for rejection:')
    if (!reason) return

    setProcessingAction(actionId)
    try {
      const res = await fetch(`/api/agent/actions/${actionId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      const data = await res.json()
      
      if (data.success) {
        alert('Message rejected successfully.')
        fetchActions()
        setSelectedAction(null)
      } else {
        alert('Failed to reject message: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error rejecting action:', error)
      alert('Failed to reject message. Please try again.')
    } finally {
      setProcessingAction(null)
    }
  }

  const parseAnalysis = (json: string) => {
    try {
      return JSON.parse(json)
    } catch {
      return null
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="approval-queue">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading approval queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="approval-queue">
      <div className="queue-header">
        <div>
          <h1>Approval Queue</h1>
          <p>Review and approve AI-generated recovery messages</p>
        </div>
        <button className="btn-primary" onClick={fetchActions}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8a5 5 0 015-5m0 10a5 5 0 005-5"/>
            <path d="M12 3l1 1-1 1M4 13l-1-1 1-1"/>
          </svg>
          Refresh
        </button>
      </div>

      {actions.length === 0 ? (
        <div className="empty-queue">
          <div className="empty-icon">✅</div>
          <h3>No pending approvals</h3>
          <p>All AI-generated messages have been reviewed.</p>
          <p>Trigger an analysis on a stale lead to generate new recommendations.</p>
        </div>
      ) : (
        <div className="approvals-grid">
          {actions.map((action) => {
            const analysis = parseAnalysis(action.analysis_json)
            const isProcessing = processingAction === action.id

            return (
              <div key={action.id} className="approval-card">
                <div className="approval-header">
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                      <h3>{action.lead_name}</h3>
                      <span className={`mode-badge ${action.mode === 'real_claude' ? 'mode-real' : 'mode-simulated'}`} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}>
                        {action.mode === 'real_claude' ? `⚡ REAL CLAUDE (${action.model || 'claude-sonnet-5-5'})` : '🎭 SIMULATED MOCK'}
                      </span>
                    </div>
                    <p className="approval-meta">
                      Requested {formatDateTime(action.approval_requested_at)}
                      {action.token_usage && (
                        <span> • {action.token_usage.total_tokens} tokens (${action.token_usage.estimated_cost_usd?.toFixed(4) || '0.0000'} USD)</span>
                      )}
                    </p>
                  </div>
                  <button 
                    className="btn-link"
                    onClick={() => onViewLead(action.lead_id)}
                  >
                    View Lead →
                  </button>
                </div>

                {analysis && (
                  <div className="analysis-summary">
                    <div className="analysis-item">
                      <label>Priority</label>
                      <span className={`priority-badge priority-${analysis.priority}`}>
                        {analysis.priority}
                      </span>
                    </div>
                    <div className="analysis-item">
                      <label>Customer Intent</label>
                      <p>{analysis.customer_intent}</p>
                    </div>
                    <div className="analysis-item">
                      <label>Reason for Inactivity</label>
                      <p>{analysis.likely_reason_for_inactivity}</p>
                    </div>
                    <div className="analysis-item">
                      <label>Recommended Action</label>
                      <p>{analysis.recommended_action}</p>
                    </div>
                  </div>
                )}

                {/* Tool Execution Trace Accordion */}
                {action.trace && action.trace.length > 0 && (
                  <div style={{ margin: '1rem 0', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'hidden' }}>
                    <div 
                      style={{ padding: '0.6rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'rgba(59, 130, 246, 0.05)' }}
                      onClick={() => setExpandedTraceActionId(expandedTraceActionId === action.id ? null : action.id)}
                    >
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        🔍 Agent Tool Trace ({action.trace.length} tool calls)
                      </span>
                      <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 500 }}>
                        {expandedTraceActionId === action.id ? 'Hide Trace ▲' : 'Inspect Tool Trace ▼'}
                      </span>
                    </div>
                    {expandedTraceActionId === action.id && (
                      <div style={{ padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem', borderTop: '1px solid var(--border)' }}>
                        {action.trace.map(step => (
                          <div key={step.step_number} style={{ fontSize: '0.8rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span style={{ background: '#1e293b', color: '#f8fafc', padding: '0.15rem 0.4rem', borderRadius: '3px', fontSize: '0.7rem', fontWeight: 700 }}>
                              #{step.step_number}
                            </span>
                            <span style={{ fontFamily: 'monospace', color: '#2563eb', background: '#eff6ff', padding: '0.15rem 0.4rem', borderRadius: '3px', fontWeight: 600 }}>
                              {step.tool_name || step.type}
                            </span>
                            <span style={{ color: 'var(--text-secondary)', flex: 1, minWidth: '200px' }}>
                              {step.description}
                            </span>
                            {step.duration_ms !== undefined && (
                              <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>
                                {step.duration_ms} ms
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="message-preview">
                  <h4>Generated Message</h4>
                  <button 
                    className="btn-expand"
                    onClick={() => setSelectedAction(selectedAction?.id === action.id ? null : action)}
                  >
                    {selectedAction?.id === action.id ? 'Hide Full Message' : 'Show Full Message'}
                  </button>
                </div>

                {selectedAction?.id === action.id && (
                  <div className="message-full">
                    <div className="message-section">
                      <strong>Subject:</strong>
                      <p>{analysis?.email_subject || 'No subject'}</p>
                    </div>
                    <div className="message-section">
                      <strong>Body:</strong>
                      <p className="message-body">{action.generated_message || analysis?.email_body || 'No message'}</p>
                    </div>
                  </div>
                )}

                <div className="approval-actions">
                  <button 
                    className="btn-reject"
                    onClick={() => handleReject(action.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Reject'}
                  </button>
                  <button 
                    className="btn-approve"
                    onClick={() => handleApprove(action.id)}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : '✓ Approve & Send'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ApprovalQueue
