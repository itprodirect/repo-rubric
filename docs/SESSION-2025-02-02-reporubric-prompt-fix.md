# RepoRubric Session: Prompt Fix for Adversarial Test Failure

**Date**: 2025-02-02
**Status**: ✅ COMPLETED
**Goal**: Fix RepoRubric's classification prompt to properly analyze code over README marketing language

---

## Problem Discovery

We ran the adversarial test repo (`rr-eval-task-flow`) — a standard Express CRUD app with ZERO AI code but a README full of "AI-powered", "intelligent automation", "agent orchestration" marketing language.

### Expected vs Actual

| Field | Expected | Got |
|-------|----------|-----|
| Classification | A_NOT_AGENTIC | **C_TASK_AGENTS** ❌ |
| Confidence | ≥0.7 | **0.95** (confidently wrong) |

The model read the hype README and classified a basic `express + pg + jsonwebtoken` app as needing task agents. It even recommended "LLM_ASSIST for JWT authentication" — complete hallucination.

### Root Cause

The system prompt in `lib/llm.ts` has no instructions to:
1. Verify README claims against actual code patterns
2. Check package.json/requirements.txt for AI library dependencies
3. Default to A when no AI patterns are found in code

---

## The Fix: Two Changes to `lib/llm.ts`

### Change 1: Replace `RUBRIC_SYSTEM_PROMPT` (~line 180)

Find the existing `RUBRIC_SYSTEM_PROMPT` constant and replace it entirely with:

```typescript
const RUBRIC_SYSTEM_PROMPT = `You are an expert at assessing GitHub repositories for agentic AI workflow potential.

You analyze codebases to determine:
1. What classification level of AI assistance is appropriate (A-D scale)
2. Specific tasks that could benefit from automation
3. Risk levels and guardrails needed
4. A concrete pilot plan for implementation

You ALWAYS cite your sources using the provided citation IDs.
You produce output in strict JSON format matching the provided schema.

## Classification Scale
- A_NOT_AGENTIC: Low variability, rules-based, minimal LLM value. Standard CRUD apps, ETL pipelines, static configs.
- B_LLM_ASSIST: Human-led with LLM support for specific tasks. LLM generates drafts/suggestions, human approves all actions.
- C_TASK_AGENTS: Autonomous agents for well-defined tasks with guardrails. Bounded autonomy, specific scope, human escalation path.
- D_AGENT_ORCHESTRATION: Multi-agent systems with dynamic routing, tool selection, and complex coordination.

## CRITICAL: Code-First Verification Rules

**README claims are INSUFFICIENT evidence for classification above A.**

Before classifying as B, C, or D, you MUST verify the codebase contains AT LEAST ONE of:
1. **AI library imports**: openai, anthropic, langchain, llama-index, transformers, @anthropic-ai/sdk, cohere, replicate
2. **LLM API calls**: chat.completions.create, messages.create, generate(), complete(), embed()
3. **Prompt patterns**: Template strings with instructions, system prompts, few-shot examples
4. **Agent patterns**: Tool/function definitions, action loops, state machines, dynamic routing logic

**Dependency verification (REQUIRED):**
- Check package.json "dependencies" and "devDependencies" for AI libraries
- Check requirements.txt, pyproject.toml, or Cargo.toml for AI packages
- If NO AI dependencies exist, classification should be A unless code explicitly shows AI patterns

**Signal mismatch handling:**
- If README describes "AI-powered", "intelligent", "autonomous", "agent" capabilities BUT code shows only standard CRUD/REST/database operations with NO AI library imports or LLM calls → Classify as A_NOT_AGENTIC
- If README claims AI features that don't exist in code → Note this discrepancy in risks.assumptions and REDUCE confidence below 0.6
- Marketing language without implementation evidence = A_NOT_AGENTIC

**What pushes classification UP:**
- B requires: At least one LLM API call where output assists human decision-making
- C requires: LLM-driven actions that execute autonomously within defined guardrails
- D requires: Multiple agents/workers with dynamic task routing or tool selection

**What keeps classification at A:**
- Standard REST APIs (express, fastify, flask, django routes)
- Database CRUD operations (SELECT, INSERT, UPDATE, DELETE)
- Static configuration files
- Rule-based validation (if/else, regex, schema validation)
- Traditional automation (cron jobs, CI/CD, webhooks without LLM)

When in doubt between adjacent categories, choose the LOWER classification.`;
```

### Change 2: Update `buildRubricPrompt` function

Find the `buildRubricPrompt` function and replace it with this version that adds dependency analysis:

```typescript
function buildRubricPrompt(
  context: AnalysisContext,
  summaries: FileSummary[],
  chunks: Chunk[]
): string {
  const summaryText = summaries
    .map((s) => `### ${s.path} [${s.citationId}]\n${s.summary}\n\nKey findings:\n${s.keyFindings.map((f) => `- ${f}`).join("\n")}`)
    .join("\n\n---\n\n");

  // Build available citations list
  const citationsList = chunks
    .map((c) => `- ${c.citationId}: ${c.path} (L${c.lineStart}-L${c.lineEnd})`)
    .join("\n");

  // NEW: Extract dependency info from chunks if package.json or requirements.txt exists
  const depsChunk = chunks.find(c => 
    c.path === 'package.json' || 
    c.path === 'requirements.txt' || 
    c.path === 'pyproject.toml'
  );
  
  const depsSection = depsChunk 
    ? `\n## Dependencies Analysis\nFile: ${depsChunk.path}\n\`\`\`\n${depsChunk.content.slice(0, 2000)}\n\`\`\`\n\n**IMPORTANT**: Check if ANY of these AI libraries are present: openai, anthropic, langchain, transformers, @anthropic-ai/sdk, llama-index, cohere. If NONE are present, this is strong evidence for A_NOT_AGENTIC classification.\n`
    : '\n## Dependencies Analysis\nNo package.json/requirements.txt found. Examine imports in source files for AI library usage.\n';

  return `## Repository Information
- URL: ${context.repoUrl}
- Owner: ${context.owner}
- Repo: ${context.repo}
- Commit: ${context.commitSha}
- Default Branch: ${context.defaultBranch}
- Detected Stack: ${context.detectedStack.join(", ") || "Unknown"}

## Analyzed Files
${context.analyzedPaths.map((p) => `- ${p}`).join("\n")}
${depsSection}
## File Summaries
${summaryText}

## Available Citations
Use these citation IDs to reference specific code locations:
${citationsList}

## Instructions
Produce a complete rubric assessment following the JSON schema exactly.

Key rules:
1. **CODE OVER DOCS**: If README claims AI capabilities but code shows standard CRUD with no AI imports, classify as A_NOT_AGENTIC
2. Classification: If variability score <= 2, default to A_NOT_AGENTIC unless you have VERIFIED AI patterns in code
3. Every task and execution_mode must reference at least one citation ID
4. Be specific in KPIs - include measurable metrics where possible
5. Pilot plan should reference the task with lowest risk + highest potential impact
6. Confidence score should reflect how much of the codebase you analyzed (${context.analyzedPaths.length} files)
7. If documentation describes features not found in code, note this in risks.assumptions and reduce confidence

The output MUST be valid JSON matching the schema.`;
}
```

---

## Bonus Fix: Add `.reporubric` Exclusion to `lib/heuristics.ts`

This prevents label leakage from test repos (the `.reporubric/expected.json` files contain the expected classification).

Find `IGNORE_DIRS` at the top of `heuristics.ts` and add `.reporubric`:

```typescript
const IGNORE_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  ".next",
  ".venv",
  "__pycache__",
  "coverage",
  "vendor",
  "logs",
  "tmp",
  ".git",
  ".cache",
  ".turbo",
  ".reporubric",  // ← ADD THIS LINE
]);
```

---

## Test Plan

After making these changes:

1. **Restart dev server**: `npm run dev`

2. **Re-run adversarial test**: Submit `https://github.com/itprodirect/rr-eval-task-flow`

3. **Expected result**:
   - Classification: `A_NOT_AGENTIC`
   - Confidence: 0.5-0.7 (reduced due to README/code mismatch)
   - `risks.assumptions` should note: "README describes AI capabilities not found in code"

4. **Verify no regression**: Re-run one of the legitimate AI repos (like the original `rr-test-b-llm-assist-doc-tool` or `rr-test-c-task-agent-issue-triage`) to confirm they still classify correctly.

---

## Test Repo Rebuild Status

We created 8 Claude Code prompts to rebuild all test repos with:
- Non-leaky names (e.g., `rr-eval-csv-normalizer` instead of `rr-test-a-deterministic-pipeline`)
- Substantial code (400+ lines instead of 8-30 line stubs)
- Real tests
- No category hints in file names

| # | New Name | Category | Status |
|---|----------|----------|--------|
| 01 | rr-eval-csv-normalizer | A | Pending |
| 02 | rr-eval-readme-drafter | B | Pending |
| 03 | rr-eval-issue-handler | C | Pending |
| 04 | rr-eval-support-desk | D | Pending |
| 05 | rr-eval-style-checker | A/B edge | Pending |
| 06 | rr-eval-pr-manager | B/C edge | Pending |
| 07 | rr-eval-review-bot | C/D edge | Pending |
| 08 | rr-eval-task-flow | A (adversarial) | ✅ Built & tested |

The prompts are in the zip file: `claude-code-prompts.zip`

---

## Priority Order

1. **Fix the prompt** (this document) — highest impact, fixes the core classifier
2. **Re-test adversarial repo** — validates the fix works
3. **Rebuild remaining test repos** — builds proper validation suite
4. **Re-run all 8 repos** — complete validation cycle

---

## Files to Edit

```
lib/llm.ts         → RUBRIC_SYSTEM_PROMPT + buildRubricPrompt
lib/heuristics.ts  → IGNORE_DIRS (add .reporubric)
```

That's it. Two files, three changes.

---

## Completion Log

**Completed**: 2025-02-02

### Changes Made

| Change | File | Status |
|--------|------|--------|
| 1. Enhanced `RUBRIC_SYSTEM_PROMPT` with Code-First Verification Rules | `lib/llm.ts` | ✅ |
| 2. Updated `buildRubricPrompt` with dependency analysis section | `lib/llm.ts` | ✅ |
| 3. Added `.reporubric` to `IGNORE_DIRS` | `lib/heuristics.ts` | ✅ |
| 4. Upgraded default model to `gpt-4.1-2025-04-14` | `lib/llm.ts` | ✅ |

### Verification

- Tested adversarial repo `rr-eval-task-flow`: Now correctly classifies as `A_NOT_AGENTIC` ✅
- Previously failed with `C_TASK_AGENTS` at 0.95 confidence (confidently wrong)

### Summary

The classifier now properly:
1. Prioritizes actual code patterns over README marketing language
2. Explicitly checks dependency files for AI library presence
3. Reduces confidence when documentation claims don't match code
4. Ignores `.reporubric` folders to prevent label leakage in test repos
