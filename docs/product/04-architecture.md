# Architecture — Agent-C

> The product's technical architecture — structure and key decisions, not code.
> Written by the architect from 01-pm-brief.md, 02-ux-workflow.md, and
> 03-ui-direction.md. Read by the engineer next (implementation).
> Product type: Agentic / conversational developer tool with text-first and
> Electron dashboard surfaces. Date: 2026-06-29

## 1. Architectural drivers & constraints

Agent-C optimizes for:

1. **Transparency:** every stage produces a reviewable artifact that explains the
   current product state.
2. **Steerability:** the user controls approval, revision, pause, and stage
   advancement at explicit gates.
3. **Context preservation:** downstream roles read versioned artifacts rather
   than relying on chat memory.
4. **Local ownership:** skills, artifacts, state, and the dashboard live on the
   user's machine and in files they can inspect.
5. **Portability:** the same canonical skills work manually and, later, through
   Code wrapper dispatch.

Hard constraints: single-user, local-first, no hosted backend, no accounts, no
billing, and no requirement that projects share a common root directory.

## 2. System context & boundaries

**Inside Agent-C:**

- The 13 canonical skills in `agents/`: shared methods, six lifecycle roles,
  critics, and the orchestrator.
- The artifact chain under each project's `docs/product/`.
- Per-project `state.json` files and the global registry cache.
- Thin Code wrapper definitions in `agent-defs/`.
- The Electron dashboard sub-product in `dashboard/`.

**Outside Agent-C:**

- Claude Desktop or Claude Code runtime behavior.
- The user's project codebases and editors.
- Git remotes and external hosting.
- Future distribution/install tooling.

Agent-C does not own deployment of the user's product. It owns the development
process, artifact trail, gates, and local project registry.

## 3. Architecture style & major components

**Style:** modular skill-based orchestration with file-backed state.

Major components:

- **Shared method skills:** `elicitation`, `best-practices`, `feature-mode`, and
  `stage-protocol` define reusable process mechanics.
- **Lifecycle role skills:** `product-manager`, `ux`, `ui`, `architect`,
  `engineer`, and `qa` produce the numbered artifact chain.
- **Quality skills:** `critic` reviews PM/UX/UI artifacts; `technical-critic`
  reviews architect/engineer/QA artifacts and code, then routes APPLY findings
  to the engineer through `pendingFeedback`.
- **Orchestrator skill:** owns registry, dashboard display, approval gates, and
  user-directed sequencing.
- **Agent definitions:** Code-only wrappers that dispatch to the same skills
  without duplicating their method.
- **Dashboard sub-product:** Electron + React GUI that reads the same registry
  and state files to visualize projects, gates, and git state.

## 4. Runtime behavior & key scenarios

**Start a new project:**

1. The user invokes the orchestrator.
2. The orchestrator creates/updates the registry and per-project `state.json`.
3. The user invokes the current stage skill.
4. The stage reads upstream artifacts, uses stage-protocol for fresh/resume/revise
   mode, writes its artifact, and returns control.
5. The orchestrator presents the approval gate.
6. The user approves, requests changes, edits manually, pauses, or runs a critic.

**Resume or revise:**

`stage-protocol` inspects `state.json`. If a checkpoint exists, the stage resumes
from the last completed section. If `pendingFeedback.stage` matches the current
stage, the role enters revise mode, applies targeted feedback, increments the
revision count, clears feedback, and returns to the gate.

**Technical critic auto-apply:**

For architect/engineer/QA quality review, the technical critic writes APPLY
findings to `pendingFeedback` with `source: "critic"`. The engineer consumes those
findings automatically on next invocation, verifies, updates implementation docs,
clears feedback, and returns to the human gate at QA.

**Cross-surface notification:**

Every surface reads or mirrors the same state. The orchestrator prints the "What
needs your attention" block, and the dashboard shows the same `needsYou` entries
from watched state files.

## 5. Data model & state

**Source of truth:** per-project or per-feature `state.json` beside the artifacts.

Core entities:

- **Project/track:** name, path, type, product type, current stage.
- **Stage state:** status, revision count, critic pass count, checkpoint.
- **Pending feedback:** stage, source (`user` or `critic`), text, optional report
  path.
- **Registry entry:** global cache/index at `~/.agent-c/registry.json`, mirroring
  path, stage, status, `needsYou`, revision count, and updated timestamp.
- **Artifacts:** Markdown docs `01` through `05`, plus QA report, backlog,
  critic reports, wireframes/mockups/diagrams as needed.

The registry is a cache. The orchestrator refreshes it from `state.json`; the
dashboard reads it for fast listing and watches state files for changes.

## 6. Interfaces & contracts

