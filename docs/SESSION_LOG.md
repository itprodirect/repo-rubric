# Session Log

Track progress across Claude Code sessions.

---

## Current Status

**Phase:** P2.2+ (Classifier Hardening)
**Last Session:** Session 9 - Prompt Fix for Adversarial Tests
**Next Action:** P2.3 Mobile Responsive (or rebuild test suite)

---

## Priority Stack (Codex-informed)

### P0: Must Fix Before Continuing
- [x] Prisma datasource url alignment
- [x] Next.js route params typing
- [x] GitHub URL validation (strict hosts)
- [x] GitHub tree truncation flag
- [x] Layout metadata (RepoRubric branding)

### P1: MVP End-to-End Loop
- [x] POST /api/analyze (full pipeline)
- [x] Home page → API integration
- [x] Progress states in UI
- [x] Error handling (rate limit, 404, private)
- [x] Report page /report/[id]
- [x] Assessment history endpoint

### P2: Polish (After MVP Works)
- [x] File picker UI (P2.1 - Session 7)
- [x] Compare view (P2.2 - Session 8)
- [ ] Mobile responsive (P2.3)
- [x] Loading skeletons
- [x] Error boundaries

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
**Date:** 2025-01-29
**Tool:** Claude Code

#### Completed
- [x] Next.js 14 project created
- [x] Prisma 7.x configured with libsql adapter
- [x] RepoAssessment model created
- [x] `npm run dev` works
- [x] `npx prisma db push` works

---

### Session 2: GitHub Integration
**Date:** 2025-01-29
**Tool:** Claude Code

#### Completed
- [x] `lib/github.ts` created
- [x] parseGitHubUrl function with strict validation
- [x] getRepoMetadata function
- [x] getLatestCommit function
- [x] getTree function with truncation flag
- [x] API route for tree

---

### Session 3: P0 Blockers + P1 Start
**Date:** 2025-01-29
**Tool:** Claude Code

#### Completed
- [x] Fixed Prisma 7.x breaking changes (libsql adapter)
- [x] Fixed route params typing (Promise wrapper for Next.js 14.2+)
- [x] Tightened GitHub URL validation
- [x] Added truncation flag to tree response
- [x] Updated layout metadata

---

### Session 4: P1 MVP Loop (Analysis Pipeline)
**Date:** 2025-01-29
**Tool:** Claude Code

#### Completed
- [x] `lib/heuristics.ts` - File selection with tier weights
- [x] `lib/chunker.ts` - Content chunking with citations
- [x] `lib/llm.ts` - OpenAI pipeline with structured output
- [x] `lib/validate.ts` - Schema validation
- [x] `app/api/analyze/route.ts` - Full analysis endpoint

#### Files Created
- `lib/heuristics.ts`
- `lib/chunker.ts`
- `lib/llm.ts`
- `lib/validate.ts`
- `app/api/analyze/route.ts`

---

### Session 5: P1 MVP Loop (UI Integration)
**Date:** 2025-01-29
**Tool:** Claude Code

#### Completed
- [x] Home page with form submission and progress states
- [x] Report page `/report/[id]` with full rubric display
- [x] Score cards component
- [x] Classification badge component
- [x] Task table component
- [x] Citation links component
- [x] Assessments API endpoint

#### Files Created
- `components/ScoreCard.tsx`
- `components/ClassificationBadge.tsx`
- `components/TaskTable.tsx`
- `components/CitationLink.tsx`
- `app/report/[id]/page.tsx`
- `app/api/assessments/route.ts`
- `app/api/assessments/[id]/route.ts`

---

### Session 6: P1 Completion (Polish MVP)
**Date:** 2025-01-29
**Tool:** Claude Code

#### Completed
- [x] Error boundary component (class + functional)
- [x] Loading skeleton components
- [x] Not-found pages (global + report-specific)
- [x] Rate limit countdown on home page
- [x] Loading states for all pages
- [x] Error pages with retry buttons

#### Files Created
- `components/ErrorBoundary.tsx`
- `components/Skeleton.tsx`
- `app/not-found.tsx`
- `app/report/[id]/not-found.tsx`
- `app/loading.tsx`
- `app/report/[id]/loading.tsx`
- `app/error.tsx`
- `app/report/[id]/error.tsx`

#### Files Modified
- `app/page.tsx` - Added rate limit countdown, disabled button state

---

### Session 7: P2.1 File Picker UI
**Date:** 2025-01-30
**Tool:** Claude Code

