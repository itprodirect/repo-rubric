# Implementation Plan (Codex-Informed)

Prioritized build order based on 4-run Codex analysis. Focus: ship the end-to-end loop first.

**Status: P0 and P1 COMPLETE - MVP is working!**

---

## Pre-flight Checklist

Before any session:
```bash
cd repo-rubric
git status              # Clean working tree?
npm run dev             # Does it start?
npx prisma generate     # Does Prisma work?
```

---

## P0: Fix Blockers (Session 3) - DONE

**Status:** Complete

These issues have been fixed:

### 1. Prisma Schema Fix

**File:** `prisma/schema.prisma`

Ensure datasource has URL from env:
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model RepoAssessment {
  id                String   @id @default(uuid())
  repoUrl           String
  owner             String
  name              String
  defaultBranch     String
  commitSha         String
  selectedPathsJson String
  fileDigestsJson   String
  rubricJson        String
  createdAt         DateTime @default(now())

  @@index([owner, name])
  @@index([commitSha])
}
```

**File:** `.env.example`
```
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY=sk-...
GITHUB_TOKEN=
```

### 2. Route Params Typing

**Check all files matching:** `app/api/**/route.ts`

Wrong:
```typescript
{ params }: { params: Promise<{ id: string }> }
```

Correct:
```typescript
{ params }: { params: { id: string } }
```

### 3. GitHub URL Validation

**File:** `lib/github.ts`

```typescript
const ALLOWED_HOSTS = ["github.com", "www.github.com"];

export function parseGitHubUrl(urlString: string): { owner: string; repo: string } {
  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw new Error("Invalid URL format");
  }
  
  if (!ALLOWED_HOSTS.includes(url.hostname)) {
    throw new Error(`Must be a GitHub URL. Got: ${url.hostname}`);
  }
  
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("Invalid GitHub URL. Expected: github.com/owner/repo");
  }
  
  return {
    owner: parts[0],
    repo: parts[1].replace(/\.git$/, "")
  };
}
```

### 4. Tree Truncation

**File:** `lib/github.ts`

```typescript
export interface TreeResult {
  tree: TreeNode[];
  sha: string;
  truncated: boolean;
}

export async function getTree(
  owner: string,
  repo: string,
  sha: string
): Promise<TreeResult> {
  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`;
  const res = await fetch(url, { headers: getHeaders() });
  
  if (!res.ok) {
    const text = await res.text();
    throw new GitHubError(res.status, text);
  }
  
  const data = await res.json();
  return {
    tree: data.tree ?? [],
    sha: data.sha,
    truncated: data.truncated ?? false
  };
}
```

### 5. Layout Metadata

**File:** `app/layout.tsx`

```typescript
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "RepoRubric",
  description: "Agentic Workflow Assessment for GitHub Repositories",
};
```

### P0 Verification

```bash
# All must pass
npm install
npx prisma generate
npx prisma db push
npm run build
npm run dev

# Manual check
# - Browser title shows "RepoRubric"
# - Tree endpoint works for public repo
```

**Commit:** `fix(p0): prisma config, route typing, github validation, truncation`

---

## P1: MVP Loop (Sessions 4-6) - DONE

**Status:** Complete

### Session 4: Analysis Pipeline - DONE

**Goal:** `/api/analyze` returns valid rubric JSON

**Create files:**

1. `lib/heuristics.ts` - File selection
2. `lib/chunker.ts` - Content chunking  
3. `lib/llm.ts` - OpenAI calls
4. `lib/validate.ts` - Schema validation
5. `app/api/analyze/route.ts` - Main endpoint

**Acceptance:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/sindresorhus/is"}'
  
# Returns: { assessmentId: "...", ... }
```

### Session 5: UI Integration - DONE

**Goal:** Home page → Analysis → Report page

**Modify files:**

1. `app/page.tsx` - Add form submission, progress states
2. `app/report/[id]/page.tsx` - Create report view
3. `components/ScoreCard.tsx` - Reusable score display
4. `components/TaskTable.tsx` - Task breakdown
5. `components/CitationLink.tsx` - GitHub links

**Acceptance:**
- Paste URL → see progress → land on report
- Report shows classification, scores, tasks
- Citations link to correct GitHub files

### Session 6: Polish MVP - DONE

**Goal:** Error handling, history

**Completed:**
- [x] Error boundaries (class + functional)
- [x] Rate limit display with countdown
- [x] 404/private repo messaging
- [x] `/api/assessments` endpoint
- [x] Recent assessments on home
- [x] Loading skeletons
- [x] Loading states for all pages

**Acceptance:** All passed
- [x] All error states visible
- [x] Can view past assessments
- [x] Refresh report page → still works

---

## P2: Enhancements (After MVP)

Only after P1 is complete and working:

### Phase 7: File Picker
- Tree view with checkboxes
- Pre-select heuristic files
- Manual add/remove

### Phase 8: Compare View
- Side-by-side assessments
- Score deltas highlighted
- Classification changes

### Phase 9: Advanced Features
- Re-analyze at different commit
- Export report as PDF
- Shareable links

---

## Quick Reference

### File Structure (Target)

```
repo-rubric/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # Home with URL input
│   ├── report/
│   │   └── [id]/
│   │       └── page.tsx      # Report view
│   └── api/
│       ├── analyze/
│       │   └── route.ts      # POST: run analysis
│       ├── assessments/
│       │   ├── route.ts      # GET: list
│       │   └── [id]/
│       │       └── route.ts  # GET: single
│       └── repo/
│           └── [owner]/
│               └── [name]/
│                   └── tree/
│                       └── route.ts
├── components/
│   ├── ScoreCard.tsx
│   ├── TaskTable.tsx
│   └── CitationLink.tsx
├── lib/
│   ├── prisma.ts
│   ├── github.ts
│   ├── heuristics.ts
│   ├── chunker.ts
│   ├── llm.ts
│   └── validate.ts
├── prisma/
│   └── schema.prisma
├── schemas/
│   └── reporubric.schema.json
└── docs/
    ├── CODEX_SYNTHESIS.md
    └── SESSION_LOG.md
```

### Key Commands

```bash
# Development
npm run dev

# Database
npx prisma generate
npx prisma db push
npx prisma studio    # GUI for database

# Build check
npm run build
npm run lint

# Test specific repo
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/owner/repo"}'
```

### Environment Variables

```env
# Required
OPENAI_API_KEY=sk-...
DATABASE_URL=file:./dev.db

# Optional (increases GitHub rate limit 60 → 5000/hr)
GITHUB_TOKEN=ghp_...

# Optional (defaults shown)
OPENAI_MODEL=gpt-4o
MAX_FILES=25
MAX_TOTAL_CHARS=250000
```