- **Stage-to-stage:** Markdown artifacts. Each stage reads prior docs and writes
  the next numbered artifact.
- **Stage-to-orchestrator:** `state.json` plus the handoff contract. Stages update
  their own checkpoint/revisions and return control; they do not advance the
  lifecycle.
- **Orchestrator-to-user:** dashboard, approval gate, and "What needs your
  attention" block.
- **Critic-to-engineer:** `pendingFeedback` with `source: "critic"` and a report
  path for APPLY findings.
- **Dashboard-to-state:** read-only file and git inspection through Electron main
  process services; no mutation of registry/state or git.
- **Code wrappers-to-skills:** wrappers invoke the matching skill or read the
  canonical `SKILL.md` as fallback.

## 7. Key technical decisions

| Decision | Choice | Rationale | Alternatives considered | Consequences |
|---|---|---|---|---|
| Artifact interface | Versioned Markdown files | Human-readable, reviewable, git-friendly, portable across runtimes | Chat-only memory; database records | Easy inspection and hand edits; requires docs to stay synced |
| Process unit | Canonical `SKILL.md` files | Skills work manually and through wrappers without method drift | Bespoke agents per runtime | One source of truth; wrappers must stay thin |
| State persistence | JSON files on disk | Local, inspectable, simple to watch and repair | Hosted DB; SQLite | Low install friction; schema/version discipline matters |
| Sequencing | Orchestrator-owned gates | Preserves user control and prevents hidden auto-chaining | Fully autonomous pipeline | Transparent and steerable; more manual steps |
| Quality loop | Critics as gate actions | Reviews improve artifacts without becoming lifecycle stages | Critics as blocking stages | Clear separation; technical critic needs explicit auto-apply carve-out |
| Dashboard | Electron sub-product | Local file/git access with a real GUI surface | Web app; terminal-only | More code and packaging work; strong local integration |
| Distribution | Repo + symlinked skills for v1 | Fastest path for a solo-builder, editable by users | Installer/package manager first | Install friction remains future work |

## 8. Cross-cutting concerns

- **Security:** local files only; dashboard renderer has no direct Node access;
  git commands are read-only.
- **Error handling:** missing paths become `unreachable`; corrupt or stale state
  should be surfaced with recovery guidance rather than crashing.
- **Observability:** artifacts, state, critic reports, revision counts, and git
  history form the audit trail.
- **Testability:** dashboard code has automated tests; skill contracts are
  verified by inspection and lifecycle dogfooding.
- **Accessibility:** text-first workflow remains the baseline; GUI must not hide
  state that chat surfaces show.
- **Operability:** no server to run; dashboard is the only long-running app-like
  surface.

## 9. Deployment, distribution & operations

Agent-C ships as a Git repository containing skills, docs, wrapper definitions,
and the dashboard sub-product. Users symlink skills into their Claude skills
directory. Code wrappers can be symlinked into Claude Code agents when autonomous
dispatch is ready. The dashboard is built and run from `dashboard/` using the
Electron toolchain.

No backend restart is part of normal Agent-C operation. If future server-side
surfaces are added, they must read the same state contract and respect the
cross-surface notification invariant.

## Risks, NFR gaps & open technical questions

- Registry/state corruption recovery still needs a formal repair design beyond
  missing-path and tolerant-read handling.
- Distribution remains symlink-oriented and needs packaging work.
- Code wrapper dispatch is prepared but not wired into a fully autonomous
  orchestrator.
- The canonical JSON schema should be versioned in one place if more surfaces are
  added.

## Diagrams

No new diagrams produced in this pass. Existing UX wireframes cover the stage and
gate flows; dashboard-specific architecture is documented under
`dashboard/docs/product/04-architecture.md`.

---

## Decisions (confirmed)

- Preserve skill-first architecture with Markdown artifacts as the interface.
- Keep the orchestrator as the owner of sequencing, registry, and gates.
- Treat `state.json` as source of truth and registry as cache.
- Treat the dashboard as a read-only GUI surface over orchestrator state.
- Keep technical critic auto-apply as a targeted quality-loop carve-out, not a
  lifecycle auto-chain.

## Assumptions

- This architecture documents the system as built rather than redesigning it.
- The current Electron dashboard remains a sub-product, not a required runtime for
  all Agent-C users.
- Future autonomous dispatch will reuse the same state and artifact contracts.

## Open questions

- Exact installer/package strategy for non-builder users.
- Formal repair UX for corrupt `registry.json` or `state.json`.
- Whether a future CLI should be its own surface or a thin orchestrator output
  format.

## Next handoff

Engineer -> reads 01/02/03/04, implements the system per this architecture.
