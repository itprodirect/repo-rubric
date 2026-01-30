# Codex Synthesis (4-run consensus)

## What Codex consistently flagged

Across 4 independent reviews, the same issues repeated:

## P0: Setup + Correctness Blockers (Fix First)

### 1. Prisma Schema/Config Inconsistencies

**Issue:** Missing or mismatched `url = env("DATABASE_URL")` in datasource block.

**Fix:**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}
```

**Also ensure:**
- `.env.example` has: `DATABASE_URL="file:./dev.db"`
- `.env` (local) matches
- `lib/prisma.ts` does NOT override the URL unless intentional

### 2. Next.js App Router Route Handler Params Typing

**Issue:** Route handlers may treat `params` as a Promise (it's a plain object in App Router).

**Wrong:**
```typescript
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }  // WRONG
) {
  const { id } = await params;
}
```

**Correct:**
```typescript
export async function GET(
  request: Request,
  { params }: { params: { id: string } }  // CORRECT - plain object
) {
  const { id } = params;
}
```

### 3. GitHub URL Validation Too Permissive

**Issue:** `hostname.includes("github.com")` accepts spoofed domains.

**Wrong:**
```typescript
if (url.hostname.includes("github.com")) { ... }  // Accepts fakegithub.com
```

**Correct:**
```typescript
const ALLOWED_HOSTS = ["github.com", "www.github.com"];
if (!ALLOWED_HOSTS.includes(url.hostname)) {
  throw new Error("Invalid GitHub URL");
}
```

### 4. GitHub Tree Truncation Not Surfaced

**Issue:** GitHub's tree API can return `truncated: true` for large repos.

**Fix:** Modify tree fetch to return and propagate the flag:
```typescript
interface TreeResult {
  tree: TreeNode[];
  truncated: boolean;
}

async function getTree(owner: string, repo: string, sha: string): Promise<TreeResult> {
  const res = await fetch(`...?recursive=1`);
  const data = await res.json();
  return {
    tree: data.tree,
    truncated: data.truncated ?? false
  };
}
```

Surface warning in UI when `truncated: true`.

### 5. Demo Polish Gap

**Issue:** Layout metadata still defaults to Create Next App.

**Fix:** Update `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  title: "RepoRubric",
  description: "Agentic Workflow Assessment for GitHub Repositories",
};
```

---

## P1: MVP Unlock (Build Immediately After P0)

Implement end-to-end analysis loop:

```
Repo URL
  → parse owner/name
  → fetch repo metadata + default branch + HEAD sha
  → fetch tree (recursive)
  → file selection heuristics (bounded)
  → fetch file contents
  → chunk (size limits)
  → LLM call to generate rubric JSON
  → validate JSON against schema
  → persist assessment keyed by commit sha
  → render report page with citations
```

---

## Decisions (to keep velocity high)

| Decision | Rationale |
|----------|-----------|
| Web-only (GitHub REST API, no cloning) | Simpler, works in serverless |
| Public repos work with no token | Lower friction for testing |
| Optional `GITHUB_TOKEN` for rate limits | 60/hr → 5000/hr |
| Fail-fast JSON validation | Invalid model output never reaches UI |
| Ship Report View before Compare View | Core value first |
| Add progress/status UI (even basic) | Prevents "is it stuck?" abandonment |

---

## Definition of Done (for MVP Loop)

- [ ] Pasting a public GitHub repo URL yields a saved assessment
- [ ] Assessment has a shareable report route (`/report/[id]`)
- [ ] Report shows:
  - Summary scores
  - Prioritized tasks/issues
  - Citations pointing to file paths (and line ranges where feasible)
- [ ] Errors are user-visible:
  - Rate limit (with retry countdown)
  - 404 (repo not found)
  - Private repo (suggest token)
  - Truncated tree (warning + suggestion)

---

## Acceptance Criteria

### P0 Complete When:

```bash
# Fresh clone test
git clone https://github.com/itprodirect/repo-rubric
cd repo-rubric
cp .env.example .env
# Add OPENAI_API_KEY to .env
npm install
npx prisma generate  # Should succeed
npx prisma db push   # Should succeed
npm run dev          # Should start without errors
```

- Tree endpoint returns structured error JSON
- `truncated` flag visible when applicable
- Layout shows "RepoRubric" not "Create Next App"

### P1 Complete When:

- Paste URL → get saved assessment → land on report page
- Report is schema-validated
- Citations display and link correctly
- Rate-limit errors are visible and actionable
