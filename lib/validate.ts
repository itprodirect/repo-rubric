/**
 * Rubric validation utilities
 * Validates LLM output against the reporubric schema
 */

export interface ValidationError {
  path: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Classification enum values
const VALID_CLASSIFICATIONS = [
  "A_NOT_AGENTIC",
  "B_LLM_ASSIST",
  "C_TASK_AGENTS",
  "D_AGENT_ORCHESTRATION",
] as const;

// Task recommendation enum values
const VALID_RECOMMENDATIONS = [
  "RULES_AUTOMATION",
  "LLM_ASSIST",
  "TASK_AGENT",
  "HUMAN",
] as const;

// Execution mode enum values
const VALID_MODES = ["STATIC", "ADAPTIVE", "COLLABORATIVE"] as const;

type Classification = (typeof VALID_CLASSIFICATIONS)[number];
type Recommendation = (typeof VALID_RECOMMENDATIONS)[number];
type Mode = (typeof VALID_MODES)[number];

export interface RubricMeta {
  repo_url: string;
  owner: string;
  repo: string;
  commit_sha: string;
  default_branch: string;
  detected_stack?: string[];
  analyzed_paths: string[];
  content_caps?: {
    max_files?: number;
    max_total_chars?: number;
    truncated?: boolean;
  };
}

export interface RubricScores {
  variability: number;
  strategic_importance: number;
  operational_impact: number;
  integration_readiness: number;
  blast_radius_risk: number;
  confidence: number;
}

export interface RubricOutcomes {
  enterprise_outcome: string;
  workflow_outcome: string;
  kpis: {
    efficiency: string[];
    quality: string[];
    business_impact: string[];
    risk_compliance: string[];
  };
}

export interface RubricTask {
  task_id: string;
  name: string;
  current_actor: string;
  inputs: string[];
  outputs: string[];
  scores: {
    variability: number;
    criticality: number;
    risk: number;
  };
  recommendation: Recommendation;
  rationale: string;
  citations: string[];
}

export interface RubricExecutionMode {
  task_id: string;
  mode: Mode;
  why: string;
  constraints: string[];
  citations: string[];
}

export interface RubricGuardrails {
  strategic: string[];
  operational: string[];
  implementation: string[];
}

export interface RubricPilot {
  recommended_first_task_id: string;
  baseline: string[];
  success_thresholds: string[];
  sandbox_plan: string[];
  rollback_plan: string[];
  monitoring: string[];
}

export interface RubricRisks {
  key_risks: string[];
  unknowns: string[];
  assumptions: string[];
}

export interface RubricCitation {
  id: string;
  path: string;
  commit_sha: string;
  line_start: number;
  line_end: number;
  url: string;
  note?: string;
}

export interface RubricOutput {
  meta: RubricMeta;
  classification: Classification;
  scores: RubricScores;
  outcomes: RubricOutcomes;
  tasks: RubricTask[];
  execution_modes: RubricExecutionMode[];
  guardrails: RubricGuardrails;
  pilot: RubricPilot;
  risks: RubricRisks;
  citations: RubricCitation[];
}

function addError(errors: ValidationError[], path: string, message: string) {
  errors.push({ path, message });
}

function isString(val: unknown): val is string {
  return typeof val === "string";
}

function isNumber(val: unknown): val is number {
  return typeof val === "number" && !isNaN(val);
}

function isArray(val: unknown): val is unknown[] {
  return Array.isArray(val);
}

function isObject(val: unknown): val is Record<string, unknown> {
  return typeof val === "object" && val !== null && !Array.isArray(val);
}

function validateStringArray(val: unknown, path: string, errors: ValidationError[]): boolean {
  if (!isArray(val)) {
    addError(errors, path, "Expected array");
    return false;
  }
  val.forEach((item, i) => {
    if (!isString(item)) {
      addError(errors, `${path}[${i}]`, "Expected string");
    }
  });
  return true;
}

function validateScore(val: unknown, path: string, errors: ValidationError[], min = 1, max = 5): boolean {
  if (!isNumber(val)) {
    addError(errors, path, "Expected number");
    return false;
  }
  if (val < min || val > max) {
    addError(errors, path, `Expected value between ${min} and ${max}`);
    return false;
  }
  return true;
}

function validateMeta(meta: unknown, errors: ValidationError[]): meta is RubricMeta {
  if (!isObject(meta)) {
    addError(errors, "meta", "Expected object");
    return false;
  }

  const required = ["repo_url", "owner", "repo", "commit_sha", "default_branch", "analyzed_paths"];
  for (const field of required) {
    if (!(field in meta)) {
      addError(errors, `meta.${field}`, "Required field missing");
    }
  }

  if ("analyzed_paths" in meta) {
    validateStringArray(meta.analyzed_paths, "meta.analyzed_paths", errors);
  }

  return true;
}

function validateScores(scores: unknown, errors: ValidationError[]): scores is RubricScores {
  if (!isObject(scores)) {
    addError(errors, "scores", "Expected object");
    return false;
  }

  const scoreFields = [
    "variability",
    "strategic_importance",
    "operational_impact",
    "integration_readiness",
    "blast_radius_risk",
  ];

  for (const field of scoreFields) {
    if (field in scores) {
      validateScore(scores[field], `scores.${field}`, errors);
    } else {
      addError(errors, `scores.${field}`, "Required field missing");
    }
  }

  if ("confidence" in scores) {
    const conf = scores.confidence;
    if (!isNumber(conf) || conf < 0 || conf > 1) {
      addError(errors, "scores.confidence", "Expected number between 0 and 1");
    }
  } else {
    addError(errors, "scores.confidence", "Required field missing");
  }

  return true;
}

function validateTask(task: unknown, index: number, errors: ValidationError[]): task is RubricTask {
  const path = `tasks[${index}]`;

  if (!isObject(task)) {
    addError(errors, path, "Expected object");
    return false;
  }

  const required = ["task_id", "name", "current_actor", "inputs", "outputs", "scores", "recommendation", "rationale", "citations"];
  for (const field of required) {
    if (!(field in task)) {
      addError(errors, `${path}.${field}`, "Required field missing");
    }
  }

  if ("recommendation" in task && !VALID_RECOMMENDATIONS.includes(task.recommendation as Recommendation)) {
    addError(errors, `${path}.recommendation`, `Invalid value. Expected one of: ${VALID_RECOMMENDATIONS.join(", ")}`);
  }

  if ("scores" in task && isObject(task.scores)) {
    validateScore(task.scores.variability, `${path}.scores.variability`, errors);
    validateScore(task.scores.criticality, `${path}.scores.criticality`, errors);
    validateScore(task.scores.risk, `${path}.scores.risk`, errors);
  }

  return true;
}

function validateCitation(citation: unknown, index: number, errors: ValidationError[]): citation is RubricCitation {
  const path = `citations[${index}]`;

  if (!isObject(citation)) {
    addError(errors, path, "Expected object");
    return false;
  }

  const required = ["id", "path", "commit_sha", "line_start", "line_end", "url"];
  for (const field of required) {
    if (!(field in citation)) {
      addError(errors, `${path}.${field}`, "Required field missing");
    }
  }

  if ("line_start" in citation && (!isNumber(citation.line_start) || citation.line_start < 1)) {
    addError(errors, `${path}.line_start`, "Expected positive integer");
  }

  if ("line_end" in citation && (!isNumber(citation.line_end) || citation.line_end < 1)) {
    addError(errors, `${path}.line_end`, "Expected positive integer");
  }

  return true;
}

/**
 * Validate a rubric output against the schema
 */
export function validateRubric(data: unknown): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isObject(data)) {
    return { valid: false, errors: [{ path: "", message: "Expected object" }] };
  }

  // Validate meta
  if ("meta" in data) {
    validateMeta(data.meta, errors);
  } else {
    addError(errors, "meta", "Required field missing");
  }

  // Validate classification
  if ("classification" in data) {
    if (!VALID_CLASSIFICATIONS.includes(data.classification as Classification)) {
      addError(errors, "classification", `Invalid value. Expected one of: ${VALID_CLASSIFICATIONS.join(", ")}`);
    }
  } else {
    addError(errors, "classification", "Required field missing");
  }

  // Validate scores
  if ("scores" in data) {
    validateScores(data.scores, errors);
  } else {
    addError(errors, "scores", "Required field missing");
  }

  // Validate outcomes
  if ("outcomes" in data) {
    if (!isObject(data.outcomes)) {
      addError(errors, "outcomes", "Expected object");
    }
  } else {
    addError(errors, "outcomes", "Required field missing");
  }

  // Validate tasks
  if ("tasks" in data) {
    if (!isArray(data.tasks)) {
      addError(errors, "tasks", "Expected array");
    } else if (data.tasks.length === 0) {
      addError(errors, "tasks", "At least one task required");
    } else {
      data.tasks.forEach((task, i) => validateTask(task, i, errors));
    }
  } else {
    addError(errors, "tasks", "Required field missing");
  }

  // Validate execution_modes
  if ("execution_modes" in data) {
    if (!isArray(data.execution_modes)) {
      addError(errors, "execution_modes", "Expected array");
    }
  } else {
    addError(errors, "execution_modes", "Required field missing");
  }

  // Validate guardrails
  if ("guardrails" in data) {
    if (!isObject(data.guardrails)) {
      addError(errors, "guardrails", "Expected object");
    }
  } else {
    addError(errors, "guardrails", "Required field missing");
  }

  // Validate pilot
  if ("pilot" in data) {
    if (!isObject(data.pilot)) {
      addError(errors, "pilot", "Expected object");
    }
  } else {
    addError(errors, "pilot", "Required field missing");
  }

  // Validate risks
  if ("risks" in data) {
    if (!isObject(data.risks)) {
      addError(errors, "risks", "Expected object");
    }
  } else {
    addError(errors, "risks", "Required field missing");
  }

  // Validate citations
  if ("citations" in data) {
    if (!isArray(data.citations)) {
      addError(errors, "citations", "Expected array");
    } else {
      data.citations.forEach((citation, i) => validateCitation(citation, i, errors));
    }
  } else {
    addError(errors, "citations", "Required field missing");
  }

  // Variability rule: If variability <= 2, should be NOT_AGENTIC unless justified
  if (
    "scores" in data &&
    isObject(data.scores) &&
    "variability" in data.scores &&
    isNumber(data.scores.variability) &&
    data.scores.variability <= 2 &&
    "classification" in data &&
    data.classification !== "A_NOT_AGENTIC"
  ) {
    // This is a warning, not an error - the LLM may have justification
    // We don't add an error but could add a warning if needed
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
