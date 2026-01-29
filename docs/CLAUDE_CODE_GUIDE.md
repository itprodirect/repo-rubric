# Claude Code Guide

Instructions for running effective Claude Code sessions to build RepoRubric.

## Before Each Session

### 1. Check Current State

```bash
# What phase are we on?
cat docs/SESSION_LOG.md | tail -50

# What files exist?
ls -la app/ lib/ 2>/dev/null || echo "No app yet"

# Does the app run?
npm run dev 2>&1 | head -20
```

### 2. Set Context

Tell Claude Code:
1. Project name: RepoRubric
2. Current phase (from IMPLEMENTATION_PLAN.md)
3. What was done in last session
4. What needs to happen this session

### 3. Share These Files

Always share at session start:
- `docs/IMPLEMENTATION_PLAN.md` (for build order)
- `docs/ARCHITECTURE.md` (for system design)
- `schemas/reporubric.schema.json` (for output format)

For specific phases, also share:
- Phase 3+: `docs/FILE_HEURISTICS.md`
- Phase 5+: `docs/RUBRIC_SPEC.md`

## Session Prompts by Phase

### Phase 1: Scaffold

```
Create a Next.js 14 project with App Router, TypeScript, and Tailwind.

Requirements:
- Use App Router (app/ directory at root, not src/app/)
- Add Prisma with SQLite
- Create RepoAssessment model per docs/ARCHITECTURE.md
- Include .env.example

After creation:
- Run `npx prisma generate`
- Run `npx prisma db push`
- Verify `npm run dev` works
```

### Phase 2: GitHub Integration

```
Create lib/github.ts with these functions:

1. parseGitHubUrl(url: string): { owner: string; repo: string }
   - Handle formats: github.com/owner/repo, github.com/owner/repo.git, etc.
   - Throw descriptive error for invalid URLs

2. getRepoMetadata(owner: string, repo: string): Promise<{defaultBranch: string, description?: string}>
   - Use GitHub REST API: GET /repos/{owner}/{repo}
   - Use GITHUB_TOKEN from env if available

3. getLatestCommit(owner: string, repo: string, branch: string): Promise<string>
   - Returns commit SHA

4. getTree(owner: string, repo: string, sha: string): Promise<TreeNode[]>
   - Use recursive=1 parameter
   - Return array of {path, type, size, sha}

Then create app/api/repo/[owner]/[name]/tree/route.ts as a GET endpoint.
```

### Phase 3: Heuristics

```
Create lib/heuristics.ts implementing file selection logic.

See docs/FILE_HEURISTICS.md for complete rules.

Export:
- selectFiles(tree: TreeNode[], maxFiles?: number): SelectionResult
- detectStack(tree: TreeNode[], packageJson?: any): string[]

Key rules:
- Tier 0 always included (README, CI, Docker)
- Tier 1 based on detected stack
- Sort by weight when caps hit
- Return warnings when truncated
```

### Phase 4: Content Fetching

```
Add to lib/github.ts:
- getFileContent(owner, repo, path, sha): Promise<{content: string, size: number}>

Create lib/chunker.ts:
- chunkFile(content, path, sha, maxLines=300): Chunk[]
- generateCitationId(path, sha, lineStart, lineEnd): string

Create lib/fetcher.ts:
- fetchAllFiles(owner, repo, sha, paths, maxChars=250000): Promise<{chunks: Chunk[], warnings: string[]}>

Each chunk must have: path, sha, lineStart, lineEnd, content, citationId
```

### Phase 5: OpenAI Pipeline

```
Create lib/llm.ts for the two-step LLM pipeline.

Step A - File Summaries:
- Input: single chunk
- Output: {purpose, entrypoints, dataFlow, externalDeps, riskNotes, citationId}
- Keep summaries concise (2-3 sentences each field)

Step B - Rubric Assessment:
- Input: repo metadata, detected stack, all file summaries
- Output: MUST match schemas/reporubric.schema.json exactly
- Use OpenAI response_format with json_schema

Key requirements:
- Use OpenAI API (not chat completions - use responses API with structured output)
- Validate output against schema before returning
- If Variability <= 2, default classification to A_NOT_AGENTIC
- Every claim needs citation IDs from summaries

Create lib/schema.ts:
- validateRubric(json): {valid: boolean, errors?: string[]}
- Load schema from schemas/reporubric.schema.json
```

