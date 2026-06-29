# Registry MCP Server — Design Spec

**Date:** 2026-06-29  
**Scope:** Full tool surface (groups A–G), except cross-artifact staleness detection (deferred to v2)  
**Runtime:** TypeScript, new top-level package `registry-mcp/`, `@modelcontextprotocol/sdk`, Vitest  
**State Model:** stdio MCP server, file-as-canon, single-writer per track via lockfile  
**Notifications:** Sync-blocking model (stage.complete() waits for notification delivery)

---

## 1. Architecture

### 1.1 Layering

```
registry-mcp/src/
  domain/                  # Pure logic, unit-testable, no MCP
    schema.ts              canonical Zod schemas + TypeScript types
    paths.ts               resolve product/feature paths, ~/.agent-c
    state-store.ts         read/write per-track state.json (CANONICAL)
    registry-store.ts      read/write registry.json (DERIVED CACHE)
    state-machine.ts       legal transitions + guardrails (enforce protocol)
    events.ts              append events.ndjson, execute notify handlers (sync)
    backlog.ts             structured backlog items + mirror to backlog.md
    analytics.ts           compute metrics from event log (cycle time, revisions)
    verify-cache.ts        memoize bestpractice.verify lookups by <subject, date-window>
  tools/                   # Thin MCP tool wrappers, call domain
    portfolio.ts           registry.list, registry.get, registry.refresh
    lifecycle.ts           project.create, project.adopt, project.repoint, project.remove
    stages.ts              stage.get, stage.checkpoint, stage.complete, stage.approve,
                           stage.requestChanges, stage.skip, stage.beginRevise
    backlog-tools.ts       backlog.add, backlog.list, backlog.update
    bestpractice.ts        bestpractice.verify (cached)
    history.ts             history.events, history.metrics
    notify-tools.ts        notify.register, notify.list (register handlers for events)
  server.ts                wire stdio transport, register tools, error handling
  index.ts                 bin entry point
```

**Principle:** Domain is isolated from MCP; tools are thin adapters. Domain is testable without MCP or files; tools just route.

### 1.2 File-as-canon model

- **Source of truth:** Per-track `<path>/docs/product/state.json` (or `docs/features/<slug>/state.json` for features).
- **Derived cache:** `~/.agent-c/registry.json` is refreshed from all on-disk state.json files; always re-derivable.
- **Event log:** `~/.agent-c/events.ndjson` (append-only, one JSON object per line).
- **Notification registrations:** `~/.agent-c/notify.json` (array of handlers).
- **Best-practice cache:** `~/.agent-c/verify-cache.json` (memoized lookups with timestamps).

Manual edits to state.json files are safe — the server re-reads and validates on each operation.

### 1.3 Concurrency & single-writer safety

**Per-track lockfile:** `~/.agent-c/locks/<project-id>.lock`

1. Every write to state.json acquires the lock via `open(..., 'wx')` (exclusive, fail if exists).
2. Perform the write via temp file + atomic rename.
3. Release the lock by deleting the lockfile.
4. If lock acquisition times out (5s default, configurable), return MCP error "track is locked" to the client.
5. **Stale lock recovery:** Lockfiles older than 30s are assumed abandoned; the server logs a warning and proceeds.

**Rationale:** Local, single-user; atomic temp-write-rename is sufficient. Two simultaneous writes to the same track are rare; first one wins, second gets "locked" error.

---

## 2. Canonical state.json schema (reconciled)

The actual dashboard implementation is canonical. The server writes exactly what the dashboard parses, with one **schema upgrade** to enrich checkpoint.

### 2.1 Current dashboard schema (observed)

```typescript
interface ProjectState {
  schemaVersion: 1;
  track: {
    type: "product" | "feature";
    name: string;
    slug: string | null;
    productType: string;  // from PM brief
  };
  currentStage: Stage;
  stages: Record<Stage, StageInfo>;
  pendingFeedback: PendingFeedback | null;
  updatedAt: string;    // ISO 8601
}

interface StageInfo {
  status: Status;       // not-started | in-progress | awaiting-approval |
                        // approved-complete | skipped
  revisions: number;
  criticPasses: number;
  checkpoint: string | null;  // currently lossy — just a string
}

interface PendingFeedback {
  stage: Stage;
  source: "user" | "critic";
  text: string;
  reportPath: string | null;  // path to critic report
}

type Stage = "pm" | "ux" | "ui" | "architect" | "engineer" | "qa";
type Status = "not-started" | "in-progress" | "awaiting-approval" |
              "approved-complete" | "skipped" | "unreachable" | "error";
```

