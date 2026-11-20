import { useState, useEffect } from 'react'
import DashboardEnhanced from './pages/DashboardEnhanced'
import LeadDetail from './pages/LeadDetail'
import ApprovalQueue from './pages/ApprovalQueue'
import Analytics from './pages/Analytics'
import Contact from './pages/Contact'
import './App.css'

type Page = 'dashboard' | 'approvals' | 'analytics' | 'lead-detail' | 'contact'

function getInitialState(): { page: Page; leadId: string | null } {
  if (typeof window === 'undefined') return { page: 'dashboard', leadId: null };
  const path = window.location.pathname;
  if (path.startsWith('/contact')) return { page: 'contact', leadId: null };
  if (path.startsWith('/approvals')) return { page: 'approvals', leadId: null };
  if (path.startsWith('/analytics')) return { page: 'analytics', leadId: null };
  if (path.startsWith('/leads/')) {
    const id = path.split('/')[2];
    return { page: 'lead-detail', leadId: id || null };
  }
  return { page: 'dashboard', leadId: null };
}

function App() {
  const [initial] = useState(getInitialState);
  const [currentPage, setCurrentPage] = useState<Page>(initial.page);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(initial.leadId);
  const [serverStatus, setServerStatus] = useState<string>('connecting...');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  // Synchronize browser history and path
  const navigateTo = (page: Page, leadId: string | null = null) => {
    setCurrentPage(page);
    setSelectedLeadId(leadId);
    let targetPath = '/';
    if (page === 'contact') targetPath = '/contact';
    else if (page === 'approvals') targetPath = '/approvals';
    else if (page === 'analytics') targetPath = '/analytics';
    else if (page === 'lead-detail' && leadId) targetPath = `/leads/${leadId}`;

    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page, leadId }, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const state = getInitialState();
      setCurrentPage(state.page);
      setSelectedLeadId(state.leadId);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    navigateTo('lead-detail', leadId);
  }

  const handleBackToDashboard = () => {
    navigateTo('dashboard', null);
  }

  return (
    <div className="app">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header" onClick={() => navigateTo('dashboard')} style={{ cursor: 'pointer' }}>
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
            onClick={() => navigateTo('dashboard')}
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
            onClick={() => navigateTo('approvals')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="10" cy="10" r="7"/>
              <path d="M7 10l2 2 4-4"/>
            </svg>
            Approval Queue
          </button>

          <button 
            className={`nav-item ${currentPage === 'analytics' ? 'active' : ''}`}
            onClick={() => navigateTo('analytics')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 17V9l4-4 4 4 4-4 4 4v8"/>
              <path d="M3 17h16"/>
            </svg>
            Analytics
          </button>

          <button 
            className={`nav-item ${currentPage === 'contact' ? 'active' : ''}`}
            onClick={() => navigateTo('contact')}
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="16" height="12" rx="2"/>
              <path d="M2 6l8 6 8-6"/>
            </svg>
            Contact Us
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
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <div style={{ flex: 1 }}>
          {currentPage === 'dashboard' && (
            <DashboardEnhanced
              onViewLead={handleViewLead}
              onNavigateToContact={() => navigateTo('contact')}
            />
          )}
          {currentPage === 'approvals' && <ApprovalQueue onViewLead={handleViewLead} />}
          {currentPage === 'analytics' && <Analytics />}
          {currentPage === 'contact' && (
            <Contact
              onNavigateToDashboard={handleBackToDashboard}
            />
          )}
          {currentPage === 'lead-detail' && selectedLeadId && (
            <LeadDetail leadId={selectedLeadId} onBack={handleBackToDashboard} />
          )}
        </div>

        {/* Global Public Footer */}
        <footer style={{
          marginTop: 'auto',
          padding: '1.5rem 2rem',
          borderTop: '1px solid var(--border)',
          background: 'var(--bg-secondary)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          fontSize: '0.8125rem',
          color: 'var(--text-secondary)'
        }}>
          <div>
            <strong>ReviveAI</strong> — Autonomous Revenue Recovery for Small Businesses.
            <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--text-tertiary)' }}>
              Deployed on GoDaddy Node.js Hosting • Domain: <a href="https://reviveaiapp.com" style={{ color: 'var(--primary)' }}>reviveaiapp.com</a>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <button
              onClick={() => navigateTo('dashboard')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8125rem' }}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigateTo('approvals')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8125rem' }}
            >
              Approvals
            </button>
            <button
              onClick={() => navigateTo('analytics')}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8125rem' }}
            >
              Analytics
            </button>
            <button
              onClick={() => navigateTo('contact')}
              style={{
                background: 'var(--primary)',
                color: 'white',
                border: 'none',
                padding: '0.35rem 0.75rem',
                borderRadius: '6px',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '0.8125rem'
              }}
            >
              ✉️ Contact Us
            </button>
          </div>
        </footer>
      </main>
    </div>
  )
}

export default App
