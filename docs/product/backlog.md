# Agent-C — Backlog

> Deferred items captured during the lifecycle so they aren't lost. Not scoped to
> v1. Each entry: what, why deferred, where it came up.

## Edge cases / off-happy-path (deferred from UX stage, 2026-06-23)

- **Hand-edit / artifact conflict reconciliation** — the user edits an artifact
  file directly while the orchestrator also tracks it. Agent should detect the
  external edit and respect the user's version rather than overwrite. *Deferred:*
  needs the registry/state mechanism (architect stage) to detect changes.
- **Stale registry entry (missing folder)** — a registered project's folder was
  moved/deleted. Dashboard should flag it `unreachable` and offer repoint/remove
  instead of crashing. *Deferred:* depends on registry design; shown in the
  dashboard wireframe for shape only.

## Notes
- "Stage run out of order" is NOT here — it's handled in v1 (each stage skill
  checks for its required input and stops).
- Add new deferred items here as later stages surface them.
