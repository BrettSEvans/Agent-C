# Orchestrator — Design Spec

**Date:** 2026-06-27
**Status:** Draft — awaiting approval at the gate
**Author:** Brett + Claude
**Supersedes open questions in:** `docs/product/01-pm-brief.md` (registry mechanism),
`docs/product/02-ux-workflow.md` (orchestrator command surface), `backlog.md` Gap #3.

> This is the design the PM brief deferred to "the architect stage." It consolidates
> the orchestrator requirements that were scattered across the brief (§6), the UX
> workflow, the backlog, and the three wireframes, and resolves every open fork from
> the 2026-06-27 review discussion. Approve this, then a separate implementation plan
> turns it into skills.

---

## 1. Vision & scope

The orchestrator is the **front door** of Agent-C: one skill the user invokes to see
all their projects, know what each needs next, and move a project through the
PM → UX → UI → architect → engineer → QA lifecycle one approved artifact at a time.

**v1 is a manual registry-helper running in Claude Desktop.** It orchestrates *the
user* — it shows the dashboard, tells them the next stage and which skill to invoke,
presents the approval gate, and keeps the registry up to date. It does **not**
auto-run stage agents. (Autonomous subagent dispatch and the `agent-defs/` wrappers
are explicitly **post-v1** and Code-only; nothing here depends on the unverified
"can a subagent invoke the Skill tool?" assumption.)

This matches the brief's "the user is the orchestrator in v1" decision, made into a
helpful skill rather than pure manual bookkeeping.

### In scope (v1)
- A global project **registry** + a **dashboard** view across all projects.
- The **start-new-project** flow and the **approval-gate** loop (per the wireframes).
- Secondary flows: **resume**, **switch**, **adopt** an external dir, **repoint**,
  **remove**.
- **Checkpointing** (resume a stage mid-elicitation) and a **revision** loop
  (request-changes re-runs a stage as a targeted edit).
- **Mode C** (feature work) as first-class tracked entries.
- **Critic** integrated as an opt-in gate action on PM/UX/UI.

### Out of scope (post-v1)
- Autonomous subagent dispatch (the orchestrator running stages for the user).
- The `agent-defs/` wrappers' activation (they wait for the above).
- Multi-session locking / merge (v1 accepts single-active-session-per-project).
- Per-user identity / personalized skills (backlog).
- `ux-audit`-style retrospective-review variants (backlog).

---

## 2. Locked decisions (from the review discussion)

1. **Manual registry-helper, Desktop.** No auto-dispatch in v1.
2. **State split.** Lean global `registry.json` is a **cache/index**; each track's
   `state.json` (beside its artifacts) is the **source of truth**.
3. **Format = JSON** for both.
4. **Three-mode entry contract** for every stage — *fresh / resume / revise* —
   encoded as a **new shared skill** (`stage-protocol`) loaded by all six roles.
5. **Revise = targeted edit**, not a full re-run; bumps the revision count.
6. **Checkpointing in v1**, at theme/section granularity, written after each theme.
7. **Write ownership:** the stage skill writes the checkpoint, bumps the revision
   count, and clears pending-feedback after a revise; the orchestrator writes
   pending-feedback and refreshes the registry cache.
8. **Adopt** an external dir → the orchestrator **synthesizes** a `state.json` by
   inferring the current stage from which artifacts already exist.
9. **Concurrency:** v1 assumes a **single active session per project**; no locking.
10. **Mode C = flat feature entries.** A feature is its own registry entry
    (`type: "feature"`), reusing the same schema and `state.json`; the dashboard
    *groups* features under their parent for display only. A feature may have **no
    registered parent** (path-only, on an external codebase).
11. **Critic = opt-in gate action** on PM/UX/UI gates; its report doubles as the
    revision feedback; max two passes, tracked in `state.json`.

---

## 3. Components to build

```
agents/
  stage-protocol/SKILL.md     ← NEW shared skill: entry modes + checkpoint/state I/O
  orchestrator/SKILL.md       ← NEW front-door skill: registry, dashboard, gates, flows
  product-manager/SKILL.md     ┐
  ux/SKILL.md                  │  retrofit: load stage-protocol;
  ui/SKILL.md                  │  participate in fresh/resume/revise;
  architect/SKILL.md           │  write checkpoints; honor pending-feedback
  engineer/SKILL.md            │
  qa/SKILL.md                  ┘

~/.agent-c/registry.json      ← NEW global index (created on first run)
<project>/docs/product/state.json            ← per product-track state
<project>/docs/features/<slug>/state.json    ← per feature-track state
```

Three units of work: **(U1)** the `stage-protocol` shared skill, **(U2)** the
`orchestrator` skill, **(U3)** the 6-role retrofit. The plan will sequence them
U1 → U3 → U2 (the protocol first, so the roles and orchestrator can rely on it).

---

## 4. Data model

### 4.1 `registry.json` (global cache/index) — `~/.agent-c/registry.json`

A flat list of entries; one per **track** (a product track or a feature track).
Every field here is a *cached mirror* of the track's `state.json`, kept so the
dashboard renders without opening every project.

```jsonc
{
  "version": 1,
  "entries": [
    {
      "id": "tiffany",                 // stable key; for features: "<parent-or-path>/<slug>"
      "type": "product",               // "product" | "feature"
      "name": "Tiffany",
      "path": "/Users/me/code/tiffany",// the project/codebase root
      "slug": null,                    // feature slug, else null
      "parentId": null,                // feature's parent entry id, else null
      "productType": "GUI app",        // from the PM brief
      "currentStage": "ux",            // pm|ux|ui|architect|engineer|qa
      "status": "awaiting-approval",   // see §4.3
      "needsYou": true,                // the dashboard "*" flag
      "revisionCount": 2,              // current stage's revisions
      "updatedAt": "2026-06-27T18:00:00Z"
    }
  ]
}
```

### 4.2 `state.json` (per-track source of truth)

Product track → `<path>/docs/product/state.json`.
Feature track → `<path>/docs/features/<slug>/state.json`.

```jsonc
{
  "version": 1,
  "track": {
    "type": "product",               // "product" | "feature"
    "name": "Tiffany",
    "slug": null,                    // feature only
    "productType": "GUI app"
  },
  "currentStage": "ux",
  "stages": {
    "pm":        { "status": "approved-complete", "revisions": 1, "criticPasses": 1, "checkpoint": null },
    "ux":        { "status": "awaiting-approval", "revisions": 2, "criticPasses": 0, "checkpoint": null },
    "ui":        { "status": "not-started",       "revisions": 0, "criticPasses": 0, "checkpoint": null },
    "architect": { "status": "not-started",       "revisions": 0, "criticPasses": 0, "checkpoint": null },
    "engineer":  { "status": "not-started",       "revisions": 0, "criticPasses": 0, "checkpoint": null },
    "qa":        { "status": "not-started",       "revisions": 0, "criticPasses": 0, "checkpoint": null }
  },
  "pendingFeedback": {                // null when none
    "stage": "ux",
    "source": "user",                // "user" | "critic"
    "text": "Flows section too thin; add the resume-project flow.",
    "reportPath": null               // e.g. critic-reports/2026-06-27-ux-p1.md when source=critic
  },
  "updatedAt": "2026-06-27T18:00:00Z"
}
```

A **feature** track's `stages` object contains only the right-sized set chosen by
`feature-mode`; stages that don't apply are present with `status: "skipped"`.

`checkpoint` is `null` unless a stage is mid-run:

```jsonc
"checkpoint": {
  "themesCompleted": ["problem", "users", "alternatives"],
  "currentTheme": "value-prop",
  "draftPath": "docs/product/01-pm-brief.md",   // partial artifact, if written
  "notes": "user leaning B2B; confirm pricing next"
}
```

### 4.3 Status values

`not-started` → `in-progress` → `awaiting-approval` → `approved-complete`,
plus `skipped` (stage intentionally bypassed) and the cross-cutting `unreachable`
(registered path missing) and `error` (a run failed — recoverable, see §7).

---

## 5. The `stage-protocol` shared skill (U1)

The reusable contract every role loads (the `elicitation` / `best-practices`
pattern). It owns **how a stage enters** and **how it persists state** — nothing
role-specific.

**On entry, detect mode** from the track's `state.json`:

| Mode | Condition | Behavior |
|---|---|---|
| **fresh** | no artifact and `checkpoint == null` | read prior artifact → full elicitation |
| **resume** | `checkpoint != null` (artifact incomplete) | skip `themesCompleted`; continue from `currentTheme` |
| **revise** | artifact complete and `pendingFeedback.stage == this stage` | load the artifact, apply `pendingFeedback.text` as a **targeted edit**, re-confirm only what changed, rewrite, `revisions += 1`, clear `pendingFeedback`, `checkpoint = null` |

**Persistence rules it provides to the role:**
- After each theme completes → append to `checkpoint.themesCompleted`, advance
  `currentTheme`, write `state.json`.
- On artifact written + handed to the gate → `status = "awaiting-approval"`,
  `checkpoint = null`.
- Graceful standalone: if no `state.json` exists (pure manual use outside any
  registered project), run **fresh** and create a `state.json` so the work is still
  resumable.

The skill must **not** advance the lifecycle or touch `registry.json` — that's the
orchestrator's job (keeps the role/orchestrator boundary clean).

---

## 6. The `orchestrator` skill (U2)

Front-door invocation (working name `/orchestrator`; friendlier `/agent-c` alias is
an open item — §10). On invoke, it loads `registry.json` (creating it if absent) and
presents the **dashboard**, then accepts a command.

### 6.1 Command surface

| Command | Does |
|---|---|
| **dashboard** (default) | render all tracks: name, path, stage, status, `*` needs-you, revisions; features grouped under their parent |
| **new** | ask name + location + product type → create the project dir + `state.json` → register (`stage = pm`, `status = in-progress`) → tell the user to invoke `/product-manager` |
| **resume** | open a track → report its mode (fresh/resume/revise) and which stage skill to invoke |
| **switch** | change the active track |
| **adopt** | point at an existing dir → **synthesize** `state.json` from the artifacts present (§7) → register |
| **repoint** | fix a moved project's path on an `unreachable` entry |
| **remove** | drop a registry entry (does not delete files) |

### 6.2 The approval-gate loop

When a stage reaches `awaiting-approval`, the orchestrator presents the gate
(per `wireframes/approval-gate.md`): which stage, which track, the artifact path +
revision count, a short summary, and the recommended next stage. Options:

| Key | Action | Effect |
|---|---|---|
| `[a]` | Approve → advance | `status = approved-complete`; advance `currentStage`; refresh registry |
| `[c]` | Request changes | orchestrator writes `pendingFeedback` (source=user) → user re-invokes the stage skill, which enters **revise** mode |
| `[e]` | Edit it myself | user hand-edits the artifact, then returns to `[a]` |
| `[p]` | Pause / switch | leave parked; resumable from the registry |
| `[r]` | **Run critic first** *(PM/UX/UI gates only)* | see §8 |

The orchestrator updates `registry.json` (the cache) from the track's `state.json`
after every gate action.

---

## 7. Adopt & recovery behaviors

- **Adopt / synthesize state.** Given a dir, infer `currentStage` from the highest
  numbered artifact present (`01`→pm … `04`→architect; code + `05`→engineer;
  qa-report→qa) and set each prior stage `approved-complete`. Mark the inferred
  current stage `awaiting-approval` so the user confirms before advancing. Record
  under the track's assumptions that the history was inferred.
- **`unreachable`.** On dashboard render, if an entry's `path` is missing, mark it
  `unreachable` and offer **repoint** / **remove** (don't crash). *(From backlog.)*
- **`error`.** If a stage run fails or leaves a malformed artifact, the stage stays
  recoverable: `status = error`, `checkpoint` retained; resume re-enters where it
  left off. *(Closes the missing-error-state omission from the review.)*

---

## 8. Critic integration

The critic reviews PM/UX/UI artifacts only. It surfaces as the `[r]` gate action on
those three stages:

1. User picks `[r]` → invokes `/critic` on the current artifact.
2. Critic writes its report to `<track>/.../critic-reports/`; `criticPasses += 1`.
3. If it flags issues, the user picks `[c]` — the orchestrator writes
   `pendingFeedback` with `source = "critic"` and `reportPath` set, so the **critic's
   report is the revision feedback**. The stage re-runs in **revise** mode against it.
4. After the revise, the gate offers `[r]` again for a validating **pass 2**. The
   skill stops offering `[r]` once `criticPasses == 2`.

Architect / engineer / QA gates do **not** show `[r]` (QA is itself the
implementation-verification stage; the critic doesn't review those artifacts).

---

## 9. Success criteria (for the eventual build)

- `/orchestrator` renders a dashboard across ≥2 projects at different paths, each
  showing stage + status + needs-you, with feature tracks grouped under their parent.
- **new** creates a registered project and routes the user to `/product-manager`.
- A stage interrupted mid-elicitation **resumes** from the last completed theme (not
  from scratch), proving the checkpoint.
- `[c]` at a gate makes the stage re-enter in **revise** mode and apply the feedback
  as a targeted edit, with `revisionCount` incrementing.
- **adopt** on a dir containing `01`+`02` registers it parked at UI with prior stages
  marked complete.
- A feature track created via `feature-mode` appears as its own entry and is
  resumable independently of its parent.
- `[r]` on a UX gate produces a critic report and, via `[c]`, drives a revise; the
  third `[r]` is no longer offered.
- All state survives quitting and reopening Desktop (everything persisted to disk).

---

## 10. Open items (decide during planning, not blockers)

- **Front-door name:** ship as `/orchestrator`, or alias to `/agent-c` for the
  friendlier front door the UX doc imagined?
- **Exact gate-summary rendering** per stage (which 3 lines to recap) — UI-stage
  styling concern; can borrow from `wireframes/approval-gate.md`.
- **`pendingFeedback` for non-elicitation stages** (engineer/QA) — feedback there is
  "fix X in the code / re-verify Y"; same field, free-text, skill interprets.

---

## 11. Honest caveats

- This is **Desktop-first and manual** by design. The value is the registry +
  guided gates, not automation. If/when auto-dispatch is built (post-v1, Code-only),
  it layers on this same registry and `state.json` — no rework of the data model.
- v1 trusts a **single active session per project**. Concurrent edits from two
  sessions are out of scope and could clobber `state.json`.
