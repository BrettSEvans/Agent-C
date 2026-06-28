# Implementation — Agent-C Dashboard

> Built by the engineer from 01–04. Last updated: 2026-06-28.
> Reflects all post-QA fixes and post-engineering visual iterations.

## What was built

A local-only Electron desktop app (macOS/Linux/Windows) that reads
`~/.agent-c/registry.json` and per-project `state.json` files to show a live
dashboard of all Agent-C projects — stage, status, approval needs, git state,
and uncommitted file list.

## Stack

| Layer | Choice | Notes |
|---|---|---|
| App shell | Electron 33 | contextIsolation ON, nodeIntegration OFF |
| Build | electron-vite 2 (Vite 5) | 3-target: main / preload / renderer |
| Frontend | React 18 + TypeScript | |
| State | Zustand 5 | SWR pattern for git cache |
| File watching | chokidar 3 | registry.json + all state.json files |
| Git concurrency | inline `createLimiter(6)` | replaced p-limit (ESM-only, crashes Electron CJS main) |
| Font | @fontsource/space-grotesk | bundled 400/500/600/700 — no CDN, offline-first |
| Tests | Vitest 2 + @testing-library/react 16 | 68 tests across 7 suites |

## How to run

```bash
cd dashboard
npm install
npm run dev       # start Electron in dev mode (hot-reload)
npm run build     # production build → out/
npm test          # run the test suite
```

**Registry path override:** `AGENT_C_REGISTRY=/path/to/registry.json`

## Files

```
dashboard/
├── package.json
├── electron.vite.config.ts
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── vitest.config.ts
└── src/
    ├── shared/types.ts                           # shared types incl. UncommittedFile, GitState
    ├── test-setup.ts
    ├── main/
    │   ├── index.ts                              # Electron main process
    │   ├── ipc/handlers.ts                       # ipcMain registrations + SWR cache
    │   └── services/
    │       ├── registry-reader.ts                # tolerant registry.json parser
    │       ├── state-reader.ts                   # tolerant state.json parser
    │       ├── git-service.ts                    # parseStatusFiles, parseRevListOutput,
    │       │                                     #   createGitService(execFileFn),
    │       │                                     #   gitService (cap-6 via createLimiter)
    │       ├── watcher-service.ts                # chokidar EventEmitter
    │       ├── persistence.ts                    # MRU recent list + git cache (userData JSON)
    │       └── clipboard-service.ts              # copyText(text) — copies arbitrary prompt text
    ├── preload/index.ts                          # contextBridge window.api (incl. copyText)
    └── renderer/
        ├── index.html                            # no external font/CDN links; tight CSP
        └── src/
            ├── main.tsx                          # mounts app; imports @fontsource weights
            ├── App.tsx                           # root + IPC wiring + handleSelectProject
            ├── lib/metal.ts                      # useMetalStyle() hook — random --rx/--ry
            ├── store/index.ts                    # Zustand store + filteredProjects + SWR
            ├── styles/globals.css                # full design system (see Visual design below)
            └── components/
                ├── Sidebar.tsx                   # search, recent, all-projects, metal badges
                ├── ProjectDetail.tsx             # detail pane, info button + popup, Claude Prompt
                ├── FeatureDetail.tsx
                └── Footer.tsx
```

## Key implementation decisions

**Tolerant parsing:** both readers ignore unknown fields, default missing optionals,
and warn on schema version mismatch — guards against orchestrator/dashboard drift.

**git-service dependency injection:** `createGitService(execFileFn)` takes the
exec function as a parameter so unit tests pass a mock. `parseStatusFiles(output)`
replaces the original `parseStatusOutput` — it returns `UncommittedFile[]`
(statusCode, label, path) instead of a count; the count is derived from `.length`.

**Inline concurrency limiter:** `p-limit` (all versions ≥ 4) is ESM-only and
crashes Electron's CJS main process with `ERR_REQUIRE_ESM`. Replaced with a
12-line `createLimiter(n)` function in `git-service.ts` — same cap-6 semantics,
zero external dependency.

**SWR pattern:** `isStale(path)` checks git cache age > 30 s. `handleSelectProject`
in App.tsx calls `addRecent` + `loadGitState`; this is the only entry point for
selecting a project — Sidebar receives it as an `onSelect` prop so the recent list
and SWR revalidation are never bypassed.

**useMetalStyle() hook:** returns a stable `{ '--rx': string, '--ry': string }`
object seeded randomly once per component mount (via `useRef`). Inlined as `style`
on every `.btn` and `.sidebar-item__stage` element. CSS uses `var(--rx, 50%)`
and `var(--ry, 30%)` in radial gradients so each element has a unique focal point
that varies on every reload.

**Security:** `contextIsolation: true`, `nodeIntegration: false`; contextBridge
exposes only the allow-listed `window.api`; git uses `execFile` with arg arrays.

## Post-QA fixes applied (2026-06-28)

