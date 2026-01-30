# Claude Code Prompt: P2.1 File Picker

**STATUS: COMPLETE** (Session 7 - 2025-01-30)

> This prompt is archived for reference. P2.1 is done. See SESSION_LOG.md for next steps.

---

You are Claude Code working on https://github.com/itprodirect/repo-rubric

**Goal (P2.1):** Build the File Picker UI step (`/repo`) with heuristic preselection + manual overrides, then run analysis using a `selectedPaths` override (analyze exactly these files). Surface truncation/caps warnings in the picker + report.

**Key insight:** `extraPaths` (additive) is not enough. A real file picker must support "analyze EXACTLY these" via `selectedPaths` (override mode).

---

## 1. Add `selectedPaths` Override to `/api/analyze`

**Current:** API supports heuristics + optional `extraPaths` (additive).

**Add:** New request field `selectedPaths?: string[]`

**Behavior:**
```typescript
interface AnalyzeRequest {
  repoUrl: string;
  extraPaths?: string[];      // Additive to heuristics
  selectedPaths?: string[];   // Override: analyze EXACTLY these (bypasses heuristics)
}

// In handler:
if (selectedPaths && selectedPaths.length > 0) {
  // Use ONLY these paths, ignore heuristics
  filesToAnalyze = selectedPaths;
} else {
  // Run heuristics, then add extraPaths
  filesToAnalyze = [...heuristicPaths, ...(extraPaths || [])];
}
```

**Also:** Persist the final analyzed paths in the assessment record so report can display them.

**Acceptance:**
- POST with `selectedPaths: ["README.md", "package.json"]` analyzes ONLY those files
- Assessment record stores which files were actually analyzed

---

## 2. Create File Selection Endpoint

Create `app/api/select-files/route.ts`:

**Input:**
```typescript
{
  repoUrl: string;
  // Optional: pass tree if already fetched (optimization)
}
```

**Output:**
```typescript
{
  success: true;
  data: {
    owner: string;
    repo: string;
    sha: string;
    defaultBranch: string;
    tree: TreeNode[];
    truncated: boolean;
    preselected: {
      paths: string[];
      reasons: Record<string, string>;  // path -> "Tier 0: README" etc.
    };
    estimates: {
      totalFiles: number;
      totalChars: number;
      overCaps: boolean;
      caps: { maxFiles: number; maxChars: number; maxPerFile: number; };
    };
  }
}
```

**Logic:**
1. Parse repoUrl → owner/repo
2. Fetch repo metadata + tree
3. Run file selection heuristics (from `lib/heuristics.ts`)
4. Calculate size estimates from tree
5. Return preselected paths with reasons + estimates

---

## 3. Create `/repo` Page (File Picker)

Create `app/repo/page.tsx`:

**Route:** `/repo?url=https://github.com/owner/repo`

**On mount:**
1. Read `url` from query params
2. Call `GET /api/select-files?repoUrl={url}`
3. Display loading state

**UI Components:**

```tsx
// File tree with checkboxes
<FileTree
  files={tree}
  selected={selectedPaths}
  preselected={preselected.paths}
  reasons={preselected.reasons}
  onToggle={(path) => toggleSelection(path)}
/>

// Search/filter
<input 
  placeholder="Filter files..."
  onChange={(e) => setFilter(e.target.value)}
/>

// Quick actions
<div className="flex gap-2">
  <button onClick={selectAll}>Select All</button>
  <button onClick={clearAll}>Clear All</button>
  <button onClick={resetToHeuristics}>Reset to Suggested</button>
</div>

// Selection summary
<SelectionSummary
  count={selectedPaths.length}
  estimatedChars={calculateChars(selectedPaths)}
  caps={estimates.caps}
  warnings={getWarnings()}
/>

// Truncation warning (if tree.truncated)
{truncated && (
  <Alert variant="warning">
    Large repository. Tree was truncated by GitHub. Some files may not be visible.
  </Alert>
)}

// Run analysis button
<button 
  onClick={runAnalysis}
  disabled={selectedPaths.length === 0 || analyzing}
>
  {analyzing ? "Analyzing..." : `Analyze ${selectedPaths.length} files`}
</button>
```

