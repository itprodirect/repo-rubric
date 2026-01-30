# Claude Code Execution Prompt

Copy this entire prompt into Claude Code to execute the fastest path to MVP.

---

You are Claude Code working on https://github.com/itprodirect/repo-rubric

**Goal:** Fastest path to a credible MVP that produces a real rubric report from a public GitHub repo URL.

## Constraints

- Web-only: use GitHub REST API; do NOT git clone repos
- Keep scope tight: Report View first; Compare View later
- Small commits with clear messages
- After each commit: run `npm run lint` and `npm run build` if available

---

## P0: Fix Blockers (Do These FIRST)

### 1. Prisma Alignment

Ensure `prisma/schema.prisma` has:

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

Standardize `DATABASE_URL` defaults:
- `.env.example`: `DATABASE_URL="file:./dev.db"`
- Remove any hardcoded paths in `lib/prisma.ts`

### 2. Next.js Route Handler Params Typing

Fix any API route signatures that treat `params` like a Promise.

**Pattern to use:**
```typescript
// app/api/assessments/[id]/route.ts
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;  // Direct access, no await
  // ...
}
```

### 3. Tighten GitHub URL Validation

In `lib/github.ts`, replace permissive hostname check:

```typescript
const ALLOWED_HOSTS = ["github.com", "www.github.com"];

export function parseGitHubUrl(urlString: string): { owner: string; repo: string } {
  const url = new URL(urlString);
  
  if (!ALLOWED_HOSTS.includes(url.hostname)) {
    throw new Error(`Invalid GitHub URL. Must be from github.com, got: ${url.hostname}`);
  }
  
  const [, owner, repo] = url.pathname.split("/");
  if (!owner || !repo) {
    throw new Error("Invalid GitHub URL format. Expected: github.com/owner/repo");
  }
  
  return { owner, repo: repo.replace(/\.git$/, "") };
}
```

### 4. Surface GitHub Tree Truncation

Modify `lib/github.ts` tree fetcher:

```typescript
export interface TreeResult {
  tree: TreeNode[];
  sha: string;
  truncated: boolean;
}

export async function getTree(owner: string, repo: string, sha: string): Promise<TreeResult> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;
  const res = await fetch(url, { headers: getHeaders() });
  
  if (!res.ok) {
    throw new GitHubError(res.status, await res.text());
  }
  
  const data = await res.json();
  return {
    tree: data.tree,
    sha: data.sha,
    truncated: data.truncated ?? false
  };
}
```

Update API response to include `truncated` flag.

### 5. Demo Polish

Update `app/layout.tsx` metadata:

```typescript
export const metadata: Metadata = {
  title: "RepoRubric",
  description: "Agentic Workflow Assessment for GitHub Repositories",
};
```

---

## P0 Acceptance

Run these commands on a fresh clone:

```bash
npm install
npx prisma generate  # Must succeed
npx prisma db push   # Must succeed  
npm run dev          # Must start without errors
npm run build        # Must complete
```

Verify:
- Browser shows "RepoRubric" in title
- API routes return structured error JSON

**Commit:** `chore(p0): fix prisma config, route typing, github validation, truncation flag`

---

## P1: Build the MVP End-to-End Loop

### 6. Implement POST `/api/analyze`

**Input:**
```typescript
{
  repoUrl: string;
  options?: {
    mode?: "auto" | "manual";
    include?: string[];
  }
}
```

**Server steps:**
1. Parse repoUrl → owner/name
2. Fetch repo metadata + default branch + HEAD sha
3. Fetch tree (recursive)
4. Apply file selection heuristics (see `docs/FILE_HEURISTICS.md`)
5. Fetch selected file contents
6. Chunk contents (cap at 250k chars total)
7. Call LLM to produce rubric JSON
8. Validate output against `schemas/reporubric.schema.json` using AJV or Zod
9. On invalid → return error with model output for debugging (dev only)
10. Persist assessment keyed by repo + commit sha (dedupe)

**Return:**
```typescript
{
  assessmentId: string;
  repo: { owner: string; name: string };
  sha: string;
  truncated: boolean;
  classification: string;
}
```

### 7. Wire Home Page to `/api/analyze`

Update `app/page.tsx`:
- Replace console.log with real POST to `/api/analyze`
- Show progress states:
  - "Fetching repository..."
  - "Selecting files..."
  - "Analyzing with AI..."
  - "Saving assessment..."
- Show user-friendly errors:
  - Rate limit: show retry countdown
  - 404: "Repository not found"
  - Private repo: "This repo is private. Add a GITHUB_TOKEN to analyze."
  - Truncated: "Large repository. Some files may be excluded."
- On success: redirect to `/report/[assessmentId]`

### 8. Report Page `/report/[id]`

Create `app/report/[id]/page.tsx`:
- Load assessment from DB by ID
- Render:
  - Classification badge (A/B/C/D with colors)
  - Score cards (Variability, Strategic Importance, etc.)
  - Tasks table (name, current actor, recommendation, rationale)
  - Citations list with GitHub links

**Citation URL format:**
```
https://github.com/{owner}/{repo}/blob/{sha}/{path}#L{lineStart}-L{lineEnd}
```

### 9. Minimal Assessment History

Create `app/api/assessments/route.ts`:
- GET with optional `?repo=owner/name` filter
- Returns last 20 assessments, newest first

Update home page to show recent assessments (optional but helpful).

---

## P1 Acceptance

Test flow:
1. Paste `https://github.com/vercel/next.js` (or any public repo)
2. See progress states
3. Land on report page with saved assessment
4. Report shows scores, tasks, citations
5. Citations link to correct GitHub locations

Test errors:
1. Paste invalid URL → see error message
2. Paste private repo (without token) → see token suggestion
3. Wait for rate limit → see countdown

**Commits:**
- `feat(p1): /api/analyze pipeline + validation + persistence`
- `feat(ui): landing page progress + errors`
- `feat(report): report page rendering + citations`
- `feat(api): assessment history endpoint`

---

## Implementation Notes

### Module Structure

```
lib/
  github.ts      # GitHub API client
  heuristics.ts  # File selection logic
  chunker.ts     # Content chunking with line tracking
  llm.ts         # OpenAI pipeline
  validate.ts    # JSON schema validation
  prisma.ts      # Database client singleton
```

### LLM Call Pattern

```typescript
import OpenAI from "openai";

const openai = new OpenAI();

const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ],
  response_format: {
    type: "json_schema",
    json_schema: {
      name: "rubric_assessment",
      schema: rubricSchema,
      strict: true
    }
  }
});
```

### Error Shape

All API routes should return consistent error shapes:

```typescript
// Success
{ success: true, data: { ... } }

// Error
{ 
  success: false, 
  error: {
    code: "RATE_LIMITED" | "NOT_FOUND" | "PRIVATE_REPO" | "VALIDATION_FAILED" | "INTERNAL",
    message: "Human readable message",
    retryAfter?: number  // For rate limits
  }
}
```

---

## After P1 Complete

The product exists. Future phases:
- Phase 3: File picker UI (manual selection)
- Phase 4: Compare view (diff two assessments)
- Phase 5: History browsing
- Phase 6: Polish and edge cases
