# Quick Start: First Claude Code Session

Copy-paste these prompts to get started immediately.

## Session 1: Project Scaffold

### Prompt 1: Create Next.js Project

```
Create a Next.js 14 project in the current directory with these requirements:

1. Use App Router (app/ directory at root level, NOT inside src/)
2. TypeScript enabled
3. Tailwind CSS enabled
4. ESLint enabled

Use these commands:
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"

Accept all defaults if prompted.
```

### Prompt 2: Add Prisma

```
Add Prisma with SQLite to this Next.js project:

npm install prisma @prisma/client
npx prisma init --datasource-provider sqlite

Then update prisma/schema.prisma with this model:

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

Then run:
npx prisma generate
npx prisma db push
```

### Prompt 3: Create lib/prisma.ts

```
Create lib/prisma.ts with a singleton pattern for the Prisma client:

import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### Prompt 4: Update Home Page

```
Update app/page.tsx with a simple form for the URL input:

- Input field for GitHub URL
- "Analyze" button
- Basic Tailwind styling
- Form submits to /api/analyze (we'll build this later)

For now, just console.log the URL on submit.
```

### Verify

```bash
npm run dev
# Visit http://localhost:3000
# Should see input form
# Check console for submitted URL
```

---

## Session 2 Preview

After Session 1 works, you'll create:
- `lib/github.ts` - GitHub API client
- `app/api/repo/[owner]/[name]/tree/route.ts` - Tree endpoint

See `docs/IMPLEMENTATION_PLAN.md` Phase 2 for details.
