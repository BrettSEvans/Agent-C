# Product Brief — Agent-C Dashboard

> Source of truth for the product's what & why. Written by the Sr. Product Manager.
> Read by UX next (02-ux-workflow.md). Date: 2026-06-27

**Product type:** Web app (single-page, local-first, persistent)

## 1. Problem & pain

The orchestrator currently displays the project dashboard as text in Claude Desktop chat. This creates friction:
- Text dashboard scrolls off-screen and is hard to scan at a glance
- Developers maintain a separate notes file to track project state manually
- No persistent visibility — must re-invoke the orchestrator every time you want to check status
- When handing off work to another developer, it's unclear what state each project is in

## 2. Target users & jobs-to-be-done

**Primary users:** Solo developers and small teams using Agent-C to build products

**Jobs they're hiring this for:**
1. **Solo context:** "I need to see all my Agent-C projects and their current stage at a glance, without losing context or manually updating notes"
2. **Handoff:** "When I hand off a project to another dev (or pick one up), I need to instantly see what stage it's at, what's uncommitted locally, and what's waiting for approval — without asking questions"

## 3. Current alternatives

- **Separate notes file:** Developer maintains a manual file tracking which projects exist, their paths, stages, and status. Gets out of sync with reality; requires manual updates.
- **Re-invoke orchestrator:** Developer invokes `/orchestrator` in Claude Desktop repeatedly to see current state. Loses context between checks.
- **Do nothing:** Developer relies on memory or asks "which project were we on?"

All are friction-heavy and don't scale with multiple projects or team handoffs.

## 4. Value proposition & differentiation

**Core promise:** Single source of truth for all Agent-C projects — always in sync with actual state, always visible.

**Why this, why better:**
- **Always current:** Dashboard reads from registry.json and state.json automatically; no manual updates
- **Always accessible:** Persistent view in the browser (not lost in chat scroll)
- **Handoff clarity:** Shows stage, approval status, and git state (uncommitted vs pushed) so the next developer knows exactly what they're picking up
- **Speed:** See all projects + status in seconds; replaces manual note-checking

## 5. Success metrics

1. **Speed (primary):** Developer sees all projects + current stage + approval needs in <5 seconds without invoking anything
2. **Handoff clarity:** Developer picking up a project understands state (stage + commits + approval) without asking questions
3. **Reliability:** Dashboard state never out of sync with actual registry/state files
4. **Adoption:** Dashboard becomes the default way developers check project status (replaces notes file)

## 6. Scope & non-goals

**In scope (v1):**
- Display all Agent-C products and their Mode C features (hierarchical view)
- Show per-project/feature: current stage, status, revision count, approval needs
- Show git status: uncommitted local changes, commits not pushed to GitHub
- Persistent, always-accessible view (browser-based, local-first)
- File watchers and polling to keep dashboard in sync with registry/state changes

**Explicitly NOT in scope (v1):**
- Project creation/deletion (use orchestrator for that)
- Git operations (commit/push/pull from the dashboard) — use git CLI for that
- Real-time collaboration or multi-user locking
- Complex git history or branch visualization
- Backend/cloud sync

## 7. Constraints & risks

**Constraints:**
- Must run locally (read registry.json and state.json from `~/.agent-c/` and project paths)
- No backend required
- Must work offline
- Team size: solo developer building this (for now)

**Biggest risks:**
1. **Dashboard out-of-sync with registry:** If registry/state files change (orchestrator updates, manual edits), dashboard doesn't know
   - *Mitigation:* file watchers (auto-refresh) + on-demand refresh button + periodic polling
2. **Git state computation is slow:** Computing git status across many repos is I/O intensive
   - *Mitigation:* cache git state with TTL (refresh every 30 sec) + background refresh (don't block UI) + lazy load

## 8. Business model & monetization

Free, open-source software. Distributed as part of the Agent-C repo (same codebase). No monetization model (v1 is community/solo).

## 9. Post-v1 platform evolution & multi-surface design

Agent-C has three surfaces for interacting with projects and approvals: **Claude Desktop** (text-based orchestrator commands), **Claude Code** (thin agent-definition wrappers), and this **Electron dashboard** (GUI visualization). All three surfaces read from the same on-disk `registry.json` and per-project `state.json` files — they are not separate systems, but different views onto shared state.

**Critical invariant:** The dashboard and orchestrator chat must show identical approval needs (`needsYou: true` flags) at all times. If one surface displays a pending action and another does not, that is a bug in the synchronization layer, not acceptable drift. This is enforced by:
- Both surfaces reading the same state files from disk.
- File watchers on the dashboard that react immediately when state changes.
- The orchestrator's contract to touch `registry.json` on every state transition, signaling the dashboard to rescan.

Future surfaces (e.g., a CLI) must follow this same pattern: read the shared state files, ensure `needsYou` entries are always synchronized, and never allow a divergence between what the user sees in one place and another.

---

## Decisions (confirmed)

- Product name: Agent-C Dashboard
- Product type: Web app (local-first, persistent)
- Repo relationships: Agent-C native (products + Mode C features from registry.json; no external dependency parsing)
- In v1: display only (no editing/creating projects, no git operations)
- Scope: all projects visible, stage + status + revisions + git state + approval needs
- Free, open source, Agent-C repo

## Assumptions

- Developers have `~/.agent-c/registry.json` and per-project `docs/product/state.json` files (created by orchestrator)
- Git status can be computed via `git status` and `git log` commands in the shell
- Local file watching is available (macOS/Linux/Windows file system events)
- No backend or cloud infrastructure needed (v1 is fully local)
- Single-user context (no multi-user concurrency concerns in v1)

## Open questions

- **Tech stack:** React? Vue? Svelte? Or vanilla web components? (deferred to UX/architect)
- **Data refresh rate:** How often should git state refresh? (deferred to UX/architect)
- **Visual hierarchy:** How to group products vs features? Tabs? Sidebar? Expandable sections? (deferred to UX)
- **Notification/alerts:** Should dashboard proactively alert if approval is pending? (deferred to v2)

## Next handoff

UX agent → reads this brief, defines the workflow and interaction model, writes
`02-ux-workflow.md`.