#### Completed
- [x] `app/api/select-files/route.ts` - File selection endpoint with preselection
- [x] `app/repo/page.tsx` - Full file picker UI with:
  - File tree with checkboxes
  - Search/filter input
  - Quick actions (Select All, Clear, Reset to Suggested)
  - Selection summary with caps warnings
  - Truncation warning for large repos
  - Rate limit handling with countdown
  - Progress states during analysis
- [x] `components/FileTree.tsx` - Tree display with preselection highlighting
- [x] Updated `/api/analyze` with `selectedPaths` override mode
- [x] Updated home page to navigate to `/repo?url=...` for file selection
- [x] Documentation reorganization and cleanup

#### Files Created
- `app/repo/page.tsx`
- `app/api/select-files/route.ts`
- `components/FileTree.tsx`
- `docs/README.md` (navigation index)
- `docs/P2_CHECKLIST.md`
- `docs/CLAUDE_CODE_PROMPT_P2.md`
- `docs/FILE_SELECTION_MODES.md`

#### Files Modified
- `app/page.tsx` - Changed to navigate to file picker instead of direct analysis
- `app/api/analyze/route.ts` - Added `selectedPaths` override mode
- `lib/heuristics.ts` - Added reasons for file selection

---

### Session 8: P2.2 Compare View + Quick Wins
**Date:** 2025-01-30
**Tool:** Claude Code

#### Completed - Compare View (P2.2)
- [x] `components/DeltaIndicator.tsx` - Score change indicator with arrows and colors
- [x] `components/CompareScoreCard.tsx` - Side-by-side score comparison with progress bars
- [x] `components/ClassificationDelta.tsx` - Classification comparison with upgrade/downgrade arrows
- [x] `components/AssessmentPicker.tsx` - Dropdown for selecting assessments to compare
- [x] `components/CompareButton.tsx` - Client wrapper for report page integration
- [x] `app/compare/page.tsx` - Full compare page with:
  - Side-by-side header with repo info
  - Classification delta visualization
  - Score comparison grid (6 metrics)
  - Tasks summary with count delta
  - Recommendation changes highlighted
  - KPIs comparison (side-by-side lists)
- [x] `app/compare/loading.tsx` - Loading skeleton for compare page
- [x] Updated home page with compare mode (checkbox selection)
- [x] Updated report page with "Compare with..." button

#### Completed - Quick Wins
- [x] **Export Report as JSON** - Download button on report page
- [x] **Re-analyze Button** - Navigate to file picker with same repo
- [x] **Delete Assessment** - Remove from history with confirmation

#### Files Created
- `components/DeltaIndicator.tsx`
- `components/CompareScoreCard.tsx`
- `components/ClassificationDelta.tsx`
- `components/AssessmentPicker.tsx`
- `components/CompareButton.tsx`
- `components/ExportButton.tsx`
- `app/compare/page.tsx`
- `app/compare/loading.tsx`

#### Files Modified
- `app/page.tsx` - Added compare mode with checkbox selection, delete functionality
- `app/report/[id]/page.tsx` - Added CompareButton, ExportButton, Re-analyze link
- `app/api/assessments/[id]/route.ts` - Added DELETE endpoint

---

### Session 9: Prompt Fix for Adversarial Tests
**Date:** 2025-02-02
**Tool:** Claude Code

#### Problem
Adversarial test repo (`rr-eval-task-flow`) - a standard Express CRUD app with marketing README claiming "AI-powered" features - was misclassified as `C_TASK_AGENTS` with 0.95 confidence when it should be `A_NOT_AGENTIC`.

#### Root Cause
The LLM was reading README marketing language and not verifying claims against actual code/dependencies.

#### Completed
- [x] Enhanced `RUBRIC_SYSTEM_PROMPT` with "Code-First Verification Rules"
  - README claims are insufficient for classification above A
  - Must verify AI library imports, LLM API calls, or agent patterns
  - Signal mismatch handling (marketing vs code)
- [x] Updated `buildRubricPrompt` with dependency analysis section
  - Extracts package.json/requirements.txt content
  - Explicit instruction to check for AI libraries
  - "CODE OVER DOCS" rule added
- [x] Added `.reporubric` to `IGNORE_DIRS` to prevent label leakage
- [x] Upgraded default model to `gpt-4.1-2025-04-14`

#### Files Modified
- `lib/llm.ts` - System prompt, buildRubricPrompt, model upgrade
- `lib/heuristics.ts` - Added .reporubric to ignore list

#### Verification
- Adversarial repo now correctly classifies as `A_NOT_AGENTIC` ✅

#### Documentation
- `docs/SESSION-2025-02-02-reporubric-prompt-fix.md` - Full session writeup

