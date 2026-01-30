import OpenAI from "openai";
import { Chunk, getCitationUrl } from "./chunker";
import { RubricOutput, validateRubric } from "./validate";
import { readFileSync } from "fs";
import { join } from "path";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL = process.env.OPENAI_MODEL || "gpt-4o";

export interface FileSummary {
  path: string;
  citationId: string;
  summary: string;
  keyFindings: string[];
}

export interface AnalysisContext {
  repoUrl: string;
  owner: string;
  repo: string;
  commitSha: string;
  defaultBranch: string;
  detectedStack: string[];
  analyzedPaths: string[];
}

// Load JSON schema for structured output
function loadSchema(): Record<string, unknown> {
  try {
    const schemaPath = join(process.cwd(), "schemas", "reporubric.schema.json");
    const schemaContent = readFileSync(schemaPath, "utf-8");
    return JSON.parse(schemaContent) as Record<string, unknown>;
  } catch {
    console.warn("Could not load schema file, using inline schema");
    return getInlineSchema();
  }
}

function getInlineSchema(): Record<string, unknown> {
  // Minimal inline schema for when file can't be loaded
  return {
    type: "object",
    required: ["meta", "classification", "scores", "outcomes", "tasks", "execution_modes", "guardrails", "pilot", "risks", "citations"],
    properties: {
      meta: { type: "object" },
      classification: { type: "string", enum: ["A_NOT_AGENTIC", "B_LLM_ASSIST", "C_TASK_AGENTS", "D_AGENT_ORCHESTRATION"] },
      scores: { type: "object" },
      outcomes: { type: "object" },
      tasks: { type: "array" },
      execution_modes: { type: "array" },
      guardrails: { type: "object" },
      pilot: { type: "object" },
      risks: { type: "object" },
      citations: { type: "array" },
    },
  };
}

/**
 * Generate a summary for a single file chunk
 */
export async function summarizeChunk(chunk: Chunk): Promise<FileSummary> {
  const systemPrompt = `You are a code analyst. Summarize the provided code/file content concisely.
Focus on:
- What this file does (purpose)
- Key functions, classes, or exports
- Dependencies or imports
- Any workflow patterns or automation potential

Keep the summary under 200 words. List 2-5 key findings as bullet points.`;

  const userPrompt = `File: ${chunk.path} (lines ${chunk.lineStart}-${chunk.lineEnd})
Citation ID: ${chunk.citationId}

Content:
\`\`\`
${chunk.content}
\`\`\`

Provide a brief summary and key findings.`;

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.3,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content || "";

  // Parse response - simple extraction
  const lines = content.split("\n");
  const summaryLines: string[] = [];
  const findings: string[] = [];
  let inFindings = false;

  for (const line of lines) {
    if (line.toLowerCase().includes("key finding") || line.toLowerCase().includes("findings:")) {
      inFindings = true;
      continue;
    }
    if (inFindings && line.trim().startsWith("-")) {
      findings.push(line.trim().replace(/^-\s*/, ""));
    } else if (!inFindings && line.trim()) {
      summaryLines.push(line.trim());
    }
  }

  return {
    path: chunk.path,
    citationId: chunk.citationId,
    summary: summaryLines.join(" ") || content,
    keyFindings: findings.length > 0 ? findings : ["See summary above"],
  };
}

/**
 * Generate summaries for multiple chunks (batched)
 */
export async function summarizeChunks(chunks: Chunk[]): Promise<FileSummary[]> {
  // Process in parallel with concurrency limit
  const CONCURRENCY = 3;
  const summaries: FileSummary[] = [];

  for (let i = 0; i < chunks.length; i += CONCURRENCY) {
    const batch = chunks.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(summarizeChunk));
    summaries.push(...results);
  }

  return summaries;
}

