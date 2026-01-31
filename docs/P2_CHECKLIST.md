# P2 Enhancement Checklists

Quick reference for P2 sessions.

---

# P2.1 File Picker Checklist

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

---

# P2.2 Compare View Checklist

**Status: COMPLETE** (Session 8 - 2025-01-30)

---

## ☑ 1. Components: Delta Indicators

### `components/DeltaIndicator.tsx`
- Props: `value: number`, `size?: "sm" | "md"`
- Green + up arrow for positive
- Red + down arrow for negative
- Gray horizontal line for zero

### `components/CompareScoreCard.tsx`
- Props: `label`, `scoreA`, `scoreB`, `maxScore?`
- Two progress bars with DeltaIndicator between them
- Uses same color scale as ScoreCard

### `components/ClassificationDelta.tsx`
- Props: `classificationA`, `classificationB`
- Shows both badges with directional arrow
- Labels: "Upgrade", "Downgrade", "Same"

---

## ☑ 2. Components: Assessment Picker

### `components/AssessmentPicker.tsx`
- Props: `excludeId?`, `onSelect: (id) => void`
- Fetches from `/api/assessments`
- Dropdown with classification badge + repo name + date
- Click outside to close

### `components/CompareButton.tsx`
- Client wrapper for server component integration
- Uses `useRouter` to navigate to `/compare?a=...&b=...`

---

## ☑ 3. Compare Page

**File:** `app/compare/page.tsx`

**Route:** `/compare?a=<id>&b=<id>`

**Sections:**
- [x] Header - Both repo names, commits, dates
- [x] Classification - ClassificationDelta component
- [x] Scores Grid - 6 CompareScoreCards (variability, strategic_importance, operational_impact, integration_readiness, blast_radius_risk, confidence)
- [x] Tasks Summary - Count delta, recommendation changes highlighted
- [x] KPIs - Side-by-side bullet lists

**File:** `app/compare/loading.tsx`
- Loading skeleton matching page layout

---

## ☑ 4. Update Report Page

**File:** `app/report/[id]/page.tsx`

Added:
- `CompareButton` in header next to classification badge
- Opens AssessmentPicker dropdown
- Navigates to `/compare?a=<current>&b=<selected>`

---

## ☑ 5. Update Home Page

**File:** `app/page.tsx`

Added:
- Compare mode toggle button
- Checkbox selection for assessments
- "Compare Selected" button when 2 selected
- Navigates to `/compare?a=<id1>&b=<id2>`

---

## Components Created

| Component | Purpose |
|-----------|---------|
| `DeltaIndicator.tsx` | Score change with arrow |
| `CompareScoreCard.tsx` | Side-by-side score bars |
| `ClassificationDelta.tsx` | Classification upgrade/downgrade |
| `AssessmentPicker.tsx` | Dropdown to select assessment |
| `CompareButton.tsx` | Client wrapper for report page |

---

## Verification

1. Run `npm run dev`
2. Go to home, run two assessments on any public repo (or use existing)
3. Test compare mode: select 2 from history list, click Compare
4. Verify `/compare?a=<id>&b=<id>` shows both assessments side-by-side
5. Test from report page: click "Compare with...", select another assessment
6. Verify delta indicators show correct +/- values with colors
7. Run `npm run build` to check for type errors

---

# P2.2 Quick Wins Checklist

**Status: COMPLETE** (Session 8 - 2025-01-30)

---

## ☑ 1. Export Report as JSON

**File:** `components/ExportButton.tsx`

- Client component with download handler
- Fetches assessment from API
- Creates blob and triggers download
- Filename: `{owner}-{name}-{sha}.json`

**Location:** Report page header

---

## ☑ 2. Re-analyze Button

**File:** `app/report/[id]/page.tsx`

Simple link in header:
```tsx
<a href={`/repo?url=${encodeURIComponent(assessment.repoUrl)}`}>
  Re-analyze
</a>
```

Allows user to re-run analysis with different file selection.

---

## ☑ 3. Delete Assessment

**API:** `app/api/assessments/[id]/route.ts`

Added DELETE handler:
```typescript
export async function DELETE(request, { params }) {
  const { id } = await params;
  await prisma.repoAssessment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
```

**UI:** Home page history list
- Trash icon appears on hover
- Confirmation dialog before delete
- Removes from list immediately on success

---

## Verification

1. Go to report page, click Export - JSON downloads
2. Click Re-analyze - navigates to file picker with same repo
3. On home page, hover assessment, click trash - deletes after confirm
