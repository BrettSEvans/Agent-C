# QA Report — Agent-C

> Verification of Agent-C against its product artifacts. Written by the QA agent
> from 01-05. Date: 2026-06-29.

## Verdict

**Pass with documented residual risks.**

Agent-C now has a complete self-dogfooding artifact chain (`01` through `05` plus
this QA report), the top-level docs reflect the current platform reality, and the
dashboard sub-product's automated checks pass. Remaining issues are non-blocking
process/design debt already recorded in backlog or open questions.

## Acceptance criteria

| Criterion | Source | Result |
|---|---|---|
| Solo developer can move idea -> shipped through PM, UX, UI, architect, engineer, QA | `01-pm-brief.md` | Pass: all six role skills exist and document the artifact handoff contract. |
| Each stage produces a reviewable artifact before advancement | `01`, `02`, `04` | Pass: artifact chain exists for Agent-C itself through QA. |
| User controls approval and revision gates | `02-ux-workflow.md`, `04-architecture.md` | Pass: orchestrator owns gates; stages return control and never advance themselves. |
| Context persists across sessions | `01`, `04`, `05` | Pass: Markdown artifacts plus `state.json`/registry protocol preserve state. |
| Cross-surface pending actions are visible | `02`, orchestrator skill | Pass: invariant documented in UX workflow and orchestrator contract. |
| Dashboard is documented as a system surface | `04`, README | Pass: top-level architecture and README now describe `dashboard/`. |

## Functional verification

| Area | Evidence | Result |
|---|---|---|
| Skills present | `agents/` contains 13 `SKILL.md` files: 4 shared methods, 6 lifecycle roles, 2 critics, orchestrator. | Pass |
| Wrapper definitions | `agent-defs/` contains wrappers for six lifecycle stages plus both critics. README now states they are prepared for future Code dispatch. | Pass |
| Artifact chain | `docs/product/01-pm-brief.md`, `02-ux-workflow.md`, `03-ui-direction.md`, `04-architecture.md`, `05-implementation.md`, and `qa-report.md` exist. | Pass |
| Approval gate behavior | Orchestrator skill defines approve, request changes, edit myself, pause, and run critic options. | Pass |
| Technical critic auto-apply | Engineer and technical-critic skills plus wrappers document `pendingFeedback.source == "critic"` auto-apply. | Pass |
| Cross-surface notification | UX workflow and orchestrator require every `needsYou: true` entry to appear on all active surfaces. | Pass |

## Build and tests

Commands run in `dashboard/`:

```bash
npm test
npm run lint
```

Results:

- `npm test`: **8 test files passed, 97 tests passed**.
- `npm run lint`: **passed** (`tsc --noEmit`).

The test suite covers watcher service behavior, registry/state readers, git
service parsing and failures, persistence, Zustand store behavior, sidebar
interaction, and project-detail prompting/popup behavior.

## Design and architecture conformance

| Check | Result |
|---|---|
| Text-first workflow remains usable without GUI | Pass |
| Electron dashboard is framed as an additional surface, not a replacement | Pass |
| Dashboard visibility is present in top-level architecture and README | Pass |
| "Recommend, don't auto-chain" is preserved with a technical-critic carve-out | Pass |
| Source-of-truth state model is documented as `state.json` plus registry cache | Pass |
| Code wrapper logic remains thin and points to canonical skills | Pass |

## Non-functional checks

- **Local-first:** Pass. Docs preserve the no-backend/no-account boundary.
- **Accessibility baseline:** Pass for documentation: text surfaces do not rely on
  color; dashboard-specific a11y remains covered by the dashboard artifact chain.
- **Maintainability:** Pass. One source of truth for role behavior remains the
  canonical `SKILL.md` files.
- **Recovery:** Minor issue. Registry/state corruption recovery is not fully
  designed; it is now explicitly recorded in `docs/product/backlog.md`.
- **Distribution:** Minor issue. Symlink-based install remains a v1 constraint;
  packaging remains open.

## Regression and drift checks

Search checks found no active top-level contradictions that still claim Agent-C is
only "not Code" or has no GUI in the current product statement. Historical critic
reports still quote the old wording; those should remain unchanged as audit
artifacts.

The dashboard test suite passing confirms the documentation changes did not
affect the dashboard codebase.

## Issues

| Severity | Issue | Recommendation |
|---|---|---|
| Minor | Formal recovery for corrupt registry/state files is still open. | Design during a future architecture/QA pass; backlog item added. |
| Minor | Installer/package distribution is unresolved. | Keep as post-v1 distribution work. |
| Minor | Autonomous Code dispatch is prepared through wrappers but not implemented. | Implement only after manual orchestrator workflow remains stable. |

## Recommendation

Agent-C is ready to present as a complete self-dogfooded v1 artifact chain, with
minor residual risks tracked for future work.
