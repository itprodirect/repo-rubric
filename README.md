# RepoRubric

Agentic Workflow Assessment Tool for GitHub Repositories

## What This Does

Paste a GitHub repo URL → Get a structured assessment report showing:
- **Classification**: A (Not agentic), B (LLM assist), C (Task agents), D (Agent-orchestrated)
- **Scores**: Variability, Strategic Importance, Operational Impact, Integration Readiness, Risk
- **Task breakdown**: Per-task recommendations with citations to actual code
- **Guardrails checklist** and **pilot plan**

Based on the Gartner 5-step framework for redesigning workflows with AI agents.

## Quick Start

```bash
# 1. Clone and install
git clone <repo>
cd repo-rubric
npm install

# 2. Set up environment
cp .env.example .env
# Add your OPENAI_API_KEY (required)
# Optionally add GITHUB_TOKEN (increases rate limits)

# 3. Initialize database
npx prisma generate
npx prisma db push

# 4. Run
npm run dev
```

Open http://localhost:3000

## Tech Stack

- Next.js 14 (App Router) + TypeScript
- Prisma 7.x + SQLite (via libsql adapter)
- Tailwind CSS
- OpenAI API (Structured output with JSON schema)
- GitHub REST API (no cloning)

## Features

### MVP Complete
- URL input with progress states
- Full analysis pipeline (file selection → chunking → LLM → validation)
- Report page with all rubric sections
- Assessment history
- Error boundaries and loading states
- Rate limit countdown
- 404 handling

### Coming Soon (P2)
- File picker UI for manual selection
- Compare assessments side-by-side
- Mobile responsive design

## Documentation

| File | Purpose |
|------|---------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design and data flow |
| [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | Build order for Claude Code sessions |
| [docs/RUBRIC_SPEC.md](docs/RUBRIC_SPEC.md) | Assessment criteria from Gartner framework |
| [docs/FILE_HEURISTICS.md](docs/FILE_HEURISTICS.md) | How files are selected for analysis |
| [docs/CLAUDE_CODE_GUIDE.md](docs/CLAUDE_CODE_GUIDE.md) | Instructions for Claude Code sessions |
| [docs/SESSION_LOG.md](docs/SESSION_LOG.md) | Track progress across sessions |

## Project Structure

```
repo-rubric/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home: URL input + recent assessments
│   ├── loading.tsx             # Global loading state
│   ├── error.tsx               # Global error boundary
│   ├── not-found.tsx           # Global 404 page
│   ├── report/
│   │   └── [id]/
│   │       ├── page.tsx        # Report view
│   │       ├── loading.tsx     # Report loading skeleton
│   │       ├── error.tsx       # Report error boundary
│   │       └── not-found.tsx   # Assessment not found
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts        # POST: run full analysis
│   │   ├── assessments/
│   │   │   ├── route.ts        # GET: list assessments
│   │   │   └── [id]/
│   │   │       └── route.ts    # GET: single assessment
│   │   └── repo/
│   │       └── [owner]/
│   │           └── [name]/
│   │               └── tree/
│   │                   └── route.ts  # GET: repo tree
│   └── generated/
│       └── prisma/             # Generated Prisma client
├── components/
│   ├── ClassificationBadge.tsx # A/B/C/D badges
│   ├── CitationLink.tsx        # GitHub file links
│   ├── ErrorBoundary.tsx       # Error handling
│   ├── ScoreCard.tsx           # Score display
│   ├── Skeleton.tsx            # Loading skeletons
│   └── TaskTable.tsx           # Task breakdown table
├── lib/
│   ├── prisma.ts               # Prisma singleton
│   ├── github.ts               # GitHub API client
│   ├── heuristics.ts           # File selection logic
│   ├── chunker.ts              # Content chunking
│   ├── llm.ts                  # OpenAI pipeline
│   └── validate.ts             # Schema validation
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── dev.db                  # SQLite database
├── schemas/
│   └── reporubric.schema.json  # Rubric JSON schema
└── docs/                       # Documentation
```

## Environment Variables

```env
OPENAI_API_KEY=sk-...      # Required
GITHUB_TOKEN=ghp_...       # Optional, increases rate limits (60 → 5000/hr)
DATABASE_URL=file:./dev.db # SQLite path (via libsql)
```

## API Endpoints

### POST /api/analyze
Analyze a GitHub repository.

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/owner/repo"}'
```

Returns: `{ assessmentId: "uuid", ... }`

### GET /api/assessments
List recent assessments.

```bash
curl http://localhost:3000/api/assessments?limit=10
```

### GET /api/assessments/[id]
Get a specific assessment.

```bash
curl http://localhost:3000/api/assessments/uuid
```

## License

MIT
