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
}

function ApprovalQueue({ onViewLead }: ApprovalQueueProps) {
  const [actions, setActions] = useState<AgentAction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedAction, setSelectedAction] = useState<AgentAction | null>(null)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  useEffect(() => {
    fetchActions()
  }, [])

  const fetchActions = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/agent/actions?status=pending')
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
      const res = await fetch(`http://localhost:5000/api/agent/actions/${actionId}/approve`, {
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
      const res = await fetch(`http://localhost:5000/api/agent/actions/${actionId}/reject`, {
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
                    <h3>{action.lead_name}</h3>
                    <p className="approval-meta">
                      Requested {formatDateTime(action.approval_requested_at)}
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
