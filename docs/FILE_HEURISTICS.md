# File Selection Heuristics

Rules for automatically selecting relevant files from a GitHub repository for analysis.

## Principles

1. Get enough signal to assess: purpose, workflow, runtime, dependencies, maturity, risk
2. Prefer docs + configs + entrypoints over deep implementation code
3. Cap total content to stay within LLM context limits
4. Prioritize by weight when caps are hit

## Step 1: Filter Tree

### Ignore Directories
```
node_modules/
dist/
build/
.next/
.venv/
__pycache__/
coverage/
vendor/
logs/
tmp/
.git/
```

### Ignore File Extensions (Binaries)
```
.png .jpg .jpeg .gif .webp .svg .ico
.pdf .doc .docx .xls .xlsx .ppt .pptx
.zip .tar .gz .rar .7z
.pt .onnx .bin .pkl .h5
.exe .dmg .app .msi
.woff .woff2 .ttf .eot
.mp3 .mp4 .wav .avi .mov
.sqlite .db
```

### Include Extensions (Text)
```
# Documentation
.md .txt .rst

# Config
.json .yml .yaml .toml .ini .env.example

# JavaScript/TypeScript
.ts .tsx .js .jsx .mjs .cjs

# Python
.py .pyi

# Other languages
.go .rs .java .kt .cs .rb .php

# Infrastructure
.sh .ps1 .sql .tf .hcl

# Web
.html .css .scss
```

## Step 2: Assign Weights

### Tier 0: Always Include (weight: 100)

| Pattern | Why |
|---------|-----|
| `README.md`, `README.*` | Primary project description |
| `docs/overview.md`, `docs/README.md` | Architecture documentation |
| `LICENSE`, `LICENSE.*` | Licensing (maturity signal) |
| `SECURITY.md` | Security practices |
| `CONTRIBUTING.md` | Contribution guidelines |
| `CODEOWNERS` | Ownership structure |
| `.github/workflows/*` | CI/CD pipeline |
| `Dockerfile`, `docker-compose.yml` | Container config |

### Tier 1: Runtime & Dependencies (weight: 80)

**Node.js / JavaScript:**
| Pattern | Why |
|---------|-----|
| `package.json` | Dependencies, scripts |
| `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml` | Locked versions |
| `next.config.*` | Next.js configuration |
| `tsconfig.json` | TypeScript config |
| `app/layout.tsx` | Next.js App Router root |
| `app/page.tsx` | Next.js homepage |
| `pages/_app.tsx`, `pages/index.tsx` | Next.js Pages Router |
| `src/index.ts`, `src/server.ts`, `server.js` | Entry points |

**Python:**
| Pattern | Why |
|---------|-----|
| `pyproject.toml` | Modern Python config |
| `requirements.txt` | Dependencies |
| `Pipfile`, `Pipfile.lock` | Pipenv |
| `setup.py`, `setup.cfg` | Package config |
| `main.py`, `app.py`, `server.py` | Entry points |

**Infrastructure:**
| Pattern | Why |
|---------|-----|
| `terraform/*.tf` | Infrastructure as code |
| `serverless.yml`, `serverless.ts` | Serverless config |
| `cdk.json`, `**/cdk/*.ts` | AWS CDK |
| `helm/**/values.yaml` | Kubernetes config |
| `k8s/*.yaml`, `kubernetes/*.yaml` | K8s manifests |

### Tier 2: Architecture & Workflows (weight: 50)

| Pattern | Why |
|---------|-----|
| `docs/*.md` (top-level) | Documentation |
| `docs/adr/*`, `docs/decisions/*` | Architecture decisions |
| `openapi.yaml`, `swagger.json` | API specification |
| `.env.example` | Environment variables (never .env) |
| `config/*.yml`, `config/*.json` | Configuration |

