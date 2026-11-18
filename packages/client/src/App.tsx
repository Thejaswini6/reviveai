import { useState, useEffect } from 'react'

function App() {
  const [serverStatus, setServerStatus] = useState<string>('Loading...')

  useEffect(() => {
    fetch('/api')
      .then(res => res.json())
      .then(data => setServerStatus(`Connected to ${data.name}`))
      .catch(err => setServerStatus('Disconnected from server'))
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🚀 ReviveAI - Autonomous Revenue Recovery Agent</h1>
      <p>Status: {serverStatus}</p>
      <p>Frontend v0.1.0</p>
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Coming Soon</h3>
        <ul>
          <li>Lead Dashboard</li>
          <li>Lead Detail View</li>
          <li>Approval Queue</li>
          <li>Analytics Dashboard</li>
        </ul>
      </div>
    </div>
  )
}

export default App
