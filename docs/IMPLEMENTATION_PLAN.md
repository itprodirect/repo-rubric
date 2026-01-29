# Implementation Plan

Step-by-step build order for Claude Code sessions. Each phase can be a single session.

## Pre-flight Checklist

Before starting any phase, ensure:
- [ ] Node.js 18+ installed
- [ ] Git initialized
- [ ] Working directory is repo-rubric

## Phase 1: Project Scaffold

**Goal:** Basic Next.js app with Prisma SQLite running

**Commands for Claude Code:**
```
Create Next.js 14 App Router project with:
- TypeScript
- Tailwind CSS
- ESLint
- src/ directory: NO (use app/ at root)
- App Router: YES

Add Prisma with SQLite. Create schema with RepoAssessment model.
```

**Expected files:**
```
app/
  layout.tsx
  page.tsx
  globals.css
prisma/
  schema.prisma
.env.example
package.json
tailwind.config.ts
tsconfig.json
```

**Acceptance criteria:**
- [ ] `npm run dev` starts server at localhost:3000
- [ ] `npx prisma generate` succeeds
- [ ] `npx prisma db push` creates dev.db
- [ ] Home page renders

**Session log entry:** Record date, files created, any issues

---

## Phase 2: GitHub Integration

**Goal:** Parse URLs, fetch repo metadata, fetch tree

**Commands for Claude Code:**
```
Create lib/github.ts with:
- parseGitHubUrl(url) -> {owner, repo} or throw
- getRepoMetadata(owner, repo) -> {defaultBranch, description}
- getLatestCommit(owner, repo, branch) -> sha
- getTree(owner, repo, sha) -> TreeNode[]

Use fetch with optional GITHUB_TOKEN from env.
Handle rate limits (return 429 response).
```

**Add API route:**
```
app/api/repo/[owner]/[name]/tree/route.ts
- GET handler
- Returns tree + metadata + commit SHA
```

**Acceptance criteria:**
- [ ] parseGitHubUrl handles various URL formats
- [ ] API route returns tree for public repo
- [ ] Proper error for invalid URLs
- [ ] Test with: https://github.com/vercel/next.js

---

## Phase 3: File Selection Heuristics

**Goal:** Automatically select relevant files from tree

**Commands for Claude Code:**
```
Create lib/heuristics.ts implementing:
- File selection weights (Tier 0, 1, 2)
- Ignore patterns (node_modules, dist, etc.)
- Stack detection (Next.js, Python, etc.)
- selectFiles(tree, maxFiles=25) -> {selected, detected_stack}

See docs/FILE_HEURISTICS.md for full spec.
```

**Acceptance criteria:**
- [ ] README.md always included
- [ ] package.json included for JS projects
- [ ] node_modules ignored
- [ ] Returns detected stack array
- [ ] Respects maxFiles limit

---

## Phase 4: Content Fetching & Chunking

**Goal:** Fetch file contents, chunk large files with line tracking

**Commands for Claude Code:**
```
Add to lib/github.ts:
- getFileContent(owner, repo, path, sha) -> {content, size}

Create lib/chunker.ts:
- chunkFile(content, path, sha, maxLines=300) -> Chunk[]
- Chunk = {path, sha, lineStart, lineEnd, content, citationId}
- citationId = "CIT-" + hash(path+sha+lineStart)

Create lib/fetcher.ts:
- fetchAllFiles(owner, repo, sha, paths, maxChars=250000)
- Returns chunks array + warnings if truncated
```

**Acceptance criteria:**
- [ ] Large files split into chunks
- [ ] Each chunk has line range
- [ ] Total content respects maxChars
- [ ] citationId is deterministic

---

## Phase 5: OpenAI Pipeline

**Goal:** File summaries + rubric assessment with strict JSON

**Commands for Claude Code:**
```
Create lib/llm.ts:
- summarizeFile(chunk) -> FileSummary
- runRubricAssessment(metadata, summaries) -> RubricOutput

Use OpenAI Responses API with:
- response_format: { type: "json_schema", json_schema: {...} }
- Include the full schema from schemas/reporubric.schema.json

Create lib/schema.ts:
- validateRubric(json) -> {valid, errors}
- Load schema from file

If validation fails:
- Dev mode: return model output + errors
- Prod mode: throw error
```