### 2.2 Schema upgrade: Checkpoint as a structured object

The protocol doc (stage-protocol/SKILL.md) describes checkpoint as an object tracking resume state:

```typescript
interface Checkpoint {
  sectionsCompleted: string[];  // e.g., ["problem", "users"]
  currentSection: string;       // e.g., "alternatives"
  draftPath?: string;           // path to partial artifact
  notes?: string;               // session notes
}
```

**Current issue:** Dashboard reads checkpoint as a string. If the server writes an object, `String({...})` coerces it to `"[object Object]"`, losing data.

**Solution:** Upgrade the schema to store checkpoint as `Checkpoint | string | null`:
- **New server writes:** `Checkpoint` objects
- **Old checkpoint strings:** Remain as strings; on read, they're wrapped into `{ currentSection: <string>, sectionsCompleted: [] }` for compatibility
- **Dashboard update:** `state-reader.ts` is updated to parse checkpoint as an object, with a fallback to string-wrapping for legacy data

This is implemented in **step 1.1** (this server build) and the dashboard state-reader in **step 1.2** (parallel dashboard update).

**stage-protocol/SKILL.md is updated** to document the actual (new) schema so it matches reality.

---

## 3. State machine & guardrails

Transitions that are currently enforced only by prose ("recommend, don't auto-chain") become server-enforced.

### 3.1 Legal transitions

**stage.complete(id, stage, artifactPath)** → `awaiting-approval`, clears checkpoint
- **Precondition:** `stages[stage].status == "in-progress"`
- **Precondition:** Every earlier stage is `approved-complete` or `skipped` (enforces gate ordering)
- **Effect:** Set `status = "awaiting-approval"`, set `checkpoint = null`, set `updatedAt`, write state.json
- **Special case (revise mode):** If `pendingFeedback.stage == stage`, increment `revisions`, clear `pendingFeedback`
- **Emit event:** `"stage-completed"` with stage, artifact path

**stage.approve(id, stage)** → `approved-complete`, advance currentStage
- **Precondition:** `status == "awaiting-approval"`
- **Effect:** Set `status = "approved-complete"`, advance `currentStage` to next stage (or null if qa)
- **Emit event:** `"stage-approved"` with stage

**stage.requestChanges(id, stage, feedback)** → sets `pendingFeedback`
- **Precondition:** `status == "awaiting-approval"`
- **Effect:** Set `pendingFeedback = { stage, source: "user", text, reportPath? }`, keep status (awaiting-approval)
- **Emit event:** `"feedback-requested"` with stage, feedback text

**stage.skip(id, stage, reason)** → `skipped`, advance currentStage
- **Precondition:** `status == "not-started"` (only skip from the start)
- **Effect:** Set `status = "skipped"`, advance `currentStage`
- **Emit event:** `"stage-skipped"` with reason

**stage.checkpoint(id, stage, checkpoint)** → in-progress, save checkpoint
- **Precondition:** `status == "in-progress"` (only checkpoint active work)
- **Effect:** Set `checkpoint = { sectionsCompleted, currentSection, draftPath?, notes? }`, keep status
- **No event** (checkpoints are frequent; only emit on stage.complete)

**stage.beginRevise(id, stage)** → load pending feedback for a revise
- **Precondition:** `status == "awaiting-approval"` AND `pendingFeedback.stage == stage`
- **Return:** The feedback text
- **No state change** (this is a read, not a write)

### 3.2 Guardrails

1. **Reject out-of-order advances** — `stage.complete()` only succeeds if all earlier stages are `approved-complete` or `skipped`.
2. **Reject illegal status transitions** — attempt to approve a stage that's not `awaiting-approval`, etc.
3. **Reject concurrent writes** — lockfile ensures one writer per track.
4. **Validate checkpoint fields** — `sectionsCompleted` is an array, `currentSection` is a string, optional fields are present.

---

## 4. Events, notifications, and the sync-blocking model

### 4.1 Event log

Every state transition is appended to `~/.agent-c/events.ndjson`. Each line is a JSON object:

