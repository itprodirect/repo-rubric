# Rubric Specification

Assessment criteria derived from Gartner's "Redesign Your Workflows for Strategic Adoption of AI Agents" (November 2025).

## Classification Levels

### A: NOT_AGENTIC
- Workflow is stable and predictable
- Traditional automation (RPA, scripts, workflows) is sufficient
- Adding agents would increase fragility and cost without improving outcomes
- **Default when Variability ≤ 2** unless strong justification

### B: LLM_ASSIST
- LLM used as a tool within existing workflow
- Human or traditional orchestration remains in control
- Examples: code completion, document drafting, search enhancement
- Deterministic workflow with AI-powered individual steps

### C: TASK_AGENTS
- AI agents handle specific tasks autonomously
- Workflow orchestration stays deterministic
- Each agent has bounded scope and clear inputs/outputs
- Human oversight at task boundaries
- **Preferred starting point for agentic adoption**

### D: AGENT_ORCHESTRATION
- AI agents coordinate multi-step workflows
- Agents decide task sequencing and delegation
- Requires mature guardrails and monitoring
- High risk, high potential reward
- **Only for high-variability, high-strategic-importance workflows**

## Scoring Dimensions

### 1. Variability (1-5)
How often does the workflow deviate from routine patterns?

| Score | Description |
|-------|-------------|
| 1 | Completely predictable, same steps every time |
| 2 | Minor variations, easily handled by rules |
| 3 | Regular exceptions requiring judgment |
| 4 | Highly variable, each instance differs |
| 5 | Case-based, every instance is unique |

**Rule:** If Variability ≤ 2, default classification is A (NOT_AGENTIC)

### 2. Strategic Importance (1-5)
How critical is this workflow to enterprise goals?

| Score | Description |
|-------|-------------|
| 1 | Internal utility, minimal business impact |
| 2 | Supports operations but not differentiating |
| 3 | Important for customer satisfaction |
| 4 | Core to value proposition |
| 5 | Existential to business success |

### 3. Operational Impact (1-5)
What would redesign change in efficiency, quality, or risk?

| Score | Description |
|-------|-------------|
| 1 | Marginal improvement possible |
| 2 | Modest efficiency gains |
| 3 | Significant time or cost reduction |
| 4 | Transformative quality improvement |
| 5 | Order of magnitude improvement possible |

### 4. Integration Readiness (1-5)
How prepared is the codebase for AI integration?

| Score | Description |
|-------|-------------|
| 1 | Monolithic, no APIs, legacy stack |
| 2 | Some APIs but tightly coupled |
| 3 | Service-oriented, clear boundaries |
| 4 | Well-documented APIs, modular |
| 5 | Already integrated with AI/ML, extensible |

### 5. Blast Radius Risk (1-5)
What's the potential damage from agent failures?

| Score | Description |
|-------|-------------|
| 1 | Fully reversible, internal only |
| 2 | Minor customer impact, recoverable |
| 3 | Moderate impact, requires intervention |
| 4 | Significant damage, compliance issues |
| 5 | Catastrophic, safety-critical, irreversible |

### 6. Confidence (0.0-1.0)
How confident is the assessment based on available code?

| Score | Description |
|-------|-------------|
| < 0.5 | Limited information, many assumptions |
| 0.5-0.7 | Reasonable signal from code structure |
| 0.7-0.9 | Good coverage of key components |
| > 0.9 | Comprehensive analysis possible |

## Decision Matrix

```
                    Low Strategic Importance    High Strategic Importance
                    -------------------------   -------------------------
Low Variability     A (Not Agentic)            B (LLM Assist) - assist
                    Traditional automation      humans on important tasks

High Variability    B (LLM Assist) - assist    C or D (Task Agents or
                    with variable handling      Agent Orchestration)
```

## Task-Level Assessment

For each identified task in the workflow:

### Task Attributes
- **name**: Human-readable task name
- **current_actor**: Who/what performs this now (human, script, service)
- **inputs**: What data/context the task needs
- **outputs**: What the task produces

### Task Scores
- **variability (1-5)**: How variable is this specific task?
- **criticality (1-5)**: How important is getting this right?
- **risk (1-5)**: What's the blast radius of failure?

### Task Recommendation
| Recommendation | When to Use |
|----------------|-------------|
| HUMAN | High criticality + high risk, judgment required |
| RULES_AUTOMATION | Low variability, deterministic rules work |
| LLM_ASSIST | Human decides but LLM drafts/suggests |
| TASK_AGENT | Bounded autonomy with clear inputs/outputs |

## Execution Modes

How should each agent operate?

### STATIC (Rule-based)
- Predictable, repeatable every time
- Best for: Low-variability, compliance-sensitive tasks
- Question: "Do we need reliability and repeatability?"

### ADAPTIVE (Feedback-driven)
- Learns from outcomes, adjusts behavior
- Best for: Medium-high variability, dependency-heavy tasks
- Question: "Would learning from feedback improve results?"

### COLLABORATIVE (Human-AI)
- Partnership between agent and human
- Best for: Tasks needing judgment + automation
- Question: "Is this better as a partnership?"

## Guardrails Framework

### Strategic Guardrails
Set by business leadership:
- What's in/out of bounds for AI autonomy enterprise-wide
- Financial thresholds requiring approval
- Customer-facing escalation rules

### Operational Guardrails
Set by workflow and risk owners:
- Per-workflow autonomy constraints
- Escalation triggers
- Human review checkpoints

### Implementation Guardrails
Set by engineering:
- API access controls
- Prompt engineering safeguards
- Memory and context constraints
- Performance monitoring

## Pilot Planning

### Selection Criteria
Best pilot candidates are:
- High volume, low variety (agents add most value)
- Low risk (failure is recoverable)
- Measurable (clear baseline and KPIs)
- Stable process (fewer moving parts)

### Success Metrics

**Efficiency:**
- Time saved per task
- Turnaround time reduction
- FTE equivalent saved

**Quality:**
- Decision accuracy
- Error rate reduction
- Customer satisfaction

**Business Impact:**
- Cost reduction
- Revenue lift
- Compliance improvement

### Pilot Structure
1. **Baseline**: Measure current state
2. **Sandbox**: Test in controlled environment
3. **Thresholds**: Define success/failure criteria
4. **Rollback**: Plan for reverting changes
5. **Monitoring**: Real-time performance tracking

## Citation Requirements

Every substantive claim in the assessment must cite:
- Source file path
- Line range (start-end)
- Commit SHA

Claims without available citations must be flagged as:
- `risks.unknowns` (can't verify from code)
- `risks.assumptions` (inferred but not confirmed)

## Output Schema

The assessment output must match `schemas/reporubric.schema.json` exactly:
- All required fields present
- Enum values match defined options
- Citations array complete and valid
- No additional properties
