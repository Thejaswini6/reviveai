import { useState, useEffect } from 'react'
import DashboardEnhanced from './pages/DashboardEnhanced'
import LeadDetail from './pages/LeadDetail'
import ApprovalQueue from './pages/ApprovalQueue'
import Analytics from './pages/Analytics'
import './App.css'

type Page = 'dashboard' | 'approvals' | 'analytics' | 'lead-detail'

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [serverStatus, setServerStatus] = useState<string>('connecting...')
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
    localStorage.setItem('darkMode', JSON.stringify(darkMode))
  }, [darkMode])

  useEffect(() => {
    fetch('/api')
      .then(res => res.json())
      .then(data => setServerStatus(`${data.name} v${data.version}`))
      .catch(() => setServerStatus('disconnected'))
  }, [])

  const handleViewLead = (leadId: string) => {
    setSelectedLeadId(leadId)
    setCurrentPage('lead-detail')
  }

  const handleBackToDashboard = () => {
    setCurrentPage('dashboard')
    setSelectedLeadId(null)
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="currentColor" opacity="0.1"/>
              <path d="M16 8L24 16L16 24L8 16L16 8Z" fill="currentColor"/>
            </svg>
            <span>ReviveAI</span>
          </div>
          <div className="status-badge">{serverStatus}</div>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1"/>
              <rect x="12" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="12" width="7" height="7" rx="1"/>
              <rect x="12" y="12" width="7" height="7" rx="1"/>
            </svg>
            Dashboard
          </button>

          <button 
            className={`nav-item ${currentPage === 'approvals' ? 'active' : ''}`}
            onClick={() => setCurrentPage('approvals')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M7 10l2 2 4-4"/>
            </svg>
            Approval Queue
          </button>

          <button 
            className={`nav-item ${currentPage === 'analytics' ? 'active' : ''}`}
            onClick={() => setCurrentPage('analytics')}
        <div className="sidebar-footer">
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="10" cy="10" r="4"/>
                <path d="M10 2v2m0 12v2M2 10h2m12 0h2M4.22 4.22l1.42 1.42m11.32 0l1.42-1.42M4.22 15.78l1.42-1.42m11.32 0l1.42 1.42"/>
              </svg>
            ) : (
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        {currentPage === 'dashboard' && <DashboardEnhanced onViewLead={handleViewLead} />}
            )}
            {darkMode ? 'Light' : 'Dark'}
          </button>
          <div className="footer-info">
            <span className="footer-label">Mode</span>
            <span className="footer-value">Mock AI</span>
          </div>
          <div className="footer-info">
            <span className="footer-label">Model</span>
            <span className="footer-value">Claude Haiku 4.5</span>
          </div>
        </div>lassName="sidebar-footer">
          <div className="footer-info">
            <span className="footer-label">Mode</span>
            <span className="footer-value">Mock AI</span>
          </div>
          <div className="footer-info">
            <span className="footer-label">Model</span>
            <span className="footer-value">Claude Haiku 4.5</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {currentPage === 'dashboard' && <Dashboard onViewLead={handleViewLead} />}
        {currentPage === 'approvals' && <ApprovalQueue onViewLead={handleViewLead} />}
        {currentPage === 'analytics' && <Analytics />}
        {currentPage === 'lead-detail' && selectedLeadId && (
          <LeadDetail leadId={selectedLeadId} onBack={handleBackToDashboard} />
        )}
      </main>
    </div>
  )
}

export default App
