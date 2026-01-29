# Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Next.js App                             │
├─────────────────────────────────────────────────────────────────┤
│  UI Layer                                                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Home     │  │ Repo     │  │ Report   │  │ Compare  │       │
│  │ (input)  │→ │ (picker) │→ │ (view)   │  │ (diff)   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
├─────────────────────────────────────────────────────────────────┤
│  API Layer                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ POST /api/analyze                                         │  │
│  │ GET  /api/assessments                                     │  │
│  │ GET  /api/assessments/[id]                                │  │
│  │ GET  /api/repo/[owner]/[name]/tree                        │  │
│  └──────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│  Core Logic                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │ github.ts   │  │ heuristics  │  │ llm.ts      │            │
│  │ (API calls) │→ │ (selection) │→ │ (analysis)  │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
├─────────────────────────────────────────────────────────────────┤
│  Data Layer                                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Prisma + SQLite (RepoAssessment)                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
       ┌─────────────┐                 ┌─────────────┐
       │ GitHub API  │                 │ OpenAI API  │
       └─────────────┘                 └─────────────┘
```

## Data Flow

### 1. Analysis Request

```
User pastes URL
       │
       ▼
Parse owner/repo from URL
       │
       ▼
GitHub API: Get repo metadata + default branch
       │
       ▼
GitHub API: Get latest commit SHA
       │
       ▼
GitHub API: Get recursive tree
       │
       ▼
Apply file selection heuristics
       │
       ▼
User reviews/modifies file selection (optional)
       │
       ▼
GitHub API: Fetch selected file contents
       │
       ▼
Chunk large files (track line ranges for citations)
       │
       ▼
OpenAI: Generate file summaries (Step A)
       │
       ▼
OpenAI: Run rubric assessment (Step B)
       │
       ▼
Validate output against JSON schema
       │
       ▼
Save to database (keyed by repo + commit SHA)
       │
       ▼
Return assessment ID + rubric JSON
```

### 2. Report Viewing

```
User navigates to /report/[id]
       │
       ▼
Load assessment from database
       │
       ▼
Parse rubricJson
       │
       ▼
Render sections:
  - Classification badge
  - Score cards
  - Task breakdown table
  - Execution modes
  - Guardrails checklist
  - Pilot plan
  - Risks
  - Citations (linked to GitHub)
```

## Data Model

### RepoAssessment

```prisma
model RepoAssessment {
  id               String   @id @default(uuid())
  repoUrl          String
  owner            String
  name             String
  defaultBranch    String
  commitSha        String
  selectedPathsJson String  // JSON array of paths
  fileDigestsJson   String  // JSON object: path -> {sha, size}
  rubricJson        String  // Full rubric output (validated)
  createdAt         DateTime @default(now())

  @@index([owner, name])
  @@index([commitSha])
}
```

## API Contracts

### POST /api/analyze

**Request:**
```json
{
  "repoUrl": "https://github.com/owner/repo",
  "extraPaths": ["/path/to/include"]  // optional
}
```

**Response:**
```json
{
  "assessmentId": "uuid",
  "rubricJson": { ... }  // Full rubric schema
}
```

### GET /api/assessments?repoUrl=...

**Response:**
```json
{
  "assessments": [
    {
      "id": "uuid",
      "commitSha": "abc123",
      "createdAt": "2025-01-29T...",
      "classification": "B_LLM_ASSIST"
    }
  ]
}
```

### GET /api/repo/[owner]/[name]/tree?sha=...

**Response:**
```json
{
  "tree": [
    { "path": "README.md", "type": "blob", "size": 1234 },
    { "path": "src", "type": "tree" }
  ],
  "defaultBranch": "main",
  "commitSha": "abc123"
}
```

## Citation Format

Every citation in the rubric includes:
- `id`: Unique identifier (e.g., "CIT-abc123")
- `path`: File path in repo
- `commit_sha`: Exact commit analyzed
- `line_start`: Starting line number
- `line_end`: Ending line number
- `url`: Direct GitHub link with line anchors

Example GitHub URL:
```
https://github.com/owner/repo/blob/abc123/src/index.ts#L10-L25
```

## Constraints & Limits

| Limit | Default | Configurable |
|-------|---------|--------------|
| Max files per analysis | 25 | Yes |
| Max total chars | 250,000 | Yes |
| Max single file chars | 40,000 | Yes |
| Chunk size (lines) | 200-400 | No |

When limits are exceeded:
1. Lower-weight files are dropped first
2. User receives a warning
3. User can manually add specific files

## Caching Strategy

**In-memory (per request):**
- File content cache (avoid re-fetching same files)
- Tree cache by commit SHA

**Database:**
- Assessments are saved per repo + commit SHA
- Re-analysis at same commit returns existing assessment (option to force re-run)

## Error Handling

| Error | Response |
|-------|----------|
| Invalid GitHub URL | 400 + message |
| GitHub rate limit | 429 + retry-after |
| Private repo (no token) | 403 + message |
| OpenAI JSON validation failed | 500 + validation errors (dev mode: include model output) |
| File fetch failed | Skip file, add to warnings |
