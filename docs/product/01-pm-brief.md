# Product Brief — Agent-C

> Source of truth for the product's what & why. Written by the Sr. Product
> Manager. Read by UX next (02-ux-workflow.md). Date: 2026-06-23

## 1. Problem & pain
Coding by ad-hoc prompting forces the developer to re-explain context every
session and to personally orchestrate every step of the work. Two pains bite
hardest: **rework** (lost context produces wrong-direction output that must be
caught and redone) and **mental load / friction** (holding the whole plan in
your head across sessions is draining enough to discourage ambitious work).
The pain is felt by the developer themselves — there is no team to absorb it.

## 2. Target users & jobs-to-be-done
**Solo developers / indie hackers** building their own products. The job they
hire Agent-C for: **get from idea → shipped without holding the entire process
in their head.** Agent-C is distributable — a developer clones a repo or installs
a package and runs it locally in their own Claude setup.

## 3. Current alternatives
- **Ad-hoc AI coding** — Claude Code / Cursor / Copilot with freeform prompting.
  Powerful but unstructured and context-lossy; the exact workflow being escaped.
- **Opaque autonomous agents** — Devin / AutoGPT-style "AI engineer" products
  that try to do everything end-to-end, but are hard to steer and not
  process-transparent.

## 4. Value proposition & differentiation
**A transparent, steerable development process.** Unlike opaque autonomous
agents, every stage (PM → UX → UI → architect → engineer → QA) produces a
reviewable artifact the developer approves before the next stage begins — control
without being the orchestrator. Every agent capability is a **portable skill the
developer owns**: usable manually in their Claude setup *or* via orchestration,
editable and version-controlled — a toolkit, not a black box. Decisions captured
as versioned docs flow agent-to-agent so context is never lost between idea,
design, and code.

## 5. Success metrics
- **Primary (outcome):** projects actually shipped using Agent-C that would
  otherwise have stalled.
- **Secondary (open, no targets yet):** adoption/spread (installs, GitHub stars,
  shares) and repeat use / retention across projects.

## 6. Scope & non-goals
**In scope for v1 — a thin slice through the entire lifecycle:** one basic agent
per stage across the whole loop (PM → UX → UI → architect → engineer → QA) plus
an orchestrator, proving the full idea→shipped loop before deepening any single
agent. The Sr. Product Manager agent is built first as the entry point. Each role
is a skill, usable manually and via orchestration; handoffs are versioned docs.

**Explicit non-goals (v1):**
- NOT a hosted SaaS / web app — it's a local package/repo run in the user's own
  Claude setup; no backend, accounts, or billing.
- NOT multi-user / team collaboration — single developer.
- NOT language/stack-specific — the agents work the process; they don't lock the
  user into a particular framework or stack.
- Human-in-the-loop in v1 (approval at each artifact). Full autonomy is not a v1
  goal but is deliberately not ruled out (see Open questions).

## 7. Constraints & risks
Ranked roughly by exposure:
1. **Platform dependency** — built on the Claude Code/Desktop skills & subagents
   ecosystem; changes to skill format, subagent behavior, or pricing expose the
   whole system.
2. **Distribution / install friction** — making it run cleanly on someone else's
   machine (vs. the builder's symlinked home directory) is hard; painful installs
   will lose solo devs before they see value.
3. **Solo-builder bandwidth** — one person building six agents, orchestration, and
   packaging; v1 must stay genuinely thin.
4. **Output quality / trust** — if agents produce mediocre artifacts or lose the
   plot, the core promise (steerable quality) collapses.

## 8. Business model & monetization
Undecided and deliberately deferred. Ship it, see whether solo devs find it
valuable, decide on monetization later. Users bring their own Claude subscription.

---

## Decisions (confirmed)
- Target user: solo devs / indie hackers; job = idea → shipped without holding the
  whole process in their head.
- Agent-C is **distributable** (repo/package others run on their own machine).
- Core promise: a **transparent, steerable, artifact-per-stage process**; skills
  are owned by the user and runnable manually or via orchestration.
- Competes with ad-hoc AI coding and opaque autonomous agent products.
- Primary success metric: **projects actually shipped**.
- v1 scope: **thin slice through the entire lifecycle** (PM→UX→UI→arch→eng→QA +
  orchestrator), shallow before deep; PM built first.
- Non-goals: not SaaS, not multi-user, not stack-specific.
- Monetization deferred.

## Assumptions
- "Thin slice all the way through" supersedes the original "do architect/engineer/
  QA later" — all six roles exist shallowly in v1 before any is deepened.
- Users supply their own Claude (Code/Desktop) subscription and environment.
- The orchestrator is part of v1 scope (per the thin-slice decision), even though
  Phase 1 implementation built only the Sr. PM so far.

## Open questions
- Full autonomy: not a v1 goal, but not ruled out — revisit after the human-in-
  the-loop flow proves out.
- Concrete targets for secondary metrics (adoption, retention).
- Monetization model (free OSS vs. open-core vs. paid).
- Distribution mechanism that avoids the home-dir symlink approach used in the
  builder's own setup (installer / packaging strategy).

## Next handoff
UX agent → reads this brief, runs workflow elicitation, writes
docs/product/02-ux-workflow.md.
