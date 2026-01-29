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
- Prisma + SQLite
- Tailwind CSS
- OpenAI API (Responses API with structured output)
- GitHub REST API (no cloning)

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
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home: URL input
│   ├── repo/[id]/page.tsx # Repo analysis view
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Core logic
│   ├── github.ts          # GitHub API client
│   ├── heuristics.ts      # File selection
│   ├── llm.ts             # OpenAI pipeline
│   └── schema.ts          # JSON schema validation
├── prisma/                # Database schema
├── schemas/               # JSON schemas
└── docs/                  # Documentation
```

## Environment Variables

```env
OPENAI_API_KEY=sk-...      # Required
GITHUB_TOKEN=ghp_...       # Optional, increases rate limits
DATABASE_URL=file:./dev.db # SQLite path
```

## License

MIT
