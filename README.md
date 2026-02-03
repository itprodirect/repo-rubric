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
- OpenAI-compatible LLM API (OpenAI and Moonshot Kimi)
- GitHub REST API (no cloning)

## Features

### Core Features
- **URL input** with progress states and rate limit handling
- **File picker** - Select which files to analyze (or use auto-detect)
- **Full analysis pipeline** - File selection → chunking → LLM → validation
- **Report page** with all rubric sections, scores, tasks, guardrails
- **Assessment history** with recent assessments on home page

### Compare & Manage
- **Compare view** - Side-by-side assessment comparison at `/compare?a=<id>&b=<id>`
  - Classification upgrade/downgrade visualization
  - Score delta indicators
  - Task and KPI comparisons
- **Export as JSON** - Download assessment data
- **Re-analyze** - Re-run analysis with different file selection
- **Delete assessments** - Clean up history

### Polish
- Error boundaries and loading skeletons
- 404 handling
- Rate limit countdown

### Coming Soon (P2.3+)
- Mobile responsive design
- History page with pagination and search
- Same-repo trend tracking

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
│   ├── page.tsx                # Home: URL input + recent assessments + compare mode
│   ├── loading.tsx             # Global loading state
│   ├── error.tsx               # Global error boundary
│   ├── not-found.tsx           # Global 404 page
│   ├── repo/
│   │   └── page.tsx            # File picker UI
│   ├── report/
│   │   └── [id]/
│   │       ├── page.tsx        # Report view with export/re-analyze/compare
│   │       ├── loading.tsx     # Report loading skeleton
│   │       ├── error.tsx       # Report error boundary
│   │       └── not-found.tsx   # Assessment not found
│   ├── compare/
│   │   ├── page.tsx            # Side-by-side comparison
│   │   └── loading.tsx         # Compare loading skeleton
│   ├── api/
│   │   ├── analyze/
│   │   │   └── route.ts        # POST: run full analysis
│   │   ├── select-files/
│   │   │   └── route.ts        # POST: get file tree with preselection
│   │   ├── assessments/
│   │   │   ├── route.ts        # GET: list assessments
│   │   │   └── [id]/
│   │   │       └── route.ts    # GET/DELETE: single assessment
│   │   └── repo/
│   │       └── [owner]/
│   │           └── [name]/
│   │               └── tree/
│   │                   └── route.ts  # GET: repo tree
│   └── generated/
│       └── prisma/             # Generated Prisma client
├── components/
│   ├── ClassificationBadge.tsx # A/B/C/D badges
│   ├── ClassificationDelta.tsx # Compare: upgrade/downgrade arrows
│   ├── CitationLink.tsx        # GitHub file links
│   ├── CompareButton.tsx       # "Compare with..." dropdown trigger
│   ├── CompareScoreCard.tsx    # Compare: side-by-side scores
│   ├── DeltaIndicator.tsx      # Compare: +/- score changes
│   ├── AssessmentPicker.tsx    # Compare: assessment dropdown
│   ├── ErrorBoundary.tsx       # Error handling
│   ├── ExportButton.tsx        # JSON export button
│   ├── FileTree.tsx            # File picker tree
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
OPENAI_API_KEY=sk-...        # Required
OPENAI_BASE_URL=             # Optional (e.g. https://api.moonshot.ai/v1)
OPENAI_MODEL=                # Optional (default: gpt-4.1-2025-04-14)
GITHUB_TOKEN=ghp_...         # Optional, increases rate limits (60 -> 5000/hr)
DATABASE_URL=file:./dev.db   # SQLite path (via libsql)
```

## Using Kimi (Moonshot)

Set the OpenAI-compatible base URL and model:

```env
OPENAI_API_KEY=your-moonshot-key
OPENAI_BASE_URL=https://api.moonshot.ai/v1
OPENAI_MODEL=kimi-k2.5
```

Note: Kimi requires temperature = 1. The app enforces this automatically when using Kimi models.

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

### DELETE /api/assessments/[id]
Delete an assessment.

```bash
curl -X DELETE http://localhost:3000/api/assessments/uuid
```

### POST /api/select-files
Get file tree with preselection hints for the file picker.

```bash
curl -X POST http://localhost:3000/api/select-files \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/owner/repo"}'
```

## License

MIT
