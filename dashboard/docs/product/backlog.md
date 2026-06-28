# Backlog — Agent-C Dashboard

Deferred items from discovery stages.

## From engineer (05-implementation.md)

- **Real orchestrator launch protocol:** Replace clipboard copy with a deep-link or trigger-file approach so "Claude Prompt" directly opens Claude Desktop at the right project. Deferred to v2 (no reliable cross-app deep-link contract in v1).
- **Sidebar list virtualization:** For 100+ projects, the sidebar list renders all rows. Add a virtual list (e.g. `@tanstack/react-virtual`) if performance degrades at scale.
- **Production git concurrency cap:** The `p-limit` cap-6 is instantiated in the exported `gitService` singleton. Consider making this configurable via env/settings for power users with fast disks.
- **`lastKnown` stale-while-revalidating in git error path:** When `get-git-state` fails to fetch fresh data, return the cached value as `lastKnown` in the failed `GitState` so the UI can show stale data with a warning. Currently the cache is checked for freshness before fetching but the failure path returns no fallback.
- **Watcher integration tests:** `watcher-service.ts` exercised manually; add a temp-file integration test to pin the chokidar event → IPC push path. (Unit tests now cover `WatcherService` in isolation.)
- **Light mode:** Dark mode only in v1. Light mode deferred to v2.
- **Code signing / notarization:** electron-builder artifacts are unsigned in v1. Add signing for macOS distribution in v2.
- **Schema version canonical definition:** `schemaVersion` is currently declared separately in registry-reader and state-reader. Define it once, shared, owned by stage-protocol when that contract is formalized.

## From PM (01-pm-brief.md)

- **Notification/alerts:** Should dashboard proactively alert if approval is pending? (defer to v2)
- **Advanced git features:** Branch visualization, detailed commit history, merge conflict detection (defer to v2)
- **Multi-user locking:** Prevent concurrent edits to same project (defer to v2, post-single-user assumption)