**Prompt structure for rubric:**
```
System: You assess GitHub repositories against an agentic workflow rubric.
You MUST cite sources for every important claim using the provided citation IDs.

User:
## Repository
{metadata}

## Detected Stack
{stack}

## File Summaries
{summaries with citation IDs}

## Instructions
Produce a rubric assessment. Rules:
- If Variability <= 2, default to NOT_AGENTIC unless justified
- Every claim needs at least one citation
- Include concrete KPIs and pilot plan
```

**Acceptance criteria:**
- [ ] File summaries generated
- [ ] Rubric output matches schema exactly
- [ ] Citations reference valid chunk IDs
- [ ] Variability rule enforced

---

## Phase 6: Database & API

**Goal:** Save/load assessments, full analyze endpoint

**Commands for Claude Code:**
```
Create app/api/analyze/route.ts:
- POST handler
- Orchestrates: parse URL -> fetch tree -> select files -> fetch content -> LLM -> save
- Returns {assessmentId, rubricJson}

Create app/api/assessments/route.ts:
- GET ?repoUrl= returns list for that repo
- GET ?all returns recent 20

Create app/api/assessments/[id]/route.ts:
- GET returns single assessment
```

**Acceptance criteria:**
- [ ] POST /api/analyze returns valid rubric
- [ ] Assessment saved to database
- [ ] Can retrieve by ID
- [ ] Can list by repo URL

---

## Phase 7: UI - Input & File Picker

**Goal:** Home page input, repo page with file picker

**Commands for Claude Code:**
```
Update app/page.tsx:
- URL input field
- Analyze button
- Recent assessments list (optional)

Create app/repo/page.tsx:
- Load tree via API
- File picker with checkboxes
- Pre-check heuristic selections
- "Analyze" button
- Loading states
```

**Acceptance criteria:**
- [ ] Can paste URL and proceed
- [ ] File tree renders with checkboxes
- [ ] Default selections pre-checked
- [ ] Can add/remove files manually
- [ ] Analysis triggers and redirects to report

---

## Phase 8: UI - Report View

**Goal:** Display full rubric assessment

**Commands for Claude Code:**
```
Create app/report/[id]/page.tsx:
- Load assessment by ID
- Render all rubric sections

Components needed:
- ClassificationBadge (A/B/C/D with colors)
- ScoreCard (label + 1-5 score)
- TaskTable (with recommendation column)
- GuardrailsChecklist
- PilotPlan
- CitationLink (renders GitHub URL)
```

**Acceptance criteria:**
- [ ] Classification displayed prominently
- [ ] All 5+ scores visible
- [ ] Task table shows all tasks
- [ ] Citations are clickable links to GitHub
- [ ] Guardrails and pilot plan readable

---

## Phase 9: Compare View

**Goal:** Compare two assessments for same repo

**Commands for Claude Code:**
```
Create app/compare/page.tsx:
- Query params: ?a={id}&b={id}
- Load both assessments
- Show:
  - Classification change (if any)
  - Score deltas
  - New/removed tasks
  - Changed recommendations
```

**Acceptance criteria:**
- [ ] Side-by-side or diff view works
- [ ] Score changes highlighted
- [ ] Classification changes obvious
- [ ] Links back to full reports

---

## Phase 10: Polish & Edge Cases

**Goal:** Handle errors gracefully, improve UX

**Tasks:**
- [ ] Loading states for all async operations
- [ ] Error boundaries with retry
- [ ] Toast notifications for success/failure
- [ ] Mobile responsive
- [ ] Rate limit handling (show retry countdown)
- [ ] Private repo messaging (suggest adding token)

---

## Session Template

Copy this for each Claude Code session:

```markdown
## Session: Phase N - [Name]
**Date:** YYYY-MM-DD
**Goal:** [one line]

### Inputs
- Previous phase completed: YES/NO
- Files from last session: [list]

### Commands Given
[paste exact prompts]

### Files Created/Modified
- [file]: [brief description]

### Issues Encountered
- [issue]: [resolution]

### Acceptance Criteria Status
- [ ] Criterion 1
- [ ] Criterion 2

### Next Session
- Start Phase N+1
- Address: [any carryover items]
```
