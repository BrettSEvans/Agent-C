# UX Workflow — Agent-C

> How the product works (flows & structure, not visual style). Written by the UX
> agent from 01-pm-brief.md. Read by UI next (03-ui-direction.md).
> Date: 2026-06-23

> **Note on product type:** Agent-C is a CLI/agentic tool driven through Claude
> Code/Desktop — it has **no GUI screens**. "Screens/views" are reframed as
> **interaction touchpoints** (a conversation turn, a dashboard listing, a gate
> prompt). Wireframes are flow/structure sketches, not screen mockups.

## 1. Primary user flows
**Core flow — Start a new project** (the flagship; see
`wireframes/start-new-project-flow.md`):
1. User asks the orchestrator to start a new project (gives a name + location).
2. Orchestrator registers it (stage = PM, status = in progress).
3. Orchestrator dispatches the current stage agent, handing it the project path +
   prior artifacts.
4. The agent reads its input, runs one-question-at-a-time elicitation, writes its
   artifact, and returns control recommending the next stage.
5. **Approval gate** — the user chooses: approve→advance, request changes (re-run
   the stage with feedback), hand-edit the artifact then approve, or pause/switch.
6. On approval the registry marks the stage complete and the orchestrator advances
   to the next stage; repeat through UX → UI → architect → engineering → QA.
7. When the last stage is approved, the project is complete.

**Secondary flows (exist in v1, not the focus):** resume a project at its current
stage; switch projects / view the dashboard; adopt an existing external directory.

## 2. Entry points & information architecture
- **Front door:** a single **orchestrator** entry the user invokes (e.g.
  `/agent-c` or talking to the PM-orchestrator). It routes everything — new,
  resume, switch, adopt, dispatch, gates.
- **Direct access:** every stage skill (`/product-manager`, `/ux`, …) remains
  individually invokable for manual use; the orchestrator is the front door, not
  a gatekeeper.
- **Command surface (from the dashboard wireframe):** new / resume / switch /
  adopt / repoint / remove.

## 3. Key screens/views & purpose
Reframed as **interaction touchpoints**:
- **Orchestrator conversation** — the front-door dialog; tell Agent-C what to do.
- **Project dashboard / registry view** — lists all known projects with location,
  current stage, status, revision count; the multi-project overview. See
  `wireframes/project-dashboard.md`.
- **Stage elicitation conversation** — the per-stage one-question-at-a-time
  discovery (the workhorse touchpoint; this very conversation is an example).
- **Approval-gate presentation** — artifact + summary + recommended next + the
  four gate options. See `wireframes/approval-gate.md`.
- **Artifact docs** (passive) — the markdown files in the project's repo that the
  user can read and hand-edit.

## 4. States & feedback
- **Stage lifecycle states:** not started → in progress → awaiting approval →
  approved-complete (plus *skipped*; plus *unreachable* for a missing folder).
- **Needs-you flag:** an explicit "awaiting your approval / blocked on you" marker
  so that across many projects the user sees what needs action now (`*` on the
  dashboard).
- **Revision count:** how many times a stage's artifact has been sent back for
  changes — visibility into churn.
- **Working/progress indication:** while an agent is actively eliciting or
  generating, show it's working vs. parked.

## 5. Edge cases & off-happy-path
**Handled in v1:**
- **Stage run out of order** — agent detects the missing prior artifact and stops
  with guidance (already enforced by each stage skill's required-input check).
- **Skipping a stage** — the orchestrator lets the user mark a stage *skipped*
  (e.g. no UI step for a pure CLI tool) and proceeds, rather than forcing every
  stage.

**Deferred to backlog** (`docs/product/backlog.md`): hand-edit/artifact conflict
reconciliation; stale-registry repoint/remove; (and other items as they arise).

## 6. Workflow constraints
- **Text/conversational only** — everything renders as text/markdown in Claude
  Code/Desktop; no GUI. (Also the accessibility win: text is screen-reader
  friendly.)
- **Bounded by skills/subagents** — the flow can only assume what the Claude Code
  skill/subagent platform actually supports (invocation, context passing, file
  I/O).
- **Resumable across sessions** — all important state persists to disk (artifacts
  in the project repo + the registry); nothing critical lives only in conversation
  memory.

## Wireframes
- `wireframes/start-new-project-flow.md` — Mermaid flow with the gate loop.
- `wireframes/project-dashboard.md` — ASCII multi-project dashboard.
- `wireframes/approval-gate.md` — sample gate-presentation transcript.

---

## Decisions (confirmed)
- Core flow = start-new-project through the stage→gate loop; gates support
  approve / request-changes / hand-edit-then-approve / pause-switch.
- Single orchestrator front door that routes; stage skills also directly
  invokable.
- Touchpoints: orchestrator conversation, project dashboard, stage elicitation,
  approval-gate presentation.
- Status model: stage lifecycle states + needs-you flag + revision count +
  working indicator.
- v1 edge cases: out-of-order (handled), skip-a-stage (handled); others → backlog.
- Constraints: text-only, within skills/subagents, fully resumable (persist to
  disk).
- Wireframes produced: flow + dashboard + gate transcript (low-fi).

## Assumptions
- Agent-C has no GUI; the UI stage will style *text* touchpoints (dashboard
  layout, gate presentation, transcript formatting), not graphical screens.
- The orchestrator's command surface (new/resume/switch/adopt/repoint/remove) is
  indicative; exact command syntax is an implementation detail for later stages.

## Open questions
- For the **UI stage**: how should text touchpoints be styled — dashboard table
  format, gate presentation, use of color/emphasis in a terminal, tone/voice of
  the orchestrator? (Look-and-feel was deliberately deferred here.)
- Exact orchestrator command syntax and whether it's a slash-command vs.
  conversational.
- How "skip a stage" is recorded in the registry (architect-stage concern).

## Next handoff
UI agent → reads this workflow, defines look and feel, writes
docs/product/03-ui-direction.md.
