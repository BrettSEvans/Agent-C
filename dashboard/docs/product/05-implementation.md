# Implementation — Agent-C Dashboard

> Built by the engineer from 01–04. Read by QA next.
> Date: 2026-06-28

## What was built

A local-only Electron desktop app (macOS/Linux/Windows) that reads
`~/.agent-c/registry.json` and per-project `state.json` files to show a live
dashboard of all Agent-C projects — stage, status, approval needs, and git state.

## Stack

| Layer | Choice |
|---|---|
| App shell | Electron 33 |
| Build | electron-vite 2 (Vite 5, 3-target: main / preload / renderer) |
| Frontend | React 18 + TypeScript |
| State | Zustand 5 |
| File watching | chokidar 3 |
| Git concurrency | p-limit 6 |
| Tests | Vitest 2 + @testing-library/react 16 |

## How to run

```bash
cd dashboard
npm install
npm run dev       # start Electron in dev mode (hot-reload)
npm run build     # production build → out/
npm test          # run the test suite
```

**Registry path override (for tests/dev):**
Set `AGENT_C_REGISTRY=/path/to/registry.json` to point at a non-default registry.

## Files created

```
dashboard/
├── package.json
├── electron.vite.config.ts
├── tsconfig.json / tsconfig.node.json / tsconfig.web.json
├── vitest.config.ts
└── src/
    ├── shared/types.ts                           # shared type definitions
    ├── test-setup.ts                             # jest-dom matchers
    ├── main/
    │   ├── index.ts                              # Electron main process
    │   ├── ipc/handlers.ts                       # ipcMain registrations
    │   └── services/
    │       ├── registry-reader.ts                # parses registry.json (tolerant)
    │       ├── state-reader.ts                   # parses state.json (tolerant)
    │       ├── git-service.ts                    # execFile git, cap-6 throttle
    │       ├── watcher-service.ts                # chokidar watcher
    │       ├── persistence.ts                    # userData JSON (recent + git cache)
    │       └── clipboard-service.ts              # /orchestrator copy
    ├── preload/index.ts                          # contextBridge window.api
    └── renderer/
        ├── index.html
        └── src/
            ├── main.tsx
            ├── App.tsx                           # root + IPC wiring
            ├── store/index.ts                    # Zustand store + SWR logic
            ├── styles/globals.css                # brushed-steel texture, palette
            └── components/
                ├── Sidebar.tsx
                ├── ProjectDetail.tsx
                ├── FeatureDetail.tsx
                └── Footer.tsx
```

## Key implementation decisions

- **Tolerant parsing in both readers:** unknown fields ignored; missing optional
  fields defaulted; schema version mismatch produces a warning, not a crash.
  Guards against schema drift between orchestrator and dashboard versions.

- **git-service uses dependency injection (`createGitService(execFileFn)`):**
  production uses `child_process.execFile`; tests pass a mock. This makes the
  git parsing logic (status porcelain, rev-list) fully unit-testable without
  spawning real git processes.

- **SWR pattern in the store:** `isStale(path)` checks whether the git cache
  entry is older than 30 seconds. App.tsx triggers revalidation on project open
  (stale-while-revalidate: show cached immediately, fetch fresh in background).

- **Background batch git on startup:** `App.tsx` fires `loadGitState` for all
  projects concurrently without awaiting — the cap-6 concurrency limit in
  `git-service.ts` is enforced by `p-limit` inside the production `gitService`
  instance. (The production `gitService` singleton exports `p-limit`-wrapped
  `execFile`; the test factory bypasses this so the mock receives raw calls.)

- **Freshness contract:** the watcher watches `registry.json` + all
  `state.json` files. On `registry-changed`, the app re-reads all entries and
  refreshes state for each. This depends on the orchestrator touching
  `registry.json` on every transition (documented dependency in `04-architecture.md`).

- **Security:** `contextIsolation: true`, `nodeIntegration: false`;
  `contextBridge` exposes only the allow-listed `window.api`; git invocations
  use `execFile` with arg arrays (no shell interpolation).

## Test suite results

```
 ✓ src/main/services/__tests__/registry-reader.test.ts (6 tests)
 ✓ src/main/services/__tests__/state-reader.test.ts    (6 tests)
 ✓ src/main/services/__tests__/git-service.test.ts     (9 tests)
 ✓ src/main/services/__tests__/persistence.test.ts     (7 tests)
 ✓ src/renderer/src/store/__tests__/store.test.ts      (11 tests)
 ✓ src/renderer/src/components/__tests__/Sidebar.test.tsx     (7 tests)
 ✓ src/renderer/src/components/__tests__/ProjectDetail.test.tsx (10 tests)

 Test Files  7 passed (7)
      Tests  56 passed (56)
```

**TDD evidence — what each test file pins down:**

| File | Behaviors covered |
|---|---|
| registry-reader | valid parse; unknown-field tolerance; schema mismatch warning; missing file; corrupt JSON; missing optional field defaults |
| state-reader | valid parse; missing stage defaults; missing file; corrupt JSON; schema version; pendingFeedback preservation |
| git-service | `parseStatusOutput`; `parseRevListOutput`; happy path (uncommitted + unpushed); no-upstream (unpushed = 0); git-not-found → failed |
| persistence | recent save/load; dedup + MRU; trim to 10; git cache save/update/null miss |
| store | initial state; setProjects; selectProject; updateGitState; isStale fresh/stale/unknown; addRecent dedup; search filter; empty search |
| Sidebar | search input render; project list render; approval flag; click → selectProject; search filter; recent section conditional |
| ProjectDetail | name heading; stage badge; revision count; approval warning; no warning when in-progress; uncommitted/unpushed counts; Open in orchestrator button + click; cached age label; failed state |

**Visual-only surfaces deferred to QA's visual/a11y pass:**
- Brushed-steel CSS texture (repeating-linear-gradients, radial patches)
- Space Grotesk font loading
- Color palette custom properties
- Hover/focus transition animations (0.15s ease)
- WCAG AA contrast check

## Build results

```
out/main/index.js        11.93 kB
out/preload/index.js      1.20 kB
out/renderer/index.html   0.88 kB
out/renderer/assets/      10.05 kB CSS + 230.57 kB JS
```

Build: clean (no errors, no warnings beyond Vite CJS deprecation notice).
TypeScript: clean (`tsc --noEmit` exits 0).

## Next handoff

QA → reads `01`–`05`, derives acceptance criteria from the artifacts, and
verifies the implementation. Visual/a11y pass covers the deferred styling surfaces.
