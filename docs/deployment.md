# ReviveAI – GoDaddy Deployment Guide

## Overview

ReviveAI is built to run on GoDaddy Node.js hosting. This guide covers environment setup, configuration, and deployment.

---

## Prerequisites

- GoDaddy account with Node.js hosting plan
- Custom domain (pending – will be assigned)
- Domain email mailbox (pending – will be configured)
- GitHub repository for code storage

---

## Local Build & Test

Before deploying to GoDaddy, ensure the app builds and runs locally.

### 1. Build Production Assets

```bash
# From workspace root
pnpm run build

# This:
# 1. Builds React frontend → packages/client/dist/
# 2. Builds Express backend → packages/server/dist/
```

### 2. Verify Start Script Works

```bash
# Start production server
PORT=5000 pnpm run start

# Expected: Server listening on port 5000
# Frontend served at http://localhost:5000
# API endpoints at http://localhost:5000/api/*
```

### 3. Test API Endpoints

```bash
# In another terminal
curl http://localhost:5000/api/leads
# Should return: { leads: [...], total: 0 }
```

---

## GoDaddy Deployment

### 1. Prepare Repository

Ensure these files are in your GitHub repo:

```
reviveai/
├── package.json              # Root workspace
├── pnpm-workspace.yaml       # Monorepo config
├── .gitignore                # Exclude .env, node_modules
├── packages/
│   ├── server/package.json   # Production dependencies
│   ├── client/package.json
│   └── ...
├── README.md
└── docs/
```

**Critical:** Never commit `.env` files or API keys. Use `.env.example` as template.

### 2. Configure GoDaddy App

Log into GoDaddy Node.js hosting console:

1. **Create New App** (or select existing)
2. **Connect GitHub Repository**
3. **Set Build Command:**
   ```bash
   pnpm install && pnpm run build
   ```
4. **Set Start Command:**
   ```bash
   pnpm run start
   ```

### 3. Environment Variables in GoDaddy

In GoDaddy's environment configuration panel, set:

```
ANTHROPIC_API_KEY=sk-ant-v7-...  (your actual API key)
ANTHROPIC_MODEL=claude-haiku-4-5
MOCK_MODE=false                  (set to false for real Claude, true for mock)
DATABASE_URL=./data/reviveai.db
PORT=                            (leave empty, GoDaddy sets this)
NODE_ENV=production
```

**Security:** GoDaddy keeps these environment variables encrypted and separate from code.

### 4. Custom Domain Setup

1. **Domain Registration:** Register your domain (pending)
2. **DNS Configuration:** Point domain to GoDaddy Node.js hosting
3. **HTTPS:** GoDaddy provisions automatic SSL certificates
4. **Access:** Your app will be available at `https://yourdomain.com`

### 5. Email Configuration (P1 Feature)

Once domain email is set up:

1. **In GoDaddy:**
   - Create mailbox: `support@yourdomain.com`
   - Get SMTP credentials

2. **In ReviveAI .env (via GoDaddy panel):**
   ```
   SMTP_HOST=mail.yourdomain.com
   SMTP_PORT=587
   SMTP_USER=support@yourdomain.com
   SMTP_PASSWORD=...
   SMTP_FROM=support@yourdomain.com
   ```

3. **Code:** Email adapter automatically uses these when MOCK_MODE=false

---

## SQLite Database on GoDaddy

### Persistence

GoDaddy Node.js hosting provides a writable filesystem. SQLite database file is stored at:
```
./data/reviveai.db
```

This file persists across app restarts **within the same deployment slot**.

### Important Notes

1. **No External Database Needed:** For MVP scale (100s of leads), SQLite is sufficient
2. **Backups:** Implement manual backup process (export SQL dump periodically)
3. **Scaling Limitation:** If you exceed 10,000 concurrent queries, consider migration to PostgreSQL (post-hackathon)

### Database Seeding on GoDaddy

After initial deploy, seed the demo leads:

Option 1: **Via API endpoint** (create admin endpoint if time permits)
```bash
POST /api/internal/db/seed
# Returns: { imported: 10, duplicates: 1, errors: [] }
```

Option 2: **Via SSH/CLI** (if GoDaddy provides access)
```bash
pnpm run db:seed
```

Option 3: **Manual**: Seed data in local DB, commit to repo, deploy

---

## Build & Deployment Scripts

These must exist in your `package.json` files:

### Root `package.json`
```json
{
  "scripts": {
    "build": "cd packages/client && pnpm run build && cd ../server && pnpm run build",
    "start": "cd packages/server && node dist/index.js",
    "dev": "concurrently \"cd packages/server && pnpm run dev\" \"cd packages/client && pnpm run dev\""
  }
}
```

### Server `package.json`
```json
{
  "scripts": {
    "build": "tsc",
    "dev": "ts-node-dev src/index.ts",
    "db:seed": "ts-node scripts/seed.ts"
  }
}
```

### Client `package.json`
```json
{
  "scripts": {
    "build": "vite build",
    "dev": "vite"
  }
}
```

---

## Monitoring & Logs

### Access Logs on GoDaddy
- Navigate to your app dashboard
- View real-time logs (stdout + stderr)
- Check for errors or performance issues

### Common Issues

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | Check if app is running. Restart via GoDaddy panel. |
| Database locked | SQLite contention. Ensure single app instance running. |
| Out of memory | Check for memory leaks. Restart app. |
| HTTPS fails | Check domain DNS. GoDaddy SSL usually auto-provisions. |
| Email not sending | Verify SMTP credentials, check if mailbox exists. |

---

## Performance Tuning

### Frontend
- Minified React bundle: ~50KB gzipped
- Assets cached with far-future headers
- No inline JavaScript, CSP compliant

### Backend
- SQLite queries indexed on frequently-filtered columns
- API responses paginated (default 50 leads per page)
- Claude analysis cached (no re-analysis of unchanged leads)

### Database
- Indexes on: lead_id, status, created_at, opted_out, payment_status
- Cleanup queries (archive old logs after 90 days)

---

## Rollback & Recovery

### If Deployment Breaks

1. **GoDaddy Auto-Rollback:**
   - If build fails, previous version remains live
   - No action needed

2. **Manual Rollback:**
   - Navigate to GoDaddy App > Deployments
   - Click previous deployment version
   - Click "Rollback"

3. **Data Recovery:**
   - Database (SQLite) is independent of code
   - Deploying new code doesn't affect existing data
   - Can safely redeploy without data loss

---

## Post-Launch Checklist

- [ ] Domain resolves to HTTPS
- [ ] Dashboard loads at https://yourdomain.com
- [ ] API endpoints respond (curl test)
- [ ] Database seeded with demo leads
- [ ] Mock mode toggled off (Claude API working)
- [ ] Email adapter configured (if P1 feature enabled)
- [ ] Admin can view all leads on dashboard
- [ ] Stale lead detection working
- [ ] Claude analysis generates recommendations
- [ ] Approval workflow functional
- [ ] Logs monitored for errors

---

## Maintenance

### Weekly
- Check logs for errors
- Monitor database size (should be <100MB for MVP)
- Verify email delivery

### Monthly
- Review performance metrics
- Archive old audit logs
- Update dependencies (if vulnerabilities found)

### Post-Hackathon
- Migrate to PostgreSQL if scaling needed
- Implement automated backups
- Set up monitoring/alerting
- Add caching layer (Redis) if needed

---

## Support & Troubleshooting

**GoDaddy Node.js Docs:** https://www.godaddy.com/  
**Node.js Version:** 18+  
**Expected Build Time:** 2–5 minutes  
**Expected Deploy Time:** 1–2 minutes  

For issues, check:
1. GoDaddy app dashboard logs
2. GitHub Actions (if CI/CD configured)
3. Local build (verify it works locally first)

---

Last Updated: November 19, 2026