/**
 * Build the rubric assessment prompt
 */
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

  return `## Repository Information
- URL: ${context.repoUrl}
- Owner: ${context.owner}
- Repo: ${context.repo}
- Commit: ${context.commitSha}
- Default Branch: ${context.defaultBranch}
- Detected Stack: ${context.detectedStack.join(", ") || "Unknown"}

## Analyzed Files
${context.analyzedPaths.map((p) => `- ${p}`).join("\n")}

## File Summaries
${summaryText}

## Available Citations
Use these citation IDs to reference specific code locations:
${citationsList}

## Instructions
Produce a complete rubric assessment following the JSON schema exactly.

Key rules:
1. Classification: If variability score <= 2, default to A_NOT_AGENTIC unless you have strong justification
2. Every task and execution_mode must reference at least one citation ID
3. Be specific in KPIs - include measurable metrics where possible
4. Pilot plan should reference the task with lowest risk + highest potential impact
5. Confidence score should reflect how much of the codebase you analyzed (${context.analyzedPaths.length} files)

The output MUST be valid JSON matching the schema.`;
}

const RUBRIC_SYSTEM_PROMPT = `You are an expert at assessing GitHub repositories for agentic AI workflow potential.

You analyze codebases to determine:
1. What classification level of AI assistance is appropriate (A-D scale)
2. Specific tasks that could benefit from automation
3. Risk levels and guardrails needed
4. A concrete pilot plan for implementation

You ALWAYS cite your sources using the provided citation IDs.
You produce output in strict JSON format matching the provided schema.

Classification scale:
- A_NOT_AGENTIC: Low variability, rules-based, minimal LLM value
- B_LLM_ASSIST: Human-led with LLM support for specific tasks
- C_TASK_AGENTS: Autonomous agents for well-defined tasks
- D_AGENT_ORCHESTRATION: Multi-agent systems with complex coordination`;

/**
 * Run the full rubric assessment
 */
export async function runRubricAssessment(
  context: AnalysisContext,
  summaries: FileSummary[],
  chunks: Chunk[]
): Promise<{ rubric: RubricOutput; raw: string; validationErrors: string[] }> {
  const userPrompt = buildRubricPrompt(context, summaries, chunks);
  const schema = loadSchema();

  const response = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: "system", content: RUBRIC_SYSTEM_PROMPT },
      { role: "user", content: userPrompt },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "rubric_assessment",
        strict: true,
        schema: schema,
      },
    },
    temperature: 0.2,
    max_tokens: 8000,
  });

  const raw = response.choices[0]?.message?.content || "{}";

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Failed to parse LLM response as JSON: ${raw.slice(0, 200)}...`);
  }

  // Validate against schema
  const validation = validateRubric(parsed);

  if (!validation.valid) {
    const errorMessages = validation.errors.map((e) => `${e.path}: ${e.message}`);

    // In dev mode, return with errors; in prod, throw
    if (process.env.NODE_ENV !== "production") {
      return {
        rubric: parsed as RubricOutput,
        raw,
        validationErrors: errorMessages,
      };
    }

    throw new Error(`Rubric validation failed:\n${errorMessages.join("\n")}`);
  }

  // Enrich citations with URLs
  const rubric = parsed as RubricOutput;
  rubric.citations = rubric.citations.map((cit) => ({
    ...cit,
    url: getCitationUrl(
      context.owner,
      context.repo,
      context.commitSha,
      cit.path,
      cit.line_start,
      cit.line_end
    ),
  }));

  return {
    rubric,
    raw,
    validationErrors: [],
  };
}

/**
 * Full analysis pipeline: summaries + rubric
 */
export async function analyzeRepository(
  context: AnalysisContext,
  chunks: Chunk[]
): Promise<{ rubric: RubricOutput; summaries: FileSummary[]; validationErrors: string[] }> {
  // Step 1: Generate file summaries
  const summaries = await summarizeChunks(chunks);

  // Step 2: Run rubric assessment
  const { rubric, validationErrors } = await runRubricAssessment(context, summaries, chunks);

  return {
    rubric,
    summaries,
    validationErrors,
  };
}
