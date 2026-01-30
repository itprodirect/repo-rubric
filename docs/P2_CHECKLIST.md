# P2.1 File Picker Checklist

Quick reference for the file picker session.

**Status: COMPLETE** (Session 7 - 2025-01-30)

---

## ☑ 1. API: Add `selectedPaths` Override

**File:** `app/api/analyze/route.ts`

```typescript
interface AnalyzeRequest {
  repoUrl: string;
  extraPaths?: string[];      // Additive (existing)
  selectedPaths?: string[];   // Override (new)
}

// In handler:
const filesToAnalyze = selectedPaths?.length 
  ? selectedPaths  // Override mode
  : [...heuristicPaths, ...(extraPaths || [])];  // Additive mode
```

**Test:**
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repoUrl":"https://github.com/sindresorhus/is","selectedPaths":["README.md","package.json"]}'
```

---

## ☑ 2. API: Create `/api/select-files`

**File:** `app/api/select-files/route.ts`

**Input:** `{ repoUrl: string }`

**Output:**
```json
{
  "success": true,
  "data": {
    "owner": "...",
    "repo": "...",
    "sha": "...",
    "tree": [...],
    "truncated": false,
    "preselected": {
      "paths": ["README.md", "package.json", ...],
      "reasons": { "README.md": "Tier 0: Project overview", ... }
    },
    "estimates": {
      "totalFiles": 25,
      "totalChars": 150000,
      "overCaps": false,
      "caps": { "maxFiles": 25, "maxChars": 250000, "maxPerFile": 40000 }
    }
  }
}
```

---

## ☑ 3. UI: Create `/repo` Page

**File:** `app/repo/page.tsx`

**Route:** `/repo?url=https://github.com/owner/repo`

**Elements:**
- [x] File tree with checkboxes
- [x] Search/filter input
- [x] Quick actions (Select All, Clear, Reset)
- [x] Selection summary (count, chars, warnings)
- [x] Truncation warning if applicable
- [x] "Analyze" button

---

## ☑ 4. UI: Update Home Page

**File:** `app/page.tsx`

Change submit handler:
```typescript
// Before: POST to /api/analyze
// After: Navigate to /repo?url=...
router.push(`/repo?url=${encodeURIComponent(repoUrl)}`);
```

---

## ☑ 5. UI: Update Report Page

**File:** `app/report/[id]/page.tsx`

Add:
```tsx
{/* Truncation warning */}
{rubric.meta.content_caps?.truncated && (
  <Alert>Analysis truncated due to size limits.</Alert>
)}

{/* Analyzed files list */}
<section>
  <h3>Files Analyzed ({rubric.meta.analyzed_paths.length})</h3>
  <ul>{rubric.meta.analyzed_paths.map(p => <li key={p}>{p}</li>)}</ul>
</section>
```

---

## Components to Create

### `components/FileTree.tsx`
- Checkbox list of files
- Highlight preselected
- Show reason tooltip
- Filter support

### `components/SelectionSummary.tsx`
- Selected count
- Estimated chars
- Warning badges

---

## Verification

1. Go to home, paste URL
2. Should navigate to `/repo?url=...`
3. File tree shows with preselected files
4. Can filter, select, deselect
5. Click "Analyze"
6. Report shows + lists analyzed files

---

## Commits

```bash
git add -A && git commit -m "feat(api): add selectedPaths override to /api/analyze"
git add -A && git commit -m "feat(api): add /api/select-files endpoint"
git add -A && git commit -m "feat(ui): create /repo file picker page"
git add -A && git commit -m "feat(ui): update home to navigate to picker"
git add -A && git commit -m "feat(report): show truncation warning + analyzed files"
```
