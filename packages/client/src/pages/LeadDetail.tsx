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
}

interface TimelineEvent {
  id: string
  type: string
  description: string
  timestamp: string
  status?: string
}

function LeadDetail({ leadId, onBack }: LeadDetailProps) {
  const [lead, setLead] = useState<Lead | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    fetchLeadDetail()
  }, [leadId])

  const fetchLeadDetail = async () => {
    setLoading(true)
    try {
      const res = await fetch(`http://localhost:5000/api/leads/${leadId}`)
      const data = await res.json()
      
      setLead(data.lead || null)
      setTimeline(data.timeline || [])
    } catch (error) {
      console.error('Error fetching lead detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAnalyze = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch(`http://localhost:5000/api/agent/analyze-lead/${leadId}`, {
        method: 'POST'
      })
      const data = await res.json()
      
      if (data.success) {
        alert('Analysis complete! Check the Approval Queue to review the recommendation.')
      }
    } catch (error) {
      console.error('Error analyzing lead:', error)
      alert('Failed to analyze lead. Please try again.')
    } finally {
      setAnalyzing(false)
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
            onClick={handleAnalyze}
            disabled={analyzing || lead.status === 'OPTED_OUT' || lead.status === 'DECLINED'}
          >
            {analyzing ? 'Analyzing...' : '🤖 Trigger AI Analysis'}
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
              ⚠️ This customer has opted out of communications. Do not contact.
            </div>
          )}
        </div>

        {/* Message Card */}
        <div className="message-card">
          <h3>Customer Message</h3>
          <div className="message-content">
            {lead.message}
          </div>
        </div>

        {/* Timeline Card */}
        <div className="timeline-card">
          <h3>Activity Timeline</h3>
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