**Analysis flow:**
```typescript
async function runAnalysis() {
  setAnalyzing(true);
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: JSON.stringify({
        repoUrl: url,
        selectedPaths: selectedPaths  // Override mode
      })
    });
    const data = await res.json();
    if (data.success) {
      router.push(`/report/${data.data.assessmentId}`);
    } else {
      setError(data.error);
    }
  } finally {
    setAnalyzing(false);
  }
}
```

**Acceptance:**
- `/repo?url=...` loads tree with preselected files
- User can search/filter files
- User can select/deselect any file
- Selection summary shows count + estimated chars
- Warning shows if over caps
- "Analyze" runs with `selectedPaths` override
- Redirects to report on success

---

## 4. Update Home Page Flow

**Current:** Home posts directly to `/api/analyze`

**New:** Home navigates to `/repo?url={url}` for file selection

```tsx
// In app/page.tsx
function handleSubmit(e: FormEvent) {
  e.preventDefault();
  if (!repoUrl) return;
  
  // Navigate to file picker instead of direct analysis
  router.push(`/repo?url=${encodeURIComponent(repoUrl)}`);
}
```

**Optional:** Add "Quick Analyze" toggle for power users who want to skip picker:
```tsx
<label className="flex items-center gap-2">
  <input 
    type="checkbox" 
    checked={quickMode}
    onChange={(e) => setQuickMode(e.target.checked)}
  />
  Skip file selection (use auto-detect)
</label>

// If quickMode, post directly to /api/analyze without selectedPaths
```

---

## 5. Update Report Page

**Add to report display:**

1. **Truncation banner** (if `rubric.meta.content_caps.truncated`):
```tsx
{rubric.meta.content_caps?.truncated && (
  <Alert variant="warning">
    Analysis was truncated due to size limits. Consider selecting fewer files.
  </Alert>
)}
```

2. **Analyzed files list:**
```tsx
<section>
  <h2>Files Analyzed ({rubric.meta.analyzed_paths.length})</h2>
  <ul className="text-sm text-gray-600">
    {rubric.meta.analyzed_paths.map(path => (
      <li key={path}>{path}</li>
    ))}
  </ul>
</section>
```

---

## 6. File Tree Component

Create `components/FileTree.tsx`:

```tsx
interface FileTreeProps {
  files: TreeNode[];
  selected: Set<string>;
  preselected: string[];
  reasons: Record<string, string>;
  filter: string;
  onToggle: (path: string) => void;
}

export function FileTree({ files, selected, preselected, reasons, filter, onToggle }: FileTreeProps) {
  const filtered = files.filter(f => 
    f.type === 'blob' && 
    f.path.toLowerCase().includes(filter.toLowerCase())
  );
  
  return (
    <div className="max-h-96 overflow-y-auto border rounded">
      {filtered.map(file => (
        <FileRow
          key={file.path}
          file={file}
          checked={selected.has(file.path)}
          isPreselected={preselected.includes(file.path)}
          reason={reasons[file.path]}
          onToggle={() => onToggle(file.path)}
        />
      ))}
    </div>
  );
}

function FileRow({ file, checked, isPreselected, reason, onToggle }) {
  return (
    <label className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
      />
      <span className={isPreselected ? "font-medium" : ""}>
        {file.path}
      </span>
      {reason && (
        <span className="text-xs text-gray-500">({reason})</span>
      )}
      {file.size && (
        <span className="text-xs text-gray-400 ml-auto">
          {formatBytes(file.size)}
        </span>
      )}
    </label>
  );
}
```

---

## Commit Plan

1. `feat(api): add selectedPaths override to /api/analyze`
2. `feat(api): add /api/select-files endpoint`
3. `feat(ui): create /repo file picker page`
4. `feat(ui): update home to navigate to picker`
5. `feat(report): show truncation warning + analyzed files`

---

## Definition of Done

- [x] `/repo?url=...` loads and shows file tree
- [x] Preselected files match heuristics
- [x] User can search/filter file list
- [x] User can select/deselect any file (including deselecting heuristic picks)
- [x] Selection summary shows count + char estimate
- [x] Warning shows when over caps (25 files, 250k chars)
- [x] "Analyze" posts with `selectedPaths` override
- [x] Report shows truncation banner when applicable
- [x] Report shows list of analyzed files
