# CRITIC REPORT — Architecture — Agent-C Dashboard

Artifact: docs/product/04-architecture.md (reviewed as decisions-in-conversation;
doc written after this review incorporating the resolutions)
Pass: 1
Status: ISSUES RAISED → RESOLVED (decisions updated before the doc was written)

> Scope note: the `critic` skill is formally scoped to PM/UX/UI artifacts only.
> This architecture review was requested explicitly and applies the same
> eight-dimension rigor as an extension. It is not an in-scope critic gate.

## Issues found

### Significant (blocking until resolved)

1. **File-watching vs. sidebar freshness (coherence/omission).** "Watch state.json
   only on open" left un-opened sidebar rows stale — contradicting the brief's #1
   value (at-a-glance freshness) and metric #3.
   **Resolved:** orchestrator touches `registry.json` on every state transition;
   dashboard watches registry.json + all state.json; git stays lazy.

2. **"Open in orchestrator" had no mechanism (omission).** Headline cross-app
   action was unspecified.
   **Resolved:** v1 = copy `/orchestrator <project>` to clipboard; real launch
   protocol deferred to v2.

3. **Sidebar git icon vs. lazy git (coherence).** UX wants a git icon per row;
   lazy-per-open can't populate it without computing all repos.
   **Resolved:** background batch git compute with concurrency cap (6),
   cache-first; icons fill progressively.

### Worth fixing (folded into the doc)

4. **SWR ambiguity** — resolved as the *pattern* inside Zustand, not the `swr`
   library (avoids two overlapping cache systems over IPC).
5. **Git concurrency undefined** — shared limiter, cap 6.
6. **"Unpushed to GitHub" misleading offline** — redefined as "ahead of last-fetched
   remote ref," no network/fetch, labeled in UI.
7. **Schema-drift coupling** — `schemaVersion` + tolerant parsing; canonical schema
   to be owned/versioned by stage-protocol.
8. **child_process injection surface** — `execFile` with arg arrays + `cwd`, never
   shell strings.

### Minor (confirmed)

9. **TypeScript** explicitly chosen (typed IPC bridge depends on it).
10. **electron-vite** named as the main/preload/renderer build integration.
11. **Stale cache across restarts** — revalidate on launch + show age honestly.

## Notes

Stack choices (Electron, Vite+React, Zustand, preload bridge, child_process) were
sound and current best practice on first review — no changes. All problems were at
the **seams** (watching, cross-app launch, sidebar git), now resolved in
`04-architecture.md` under "Decisions (confirmed)."

Action: Proceed to approval gate. Human reviews this report + `04-architecture.md`.
