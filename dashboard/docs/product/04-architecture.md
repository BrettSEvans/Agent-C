# Architecture — Agent-C Dashboard

> The product's technical architecture — structure and key decisions, not code.
> Written by the architect from 01-pm-brief.md, 02-ux-workflow.md, and
> 03-ui-direction.md. Read by the engineer next (implementation).
> Product type: GUI app (Electron desktop, local-first). Date: 2026-06-28

## 1. Architectural drivers & constraints

The architecture optimizes for, in priority order:

1. **Freshness / never-out-of-sync** (primary) — the dashboard must reflect actual
   registry/state on disk. Success metric #3 ("never out of sync") and the brief's
   #1 risk both point here. This drives the watching and refresh design.
2. **Fast first paint** — all projects + stage + status visible in <5s (metric #1).
   Drives: cheap reads (registry + state.json) on the hot path; expensive work
   (git) pushed off the critical path.
3. **Offline-first & local-only** — no backend, no network. All data from
   `~/.agent-c/` and local project paths via local git. Drives: no fetch; "unpushed"
   is defined against the last-fetched remote ref (see §8).
4. **Scale 20–100 projects** — sidebar virtualized/scrollable; git computation
   throttled, not fanned out unbounded.
5. **Maintainability for a solo dev** — current best-practice stack, minimal moving
   parts, typed seams.

**Hard constraints:** single-user (no concurrency/locking); read-only with respect
to registry/state and git (the dashboard never writes them or runs git mutations);
cross-platform (macOS/Linux/Windows).

## 2. System context & boundaries

**Inside the boundary (the dashboard owns):**
- Reading & parsing `~/.agent-c/registry.json` and per-project
  `docs/product/state.json`.
- Computing git state by invoking local `git` (read-only commands).
- Watching the filesystem for changes and re-reading.
- Its own persisted data (recently-opened list, git-state cache) in Electron
  userData.

**Outside the boundary (the dashboard depends on, never mutates):**
- **Orchestrator / stage-protocol** — sole writer of `registry.json` and
  `state.json`. The dashboard is a pure reader. *Contract dependency:* the
  orchestrator **touches `registry.json` on every state transition** so a single
  registry watcher is a reliable "something changed" signal (resolves freshness for
  un-opened projects — see §4).
- **Local git** — the `git` binary on PATH; repos at each project path.
- **Claude Desktop / CLI** — the target of the "Open in orchestrator" action.
  v1 integration is **clipboard hand-off** (copy `/orchestrator <project>`), not a
  direct invocation (no reliable cross-app deep-link exists; see §6/ADR).

## 3. Architecture style & major components

**Style:** Standard Electron two-process split with a typed preload bridge.
Node-side services (I/O, git, watching) in the **main** process; React SPA in the
**renderer**; a thin, allow-listed **preload** bridge between them. This is the
secure, current-best-practice Electron shape (context isolation on, node
integration off in the renderer).

```
Main process (Node)                Preload (contextBridge)        Renderer (React+Vite)
─────────────────────              ──────────────────────         ─────────────────────
registry-reader  ─┐                                               Zustand store
state-reader      │   ipcMain.handle(...)   window.api.*   ◀────▶ (projects, selection,
git-service ──────┼──────────────────────▶  (typed, allow-       gitCache, syncStatus,
watcher-service   │   ◀── ipc events ──      listed surface)      recent)
persistence       │                                               SWR-pattern git logic
clipboard-service ┘                                               components (Sidebar,
                                                                  Detail, Footer, …)
```

**Main-process services:**
- **registry-reader** — loads/parses `registry.json`; tolerant parse + schema
  version check (§6).
- **state-reader** — loads/parses each project's `state.json`; same tolerance.
- **git-service** — runs `git status --porcelain` and `git rev-list
  @{u}..HEAD` (and counterpart) via `execFile` with an arg array and `cwd`;
  throttled by a concurrency limiter (cap 6).
- **watcher-service** — chokidar; watches `registry.json` plus every project's
  `state.json`; emits change events to the renderer.
- **persistence** — reads/writes the recently-opened list and git-state cache in
  Electron userData.
- **clipboard-service** — `copyText(text)` writes arbitrary text to the clipboard;
  the renderer builds the context-aware prompt and passes it in.

**Renderer:**
- **Zustand store** — single source of UI truth: projects, selected project, git
  cache (with timestamps), sync status, recently-opened, loading/error flags.
- **SWR-pattern logic** — stale-while-revalidate implemented *inside the store*
  (not the `swr` library): render cached git immediately, revalidate via
  `window.api.getGitState`, replace when fresh. (See ADR for why pattern, not lib.)
- **Components** — Sidebar (search, recent, all-projects, virtualized list),
  ProjectDetail, FeatureDetail, GitState, Footer. Styling per `03-ui-direction.md`.

## 4. Runtime behavior & key scenarios

**Concurrency model:** all blocking work runs in the **main** process; the renderer
only awaits IPC promises. File reads run in parallel (cheap). Git invocations are
throttled through a single shared concurrency limiter (cap 6) so a 100-repo batch
never spawns 100 git processes at once.

**Startup (cold load):**
1. `registry-reader` loads the project list → renderer renders the sidebar with
   name/stage/status/approval (from state.json) — this is the <5s hot path; **no
   git on it**.
2. `state-reader` reads all `state.json` in parallel to populate stage/status/
   approval/revisions.
3. **Background batch git** kicks off: git-service computes git state for all
   projects through the cap-6 limiter; sidebar git-sync icons fill in
   progressively as results land (icon shows "unknown/…" until first result, or
   the persisted cache value).
4. `watcher-service` starts watching `registry.json` + every `state.json`.

**Open a project (right pane):** selection shows state.json fields immediately;
git follows the **SWR pattern** — cached value rendered instantly with its age,
a background revalidate runs, the pane updates when fresh.

**Orchestrator state transition (the freshness path):** orchestrator writes a
state.json *and touches `registry.json`* → registry watcher fires → re-read
registry + all state.json → diff into the store → sidebar badges update; add/remove
state.json watchers for any added/removed projects. This is what keeps **un-opened**
projects current in the sidebar.

**Manual refresh:** the refresh button calls `window.api.refreshGit(path)`, which
bypasses cache and recomputes that project's git state now.

**Claude Prompt:** `clipboard-service` copies a context-aware prompt built in the
renderer from stage, status, pendingFeedback, and git state (revision prompt /
orchestrator hand-off / next-stage advancement / commit reminder). A circular
brushed-steel info button in the approval warning row opens a popup with the full
approval detail. The UI shows a brief "copied — paste into Claude" toast.

## 5. Data model & state

**Source of truth = files on disk** (`registry.json`, `state.json`). The dashboard
holds only a *derived, in-memory* projection plus a *cache*; it never writes the
sources.

Core entities:
- **Project** (from registry.json): `path` (identity key), `name`, `type`
  (product | feature), `parentPath?` (for Mode C features), `lastUpdated`.
- **ProjectState** (from state.json): `schemaVersion`, `stage`, `status`,
  `revisions`, `pendingFeedback?`, `checkpoint?`, `criticPasses?`, `features?`.
- **GitState** (computed, cached): `uncommittedCount`, `unpushedCount` (ahead of
  last-fetched remote ref), `computedAt`, `status` (fresh | cached | computing |
  failed), `lastKnown?` (for fallback display).
- **Dashboard-owned** (userData): `recentlyOpened[]` (≤10, MRU), `gitCache{path →
  GitState}`.

State changes propagate one direction: **disk → watcher → store → UI**. The git
cache is the only thing the store mutates on its own (write-through to userData).

## 6. Interfaces & contracts

**Preload bridge (`window.api`, typed, promise-based):**
- `listProjects(): Project[]` — read registry.
- `readState(path): ProjectState` — read one state.json.
- `getGitState(path): GitState` — cached-or-compute (SWR revalidation entry).
- `refreshGit(path): GitState` — force recompute.
- `onRegistryChange(cb)` / `onStateChange(path, cb)` — push events from watchers.
- `copyOrchestratorCommand(project): void` — clipboard hand-off.
- `getRecent()` / `addRecent(path)` — persisted MRU list.

**File contracts (read-only, tolerant):**
- Both `registry.json` and `state.json` carry a `schemaVersion`. The readers parse
  tolerantly: unknown fields ignored; missing optional fields defaulted; on a
  *major* schemaVersion the dashboard couldn't decode, it surfaces the
  "incomplete/old data" warning (UX §4) rather than crashing. This guards against
  **schema drift**, not just corrupt JSON.

**External seam — git:** read-only commands only (`status --porcelain`,
`rev-list`), invoked with `execFile(file, [args], {cwd})` — never a shell string —
so user/orchestrator-supplied paths can't inject.

## 7. Key technical decisions

| Decision | Choice | Rationale | Alternatives considered | Consequences |
|---|---|---|---|---|
| Delivery | **Electron desktop app** | Native Node APIs for git + file watching; persistent window; cross-platform | Local dev server; static HTML | Heavier install; full Node access (easier) but must enforce context isolation |
| Frontend | **React + Vite** (+ **electron-vite** for main/preload/renderer bundling) | Current best-practice React tooling; fast HMR; electron-vite handles the 3-target build | CRA (declining); Next.js (SSR overkill); webpack (more config) | Modern, fast; electron-vite is the integration piece the engineer must use |
| Language | **TypeScript** | Type-safe IPC contract across the preload bridge; 2024–25 default | Plain JS | Slightly more setup; types make the bridge + file schemas safe |
| State mgmt | **Zustand** | Minimal boilerplate; no provider tree; fits projects/selection/cache | Redux (overkill); Context+useReducer (more wiring) | Simple store; team must keep store cohesive |
| Git caching | **Stale-while-revalidate as a pattern inside Zustand** | Instant render + background refresh without a second cache system over IPC | `swr`/React Query library (built for HTTP keys, redundant with Zustand here) | We hand-roll revalidate logic; avoids two overlapping state systems |
| Git exec | **Node `child_process.execFile`** | Direct, reliable, offline; arg-array form avoids shell injection | isomorphic-git/WASM (slower); simple-git (extra dep) | We own parsing; must throttle (below) |
| Git concurrency | **Shared limiter, cap 6** (e.g. p-limit) | Bounds resource use across 100 repos; keeps UI responsive | Unbounded fan-out (resource spikes); serial (too slow) | Predictable load; large batches take longer but never thrash |
| File watching | **chokidar: registry.json + all state.json**; git stays lazy | Keeps the *sidebar* (state-driven) live for un-opened projects; relies on orchestrator touching registry on every transition | Watch-on-open only (sidebar goes stale — rejected); watch whole `~/.agent-c/` (more I/O) | Sidebar stays fresh; **depends on the orchestrator-touches-registry contract** |
| IPC | **Preload contextBridge** | Secure (sandboxed renderer), typed, clean `window.api.*` calls | `ipcRenderer.send/on` (more boilerplate, less safe) | Must maintain the bridge surface as the single API |
| Orchestrator launch | **Clipboard copy via `copyText(text)`; prompt built in renderer** | Renderer has full state context (stage/status/feedback/git) to build the right prompt; clipboard-service stays generic | Fixed `/orchestrator <name>` string (too dumb — ignores pending feedback and next-stage context) | One manual paste; prompt is context-aware; revisit a real launch protocol in v2 |
| Persistence | **Electron userData (JSON)** | Standard, survives restarts; right size for recent list + git cache | IndexedDB; SQLite; in-memory | Simple; cache can be stale across restarts → revalidate on launch + show age |

## 8. Cross-cutting concerns

- **Security:** context isolation ON, node integration OFF in the renderer; the
  preload bridge exposes only the allow-listed `window.api`. Git via `execFile`
  with arg arrays + `cwd` (no shell interpolation). The app issues only read-only
  git commands.
- **Error handling (hybrid/smart fallback):** try fresh → on failure fall back to
  `lastKnown` git state with a warning + age → offer retry. Missing path →
  `unreachable` with repoint guidance. Corrupt/old-schema state.json → partial load
  + "incomplete data" warning. All copy in the warm, non-alarming tone of
  `03-ui-direction.md`.
- **Offline correctness:** no network is ever used. **`unpushedCount` is explicitly
  "commits ahead of the last-fetched remote ref"** — it does not reflect the live
  GitHub state and never triggers a fetch. The UI labels it accordingly so the
  handoff number can't silently mislead.
- **Configuration:** registry path defaults to `~/.agent-c/registry.json`;
  overridable via env/setting for tests.
- **Observability:** main-process logs for git failures and watcher events (local
  log file); no telemetry (offline, single-user).
- **Performance:** hot path = file reads only; git throttled (cap 6) and off the
  critical path; sidebar list virtualized for 100 rows.
- **Testability:** main-process services (readers, git-service, watcher) are pure
  modules behind the IPC layer → unit-testable with fixture registry/state files
  and a stubbed git; renderer store testable independently of Electron. This is the
  upstream the QA stage will lean on.

## 9. Deployment, distribution & operations

- **Build:** electron-vite produces three bundles (main, preload, renderer).
- **Package/distribute:** electron-builder for macOS/Linux/Windows artifacts;
  shipped from the Agent-C repo (free, open source). v1 may run unsigned/local;
  code-signing/notarization is a v2 concern.
- **Runtime ops:** no server, no secrets, no env beyond the optional registry-path
  override. "Update" = reinstall the app; persisted userData survives.

## Risks, NFR gaps & open technical questions

- **Freshness depends on an orchestrator contract** (registry touched on every
  transition). If the orchestrator doesn't honor it, un-opened sidebar rows go
  stale. → Must be written into the orchestrator/stage-protocol spec; until then,
  a periodic low-frequency re-read of all state.json is the safety net.
- **Clipboard hand-off is a UX compromise** — a real launch protocol (deep link or
  trigger file the orchestrator watches) is deferred to v2.
- **Schema drift** is mitigated by `schemaVersion` + tolerant parsing, but the
  canonical schema itself isn't versioned anywhere shared yet — define it once,
  owned by stage-protocol.
- **Batch git on 100 cold repos** is bounded but can still take many seconds total;
  acceptable because it's background and cached, but worth measuring.
- Engineer to decide: exact git porcelain parsing details; list virtualization lib;
  toast component. (Implementation-level.)

## Diagrams

Declined for now — none produced. (The UX doc's Mermaid flows already cover the
runtime paths; architecture diagrams can be added later if useful.)

---

## Decisions (confirmed)

- Electron desktop app; React + Vite (electron-vite); TypeScript.
- Zustand for state; stale-while-revalidate as a **pattern** in the store (not the
  `swr` library).
- Git via Node `execFile`, read-only, with a **concurrency cap of 6**.
- File watching: chokidar on **registry.json + all state.json**; git stays lazy;
  **orchestrator touches registry.json on every state transition** to drive
  sidebar freshness.
- Sidebar git icons populated by a **background batch compute** (cap 6), cache-first.
- "Claude Prompt" = **copy a context-aware prompt to the clipboard** (v1); prompt
  is built in the renderer from stage/status/pendingFeedback/git state via
  `clipboard-service.copyText(text)`.
- Preload contextBridge for IPC; persistence in Electron userData.

## Assumptions

- The orchestrator will be updated to touch `registry.json` on every transition
  (freshness contract). Flagged as a dependency, not yet implemented.
- `git` is on PATH on all target platforms.
- A `schemaVersion` field will be added to registry/state files by stage-protocol.

## Open questions

- The real (non-clipboard) orchestrator launch protocol — v2.
- Where the canonical registry/state JSON schema is defined and versioned (owner:
  stage-protocol).
- Proactive approval notifications — v2 (from earlier stages' backlog).

## Post-approval engineering divergences

The following decisions were made during implementation and approved as deviations
from this document. Recorded here so QA and future readers see the actual contract.

**Concurrency limiter — custom `createLimiter` instead of p-limit:**
The architecture's ADR listed `p-limit` as the example library for the cap-6
concurrency limiter. The engineer implemented a hand-rolled `createLimiter` function
in `git-service.ts` rather than taking the `p-limit` dependency. Behavior and cap are
identical (FIFO queue, cap 6); the change avoids an ESM-compatibility issue with
`p-limit` in the Electron main-process bundle context. `p-limit` does not appear in
`package.json`. The "p-limit 6" entry in `05-implementation.md`'s stack table is a
stale draft; the actual implementation uses the internal `createLimiter`.

**Sidebar list virtualization deferred to v2:**
The architecture stated "sidebar list virtualized for 100 rows" and listed a
virtualization lib as an engineer decision. The engineer shipped a plain `Array.map`
render instead and recorded `@tanstack/react-virtual` as a v2 backlog item. For the
v1 use case (20–100 projects), unmeasured performance is acceptable; virtualization
is not implemented in the current codebase.

## Next handoff

Engineer → reads 01/02/03/04, implements the system per this architecture.
