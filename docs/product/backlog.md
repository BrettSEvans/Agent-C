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

## User-customized skills (deferred from critic review, 2026-06-24)

- **Per-user skill customization** — Agent-C should know which user is running it
  and generate personalized sub-skills tailored to that user (their preferences,
  past projects, workflow). This requires user identification / login. *Deferred to
  post-v1* because v1 is single-user/personal-machine context; full value of
  per-user skills emerges when the tool is shared or used by teams. Requires
  implementation of user handling, identity, and skill generation/persistence.
  Build for: post-v1 or future phase when multi-user context is relevant.

## Process / skill notes (deferred from UX gap-review, 2026-06-23)

- **Gap #3 — orchestrator-UX sequencing tension.** Defining the UX of Agent-C
  forces decisions about the *orchestrator's* interaction (dashboard, registry
  states, command surface, skip-stage) even though the orchestrator is built last.
  When building the orchestrator/architect stages, treat `02-ux-workflow.md`'s
  touchpoints/states/commands as input requirements rather than re-deriving them.
- **Gap #5 — states vs. edge cases overlap (minor).** In the UX skill, theme 4
  (states & feedback) and theme 5 (edge cases) blur (e.g. revision count is both).
  Low priority wording cleanup for a future skill edit.

## Notes
- "Stage run out of order" is NOT here — it's handled in v1 (each stage skill
  checks for its required input and stops).
- Add new deferred items here as later stages surface them.
