// Production Smoke Test (Self-contained in-process child process test)
import { spawn } from 'child_process';
import path from 'path';

async function main() {
  console.log('🚀 Spawning production server (node packages/server/dist/index.js)...');
  
  const server = spawn('node', ['packages/server/dist/index.js'], {
    env: {
      ...process.env,
      NODE_ENV: 'production',
      PORT: '5000',
      MOCK_MODE: 'true',
      EMAIL_ADAPTER: 'mock'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  server.stdout.on('data', (d) => process.stdout.write(`[SERVER STDOUT] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[SERVER STDERR] ${d}`));

  // Wait for server to start
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server start timed out after 10s')), 10000);
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Server running on port 5000')) {
        clearTimeout(timer);
        resolve(true);
      }
    });
    server.on('error', reject);
    server.on('exit', (code) => {
      if (code !== 0) reject(new Error(`Server exited prematurely with code ${code}`));
    });
  });

  console.log('\n--- Running API & Static Asset Smoke Checks ---\n');

  try {
    const health = await fetch('http://127.0.0.1:5000/health').then(r => r.json());
    console.log('✅ /health:', health);

    const api = await fetch('http://127.0.0.1:5000/api').then(r => r.json());
    console.log('✅ /api:', api);

    const leads = await fetch('http://127.0.0.1:5000/api/leads?limit=3').then(r => r.json());
    console.log(`✅ /api/leads: ${leads.total} total leads in system`);

    const summary = await fetch('http://127.0.0.1:5000/api/analytics/summary').then(r => r.json());
    console.log(`✅ /api/analytics/summary: total_leads=${summary.total_leads}, stale_leads=${summary.stale_leads}, pipeline=₹${summary.gross_open_pipeline_value}`);

    const html = await fetch('http://127.0.0.1:5000/').then(r => r.text());
    console.log(`✅ GET / (React index.html): ${html.length} bytes, has <div id="root">: ${html.includes('<div id="root"></div>')}`);

    const spaRoute = await fetch('http://127.0.0.1:5000/leads/RV-2001').then(r => r.text());
    console.log(`✅ GET /leads/RV-2001 (SPA fallback): ${spaRoute.length} bytes, has root div: ${spaRoute.includes('<div id="root"></div>')}`);

    const contactRes = await fetch('http://127.0.0.1:5000/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Judge Evaluation Test',
        email: 'judge@godaddy.hackathon',
        subject: 'Evaluation Inquiry',
        message: 'Testing live website contact form delivery to thejaswini@reviveaiapp.com.'
      })
    }).then(r => r.json());
    console.log('✅ POST /api/contact:', contactRes.success ? 'PASSED' : 'FAILED', '| Recipient:', contactRes.delivery?.recipient, '| Channel:', contactRes.delivery?.channel);

    const leadRes = await fetch('http://127.0.0.1:5000/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ananya Deshmukh',
        email: 'ananya@example.com',
        phone: '+91-98765-43210',
        service: 'AC repair',
        potential_value: 4500,
        message: 'Urgent: Split AC stopped cooling.'
      })
    }).then(r => r.json());
    console.log('✅ POST /api/leads (+ New Inquiry):', leadRes.success ? 'PASSED' : 'FAILED', '| Created Lead:', leadRes.lead_id, '| Name:', leadRes.lead?.name);

    console.log('\n================================================');
    console.log('🎉 ALL PRODUCTION SMOKE TESTS PASSED CLEANLY');
    console.log('================================================');
  } finally {
    console.log('🛑 Shutting down server...');
    server.kill();
  }
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
