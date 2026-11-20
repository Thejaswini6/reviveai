import { useState, useEffect } from 'react'
import { useToast } from '../contexts/ToastContext'
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
  score?: number
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

function DashboardEnhanced({ onViewLead }: DashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set())
  const [revenueFilter, setRevenueFilter] = useState<string>('all')
  const [sourceFilter, setSourceFilter] = useState<string>('all')
  const { showToast } = useToast()

  useEffect(() => {
    fetchData()
  }, [filter])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [leadsRes, summaryRes] = await Promise.all([
        fetch(`/api/leads${filter !== 'all' ? `?status=${filter}` : ''}`),
        fetch('/api/analytics/summary')
      ])

      const leadsData = await leadsRes.json()
      const summaryData = await summaryRes.json()

      // Add lead scoring
      const leadsWithScores = (leadsData.leads || []).map((lead: Lead) => ({
        ...lead,
        score: calculateLeadScore(lead)
      }))

      setLeads(leadsWithScores)
      setSummary(summaryData)
    } catch (error) {
      console.error('Error fetching data:', error)
      showToast('Failed to load dashboard data', 'error')
    } finally {
      setLoading(false)
    }
  }

  const calculateLeadScore = (lead: Lead): number => {
    let score = 50 // Base score

    // Value contribution (0-30 points)
    if (lead.potential_value > 50000) score += 30
    else if (lead.potential_value > 20000) score += 20
    else if (lead.potential_value > 10000) score += 15
    else if (lead.potential_value > 5000) score += 10
    else score += 5

    // Status contribution (0-20 points)
    if (lead.status === 'STALE') score += 20
    else if (lead.status === 'NEW') score += 15
    else if (lead.status === 'CONTACTED') score += 10

    // Urgency contribution (0-20 points)
    const daysOld = Math.floor((Date.now() - new Date(lead.received_at).getTime()) / (1000 * 60 * 60 * 24))
    if (daysOld > 7) score += 20
    else if (daysOld > 5) score += 15
    else if (daysOld > 3) score += 10
    else score += 5

    // Engagement contribution (0-10 points)
    if (lead.follow_up_count === 0) score += 10
    else if (lead.follow_up_count === 1) score += 5

    return Math.min(100, Math.max(0, score))
  }

  const handleBulkAnalyze = async () => {
    if (selectedLeads.size === 0) {
      showToast('Please select leads to analyze', 'warning')
      return
    }

    showToast(`Analyzing ${selectedLeads.size} leads...`, 'info')
    
    // Simulate bulk analysis
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    showToast(`Successfully analyzed ${selectedLeads.size} leads!`, 'success')
    setSelectedLeads(new Set())
  }

  const handleExportCSV = () => {
    const selectedLeadsList = leads.filter(lead => selectedLeads.has(lead.id))
    const dataToExport = selectedLeadsList.length > 0 ? selectedLeadsList : leads

    const headers = ['ID', 'Name', 'Email', 'Phone', 'Service', 'Value', 'Status', 'Score', 'Received']
    const rows = dataToExport.map(lead => [
      lead.id,
      lead.name,
      lead.email,
      lead.phone,
      lead.enquiry_type,
      lead.potential_value,
      lead.status,
      lead.score || 0,
      new Date(lead.received_at).toLocaleDateString()
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reviveai-leads-${new Date().toISOString().split('T')[0]}.csv`
    a.click()

    showToast(`Exported ${dataToExport.length} leads to CSV`, 'success')
  }

  const toggleSelectLead = (leadId: string) => {
    const newSelected = new Set(selectedLeads)
    if (newSelected.has(leadId)) {
      newSelected.delete(leadId)
    } else {
      newSelected.add(leadId)
    }
    setSelectedLeads(newSelected)
  }

  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set())
    } else {
      setSelectedLeads(new Set(filteredLeads.map(l => l.id)))
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'score-high'
    if (score >= 60) return 'score-medium'
    return 'score-low'
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

  // Apply filters
  const filteredLeads = leads.filter(lead => {
    // Search filter
    const searchLower = searchTerm.toLowerCase()
    const matchesSearch = !searchTerm || 
      lead.name.toLowerCase().includes(searchLower) ||
      lead.email.toLowerCase().includes(searchLower) ||
      lead.phone.includes(searchTerm) ||
      lead.id.toLowerCase().includes(searchLower)

    // Revenue filter
    const matchesRevenue = revenueFilter === 'all' ||
      (revenueFilter === 'low' && lead.potential_value < 5000) ||
      (revenueFilter === 'medium' && lead.potential_value >= 5000 && lead.potential_value < 20000) ||
      (revenueFilter === 'high' && lead.potential_value >= 20000)

    // Source filter
    const matchesSource = sourceFilter === 'all' || lead.source === sourceFilter

    return matchesSearch && matchesRevenue && matchesSource
  })

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
        <div className="header-actions">
          <button className="btn-secondary" onClick={fetchData}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 8a5 5 0 015-5m0 10a5 5 0 005-5"/>
              <path d="M12 3l1 1-1 1M4 13l-1-1 1-1"/>
            </svg>
            Refresh
          </button>
          <button className="btn-secondary" onClick={handleExportCSV}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 16v-3m0 0V3m0 10h10m0 0V3m0 10v3"/>
            </svg>
            Export CSV
          </button>
        </div>
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

      {/* Search and Filters */}
      <div className="filters-section">
        <div className="search-box">
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="9" r="6"/>
            <path d="M14 14l4 4"/>
          </svg>
          <input
            type="text"
            placeholder="Search leads by name, company, email, phone, service type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button className="search-clear" onClick={() => setSearchTerm('')}>×</button>
          )}
        </div>

        <div className="advanced-filters">
          <select value={filter} onChange={(e) => setFilter(e.target.value)} className="filter-select">
            <option value="all">All Status</option>
            <option value="NEW">New</option>
            <option value="STALE">Stale</option>
            <option value="CONTACTED">Contacted</option>
            <option value="RECOVERED">Recovered</option>
          </select>

          <select value={revenueFilter} onChange={(e) => setRevenueFilter(e.target.value)} className="filter-select">
            <option value="all">All Revenue</option>
            <option value="low">₹0 - ₹5K</option>
            <option value="medium">₹5K - ₹20K</option>
            <option value="high">₹20K+</option>
          </select>

          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="filter-select">
            <option value="all">All Sources</option>
            <option value="WEBSITE">Website</option>
            <option value="PHONE">Phone</option>
            <option value="REFERRAL">Referral</option>
          </select>

          {filteredLeads.length !== leads.length && (
            <span className="filter-results">{filteredLeads.length} of {leads.length} leads</span>
          )}
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedLeads.size > 0 && (
        <div className="bulk-actions-bar">
          <div className="bulk-selected">
            {selectedLeads.size} lead{selectedLeads.size !== 1 ? 's' : ''} selected
          </div>
          <div className="bulk-actions">
            <button className="btn-bulk" onClick={handleBulkAnalyze}>
              🤖 Analyze Selected
            </button>
            <button className="btn-bulk" onClick={handleExportCSV}>
              📥 Export Selected
            </button>
            <button className="btn-bulk-secondary" onClick={() => setSelectedLeads(new Set())}>
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Leads Table */}
      <div className="table-container">
        <table className="leads-table">
          <thead>
            <tr>
              <th style={{ width: '40px' }}>
                <input
                  type="checkbox"
                  checked={selectedLeads.size === filteredLeads.length && filteredLeads.length > 0}
                  onChange={toggleSelectAll}
                />
              </th>
              <th>Customer</th>
              <th>Contact</th>
              <th>Service Type</th>
              <th>Status</th>
              <th>Score</th>
              <th>Received</th>
              <th>Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={9} className="empty-state">
                  <div className="empty-icon">📭</div>
                  <p>No leads found</p>
                  <span>{searchTerm ? 'Try adjusting your search or filters' : 'Seed the database to add demo leads'}</span>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
                <tr key={lead.id} className={selectedLeads.has(lead.id) ? 'row-selected' : ''}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedLeads.has(lead.id)}
                      onChange={() => toggleSelectLead(lead.id)}
                    />
                  </td>
                  <td onClick={() => onViewLead(lead.id)}>
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
                  <td onClick={() => onViewLead(lead.id)}>
                    <div className="contact-cell">
                      <div>{lead.email}</div>
                      <div className="contact-phone">{lead.phone}</div>
                    </div>
                  </td>
                  <td onClick={() => onViewLead(lead.id)}>{lead.enquiry_type || 'N/A'}</td>
                  <td onClick={() => onViewLead(lead.id)}>
                    <span className={`status-badge ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td onClick={() => onViewLead(lead.id)}>
                    <div className={`lead-score ${getScoreColor(lead.score || 0)}`}>
                      {lead.score || 0}
                    </div>
                  </td>
                  <td onClick={() => onViewLead(lead.id)}>{formatDate(lead.received_at)}</td>
                  <td onClick={() => onViewLead(lead.id)} className="revenue-cell">{formatCurrency(lead.potential_value)}</td>
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

export default DashboardEnhanced
