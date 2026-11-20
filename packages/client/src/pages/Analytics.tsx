import { useState, useEffect } from 'react'
import './Analytics.css'

interface AnalyticsData {
  total_leads: number
  new_leads: number
  stale_leads: number
  contacted_leads: number
  recovered_leads: number
  total_revenue_at_risk: number
  recovered_revenue: number
  recovery_rate_percent: number
  pending_approvals: number
  emails_sent: number
}

function Analytics() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/analytics/summary')
      const analyticsData = await res.json()
      setData(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="analytics">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics">
      <div className="analytics-header">
        <div>
          <h1>Analytics Dashboard</h1>
          <p>Track performance and recovery metrics</p>
        </div>
        <button className="btn-primary" onClick={fetchAnalytics}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 8a5 5 0 015-5m0 10a5 5 0 005-5"/>
            <path d="M12 3l1 1-1 1M4 13l-1-1 1-1"/>
          </svg>
          Refresh
        </button>
      </div>

      {/* Key Metrics */}
      <div className="metrics-section">
        <h2>Key Metrics</h2>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon bg-blue">
              <svg width="24" height="24" fill="currentColor">
                <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-value">{data?.total_leads || 0}</div>
              <div className="metric-label">Total Leads</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon bg-green">
              <svg width="24" height="24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-value">{data?.recovered_leads || 0}</div>
              <div className="metric-label">Recovered Leads</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon bg-purple">
              <svg width="24" height="24" fill="currentColor">
                <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-value">{data?.emails_sent || 0}</div>
              <div className="metric-label">Emails Sent</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon bg-orange">
              <svg width="24" height="24" fill="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <div className="metric-content">
              <div className="metric-value">{data?.recovery_rate_percent?.toFixed(1) || 0}%</div>
              <div className="metric-label">Recovery Rate</div>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="revenue-section">
        <h2>Revenue Overview</h2>
        <div className="revenue-grid">
          <div className="revenue-card">
            <div className="revenue-label">Revenue at Risk</div>
            <div className="revenue-value revenue-risk">
              {formatCurrency(data?.total_revenue_at_risk || 0)}
            </div>
            <p className="revenue-description">
              Total potential value from stale leads that need recovery
            </p>
          </div>

          <div className="revenue-card">
            <div className="revenue-label">Recovered Revenue</div>
            <div className="revenue-value revenue-recovered">
              {formatCurrency(data?.recovered_revenue || 0)}
            </div>
            <p className="revenue-description">
              Successfully recovered revenue from converted leads
            </p>
          </div>
        </div>
      </div>

      {/* Lead Status Breakdown */}
      <div className="breakdown-section">
        <h2>Lead Status Breakdown</h2>
        <div className="breakdown-grid">
          <div className="breakdown-item">
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill bg-blue" 
                style={{ width: `${((data?.new_leads || 0) / (data?.total_leads || 1)) * 100}%` }}
              ></div>
            </div>
            <div className="breakdown-info">
              <span className="breakdown-label">New</span>
              <span className="breakdown-count">{data?.new_leads || 0}</span>
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill bg-orange" 
                style={{ width: `${((data?.stale_leads || 0) / (data?.total_leads || 1)) * 100}%` }}
              ></div>
            </div>
            <div className="breakdown-info">
              <span className="breakdown-label">Stale</span>
              <span className="breakdown-count">{data?.stale_leads || 0}</span>
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill bg-purple" 
                style={{ width: `${((data?.contacted_leads || 0) / (data?.total_leads || 1)) * 100}%` }}
              ></div>
            </div>
            <div className="breakdown-info">
              <span className="breakdown-label">Contacted</span>
              <span className="breakdown-count">{data?.contacted_leads || 0}</span>
            </div>
          </div>

          <div className="breakdown-item">
            <div className="breakdown-bar">
              <div 
                className="breakdown-fill bg-green" 
                style={{ width: `${((data?.recovered_leads || 0) / (data?.total_leads || 1)) * 100}%` }}
              ></div>
            </div>
            <div className="breakdown-info">
              <span className="breakdown-label">Recovered</span>
              <span className="breakdown-count">{data?.recovered_leads || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Performance */}
      <div className="ai-performance-section">
        <h2>AI Agent Performance</h2>
        <div className="performance-grid">
          <div className="performance-stat">
            <div className="stat-icon">🤖</div>
            <div className="stat-value">{data?.pending_approvals || 0}</div>
            <div className="stat-label">Pending Approvals</div>
          </div>

          <div className="performance-stat">
            <div className="stat-icon">✉️</div>
            <div className="stat-value">{data?.emails_sent || 0}</div>
            <div className="stat-label">Messages Sent</div>
          </div>

          <div className="performance-stat">
            <div className="stat-icon">📊</div>
            <div className="stat-value">{data?.recovery_rate_percent?.toFixed(1) || 0}%</div>
            <div className="stat-label">Success Rate</div>
          </div>

          <div className="performance-stat">
            <div className="stat-icon">💰</div>
            <div className="stat-value">{formatCurrency(data?.recovered_revenue || 0)}</div>
            <div className="stat-label">Revenue Impact</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics
