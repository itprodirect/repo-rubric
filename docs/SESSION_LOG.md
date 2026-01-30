# Session Log

Track progress across Claude Code sessions.

---

## Current Status

**Phase:** P0 (Blockers)
**Last Session:** Phase 2 - GitHub Integration (partial)
**Next Action:** Complete P0 blockers, then P1 MVP loop

---

## Priority Stack (Codex-informed)

### P0: Must Fix Before Continuing
- [ ] Prisma datasource url alignment
- [ ] Next.js route params typing
- [ ] GitHub URL validation (strict hosts)
- [ ] GitHub tree truncation flag
- [ ] Layout metadata (RepoRubric branding)

### P1: MVP End-to-End Loop
- [ ] POST /api/analyze (full pipeline)
- [ ] Home page → API integration
- [ ] Progress states in UI
- [ ] Error handling (rate limit, 404, private)
- [ ] Report page /report/[id]
- [ ] Assessment history endpoint

### P2: Polish (After MVP Works)
- [ ] File picker UI
- [ ] Compare view
- [ ] Mobile responsive
- [ ] Loading skeletons

---

## Sessions

### Session 0: Documentation Setup
**Date:** 2025-01-29
**Source:** Claude.ai

#### Completed
- Created project documentation structure
- Wrote all specification documents
- Created JSON schema

#### Files Created
- `README.md`, `QUICKSTART.md`
- `docs/ARCHITECTURE.md`
- `docs/IMPLEMENTATION_PLAN.md`
- `docs/RUBRIC_SPEC.md`
- `docs/FILE_HEURISTICS.md`
- `docs/CLAUDE_CODE_GUIDE.md`
- `docs/SESSION_LOG.md`
- `schemas/reporubric.schema.json`
- `.env.example`, `.gitignore`

---

### Session 1: Project Scaffold
**Date:** [Completed]
**Tool:** Claude Code

#### Completed
- [x] Next.js 14 project created
- [x] Prisma configured (needs P0 fix)
- [x] RepoAssessment model created
- [x] `npm run dev` works
- [x] `npx prisma db push` works

#### Issues to Address in P0
- Prisma schema may be missing `url = env("DATABASE_URL")`
- Layout metadata still shows Create Next App defaults

---

### Session 2: GitHub Integration
**Date:** [In Progress]
**Tool:** Claude Code

#### Completed
- [x] `lib/github.ts` created
- [x] parseGitHubUrl function
- [x] getRepoMetadata function
- [x] getLatestCommit function
- [x] getTree function
- [x] API route for tree

#### Issues to Address in P0
- GitHub URL validation too permissive
- Tree truncation not surfaced
- Route params typing may need fix

---

### Session 3: P0 Blockers
**Date:** YYYY-MM-DD
**Tool:** Claude Code

#### Goal
Fix all P0 blockers identified by Codex

#### Prompt to Use
See `CLAUDE_CODE_PROMPT.md` P0 section

#### Checklist
- [ ] Fix Prisma schema datasource
- [ ] Standardize DATABASE_URL in .env.example
- [ ] Fix route params typing (if needed)
- [ ] Tighten GitHub URL validation
- [ ] Add truncation flag to tree response
- [ ] Update layout metadata

#### Verification
```bash
# Fresh clone test
rm -rf node_modules .next
npm install
npx prisma generate
npx prisma db push
npm run build
npm run dev
```

---

### Session 4: P1 MVP Loop (Part 1)
**Date:** YYYY-MM-DD
**Tool:** Claude Code

#### Goal
Implement /api/analyze endpoint

#### Files to Create/Modify
- `lib/heuristics.ts` - file selection
- `lib/chunker.ts` - content chunking
- `lib/llm.ts` - OpenAI pipeline
- `lib/validate.ts` - JSON schema validation
- `app/api/analyze/route.ts` - main endpoint

#### Checklist
- [ ] File selection heuristics work
- [ ] Content fetching with chunking
- [ ] LLM call with strict JSON schema
- [ ] Schema validation (AJV or Zod)
- [ ] Assessment saved to database

---

### Session 5: P1 MVP Loop (Part 2)
**Date:** YYYY-MM-DD
**Tool:** Claude Code

#### Goal
Wire UI to API, build report page

#### Files to Create/Modify
- `app/page.tsx` - integrate with /api/analyze
- `app/report/[id]/page.tsx` - report view
- `components/` - reusable components

#### Checklist
- [ ] Home page calls /api/analyze
- [ ] Progress states visible
- [ ] Errors displayed properly
- [ ] Redirect to report on success
- [ ] Report page renders all sections
- [ ] Citations link to GitHub

---

### Session 6: P1 Completion
**Date:** YYYY-MM-DD
**Tool:** Claude Code

#### Goal
Polish MVP, add history

#### Checklist
- [ ] Assessment history endpoint
- [ ] Recent assessments on home page
- [ ] Error boundaries
- [ ] Loading states complete

#### MVP Acceptance Test
1. Paste https://github.com/vercel/next.js
2. See progress states
3. Land on report page
4. Report shows scores, tasks, citations
5. Refresh page - report still there

---

## Milestone Tracking

| Milestone | Target | Actual | Status |
|-----------|--------|--------|--------|
| Scaffold complete | Session 1 | Session 1 | ✅ |
| GitHub API working | Session 2 | Session 2 | ✅ |
| P0 blockers fixed | Session 3 | | ⏳ |
| First LLM call | Session 4 | | |
| Full analysis pipeline | Session 4 | | |
| Report page working | Session 5 | | |
| MVP complete | Session 6 | | |

---

## Known Issues Backlog

| Issue | Priority | Status | Session |
|-------|----------|--------|---------|
| Prisma datasource url | P0 | Open | 3 |
| Route params typing | P0 | Open | 3 |
| GitHub URL validation | P0 | Open | 3 |
| Tree truncation | P0 | Open | 3 |
| Layout metadata | P0 | Open | 3 |

---

## Codex Recommendations Applied

See `docs/CODEX_SYNTHESIS.md` for full analysis.

Key changes from original plan:
1. **Reordered priorities** - Fix P0 blockers before adding features
2. **Simplified phases** - Combined into P0/P1/P2 instead of 10 phases
3. **Tightened validation** - Strict GitHub host allowlist
4. **Added truncation handling** - Surface GitHub API limitations
5. **Focus on loop** - Ship end-to-end before polish
