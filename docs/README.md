# RepoRubric Documentation

> Start here for navigating the project docs.

---

## Quick Links

| What you need | File |
|---------------|------|
| **Start a new session** | [SESSION_LOG.md](SESSION_LOG.md) - Check current status |
| **P2 work in progress** | [P2_CHECKLIST.md](P2_CHECKLIST.md) - Current checklist |
| **Claude Code prompts** | [CLAUDE_CODE_PROMPT_P2.md](CLAUDE_CODE_PROMPT_P2.md) - Copy-paste prompt |
| **Technical architecture** | [ARCHITECTURE.md](ARCHITECTURE.md) |

---

## Document Index

### Session Management

| File | Purpose |
|------|---------|
| [SESSION_LOG.md](SESSION_LOG.md) | Track all sessions, current status, what to do next |
| [QUICKSTART.md](../QUICKSTART.md) | First-time setup prompts (P1 - historical) |

### Phase Guides (Current: P2)

| File | Purpose |
|------|---------|
| [P2_CHECKLIST.md](P2_CHECKLIST.md) | Current work checklist - P2.1 File Picker |
| [CLAUDE_CODE_PROMPT_P2.md](CLAUDE_CODE_PROMPT_P2.md) | Full prompt to copy into Claude Code |
| [FILE_SELECTION_MODES.md](FILE_SELECTION_MODES.md) | API contract for additive vs override modes |

### Technical Specs (Reference)

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture, data flow, components |
| [RUBRIC_SPEC.md](RUBRIC_SPEC.md) | Rubric JSON schema specification |
| [FILE_HEURISTICS.md](FILE_HEURISTICS.md) | File selection algorithm details |
| [CLAUDE_CODE_GUIDE.md](CLAUDE_CODE_GUIDE.md) | Tips for working with Claude Code |

### Archive (P0/P1 Complete)

| File | Purpose |
|------|---------|
| [P0_CHECKLIST.md](P0_CHECKLIST.md) | P0 blockers - DONE |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Original implementation plan - P1 DONE |
| [CODEX_ASSESSMENT.md](CODEX_ASSESSMENT.md) | Initial Codex analysis |
| [CODEX_SYNTHESIS.md](CODEX_SYNTHESIS.md) | Prioritization from Codex runs |

---

## Session Workflow

### Starting a New Session

1. **Read current status**: Open [SESSION_LOG.md](SESSION_LOG.md), check "Current Status" section
2. **Find your checklist**: Use the phase checklist (currently [P2_CHECKLIST.md](P2_CHECKLIST.md))
3. **Run pre-flight**:
   ```bash
   cd repo-rubric
   git status              # Clean working tree?
   npm run dev             # Does it start?
   npx prisma generate     # Does Prisma work?
   ```
4. **Copy prompt** (optional): Use the Claude Code prompt file for full context

### Ending a Session

1. **Update SESSION_LOG.md**: Add session entry with completed/remaining items
2. **Update checklist**: Check off completed items
3. **Commit and push**:
   ```bash
   git add -A
   git commit -m "feat(pX): describe what was done"
   git push
   ```

---

## Phase Overview

| Phase | Status | Description |
|-------|--------|-------------|
| P0 | DONE | Fix blockers (Prisma, routing, validation) |
| P1 | DONE | MVP end-to-end loop (Sessions 1-6) |
| P2.1 | DONE | File Picker UI with selectedPaths override |
| P2.2 | TODO | Compare View |
| P2.3 | TODO | Mobile responsive |

---

## Project Structure

```
repo-rubric/
├── app/                    # Next.js App Router
│   ├── page.tsx            # Home - URL input
│   ├── repo/page.tsx       # File picker (P2.1)
│   ├── report/[id]/        # Report view
│   └── api/
│       ├── analyze/        # POST: run analysis
│       ├── select-files/   # POST: get file tree + preselection
│       └── assessments/    # GET: list/single
├── components/             # React components
├── lib/                    # Business logic
│   ├── github.ts           # GitHub API client
│   ├── heuristics.ts       # File selection
│   ├── chunker.ts          # Content chunking
│   ├── llm.ts              # OpenAI pipeline
│   └── validate.ts         # Schema validation
├── prisma/                 # Database schema
├── schemas/                # JSON schemas
└── docs/                   # You are here
```