```typescript
interface Event {
  id: string;              // UUID or auto-incrementing
  type: string;            // "stage-completed" | "stage-approved" | "feedback-requested" | etc.
  trackId: string;         // project ID
  stage?: Stage;           // if applicable
  at: string;              // ISO 8601 timestamp
  payload: {
    [key: string]: unknown;  // type-specific data: artifactPath, reason, feedback text, etc.
  };
}
```

The log is append-only; no deletions. For analytics queries (history.metrics), the server reads the entire file and computes aggregates. **Acceptable for v1** but not scalable to 1000s of projects; defer log rotation/compression to v2.

### 4.2 Notification handlers (sync-blocking model)

Users register notification handlers in `~/.agent-c/notify.json`:

```typescript
interface NotifyRegistration {
  id: string;
  eventTypes: string[];        // e.g., ["stage-completed", "stage-approved"]
  handler: "webhook" | "push" | "telegram";
  target: string;              // URL (webhook), device token (push), chat ID (Telegram)
  filter?: { trackId?: string; stage?: Stage };  // optional filtering
}
```

**Sync-blocking flow:**

1. User calls `notify.register({ eventTypes: ["stage-completed"], handler: "telegram", target: <chat_id> })`.
2. The call writes the registration to `~/.agent-c/notify.json`.
3. Later, when a stage.complete() call emits a "stage-completed" event, the server matches registered handlers synchronously.
4. **Order:** Match registered handlers → attempt all notify calls (with 3s timeout each) → **only if all succeed**, write state.json and release lock.
5. If any notification call times out or fails, `stage.complete()` returns an error to the client, and **no state change is committed** (lock released without writing state.json).

**Trade-off:** stage.complete() may block for up to 3+ seconds per handler if notifications are slow (e.g., three handlers = up to 9s worst-case). Acceptable for a local, single-user system where "the stage is complete but notifier is slow" is rare.

**Failure recovery:** If a notify call fails (Telegram down, webhook unreachable), the entire state transaction is aborted. The user sees an error and can retry. This ensures "no state change without successful notification" — the invariant is tight.

**Timeout and retry:** Notification calls have a 3s timeout. No automatic retry; the user's next call (approve, request changes, etc.) triggers a fresh attempt if desired.

### 4.3 Event types and their payloads

| Type | Trigger | Payload | Handlers triggered |
|---|---|---|---|
| `stage-completed` | `stage.complete()` | `{ artifactPath, wasRevise: bool }` | all registered for this type |
| `stage-approved` | `stage.approve()` | `{ stage }` | all registered for this type |
| `feedback-requested` | `stage.requestChanges()` | `{ stage, feedbackText, reportPath? }` | all registered for this type |
| `stage-skipped` | `stage.skip()` | `{ stage, reason }` | — (low priority for notifiers) |

Handlers filter by event type; the server also matches optional filters (trackId, stage). Webhook handlers POST the event JSON to the configured URL.

---

## 5. Backlog management

Each track maintains `docs/product/backlog.md` with deferred items. The server owns structured backlog data alongside the .md file.

### 5.1 Structured backlog storage

Backlog items are stored in a new `backlog` field in state.json:

```typescript
interface State {
  // ... existing fields
  backlog: BacklogItem[];
}

interface BacklogItem {
  id: string;              // UUID
  stage: Stage;            // which stage deferred it
  text: string;            // description
  severity: "low" | "medium" | "high";
  status: "open" | "done" | "wontfix";
  createdAt: string;       // ISO 8601
  resolvedAt?: string;     // when closed
}
```

### 5.2 Tools

- **backlog.add(id, stage, text, severity?)** → creates item, appends to state.json
- **backlog.list(id, status?)** → returns all items (or filtered by status)
- **backlog.update(id, itemId, status)** → marks as done/wontfix, sets resolvedAt

### 5.3 Markdown sync

After every backlog.add/update, the server regenerates `docs/product/backlog.md` from the structured items:

```markdown
# Product Backlog

## Open (3)
- **[PM]** Issue A (high)
- **[UX]** Issue B (medium)

## Done (1)
- Issue C (2026-06-28)

## Won't Fix (0)
```

This is deterministic (same items → same markdown), so manual edits to .md are not preserved. Roles should record backlog via the tool, not by hand-editing the .md. This is documented in the role skills.

