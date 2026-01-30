# P0 Blockers Checklist

Quick reference for fixing the 5 blockers before continuing with MVP.

---

## ☐ 1. Prisma Schema

**File:** `prisma/schema.prisma`

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")  // ← Must have this line
}
```

**Test:**
```bash
npx prisma generate  # Should succeed
npx prisma db push   # Should succeed
```

---

## ☐ 2. Route Params

**Files:** Any `app/api/**/route.ts` with dynamic params

**Find & Replace:**
```typescript
// WRONG
{ params }: { params: Promise<{ id: string }> }
const { id } = await params;

// CORRECT  
{ params }: { params: { id: string } }
const { id } = params;
```

---

## ☐ 3. GitHub Host Validation

**File:** `lib/github.ts`

```typescript
const ALLOWED_HOSTS = ["github.com", "www.github.com"];

// In parseGitHubUrl:
if (!ALLOWED_HOSTS.includes(url.hostname)) {
  throw new Error(`Must be a GitHub URL`);
}
```

---

## ☐ 4. Tree Truncation

**File:** `lib/github.ts`

Return type must include `truncated`:
```typescript
interface TreeResult {
  tree: TreeNode[];
  sha: string;
  truncated: boolean;  // ← Add this
}
```

Parse from API response:
```typescript
return {
  tree: data.tree,
  sha: data.sha,
  truncated: data.truncated ?? false
};
```

---

## ☐ 5. Layout Metadata

**File:** `app/layout.tsx`

```typescript
export const metadata: Metadata = {
  title: "RepoRubric",
  description: "Agentic Workflow Assessment for GitHub Repositories",
};
```

---

## Verification

All must pass:
```bash
npm install
npx prisma generate
npx prisma db push
npm run build
npm run dev
```

Browser check:
- Title shows "RepoRubric" (not "Create Next App")

---

## Commit

After all fixed:
```bash
git add -A
git commit -m "fix(p0): prisma url, route params, github validation, truncation, metadata"
```

Then proceed to P1 (MVP loop).