### Phase 6: API & Database

```
Create these API routes:

POST /api/analyze (app/api/analyze/route.ts)
- Body: { repoUrl: string, extraPaths?: string[] }
- Orchestrate full pipeline
- Save to database
- Return { assessmentId, rubricJson }

GET /api/assessments (app/api/assessments/route.ts)
- Query param: repoUrl (optional)
- Return list of assessments

GET /api/assessments/[id] (app/api/assessments/[id]/route.ts)
- Return single assessment with full rubricJson

Use Prisma for all database operations.
```

### Phase 7: UI Pages

```
Create the main UI pages:

app/page.tsx (Home)
- URL input field
- "Analyze" button
- Shows recent assessments (optional)
- On submit: fetch tree, navigate to /repo page

app/repo/page.tsx (File Picker)
- Query param: url
- Fetch tree and apply heuristics
- Show file tree with checkboxes
- Pre-check selected files
- "Run Analysis" button
- Loading states

Use Tailwind for styling. Keep it minimal but usable.
```

### Phase 8: Report View

```
Create app/report/[id]/page.tsx

Load assessment by ID and render:
1. Classification badge (A/B/C/D with distinct colors)
2. Score cards (5 scores + confidence)
3. Outcomes section
4. Task table with columns: name, actor, recommendation, rationale
5. Execution modes
6. Guardrails (strategic, operational, implementation)
7. Pilot plan
8. Risks section
9. Citations list (each links to GitHub)

Build GitHub citation URL:
https://github.com/{owner}/{repo}/blob/{sha}/{path}#L{lineStart}-L{lineEnd}

Create reusable components in components/ directory.
```

## Key Technical Requirements

### OpenAI Structured Output

```typescript
const response = await openai.responses.create({
  model: "gpt-4o",
  input: [{ role: "user", content: prompt }],
  text: {
    format: {
      type: "json_schema",
      name: "rubric_assessment",
      schema: rubricSchema,
      strict: true
    }
  }
});
```

### Prisma Usage

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Save
const assessment = await prisma.repoAssessment.create({
  data: {
    repoUrl,
    owner,
    name,
    defaultBranch,
    commitSha,
    selectedPathsJson: JSON.stringify(paths),
    fileDigestsJson: JSON.stringify(digests),
    rubricJson: JSON.stringify(rubric),
  }
});

// Load
const assessment = await prisma.repoAssessment.findUnique({
  where: { id }
});
```

### Error Handling Pattern

```typescript
// In API routes
export async function POST(request: Request) {
  try {
    // ... logic
    return Response.json({ data });
  } catch (error) {
    console.error('API error:', error);
    
    if (error instanceof ValidationError) {
      return Response.json({ error: error.message }, { status: 400 });
    }
    
    if (error instanceof GitHubRateLimitError) {
      return Response.json({ 
        error: 'Rate limited',
        retryAfter: error.retryAfter 
      }, { status: 429 });
    }
    
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
```

## After Each Session

### 1. Update SESSION_LOG.md

```markdown
## Session: Phase N - [Name]
**Date:** 2025-01-29
**Duration:** ~X minutes

### Completed
- Created X files
- Implemented Y feature

### Files Modified
- `path/to/file.ts`: description

### Issues
- Issue description: how resolved

### Next Session
- Continue to Phase N+1
- Fix: [any carryover]
```

### 2. Verify State

```bash
# Check app runs
npm run dev

# Check types
npm run build 2>&1 | head -50

# Check database
npx prisma studio
```

### 3. Commit Progress

```bash
git add .
git commit -m "Phase N: brief description"
```

## Common Issues & Fixes

### "Module not found"
```bash
npm install
npx prisma generate
```

### "Type error in Prisma"
```bash
rm -rf node_modules/.prisma
npx prisma generate
```

### "OpenAI JSON invalid"
- Check schema matches exactly
- Ensure strict: true in response_format
- Log raw output for debugging

### "GitHub rate limit"
- Add GITHUB_TOKEN to .env
- Check: `curl -H "Authorization: token $GITHUB_TOKEN" https://api.github.com/rate_limit`