---

## 6. Analytics

The server computes metrics over the event log on demand.

### 6.1 history.events(id?, since?, types?)

Returns events filtered by track, date range, and type:

```typescript
history.events({ since: "2026-06-20T00:00:00Z", types: ["stage-completed"] })
  → Event[]
```

### 6.2 history.metrics(id?)

Computes aggregate metrics for a project or portfolio:

```typescript
history.metrics()  // portfolio-wide
→ {
  stageMetrics: {
    pm: { medianCycleTime: "2h", revisions: 1.2, stalls: 3 },
    ux: { medianCycleTime: "4h", revisions: 0.8, stalls: 1 },
    ...
  },
  portfolioMetrics: {
    totalProjects: 5,
    avgCycleTime: "20h",
    avgRevisions: 1.0
  }
}
```

Cycle time = time from stage entry (first checkpoint or complete call) to stage.approve. Stalls = times project was idle >7 days in a stage.

These queries scan the event log; v1 accepts O(n) performance. Defer indexing to v2 if needed.

---

## 7. Best-practice verification cache

The recommendation-1 change added verification to `best-practices` skill: "when a retrieval tool is available, check the current state before asserting."

This server exposes a shared cache so multiple sessions don't re-fetch the same lookups.

### 7.1 bestpractice.verify(subject, ecosystem?)

```typescript
bestpractice.verify({ subject: "tailwind", ecosystem: "web" })
→ {
  finding: "Tailwind v4, stable, current best practice",
  source: "https://tailwindcss.com/docs",
  checkedAt: "2026-06-29T11:30:00Z",
  cached: false  // true if this is a cached result
}
```

The server:
1. Checks if a cached result exists for `(subject, ecosystem)` checked within the last 24 hours.
2. If yes, returns it with `cached: true`.
3. If no, calls `WebSearch`/`WebFetch` or a docs MCP (if available), caches the result, and returns with `cached: false`.

The server cannot call WebSearch itself (it's an MCP client capability); instead, it stores a **callable reference** that a Claude client performs on its behalf, or it defers to Claude's next call to stage.complete() to perform the verify-and-store. Simpler: the server stores lookups its client calls provide.

**Alternative (simpler for v1):** The server doesn't perform verifications; the skill does (via Recommendation 1's added verification step). The server exposes a **read-only `bestpractice.getCached(subject)`** to let skills check if a verification is already cached, and a **`bestpractice.putCached(subject, finding, source)`** to let a skill store a verified result. This is lighter—the server is just a cache, not a fetcher.

**Decision:** Go with the simpler read-only cache model for v1. Skills verify (via their retrieval tools) and store the result; the server just memoizes.

---

## 8. Project registry

### 8.1 registry.list(filter?)

Returns all entries (cached from registry.json) with optional filtering:

```typescript
registry.list({ status: "awaiting-approval", needsYou: true, stalledDays: 7 })
```

Filters:
- `status` — exact match on current status
- `needsYou` — true if awaiting approval or in error state
- `type` — "product" or "feature"
- `stalledDays` — projects idle in current stage for N+ days

### 8.2 registry.get(id)

Returns a single entry + its full state (from state.json):

```typescript
{
  id, type, name, path, slug, parentId, productType, currentStage, status, ...
  state: { track, stages, pendingFeedback, backlog, ... }
}
```

### 8.3 registry.refresh()

Re-scans `~/..` for all state.json files, refreshes registry.json cache. Idempotent. Useful for recovery if registry.json becomes stale. Dashboard calls this on startup.

### 8.4 Project lifecycle tools

- **project.create({ name, path, type, productType, slug?, parentId? })** → scaffolds docs/product/ and state.json, adds to registry
- **project.adopt({ path, slug? })** → registers an existing on-disk track
- **project.repoint({ id, newPath })** → update registry entry with new path (after manually moving the project)
- **project.remove({ id })** → remove from registry (does not delete files)

---

## 9. Scope boundaries

### In v1

✅ Groups A–G:
- Registry CRUD (portfolio view + project lifecycle)
- Stage state machine (transitions + guardrails)
- Events & notifications (sync-blocking)
- Backlog (structured + .md mirror)
- Verify-cache (read-only)
- Analytics (on-demand over event log)

### Deferred to v2