| ID | Issue | Fix |
|---|---|---|
| S1 | p-limit installed but not wired into production `gitService` | Added `createLimiter(6)` wrapping `execFileAsync` in the production singleton |
| S2 | `Sidebar` called `selectProject` from the store directly, bypassing `handleSelectProject` in App.tsx (recent list + SWR revalidation skipped) | `Sidebar` now accepts `onSelect` prop; App.tsx passes `handleSelectProject` |
| S3 | Space Grotesk loaded from Google Fonts CDN (offline-first violated; external font CSP) | Bundled via `@fontsource/space-grotesk`; CDN `<link>` and external font CSP entries removed |

## Visual design (current — see also 03-ui-direction.md §Post-approval evolution)

The implemented visual style diverged from the original direction during engineering.
The authoritative description of what was actually built is in
`03-ui-direction.md` under **Post-approval design evolution**. Summary:

- **Light model:** Radial point source (not horizontal brush stripes). CSS
  `radial-gradient(ellipse at var(--rx) var(--ry), …)` — focal point randomised
  per button per reload via `useMetalStyle()`.
- **Buttons:** Polished grey steel plates — radial surface, inset bevel rim
  (bright top, dark bottom), 10px radius, 1px press on `:active`.
- **Sidebar stage badges:** Metallic blue radial gradient (bright `#88d0f0` →
  deep navy `#0a2e52`) with bevel. Same light model as buttons.
- **Stage badge (detail pane):** Grey radial steel — visually distinct from
  sidebar badges.
- **Panel borders:** Inset bevel box-shadows simulate raised metal panels
  (git card, approval warning, footer).
- **Sidebar right border:** 13px brushed grey metal strip via `::after`
  (≈ 2/3 the height of the stage badge).
- **Uncommitted file list:** Colour-coded status pills (amber/green/red/blue/grey)
  shown in the git state card when `uncommittedFiles.length > 0`.
- **Approval warning row:** replaced plain text with an inline layout — circular
  brushed-steel ⓘ info button (radial gradient, teal `--accent` border + glow ring,
  serif italic "i") left of a descriptive line. Clicking the button opens a modal
  popup with stage/status detail, revision/critic-pass counts, full pending-feedback
  text, and a "next step" line.
- **"Claude Prompt" button:** renamed from "Open in orchestrator". Copies a
  context-aware prompt built from stage, status, pendingFeedback, and git state:
  revision prompt when feedback is pending; `/orchestrator <name>` when awaiting
  approval with no feedback; next-stage advancement prompt when approved and clean;
  commit reminder when git work is outstanding.
- **"Claude Prompt" toast:** 5-second inline status message after click.

## Test suite (current)

```
 ✓ src/main/services/__tests__/registry-reader.test.ts   (6 tests)
 ✓ src/main/services/__tests__/state-reader.test.ts      (6 tests)
 ✓ src/main/services/__tests__/git-service.test.ts      (15 tests)
 ✓ src/main/services/__tests__/persistence.test.ts       (7 tests)
 ✓ src/renderer/src/store/__tests__/store.test.ts        (11 tests)
 ✓ src/renderer/src/components/__tests__/Sidebar.test.tsx      (7 tests)
 ✓ src/renderer/src/components/__tests__/ProjectDetail.test.tsx (27 tests)

 Test Files  7 passed (7)
      Tests  79 passed (79)
```

| Suite | Behaviors covered |
|---|---|
| registry-reader | valid parse; unknown-field tolerance; schema mismatch warning; missing file; corrupt JSON; optional field defaults |
| state-reader | valid parse; missing stage defaults; missing file; corrupt JSON; schema version; pendingFeedback preservation |
| git-service | `parseStatusFiles` (empty, blank lines, M/M /??/A /D /, multi-file); `parseRevListOutput`; happy path with file list; clean tree; no-upstream; git-not-found → failed |
| persistence | recent save/load; dedup + MRU; trim to 10; git cache save/update/null miss |
| store | initial state; setProjects; selectProject; updateGitState; isStale fresh/stale/unknown; addRecent dedup; search filter; empty search |
| Sidebar | search input; project list; approval flag; click → onSelect prop; search filter; recent section conditional; no recent section when empty |
| ProjectDetail | name/badge/revisions; approval warning present/absent; revision-requested vs awaiting-approval text; info button visible/hidden; popup opens on click; popup shows feedback text; popup closes; Claude Prompt button + copyText API call; orchestrator prompt when no feedback; revision prompt when feedback set; next-stage prompt when approved+clean; toast shows/hides/absent; cached age; failed state; file list paths/labels/absent-when-clean |

**Visual-only surfaces (not unit-tested — deferred to QA visual/a11y pass):**
- Radial gradient focal point randomisation (visual output of `useMetalStyle`)
- Brushed-steel sidebar texture (repeating-linear-gradients)
- Hover/active/focus transition animations
- WCAG AA contrast verification
- Sidebar 13px border strip appearance

## Build

```
out/main/index.js          ~12 kB
out/preload/index.js        ~1 kB
out/renderer/index.html    ~0.9 kB
out/renderer/assets/       ~17 kB CSS + ~231 kB JS + ~130 kB woff/woff2 fonts
```

Build: clean. TypeScript: clean.

## Next handoff

QA → re-verify against artifacts (this is the second engineer pass; S1–S3 are
fixed). Visual/a11y pass should cover the polished-steel button and badge
rendering, sidebar border strip, and toast behaviour.
