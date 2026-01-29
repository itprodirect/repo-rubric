# Session Log

Track progress across Claude Code sessions.

---

## Current Status

**Phase:** 2 (Complete)
**Last Session:** 2026-01-29
**Next Action:** Start Phase 3 - File Selection Heuristics

---

## Sessions

### Session 0: Documentation Setup
**Date:** 2025-01-29
**Duration:** Initial setup

#### Completed
- Created project documentation structure
- Wrote all specification documents
- Created JSON schema

#### Files Created
- `README.md`: Project overview and setup
- `docs/ARCHITECTURE.md`: System design
- `docs/IMPLEMENTATION_PLAN.md`: 10-phase build guide
- `docs/RUBRIC_SPEC.md`: Assessment criteria
- `docs/FILE_HEURISTICS.md`: File selection rules
- `docs/CLAUDE_CODE_GUIDE.md`: Session instructions
- `docs/SESSION_LOG.md`: This file
- `schemas/reporubric.schema.json`: Output schema
- `.env.example`: Environment template
- `.gitignore`: Git ignore patterns

#### Next Session
- Start Phase 1: Create Next.js scaffold with Prisma

---

### Session 1: Phase 1 & 2 - Scaffold + GitHub Integration
**Date:** 2026-01-29
**Duration:** ~1 session

#### Goal
Create Next.js 14 project with Prisma SQLite + GitHub API integration

#### Phase 1 Completed
- [x] Next.js 14 project created with App Router
- [x] TypeScript enabled
- [x] Tailwind CSS enabled
- [x] ESLint enabled
- [x] Prisma configured with SQLite
- [x] RepoAssessment model created
- [x] Prisma client generated
- [x] Database pushed (dev.db created)
- [x] Home page with URL input form
- [x] `npm run dev` works
- [x] `npm run lint` passes

#### Phase 2 Completed
- [x] `parseGitHubUrl()` - handles various URL formats
- [x] `getRepoMetadata()` - fetches default branch & description
- [x] `getLatestCommit()` - gets HEAD commit SHA
- [x] `getTree()` - recursive file tree
- [x] `getFileContent()` - fetch file contents (ready for Phase 4)
- [x] `GitHubError` class with rate limit handling
- [x] API route: `GET /api/repo/[owner]/[name]/tree`

#### Files Created/Modified

**Phase 1:**
- `package.json` - Project dependencies
- `tsconfig.json` - TypeScript configuration
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind configuration
- `postcss.config.mjs` - PostCSS configuration
- `.eslintrc.json` - ESLint configuration
- `next-env.d.ts` - Next.js TypeScript declarations
- `prisma/schema.prisma` - Database schema with RepoAssessment model
- `prisma.config.ts` - Prisma 7.x configuration
- `prisma/dev.db` - SQLite database
- `app/layout.tsx` - Root layout
- `app/page.tsx` - Home page with URL input form
- `app/globals.css` - Global styles with Tailwind
- `app/generated/prisma/` - Generated Prisma client
- `lib/prisma.ts` - Prisma singleton with libsql adapter
- `public/next.svg` - Next.js logo
- `public/vercel.svg` - Vercel logo

**Phase 2:**
- `lib/github.ts` - GitHub API utilities
- `app/api/repo/[owner]/[name]/tree/route.ts` - Tree API endpoint

#### Issues Encountered
1. **npx/npm output not visible in Git Bash** - Resolved by using PowerShell for npm commands
2. **Prisma 7.x breaking changes** - Required `@prisma/adapter-libsql` for SQLite connections (new in Prisma 7.x)
3. **Prisma client import path** - Client generated to `app/generated/prisma/client` instead of `@prisma/client`

#### Dependencies Added
- `next@14.2.21`
- `react@^18`, `react-dom@^18`
- `prisma@^7.3.0`, `@prisma/client@^7.3.0`
- `@prisma/adapter-libsql`, `@libsql/client`
- `typescript@^5`
- `tailwindcss@^3.4.1`
- `eslint@^8`, `eslint-config-next@14.2.21`

#### Next Session
- Start Phase 3: File Selection Heuristics
- Create `lib/heuristics.ts` with:
  - `selectFiles(tree, maxFiles)` function
  - `detectStack(tree)` function
  - Tier-based file weighting (0-4)
  - Ignore patterns implementation

---

### Session 2: [Phase 3 - Heuristics]
**Date:** YYYY-MM-DD
**Duration:**

#### Goal
File selection logic

#### Planned Tasks
- [ ] Create `lib/heuristics.ts`
- [ ] Implement file tier weights (0-4)
- [ ] Implement ignore patterns (node_modules, dist, etc.)
- [ ] Implement stack detection (Next.js, Python, etc.)
- [ ] `selectFiles(tree, maxFiles=25)` returns selected files + detected stack
- [ ] Unit tests for heuristics

#### Acceptance Criteria
- [ ] README.md always included
- [ ] package.json included for JS projects
- [ ] node_modules ignored
- [ ] Returns detected stack array
- [ ] Respects maxFiles limit

---

## Milestones

| Milestone | Target | Actual |
|-----------|--------|--------|
| Scaffold working | Session 1 | Session 1 |
| GitHub API working | Session 2 | Session 1 |
| First LLM call | Session 5 | |
| Full analysis working | Session 6 | |
| UI complete | Session 8 | |
| MVP complete | Session 10 | |

---

## Known Issues Backlog

| Issue | Priority | Status | Resolution |
|-------|----------|--------|------------|
| Next.js security warning | Low | Open | Upgrade to patched version when available |
| ESLint deprecation warnings | Low | Open | Will auto-resolve with future updates |

---

## Notes

- Prisma 7.x requires driver adapters - using `@prisma/adapter-libsql` for SQLite
- npm/npx commands need to run via PowerShell on this Windows/Git Bash environment
- GitHub API rate limits: 60/hr unauthenticated, 5000/hr with token