❌ Group 6 (cross-artifact staleness):
- Version tracking (`artifact.register`, `artifact.checkStaleness`)
- Mechanism for Claude clients to report consumed-upstream-versions
- Queries for "02 has changed since 04 was built"

This requires more design (how/when do clients report versions? manual or automatic?) and is lower-priority.

---

## 10. Testing strategy

### Domain-layer tests (unit + integration)

- **schema.ts:** Zod validation tests (valid/invalid state.json shapes)
- **paths.ts:** Path resolution (product, feature, symlink handling)
- **state-store.ts:** Read/write state.json, checkpoint handling, legacy-string checkpoint wrapping
- **state-machine.ts:** Legal/illegal transitions, precondition checks, revise-mode detection
- **events.ts:** Event log append, handler matching, notification sync/failures
- **backlog.ts:** Add/list/update, .md regeneration consistency
- **analytics.ts:** Cycle time, revision aggregation, stall detection
- **verify-cache.ts:** Cache hit/miss, TTL expiry

Integration tests use temp directories to test full workflows (e.g., create project → advance stage → approve → verify registry/state/event-log all updated consistently).

### Tool layer (smoke tests)

- Each tool serializes input, calls domain, deserializes output
- Smoke tests: happy path + one error case per tool
- No need to re-test domain logic

### Coverage target

80% line coverage on domain layer; tool layer at 60% (thin adapter pattern).

---

## 11. Package structure & dependencies

```
registry-mcp/
  src/
    domain/
    tools/
    server.ts
    index.ts
  __tests__/
    unit/
      state-machine.test.ts
      schema.test.ts
      ...
    integration/
      project-lifecycle.test.ts  (temp dir, full workflow)
  package.json
  tsconfig.json
  vitest.config.ts
```

**Dependencies:**
- `@modelcontextprotocol/sdk` — MCP types + server transport
- `zod` — schema validation
- `uuid` — unique IDs
- Node.js built-ins (fs, path, util)

**DevDeps:**
- `vitest`, `@vitest/ui`
- `@types/node`
- TypeScript

---

## 12. Integration with existing codebase

### Dashboard (separate, parallel change)

Update `dashboard/src/main/services/state-reader.ts` to handle the new checkpoint schema (object vs. string). Backward-compatible parse: if checkpoint is a string, wrap it.

### Stage-protocol SKILL.md

Update §1 (the method) and examples to document the actual schema (checkpoint as `Checkpoint | string | null`).

### Orchestrator skill

No changes required for v1. The orchestrator continues to be a manual registry-helper; it can now call server tools instead of doing file I/O by hand. That's a future enhancement (orchestrator v2 with better UX).

---

## 13. Known limitations & open questions

1. **Event log unbounded:** No rotation/truncation in v1. For small portfolios (<50 projects), acceptable. Defer log rotation to v2.
2. **Analytics performance:** O(n) scan of event log for every metrics query. Acceptable for <10k events; defer indexing to v2.
3. **Notification failures abort the stage transition:** Tight but safe. User sees error and must retry. Could add a "force" flag to complete the stage even if notify fails (defer to v2).
4. **No multi-user auth:** Local, single-user only. Team coordination is deferred.
5. **Verify-cache strategy assumed:** Server exposes cache; skills perform verifications and store results. Assumes skills have WebSearch/WebFetch available. If a session has no retrieval tool, cache is not populated—that's fine, it's optional.

---

## 14. Deployment & runtime

The server is a simple stdio MCP: spawn it from Claude Code or Desktop, read/write on stdio. No listening port, no daemon, no process manager. Clients come and go; state files are the durable source of truth.

**Startup:** `node registry-mcp/out/index.js` or `npx registry-mcp` (if installed globally).

**Symlink into Claude:** Once built, symlink the package into `~/.claude/plugins/` or use a local MCP server entry in Claude Code settings.

---

## 15. Handoff

Once implementation is complete and all tests pass:

1. Registry MCP is a working server (stdio, testable independently).
2. Dashboard state-reader updated to consume new checkpoint schema.
3. stage-protocol/SKILL.md updated to document the real schema.
4. Orchestrator can optionally adopt server tools (out of scope for v1 implementation, but now feasible).
5. Next: Recommendation 3 (proactive notifications) is unblocked via the sync-blocking model + event types.
