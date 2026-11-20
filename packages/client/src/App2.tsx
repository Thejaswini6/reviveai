import { useState, useEffect } from 'react'
import DashboardEnhanced from './pages/DashboardEnhanced'
import LeadDetail from './pages/LeadDetail'
import ApprovalQueue from './pages/ApprovalQueue'
import Analytics from './pages/Analytics'
import Contact from './pages/Contact'
import './App.css'

type Page = 'dashboard' | 'approvals' | 'analytics' | 'lead-detail' | 'contact'

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
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 17V9l4-4 4 4 4-4 4 4v8"/>
              <path d="M3 17h16"/>
            </svg>
            Analytics
          </button>

          <button 
            className={`nav-item ${currentPage === 'contact' ? 'active' : ''}`}
            onClick={() => setCurrentPage('contact')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="16" height="12" rx="2"/>
              <path d="M2 6l8 6 8-6"/>
            </svg>
            Contact Form
          </button>
        </nav>

        <div className="sidebar-footer">
          <button 
            className="theme-toggle"
            onClick={() => setDarkMode(!darkMode)}
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1" x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1" y1="12" x2="3" y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            )}
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {currentPage === 'dashboard' && (
          <DashboardEnhanced
            onViewLead={handleViewLead}
            onNavigateToContact={() => setCurrentPage('contact')}
          />
        )}
        {currentPage === 'approvals' && <ApprovalQueue onViewLead={handleViewLead} />}
        {currentPage === 'analytics' && <Analytics />}
        {currentPage === 'contact' && (
          <Contact
            onNavigateToDashboard={handleBackToDashboard}
            onInquirySubmitted={() => {
              // Allows user to view lead on dashboard
            }}
          />
        )}
        {currentPage === 'lead-detail' && selectedLeadId && (
          <LeadDetail leadId={selectedLeadId} onBack={handleBackToDashboard} />
        )}
      </main>
    </div>
  )
}

export default App
