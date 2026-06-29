# Product Brief — Agent-C

> Source of truth for the product's what & why. Written by the Sr. Product
> Manager. Read by UX next (02-ux-workflow.md). Date: 2026-06-23

**Product type:** Agentic / conversational developer tool. Original v1 discovery
baseline: **Claude Desktop**, skill-driven, no GUI screens; downstream stages
designed text/interaction touchpoints, not graphical screens. Current product
reality: Agent-C now spans Claude Desktop manual skills, Claude Code wrapper
definitions, and an Electron dashboard surface (see "Post-v1 platform evolution").

**Claude model (current):** Sonnet 4.6+ for PM, UX, and UI stages.
**Historical floor:** Claude 3.5 Sonnet was the v1 discovery baseline. Later
stages may use stronger models when architecture, implementation, or QA depth
requires it.

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
per stage across the whole loop (PM → UX → UI → architect → engineer → QA),
proving the full idea→shipped loop before deepening any single agent. The Sr.
Product Manager agent is built first as the entry point. Each role is a skill,
usable manually via Desktop; handoffs are versioned docs.

**Stage checkpoints & resumption:** Each stage maintains a checkpoint/plan showing
what steps have been completed. If interrupted mid-elicitation, the user can
resume from the last completed step (not from scratch). This requires each stage
to track progress — marking themes answered, sections filled — and presenting that
state on resumption.

**Multi-project support (core capability):** Agent-C manages multiple concurrent,
isolated projects. Each project lives at its **own configurable location** on
disk — projects need NOT share a common root and may sit anywhere. The tool keeps
a **central registry/dashboard** of every project it knows about (name, location,
current stage, completed stages), so the user can switch between projects and
**resume any one at any lifecycle stage** (e.g. Tiffany parked at UX while Amanda
resumes at architect → engineering). The user can also **point Agent-C at an
existing external directory** to adopt a project started elsewhere. Each project's
handoff docs/artifacts live in that project's own folder; the registry is the
cross-project index. (Registry format/location and stage-tracking mechanism are an
architecture-stage concern.)

**Orchestration & handoff model:** **the user is the orchestrator** (Desktop has no subagents, so orchestration is manual in v1). The user owns lifecycle sequencing, the project registry, and the per-stage approval gates. Stage agents (PM, UX, UI, …) are workers that don't know about each other: each reads the prior stage's artifact, runs its elicitation, writes its own artifact, then **returns control and recommends the next stage** — it never directly invokes the next agent. The user presents each artifact for approval, updates the registry (stage → complete), and decides whether to proceed, pause, or switch projects. (Future: orchestrator subagent to automate this, after v1 proves out.)

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

## 9. Post-v1 platform evolution

The core product promise is unchanged: a transparent, steerable lifecycle where
PM -> UX -> UI -> architect -> engineer -> QA each produce reviewable artifacts
that the developer approves before advancing. The platform surfaces evolved after
the original v1 discovery baseline:

- **Claude Desktop:** manual orchestration. Users invoke skills directly, review
  artifacts, and use the orchestrator skill as a registry/dashboard and gate guide.
- **Claude Code:** thin wrapper definitions live in `agent-defs/`. They dispatch
  to the same canonical skills and are Code-only because Desktop has no subagents.
  They are ready for future autonomous dispatch but are not a separate method.
- **Electron dashboard:** `dashboard/` is a GUI sub-product that visualizes the
  same project registry and approval-gate state that the text orchestrator shows.
  It does not replace the text workflow; it is another surface over the same
  on-disk state.

This is a healthy post-discovery expansion, not a change to the lifecycle model.
The original "Desktop/no GUI" language should be read as the starting constraint
that shaped v1, not as the full current system boundary.

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
- **Multi-project is a core capability:** concurrent isolated projects, each at
  its own configurable path (no shared root required); a central registry/
  dashboard tracks each project's location and current stage; any project is
  resumable at any stage; existing external directories can be adopted.
- **User is the orchestrator (v1):** Desktop has no subagents, so orchestration is
  manual. The user controls sequencing, registry, and approval gates. Stage agents
  return control + recommend the next stage; they never auto-chain.
- **Claude Sonnet for PM/UX/UI stages:** current guidance is Sonnet 4.6+; Claude
  3.5 Sonnet remains the historical v1 discovery floor.
- **Stage checkpointing:** each stage tracks and marks completed steps (themes,
  sections answered). On resumption after interruption, the user picks up from the
  last completed step, not from scratch.
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
  builder's own setup (installer / packaging strategy) — for Desktop installation.
- Formal repair behavior for corrupt registry/state files.

## Next handoff
UX agent → reads this brief, runs workflow elicitation, writes
docs/product/02-ux-workflow.md.
