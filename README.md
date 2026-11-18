# ReviveAI – Autonomous Revenue Recovery Agent

> A small business revenue recovery application for the GoDaddy Inclusive Innovation Hackathon 2026.

## What is ReviveAI?

ReviveAI helps small businesses recover missed enquiries, forgotten quotations, and incomplete bookings. It uses Claude AI to analyze customer context, recommend recovery strategies, and generate personalized follow-ups—all with human approval before any action.

**Use case:** An AC repair business receives a quotation request, but the customer goes silent. ReviveAI detects the stale lead, Claude analyzes why the customer might have lost interest, recommends a recovery strategy, generates a personalized message, and waits for business owner approval before sending.

## Key Features

- **Lead Management:** Store and track customer enquiries with status
- **Stale Lead Detection:** Automatically identify enquiries that need follow-up
- **Claude AI Analysis:** Understand customer context and recommend recovery strategies
- **Human-in-the-Loop:** All generated messages require business owner approval before sending
- **Audit Trail:** Complete activity timeline for compliance and transparency
- **Mock AI Mode:** Develop and test without Claude API calls
- **GoDaddy Deployment Ready:** Listens on `process.env.PORT`, includes build and start scripts

## Quick Start

### Prerequisites

- Node.js 18+
- pnpm (or npm/yarn)
- SQLite3 (included with most systems)
- Anthropic API key (optional for MVP with mock mode)

### Local Development

```bash
# Clone and install
git clone <repo>
cd reviveai
pnpm install

# Set up environment
cp packages/server/.env.example packages/server/.env

# Seed database with demo leads (10 AC repair leads)
pnpm run db:seed

# Start dev servers (client: port 5173, server: port 5000)
pnpm run dev
```

The dashboard will open at `http://localhost:5173`.

### Production Build & Run

```bash
# Build frontend and backend
pnpm run build

# Start production server (listens on process.env.PORT or 5000)
PORT=5000 pnpm run start
```

## Project Structure

```
reviveai/
├── packages/
│   ├── server/           # Express backend + Claude agent + SQLite
│   │   ├── src/
│   │   │   ├── agent/    # Claude orchestrator, tools, prompts
│   │   │   ├── api/      # REST endpoints (leads, agent actions)
│   │   │   ├── db/       # Database schema and queries
│   │   │   ├── services/ # Email, approval, audit logging
│   │   │   └── utils/    # Helpers, validators, dates
│   │   ├── data/         # CSV demo dataset
│   │   ├── scripts/      # db:seed, migrations
│   │   └── package.json
│   │
│   └── client/           # React + Vite frontend
│       ├── src/
│       │   ├── pages/    # Dashboard, LeadDetail, ApprovalQueue
│       │   ├── components/
│       │   ├── api/      # API client
│       │   └── utils/
│       └── package.json
│
├── docs/                 # Documentation
│   ├── README.md         # (this file)
│   ├── requirements.md   # Feature specifications
│   ├── architecture.md   # Technical design
│   ├── claude-budget.md  # Token tracking & costs
│   ├── demo-plan.md      # 10 lead scenarios
│   └── deployment.md     # GoDaddy deployment guide
│
├── .gitignore
├── pnpm-workspace.yaml
└── package.json
```

## Documentation

- **[requirements.md](./docs/requirements.md)** – Feature requirements and acceptance criteria
- **[architecture.md](./docs/architecture.md)** – Technical design and data model
- **[claude-budget.md](./docs/claude-budget.md)** – API token usage and cost tracking
- **[demo-plan.md](./docs/demo-plan.md)** – Demo leads and test scenarios
- **[deployment.md](./docs/deployment.md)** – GoDaddy Node.js deployment

## Core Concepts

### Lead Status Flow

```
new → stale → contacted → recovered / escalated
```

- **new:** Just received, no contact attempt yet
- **stale:** No response >3 days, eligible for recovery action
- **contacted:** Recovery message sent or escalated
- **recovered:** Customer responded positively
- **escalated:** Requires manual intervention (complaint, manual callback request)

### Agent Safety Rules

The agent **never** automatically contacts:
- Customers who opted out
- Customers who declined
- Customers who already paid
- Duplicate records
- Recent enquiries (< 3 days old)

All messages require explicit human approval before sending.

### Claude Integration

- **Model:** Claude Haiku 4.5 (cost-optimized)
- **Mode:** Mock by default (zero API calls), real mode via ANTHROPIC_API_KEY
- **Output:** Structured JSON with lead analysis and recommendations
- **Tools:** 6 defined tools (fetch context, calculate revenue, generate message, etc.)
- **Budget:** ~$50 promotional credits, conservative use

## Development

### Available Scripts

```bash
pnpm run dev           # Start dev servers (client + server with hot reload)
pnpm run build         # Build for production
pnpm run start         # Run production server
pnpm run db:seed       # Seed database with 10 demo leads
pnpm run test          # Run tests
pnpm run lint          # Lint code
pnpm run format        # Format code
```

### Environment Variables

See `packages/server/.env.example` for all required variables:
- `ANTHROPIC_API_KEY` – (optional) Anthropic API credentials
- `ANTHROPIC_MODEL` – Claude model ID (default: claude-haiku-4-5)
- `MOCK_MODE` – Use mock AI provider (default: true)
- `DATABASE_URL` – SQLite database path
- `PORT` – Server port (default: 5000)

## Demo Walkthrough

1. **Dashboard** shows 10 seeded AC repair leads with status and revenue at risk
2. Click a **stale lead** → view details and interaction history
3. Click **"Trigger Analysis"** → Claude analyzes the lead (mock or real)
4. Review recommendation in **Approval Queue** → suggested message and action
5. **Approve** → message logged, lead status updated, audit trail recorded
6. View complete **timeline** of all actions per lead

## Hackathon Timeline

- **Day 1–2:** Project setup, CSV seeding, core API
- **Day 2–3:** Dashboard UI, lead management
- **Day 3–4:** Claude integration, agent analysis
- **Day 4–5:** Approval workflow, mock email
- **Day 5–6:** E2E testing, deterministic safety validation
- **Day 6–7:** Deployment, documentation

## Key Design Decisions

- **Single Agent:** One well-defined agent, not multi-agent architecture
- **Deterministic First:** TypeScript handles dates, revenue, eligibility checks
- **Claude for Reasoning:** AI handles context analysis, strategy, message writing
- **Human Approval:** No message sent without business owner review
- **Structured Output:** Claude output validated with Zod before execution
- **Mock Mode Default:** Develop without API calls, toggle to real Claude as needed
- **SQLite MVP:** Simple, fast, sufficient for demo scale

## Deployment

ReviveAI is built for **GoDaddy Node.js hosting**:
- Listens on `process.env.PORT`
- Build script: `pnpm run build`
- Start script: `pnpm run start`
- No external databases (SQLite on disk)
- Environment secrets in GoDaddy config, never in code

See [deployment.md](./docs/deployment.md) for detailed GoDaddy setup.

## License

Hackathon project for GoDaddy Inclusive Innovation 2026.

## Questions?

Refer to the [docs/](./docs/) folder for detailed documentation.

---

**Status:** MVP in development (P0 tasks in progress)  
**Last Updated:** November 19, 2026