**Routing & Services:**
| Pattern | Why |
|---------|-----|
| `src/**/routes*` | Route definitions |
| `src/**/controllers*` | Controller logic |
| `src/**/services*` | Service layer |
| `app/api/**/*.ts` | Next.js API routes |

### Tier 3: Testing (weight: 30)

| Pattern | Why |
|---------|-----|
| `jest.config.*`, `vitest.config.*` | Test configuration |
| `pytest.ini`, `pyproject.toml[tool.pytest]` | Python testing |
| `playwright.config.*` | E2E testing |
| `tests/*.test.*` (sample 3 max) | Test examples |
| `__tests__/*.test.*` (sample 3 max) | Test examples |

### Tier 4: General Code (weight: 10)
Everything else that passes filters, up to remaining capacity.

## Step 3: Stack Detection

Detect stack based on file presence:

```typescript
const stackRules = {
  'next.js': [
    'next.config.*',
    'app/layout.tsx',
    'pages/_app.tsx',
  ],
  'express': [
    'package.json contains "express"',
    'src/server.*',
  ],
  'fastapi': [
    'requirements.txt contains "fastapi"',
    'app.py OR main.py',
  ],
  'flask': [
    'requirements.txt contains "flask"',
  ],
  'django': [
    'manage.py',
    'settings.py',
  ],
  'react': [
    'package.json contains "react"',
  ],
  'vue': [
    'package.json contains "vue"',
  ],
  'terraform': [
    '*.tf files present',
  ],
  'docker': [
    'Dockerfile',
    'docker-compose.yml',
  ],
  'ml-pytorch': [
    'requirements.txt contains "torch"',
  ],
  'ml-tensorflow': [
    'requirements.txt contains "tensorflow"',
  ],
};
```

## Step 4: Apply Caps

### Default Limits
| Limit | Value |
|-------|-------|
| `max_files` | 25 |
| `max_total_chars` | 250,000 |
| `max_single_file_chars` | 40,000 |

### When Over Limit
1. Sort files by weight (descending)
2. Include files until cap reached
3. Set `truncated: true` in metadata
4. Return warning: "Truncated due to caps; add specific files manually."

### Priority Order (when tied on weight)
1. Shorter path depth (root files first)
2. Smaller file size
3. Alphabetical

## Step 5: Chunking

For files exceeding `max_single_file_chars`:

1. Split into lines
2. Create chunks of 200-400 lines (~8k-12k chars)
3. Each chunk tracks:
   - `path`: Original file path
   - `sha`: Commit SHA
   - `lineStart`: First line number
   - `lineEnd`: Last line number
   - `citationId`: `CIT-${hash(path+sha+lineStart+lineEnd)}`

## Step 6: UI Behavior

### Pre-check Logic
- All Tier 0 files: checked
- All Tier 1 files: checked
- Tier 2 files: checked if under 15 total
- Tier 3-4: unchecked by default

### User Actions
- Can uncheck any file
- Can check additional files from tree
- Can search tree by filename
- "Add folder" includes top N highest-weight files from folder

### Warnings
Show warning when:
- `truncated: true`
- Very large repo (> 1000 files in tree)
- No README found

## Step 7: Special Cases

### Documentation-Heavy Repos
If > 60% of selected files are `.md`:
- Reduce code weight
- Prioritize `docs/` folder
- Flag as "documentation project"

### Monorepos
If multiple `package.json` or `pyproject.toml` at different paths:
- Include root-level files
- Include root README
- Prompt user to select specific package/module
- Don't block analysis if no selection

### Empty/Minimal Repos
If < 5 candidate files:
- Include all
- Set confidence score low
- Flag in assessment

## Output Format

```typescript
interface SelectionResult {
  selected: Array<{
    path: string;
    weight: number;
    tier: 0 | 1 | 2 | 3 | 4;
    size: number;
  }>;
  detected_stack: string[];
  truncated: boolean;
  warnings: string[];
  stats: {
    total_candidates: number;
    selected_count: number;
    estimated_chars: number;
  };
}
```
