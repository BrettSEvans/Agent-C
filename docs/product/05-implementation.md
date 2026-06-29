# Implementation — Agent-C

> Built/documented by the engineer from 01-04. Date: 2026-06-29.
> This pass documents the existing implementation rather than introducing new
> product code.

## What was built

Agent-C is a local, distributable multi-agent development pipeline. It contains:

- 13 canonical skills in `agents/`.
- Thin Claude Code wrapper definitions in `agent-defs/`.
- A text-first orchestrator contract for registry, gates, dashboard display, and
  user-directed dispatch.
- A per-project artifact chain under `docs/product/`.
- A file-backed lifecycle state protocol using `state.json` and a global registry
  cache.
- A complete Electron dashboard sub-product in `dashboard/`.

## Shared methods

| Skill | Role in the implementation |
|---|---|
| `elicitation` | One-question-at-a-time discovery discipline used by PM, UX, UI, and architect. |
| `best-practices` | Guards against stale or merely common choices; used across roles. |
| `feature-mode` | Supports Mode C feature work inside existing products under `docs/features/<slug>/`. |
| `stage-protocol` | Defines fresh/resume/revise entry modes, checkpoints, revisions, and `state.json` ownership. |

## Lifecycle roles

| Stage | Skill | Output |
|---|---|---|
| PM | `product-manager` | `docs/product/01-pm-brief.md` |
| UX | `ux` | `docs/product/02-ux-workflow.md` plus optional wireframes |
| UI | `ui` | `docs/product/03-ui-direction.md` plus optional mockups |
| Architect | `architect` | `docs/product/04-architecture.md` plus optional diagrams |
| Engineer | `engineer` | Code changes plus `docs/product/05-implementation.md` |
| QA | `qa` | QA report with verdict and findings |

Each role has the same high-level contract: establish the active project, detect
mode, read upstream artifacts, do its work, write its artifact/checkpoint state,
record deferred items in backlog, recommend the next stage, and stop.

## Quality roles

`critic` reviews PM/UX/UI artifacts before approval. It reports to the human gate
and does not decide.

`technical-critic` reviews architect/engineer/QA artifacts and code. It is a
single-pass quality gate: findings are tagged APPLY or DEFER. APPLY findings are
written to `pendingFeedback` for the engineer to auto-apply without human
confirmation; DEFER findings go to backlog. The human reviews the final result at
QA.

## Orchestrator implementation

The orchestrator skill is the front door. It:

- Creates or loads `~/.agent-c/registry.json`.
- Refreshes registry entries from each project's `state.json`.
- Shows the text dashboard.
- Always prints "What needs your attention" after the dashboard.
- Supports `new`, `resume`, `switch`, `adopt`, `repoint`, `remove`, and
  `dashboard`.
- Presents approval gates with approve, request changes, edit myself, pause, and
  run critic options.
- Writes sequencing state and pending user feedback.

The orchestrator does not write stage artifacts, run stages, or modify role-owned
checkpoints/revision counters.

## State and artifacts

Per-project lifecycle state lives at:

- Product track: `<project>/docs/product/state.json`
- Feature track: `<project>/docs/features/<slug>/state.json`

The global registry at `~/.agent-c/registry.json` is a cache/index. It mirrors the
current project list and stage status so dashboards can list projects quickly.

Artifacts are Markdown so the user can inspect, edit, diff, and commit them. This
is the main implementation mechanism for context preservation across stages.

## Code wrappers

`agent-defs/` contains one thin wrapper per dispatchable role: six lifecycle
stages plus the two critics. Wrappers are Claude Code-only. Each wrapper prefers
invoking the matching skill via the Skill tool and falls back to reading the
canonical `~/.claude/skills/<name>/SKILL.md`.

The wrappers intentionally do not duplicate role logic. The implementation keeps
the `SKILL.md` files as the source of truth.

## Dashboard sub-product

The dashboard is a complete Electron + React app under `dashboard/`. It has its
own product artifact chain in `dashboard/docs/product/` and its own tests. It reads
Agent-C registry/state files, computes read-only git state, and displays the same
approval/action information as a GUI surface.

Current dashboard stack:

| Layer | Choice |
|---|---|
| App shell | Electron 33 |
| Build | electron-vite / Vite 5 |
| UI | React 18 + TypeScript |
| State | Zustand |
| File watching | chokidar |
| Tests | Vitest + Testing Library |

## Test and verification status

This implementation pass did not add production code, so no new TDD cycle was
required for Agent-C itself. The dashboard sub-product already has automated test
coverage for registry/state readers, watcher service, git service, persistence,
store behavior, and UI components.

Verification to run before QA:

```bash
cd dashboard
npm test
npm run lint
```

The QA report records the actual results from this pass.

## Deferred items recorded

- Formal recovery UX for corrupt registry/state files.
- Installer/package distribution beyond symlink setup.
- Fully autonomous Code subagent dispatch.
- Future CLI surface and any OS-level notifications.

## Next handoff

QA -> reads 01/02/03/04/05 and verifies the implementation against the artifacts.