---

### Session 10: Kimi Compatibility
**Date:** 2026-02-03
**Tool:** Codex

#### Completed
- [x] Added `OPENAI_BASE_URL` support for OpenAI-compatible providers
- [x] Added Kimi detection (base URL or model prefix)
- [x] Enforced Kimi temperature requirement (`temperature = 1`)
- [x] Disabled `response_format` for Kimi (JSON schema is OpenAI-specific)
- [x] Updated documentation for Kimi usage and env vars
 - [ ] First Kimi run (blocked by 401 Invalid Authentication)

#### Files Modified
- `lib/llm.ts` - Kimi detection, temperature handling, response_format gating
- `.env.example` - Added `OPENAI_BASE_URL`, updated model comment
- `README.md` - Kimi usage instructions and env vars

#### Documentation
- `docs/SESSION-2026-02-03-kimi-compat.md` - Full session writeup

---

## Milestone Tracking

| Milestone | Target | Actual | Status |
|-----------|--------|--------|--------|
| Scaffold complete | Session 1 | Session 1 | Done |
| GitHub API working | Session 2 | Session 2 | Done |
| P0 blockers fixed | Session 3 | Session 3 | Done |
| First LLM call | Session 4 | Session 4 | Done |
| Full analysis pipeline | Session 4 | Session 4 | Done |
| Report page working | Session 5 | Session 5 | Done |
| MVP complete | Session 6 | Session 6 | Done |
| P2.1 File Picker | Session 7 | Session 7 | Done |
| P2.2 Compare View | Session 8 | Session 8 | Done |
| Classifier Hardening | Session 9 | Session 9 | Done |

---

## Known Issues Backlog

| Issue | Priority | Status | Session |
|-------|----------|--------|---------|
| Prisma datasource url | P0 | Fixed | 3 |
| Route params typing | P0 | Fixed | 3 |
| GitHub URL validation | P0 | Fixed | 3 |
| Tree truncation | P0 | Fixed | 3 |
| Layout metadata | P0 | Fixed | 3 |

---

## Technical Notes

### Prisma 7.x Migration
Prisma 7.x introduced breaking changes:
- Requires `@prisma/adapter-libsql` instead of direct SQLite connection
- Client import changed to `@/app/generated/prisma/client`
- Uses `prisma.config.ts` for datasource configuration
- PrismaClient constructor requires `{ adapter }` option

### Next.js 14.2+ Route Params
Dynamic route params now use Promise wrapper:
```typescript
// Correct for Next.js 14.2+
{ params }: { params: Promise<{ id: string }> }
const { id } = await params;
```

### libsql Bundling
Fixed with `serverComponentsExternalPackages` in `next.config.mjs`:
```javascript
experimental: {
  serverComponentsExternalPackages: [
    "@prisma/adapter-libsql",
    "@libsql/client",
    "libsql",
  ],
}
```

---

## Codex Recommendations Applied

See `docs/CODEX_SYNTHESIS.md` for full analysis.

Key changes from original plan:
1. **Reordered priorities** - Fixed P0 blockers before adding features
2. **Simplified phases** - Combined into P0/P1/P2 instead of 10 phases
3. **Tightened validation** - Strict GitHub host allowlist
4. **Added truncation handling** - Surface GitHub API limitations
5. **Focus on loop** - Shipped end-to-end before polish

---

## Next Session Suggestions (P2.3+)

Prioritized by impact and simplicity:

### High Priority (Recommended for Session 9)
1. **History Page** (`/history`) - Full assessment list with pagination, search, filtering
   - Currently limited to 5 on home page
   - Add sorting (by date, classification, repo)
   - Builds on existing `/api/assessments` endpoint

2. **Mobile Responsive (P2.3)** - Per original roadmap
   - Header stacking on small screens
   - Compare page responsive grid
   - Touch-friendly interactions

### Medium Priority
3. **Same-Repo Trend View** - When comparing assessments of same repo
   - Auto-detect same repo, different commits
   - Show timeline of classification changes
   - Track score progression

4. **Batch Analysis** - Analyze multiple repos at once
   - Queue system for multiple URLs
   - Progress tracking per repo
   - Summary view of all results

### Lower Priority (Future Sessions)
5. **PDF Export** - Generate formatted report
6. **Webhook/API Key** - Allow external triggers
7. **Custom Rubric Weights** - Let users adjust scoring priorities
8. **Team/Organization Features** - Share assessments, permissions

### Technical Debt
- Add comprehensive error handling for edge cases
- Add unit tests for core lib functions
- Consider caching GitHub API responses
