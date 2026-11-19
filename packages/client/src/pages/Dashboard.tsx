import { useState, useEffect } from 'react'
import './Dashboard.css'

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
}

interface Summary {
  total_leads: number
  new_leads: number
  stale_leads: number
  total_revenue_at_risk: number
  recovery_rate_percent: number
  pending_approvals: number
}

interface DashboardProps {
  onViewLead: (leadId: string) => void
}

function Dashboard({ onViewLead }: DashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [leadsRes, summaryRes] = await Promise.all([
        fetch(`http://localhost:5000/api/leads${filter !== 'all' ? `?status=${filter}` : ''}`),
        fetch('http://localhost:5000/api/analytics/summary')
      ])

      const leadsData = await leadsRes.json()
      const summaryData = await summaryRes.json()

      setLeads(leadsData.leads || [])
      setSummary(summaryData)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'NEW': 'status-new',
      'STALE': 'status-stale',
      'CONTACTED': 'status-contacted',
      'RECOVERED': 'status-recovered',
      'DECLINED': 'status-declined',
      'OPTED_OUT': 'status-opted-out'
    }
    return colors[status] || 'status-default'
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-loading">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h1>Lead Dashboard</h1>
          <p>Monitor and recover stale leads with AI assistance</p>
        </div>
        <button className="btn-primary" onClick={fetchData}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8a5 5 0 015-5m0 10a5 5 0 005-5"/>
            <path d="M12 3l1 1-1 1M4 13l-1-1 1-1"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon bg-blue">
            <svg width="24" height="24" fill="currentColor">
              <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-label">Total Leads</div>
            <div className="summary-value">{summary?.total_leads || 0}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-orange">
            <svg width="24" height="24" fill="currentColor">
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-label">Stale Leads</div>
            <div className="summary-value">{summary?.stale_leads || 0}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-red">
            <svg width="24" height="24" fill="currentColor">
              <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-label">Revenue at Risk</div>
            <div className="summary-value">{formatCurrency(summary?.total_revenue_at_risk || 0)}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon bg-purple">
            <svg width="24" height="24" fill="currentColor">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
          </div>
          <div className="summary-content">
            <div className="summary-label">Pending Approvals</div>
            <div className="summary-value">{summary?.pending_approvals || 0}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Leads
        </button>
        <button 
          className={`filter-btn ${filter === 'STALE' ? 'active' : ''}`}
          onClick={() => setFilter('STALE')}
        >
          Stale
        </button>
        <button 
          className={`filter-btn ${filter === 'NEW' ? 'active' : ''}`}
          onClick={() => setFilter('NEW')}
        >
          New
        </button>
        <button 
          className={`filter-btn ${filter === 'CONTACTED' ? 'active' : ''}`}
          onClick={() => setFilter('CONTACTED')}
        >
          Contacted
        </button>
        <button 
          className={`filter-btn ${filter === 'RECOVERED' ? 'active' : ''}`}
          onClick={() => setFilter('RECOVERED')}
        >
          Recovered
        </button>
      </div>

      {/* Leads Table */}
      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Contact</th>
              <th>Service Type</th>
              <th>Status</th>
              <th>Received</th>
              <th>Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>No leads found</p>
                  <span>Seed the database to add demo leads</span>
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id} onClick={() => onViewLead(lead.id)}>
                  <td>
                    <div className="customer-cell">
                      <div className="customer-avatar">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="customer-name">{lead.name}</div>
                        <div className="customer-id">{lead.id}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="contact-cell">
                      <div>{lead.email}</div>
                      <div className="contact-phone">{lead.phone}</div>
                    </div>
                  </td>
                  <td>{lead.enquiry_type || 'N/A'}</td>
                  <td>
                    <span className={`status-badge ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td>{formatDate(lead.received_at)}</td>
                  <td className="revenue-cell">{formatCurrency(lead.potential_value)}</td>
                  <td>
                    <button className="btn-action" onClick={(e) => {
                      e.stopPropagation()
                      onViewLead(lead.id)
                    }}>
                      View →
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Dashboard
