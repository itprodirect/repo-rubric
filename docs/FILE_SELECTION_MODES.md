# File Selection API Contract

Critical distinction between additive and override modes.

---

## The Problem

Current API supports:
```typescript
{ repoUrl: string, extraPaths?: string[] }
```

This is **additive** - adds files ON TOP of heuristic picks.

But a file picker needs **override** mode - analyze EXACTLY what user selected.

---

## The Solution

Two distinct modes:

### Mode 1: Additive (`extraPaths`)

```typescript
// "Run heuristics, but also include these"
{
  repoUrl: "https://github.com/owner/repo",
  extraPaths: ["docs/API.md", "scripts/deploy.sh"]
}

// Result: heuristic picks + extraPaths
```

**Use case:** Quick analysis with a few extra files

### Mode 2: Override (`selectedPaths`)

```typescript
// "Analyze EXACTLY these files, nothing else"
{
  repoUrl: "https://github.com/owner/repo",
  selectedPaths: ["README.md", "package.json", "src/index.ts"]
}

// Result: only selectedPaths, heuristics bypassed
```

**Use case:** File picker, precision analysis

---

## API Behavior

```typescript
export async function POST(request: Request) {
  const { repoUrl, extraPaths, selectedPaths } = await request.json();
  
  let filesToAnalyze: string[];
  
  if (selectedPaths && selectedPaths.length > 0) {
    // Override mode: use exactly these
    filesToAnalyze = selectedPaths;
  } else {
    // Additive mode: heuristics + extras
    const heuristicPicks = await selectFiles(tree);
    filesToAnalyze = [...heuristicPicks, ...(extraPaths || [])];
  }
  
  // Continue with analysis...
}
```

---

## Priority Rules

| `selectedPaths` | `extraPaths` | Behavior |
|-----------------|--------------|----------|
| `["a", "b"]` | `["c"]` | Analyze `["a", "b"]` only (override wins) |
| `[]` or undefined | `["c"]` | Analyze heuristics + `["c"]` |
| `[]` or undefined | undefined | Analyze heuristics only |

---

## Why This Matters

Without override mode:
- User deselects a heuristic file
- Can't actually remove it (no way to say "not this")
- Picker becomes useless

With override mode:
- User has full control
- What you select = what gets analyzed
- Trust established

---

## Persisting Selection

Store final file list in assessment for transparency:

```prisma
model RepoAssessment {
  // ... existing fields
  selectedPathsJson  String   // User's original selection (for re-runs)
  analyzedPathsJson  String   // What was actually analyzed (after validation)
}
```

This allows:
1. Report showing exactly what was analyzed
2. Re-running with same selection
3. Comparing selection vs actual (if some files failed to fetch)
