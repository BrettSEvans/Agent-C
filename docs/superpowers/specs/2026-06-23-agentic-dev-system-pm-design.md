# Agentic Development System — Design (Phase 1: Sr. Product Manager)

**Date:** 2026-06-23
**Status:** Approved (design); ready for implementation
**Author:** Brett + Claude

## Vision

Build a multi-agent system that helps design, architect, sprint-plan, build,
test, and iterate software — getting away from ad-hoc prompting. Each role
(Sr. Product Manager, UX, UI, Architect, Engineer, QA) is a reusable **skill**.
A separate **Orchestrator** agent (later) coordinates the roles. The human can
invoke any role's skill manually in Claude Desktop; orchestrated agents call the
*same* skills, so the manual path and the automated path never drift.

This spec covers **Phase 1 only**: the shared elicitation method, the Sr. Product
Manager skill, its thin agent wrapper, and the repo/symlink plumbing. UX, UI,
Architect, Engineer, QA, and the Orchestrator are explicitly out of scope here
and follow the same pattern in later phases.

## Locked Decisions

1. **Skill-first, thin agents.** Each role = a SKILL in `~/.claude/skills/`
   (the real capability). The "agent" is a thin subagent definition that just
   invokes that same skill. One source of truth, zero duplication. Manual use in
   Desktop = invoke the skill; orchestrated use = subagent calls the skill.
2. **Versioned-doc handoffs.** Each role writes a markdown artifact into the
   product's repo under `docs/product/` and reads the prior role's doc as input:
   `01-pm-brief.md` → `02-ux-workflow.md` → `03-ui-direction.md` → …
   Git-tracked, reviewable, resumable across sessions and across Desktop.
3. **Two distinct PM roles.** Sr. Product Manager *defines* the what/why.
   A separate Orchestrator/Program-Manager (later) owns sprint planning and
   dispatch. The orchestrator routes; it never does product work.
4. **Repo + symlinks.** Canonical files live in `~/Code/Saasless/Agent-C/`
   (git-tracked). They are symlinked into `~/.claude/skills/` and
   `~/.claude/agents/` so Claude Desktop and Claude Code pick them up live.
   Skills remain available in Desktop independently of any running session, as
   long as the `Agent-C` folder stays at its path. (Mirrors the existing
   `paperclip` skills, which are already symlinks on this machine.)
5. **8 PM question themes:** problem & pain; target users & jobs-to-be-done;
   current alternatives; value proposition & differentiation; success metrics;
   scope & non-goals; constraints & risks; business model & monetization.

## Honest caveat

The *orchestration* layer (one agent dispatching subagents) is a Claude Code
capability. In Claude Desktop you get the **manual** path — invoke each skill
yourself and do the handoffs. Same skills, both places; only auto-dispatch
differs. We are building skill-first precisely so this caveat costs nothing.

## Architecture

```
~/Code/Saasless/Agent-C/                 ← canonical, version-controlled source
  agents/
    elicitation/SKILL.md                 ← shared elicitation METHOD (the "how")
    product-manager/SKILL.md             ← Sr. PM specialization (the "what/why")
    product-manager/brief-template.md    ← output template for 01-pm-brief.md
  agent-defs/
    sr-product-manager.md                ← thin subagent wrapper → calls the skill
  docs/
    product/                             ← per-product briefs/specs get written here
    superpowers/specs/                   ← this design doc

~/.claude/skills/elicitation        → symlink → Agent-C/agents/elicitation
~/.claude/skills/product-manager    → symlink → Agent-C/agents/product-manager
~/.claude/agents/sr-product-manager.md → symlink → Agent-C/agent-defs/sr-product-manager.md
```

### Unit 1 — `elicitation` skill (shared method)

**Purpose:** the reusable discipline of eliciting well, independent of role.
**Used by:** every role skill, which references it then layers role-specific
question banks + output templates.

Defines:
- One question at a time; multiple-choice when possible; never a wall of questions.
- Probe the four corners: purpose/why, constraints, success criteria, explicit
  non-goals.
- Don't lead the witness — surface trade-offs, offer a recommendation, let the
  user decide.
- Reflect back / summarize periodically to confirm understanding and catch drift.
- Know when to stop (diminishing returns) → write the artifact.
- Standard output shape: Decisions (confirmed) · Assumptions · Open questions ·
  Next handoff.

### Unit 2 — `product-manager` skill (Sr. PM specialization)

**Purpose:** define the **what & why** of a product — not solutions, screens, or
tech. **Reads:** nothing (first in chain); optionally a one-line seed idea.
**Writes:** `docs/product/01-pm-brief.md` from `brief-template.md`.
**Behavior:** follows the elicitation method, works the 8 themes, confirms the
brief with the user, then explicitly tees up the **UX handoff**.

8 themes: problem & pain · target users & jobs-to-be-done · current alternatives ·
value proposition & differentiation · success metrics · scope & non-goals ·
constraints & risks · business model & monetization.

### Unit 3 — `sr-product-manager` agent wrapper

A thin Claude Code subagent definition (`agent-defs/sr-product-manager.md`) whose
entire job is to adopt the Sr. PM persona and invoke the `product-manager` skill.
Keeps the orchestrated path identical to the manual path.

## Data flow

```
seed idea ─▶ [product-manager skill] ─▶ docs/product/01-pm-brief.md ─▶ (UX, later)
                     ▲
              [elicitation skill]  (method shared by all roles)
```

## Out of scope (later phases, same pattern)

UX skill (+ optional wireframes) → `02-ux-workflow.md`; UI skill (+ optional
wireframes) → `03-ui-direction.md`; Architect, Engineer, QA skills; Orchestrator
agent for sprint planning and dispatch.

## Success criteria for Phase 1

- `elicitation` and `product-manager` skills exist in the repo and are symlinked
  live into `~/.claude/skills/` (verifiable: `/product-manager` resolves; visible
  in Desktop).
- `sr-product-manager` agent wrapper symlinked into `~/.claude/agents/`.
- Running the PM skill conducts a one-question-at-a-time elicitation across the 8
  themes and produces a completed `docs/product/01-pm-brief.md`.
- The brief ends by teeing up the UX handoff.
```
