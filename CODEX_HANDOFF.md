# Agent-C Codex Handoff

**Date:** 2026-06-28  
**Source:** Claude Code (being discontinued)  
**Destination:** Codex (new AI platform)  
**Document Purpose:** Complete project context, current state, findings, and action items so you can continue Agent-C work independently and dogfood the system on itself.

---

## 1. Executive Summary

Agent-C is a **distributable, multi-agent software-development pipeline** for solo developers and indie hackers. The value proposition is **transparent, steerable development**: take an idea through six lifecycle stages (PM → UX → UI → architect → engineer → QA), where each stage produces a reviewable artifact the developer approves before advancing.

**Current state (as of 2026-06-28):**
- All 13 skills (shared methods + 6 roles + orchestrator + 2 critics) are fully built and symlinked.
- Full lifecycle proof-of-concept is working: PM, UX, UI, architect, engineer, QA roles exist and follow a consistent contract.
- An Electron GUI dashboard is built as a sub-product (the orchestrator's text dashboard has a GUI counterpart).
- **Agent-C has NOT run its own full process on itself** — the PM and UX artifacts exist for the system itself, but the UI, architecture, engineer, and QA artifacts are missing. This is the central dogfooding gap.
- Recent changes: technical-critic auto-apply model (engineer accepts all critic findings without HITL), new cross-surface notification requirement.

**System documentation drift:** The PM brief and UX workflow lock v1 as "Claude Desktop, no subagents, text-only, no GUI," but the built system now spans Desktop (manual) + Code (subagent wrappers) + Electron GUI dashboard. The discovery artifacts were never updated to reflect this evolution.

**9 prioritized findings from the end-to-end critic review:**
- 4 significant (must address before claiming docs are accurate)
- 5 minor (drift cleanup)

---

## 2. What You Need to Know

### 2.1 Why This Matters

Agent-C is **self-describing software** — the system that builds products also documents itself via the same discovery artifacts (PM brief, UX workflow, UI direction, architecture, implementation, QA report). The entire value proposition depends on this: every stage produces a reviewable artifact, every artifact flows downstream, context is never lost.

**The gap:** Agent-C has only run the first 2 of 6 lifecycle stages on itself. This is like a scaffolding company that never built a house — the tools work, but you haven't proven them end-to-end. Fixing this is not optional housekeeping; it's dogfooding the core promise.

### 2.2 Why It's Important for Codex

1. **You're switching platforms.** Claude Code context is gone once you leave. This document and the codebase are your source of truth now.
2. **You need to work independently.** You won't have Claude prompting you through decisions. The skills and artifacts are designed to guide you, but you have to know how to read them.
3. **Dogfooding is validation.** Running Agent-C on Agent-C itself will surface real issues before users encounter them. It's the highest-value regression test.

---

## 3. Project Context & Setup

### 3.1 Repository Structure

```
Agent-C/
├── README.md                              # Front door; quick start
├── ARCHITECTURE.md                        # Full system design (the map)
├── CLAUDE.md                              # (Legacy) Instructions for Claude Code
├── CODEX_HANDOFF.md                       # This file
├── agents/                                # Canonical skills (symlinked to ~/.claude/skills/)
│   ├── elicitation/SKILL.md               # Shared: one-question-at-a-time discovery
│   ├── best-practices/SKILL.md            # Shared: choose current best practice
│   ├── feature-mode/SKILL.md              # Shared: build features inside existing products
│   ├── stage-protocol/SKILL.md            # Shared: entry modes, checkpoints, state.json
│   ├── product-manager/SKILL.md           # Stage 1: what & why → 01-pm-brief.md
│   ├── ux/SKILL.md                        # Stage 2: how it works → 02-ux-workflow.md
│   ├── ui/SKILL.md                        # Stage 3: look & feel → 03-ui-direction.md
│   ├── architect/SKILL.md                 # Stage 4: technical architecture → 04-architecture.md
│   ├── engineer/SKILL.md                  # Stage 5: implementation → code + 05-implementation.md
│   ├── qa/SKILL.md                        # Stage 6: verification → qa-report.md
│   ├── critic/SKILL.md                    # Quality review: PM/UX/UI artifacts
│   ├── technical-critic/SKILL.md          # Quality review: architect/engineer/QA artifacts + code
│   └── orchestrator/SKILL.md              # Front door: registry, dashboard, gates, dispatch
├── agent-defs/                            # Thin subagent wrappers (Code-only; idle for now)
│   ├── README.md                          # Status of each wrapper
│   ├── engineer.md                        # Calls engineer skill; auto-apply critic findings
│   ├── technical-critic.md                # Calls technical-critic skill
│   └── [others for each stage]
├── dashboard/                             # Electron + React GUI for the orchestrator's dashboard
│   ├── src/main/                          # Electron main process
│   ├── src/renderer/                      # React app
│   ├── src/preload/                       # IPC bridge (contextIsolation ON)
│   ├── src/shared/                        # Shared types
│   ├── docs/product/                      # The dashboard's own discovery artifacts
│   │   ├── 01-pm-brief.md                 # Dashboard: what & why
│   │   ├── 02-ux-workflow.md              # Dashboard: how it works
│   │   ├── 03-ui-direction.md             # Dashboard: look & feel
│   │   ├── 04-architecture.md             # Dashboard: technical design
│   │   ├── 05-implementation.md           # Dashboard: what's built, test results
│   │   ├── qa-report.md                   # Dashboard: QA verification
│   │   ├── critic-reports/                # Quality reviews (optional; not required in v1)
│   │   └── state.json                     # Current project state (stage, revisions, feedback)
│   └── package.json
├── docs/product/                          # Agent-C's own discovery artifacts
│   ├── 01-pm-brief.md                     # COMPLETE: what Agent-C is & why
│   ├── 02-ux-workflow.md                  # COMPLETE: how Agent-C works (flows, IA)
│   ├── 03-ui-direction.md                 # MISSING: look, feel, taste, voice
│   ├── 04-architecture.md                 # MISSING: technical system design
│   ├── 05-implementation.md               # MISSING: implementation + test results
│   ├── backlog.md                         # Deferred items
│   ├── critic-reports/                    # Quality reviews
│   │   ├── 2026-06-24-pm-p1.md            # PM stage: APPROVED
│   │   └── 2026-06-28-system-e2e-p1.md    # CURRENT: end-to-end review (findings below)
│   └── wireframes/                        # Low-fi UX sketches
├── docs/DUAL-MODE-SKILL-PATTERN.md        # How skills support both workflow and standalone modes
├── agent-defs/README.md                   # Status of subagent wrappers
└── [package.json, tsconfig, etc.]
```

### 3.2 How to Read the Codebase

**Start here for understanding:**
1. `README.md` — quick start and front door
2. `ARCHITECTURE.md` — full system design; the map
3. `docs/product/01-pm-brief.md` — Agent-C's own what & why
4. `docs/product/02-ux-workflow.md` — Agent-C's own flows and structure
5. `agents/` — the 13 skills are the implementation; read the SKILL.md file for any role you're working on

**For the dashboard sub-product:**
- `dashboard/docs/product/` — same structure; its own discovery chain (01-05 + QA report)

**For skills mechanics:**
- `agents/stage-protocol/SKILL.md` — how every role enters, checkpoints, revises, and writes state.json
- `agents/elicitation/SKILL.md` — the discipline for asking questions well
- `agents/best-practices/SKILL.md` — how to choose current best practice over frequency bias

### 3.3 Installation & Running (Codex Context)

Since you're moving to Codex, you'll invoke skills differently. Here's the conceptual model:

**The skills are plain Markdown files with a frontmatter + method.**

Each SKILL.md file:
- Has frontmatter: `name`, `description`, (optional `triggers`)
- Has a `## Method` section explaining how to use it
- Has specialized guidance (themes, template, output format)
- Is independent — you can read and follow it without requiring a platform wrapper

**To use a skill in Codex:**
1. Read the relevant `agents/<name>/SKILL.md` file
2. Follow its method and guidance exactly
3. The skill will tell you what inputs it needs, what questions to ask, and what output to produce
4. Write the output to the specified location (e.g., `docs/product/01-pm-brief.md`)

**Example: Running the UI skill on Agent-C**
1. Read `agents/ui/SKILL.md`
2. Establish the project: "Agent-C system, ~/Code/Saasless/Agent-C/"
3. Determine mode: check if `docs/product/02-ux-workflow.md` exists → YES, Mode A
4. Read `01-pm-brief.md` and `02-ux-workflow.md`
5. Follow the UI skill's themes (design concept, visual tone, etc.)
6. Produce and write `docs/product/03-ui-direction.md`

---

## 4. Current State & What's Missing

### 4.1 What's Built (Verified)

| Component | Status | Notes |
|-----------|--------|-------|
| **Shared methods** | ✅ Complete | elicitation, best-practices, feature-mode, stage-protocol all mature |
| **Role skills** | ✅ Complete | product-manager, ux, ui, architect, engineer, qa all exist with dual-mode support |
| **Orchestrator** | ✅ Complete | Manual orchestration in Desktop; dispatches, manages registry, approval gates |
| **Critic (PM/UX/UI)** | ✅ Complete | Two-pass model; reports to orchestrator |
| **Technical-critic** | ✅ Complete | Single-pass; auto-apply model (findings tagged APPLY/DEFER; engineer applies without HITL) |
| **Electron dashboard** | ✅ Complete | GUI for the orchestrator's project dashboard; shows stage, approval status, git state |
| **Agent-C discovery (01-02)** | ✅ Complete | PM brief and UX workflow for Agent-C itself are approved |
| **Dashboard discovery (01-05 + QA)** | ✅ Complete | Dashboard's own full lifecycle documented |
| **Test suite** | ✅ 97 tests | dashboard + watcher-service + git-service + state/registry readers |

### 4.2 What's Missing

| Stage | Artifact | Status | Why Missing |
|-------|----------|--------|-------------|
| **UI** | `docs/product/03-ui-direction.md` | 🔴 Missing | Agent-C has not run the UI skill on itself |
| **Architect** | `docs/product/04-architecture.md` | 🔴 Missing | Agent-C has not run the architect skill on itself |
| **Engineer** | `docs/product/05-implementation.md` | 🔴 Missing | Agent-C source code exists but no implementation doc; no tests for Agent-C system itself |
| **QA** | `docs/product/qa-report.md` | 🔴 Missing | Agent-C has not run QA verification on itself |

**Why this matters:** The system's central promise is "every stage produces a reviewable artifact; context flows downstream." Agent-C proves this for the dashboard (a sub-product), but not for the system itself. Fixing this is **high-priority dogfooding**.

---

## 5. The 9 Prioritized Findings (End-to-End Critic Report)

Full details in `docs/product/critic-reports/2026-06-28-system-e2e-p1.md`. Here's the prioritized action list:

### 5.1 Significant Findings (address first)

#### Finding 1: Platform/GUI story is stale in the brief
**Problem:** `01-pm-brief.md:6` says "designed for **Claude Desktop (not Code) … no GUI screens**." Reality: the system now spans Desktop (manual orchestration) + Code (subagent wrappers in `agent-defs/`) + Electron GUI dashboard. The source-of-truth brief contradicts the built system.

**Why it matters:** New readers will misunderstand what the product is. It looks like an incomplete product when it's actually a healthy evolution.

**Action items:**
1. Open `docs/product/01-pm-brief.md`
2. Add a new section after section 8 (Business model): **"Post-v1 evolution"** or **"Platform & distribution (post-discovery)"**
3. Document that the product now spans:
   - **Claude Desktop:** manual orchestration (no subagents needed), users invoke skills directly
   - **Claude Code:** thin subagent wrappers in `agent-defs/` enable autonomous dispatch (not yet built; Code-only, post-v1)
   - **Electron GUI dashboard:** a separate sub-product (`dashboard/`) that is the GUI realization of the text orchestrator dashboard
4. Emphasize: the core process (PM → UX → UI → architect → engineer → QA) is unchanged; the platform **choices evolved** based on what was actually needed
5. Update `02-ux-workflow.md:6` similarly: note that "no GUI screens" was the v1-discovery baseline; the dashboard is the GUI implementation post-discovery

**Responsible party:** You, with feedback from the architect/engineer phases

**Effort:** 30 minutes (write the section, verify references)

---

#### Finding 2: Agent-C's own artifact chain is incomplete (THE BIG ONE)
**Problem:** The UX workflow hands off to UI (`02-ux-workflow.md:121`): *"UI agent → … writes docs/product/03-ui-direction.md."* That file does not exist. Neither do `04`, `05`, or the QA report. The system built six agents but has only run two of them on itself.

**Why it matters:**
- Agent-C's entire pitch is "every stage produces a reviewable artifact; you approve before advancing." It hasn't proven this end-to-end on itself.
- A reader sees an incomplete artifact chain and questions whether the system works.
- This is the highest-value regression test: running the system on itself will surface real issues before users hit them.

**Action items (choose one path):**

**Path A: Complete the chain (recommended)**
1. Run the **UI skill** on Agent-C:
   - Read `agents/ui/SKILL.md`
   - Establish project: "Agent-C," `~/Code/Saasless/Agent-C/`
   - Determine mode: Mode A (02-ux-workflow.md exists)
   - Read `01-pm-brief.md` and `02-ux-workflow.md`
   - Follow the UI skill's themes (design concept, visual tone, key element styling, voice, anti-references)
   - **Produce and write `docs/product/03-ui-direction.md`**
   - Tip: Agent-C is an agentic/conversational product (CLI-style in Claude, Electron GUI in dashboard); the UI direction should address both touchpoints' presentation

2. Run the **architect skill** on Agent-C:
   - Read `agents/architect/SKILL.md`
   - Mode A (03-ui-direction.md now exists)
   - Read `01`/`02`/`03`
   - Follow the architect's themes (drivers, context, components, runtime behavior, data model, interfaces, decisions, cross-cutting concerns, deployment)
   - **Produce and write `docs/product/04-architecture.md`**
   - Tip: The architecture already exists in code; the architect's job is to *document* the decision rationale and make it reviewable. The decisions live in the skills and the dashboard code.

3. Run the **engineer skill** on Agent-C:
   - Read `agents/engineer/SKILL.md`
   - Mode A (04-architecture.md exists)
   - Document the implementation: the 13 skills, the shared methods, the lifecycle, the state.json protocol, the dashboard
   - **Produce and write `docs/product/05-implementation.md`**
   - Tip: No new code needs to be written; this is documentation of what's already built. Write a summary of skills/methods, the key implementation decisions (symlinks, state.json schema, IPC, Electron architecture), and the test results.

4. Run the **QA skill** on Agent-C:
   - Read `agents/qa/SKILL.md`
   - Mode A (full workflow)
   - Derive acceptance criteria from the brief (shipped, solo dev can use it end-to-end, artifacts are reviewable, etc.)
   - Verify: all 13 skills exist and follow the contract? The PM and UX artifacts are approved? The dashboard is a working GUI? The test suite covers the key paths?
   - **Produce and write `docs/product/qa-report.md`**
   - Report findings and a verdict (pass / pass with issues / fail → fix)

**Effort:** ~16 hours total (4 hours UI, 4 hours architect, 4 hours engineer, 4 hours QA) — this is documentation, not new code.

**Path B: Document the dogfooding stop-point (fallback)**
If Path A is too much work right now:
1. Open `02-ux-workflow.md` and add a note after the "Next handoff" section:
   ```
   **Dogfooding status (v1 completed):**
   Agent-C's own discovery chain intentionally stops at the UX stage in v1. 
   The system was hand-built and verified via the dashboard sub-product's 
   full lifecycle proof (01-05 + QA report). The UI/architect/engineer/QA 
   artifacts are high-value future work (backlog item #3).
   ```
2. Add similar notes to `ARCHITECTURE.md:233-234` and `README.md:75-87`
3. Log this as a backlog item

**Responsible party:** You + Codex (for UX/architect/engineer/QA phases)

---

#### Finding 3: Dashboard is invisible in the system documentation
**Problem:** `ARCHITECTURE.md` is "the top-level map" but doesn't mention `dashboard/` anywhere. The dashboard is the single largest piece of built software in the repo (Electron + React app, full discovery chain, 97 tests) yet reads as invisible at the system level.

**Why it matters:** New readers won't know the dashboard exists or how it relates to the orchestrator.

**Action items:**
1. Open `ARCHITECTURE.md`
2. Add a new section before §9 (Extending the system): **"§8.5 Sub-products: the Dashboard"**
   ```
   ## 8.5 Sub-products: The Dashboard
   
   The text dashboard (described in §2 Skill catalog and §3 Lifecycle) has a GUI 
   counterpart: the Electron-based **dashboard application** (`dashboard/` folder). 
   The GUI dashboard is the visual realization of the orchestrator's text-based 
   project listing and approval-gate interaction.
   
   **Architecture:** Electron 33 (main process + preload + renderer), React 18, 
   TypeScript, Zustand, Tailwind CSS. Watches the registry and project state files 
   on disk; updates reactively when orchestrator changes state. Built and tested as 
   a full sub-product with its own discovery chain (01-pm-brief → 05-implementation 
   + QA report in dashboard/docs/product/).
   
   **Relationship to orchestrator:** The orchestrator is the "business logic" 
   (what decisions to make, how state flows, what the user can do); the dashboard 
   is one "surface" for that logic. In v1, orchestration is manual via Claude Desktop; 
   the dashboard is a peer surface showing the same state in a GUI format.
   
   **Test coverage:** 97 tests across 8 suites (watcher, git, state, registry readers, 
   store, UI components).
   ```
3. Update the §10 repo-layout tree to include `dashboard/`:
   ```
   dashboard/                  # Electron GUI dashboard (the visual surface for orchestrator state)
   ├── src/main/               # Electron main process (IPC handlers, watchers, git)
   ├── src/renderer/           # React app (project list, approval UI, git state)
   ├── src/preload/            # IPC bridge (contextIsolation ON, sandbox ON)
   ├── src/shared/             # Shared types (DashboardAPI)
   ├── docs/product/           # Dashboard's own discovery artifacts (01-05 + QA)
   └── package.json
   ```

**Responsible party:** You (documentation)

**Effort:** 20 minutes

---

#### Finding 4: Cross-surface notification rule is undocumented (your point 1)
**Problem:** You established a rule: *"whenever an action for the user is returned, it must be communicated on every surface (Claude chat, the Electron dashboard, and a future CLI) so the user knows there's an action no matter where they're working."* This is **partially implemented** (orchestrator emits a "What needs your attention" block in chat; dashboard computes a Claude prompt) but is **not written down as a requirement or invariant** anywhere in the artifacts.

**Why it matters:** Future maintainers won't know this is a rule. If someone adds a new surface (a CLI, a Slack integration, etc.) without understanding the cross-surface symmetry requirement, they could violate it.

**Action items:**
1. Open `docs/product/02-ux-workflow.md`, find §4 (States & feedback)
2. Add a new subsection: **"Cross-surface notification invariant"**
   ```
   ### Cross-surface notification invariant
   
   **Rule:** Every action that requires user attention must be surfaced on all 
   active surfaces simultaneously. The user must always know what needs their 
   attention, regardless of which surface they're looking at.
   
   **How it works:**
   - A single source of truth: `state.json` in each project's docs/product/ folder
   - The `needsYou` flag marks projects/stages awaiting approval or revision
   - The orchestrator reads state.json and outputs a "What needs your attention" 
     plain-text block in chat (so chat users see it)
   - The Electron dashboard watches state.json on disk and updates reactively (so 
     GUI users see it)
   - Any future surface (CLI, Slack, etc.) must read the same state.json and show 
     the same `needsYou` entries
   
   **Consequence:** Surfaces cannot diverge. If one surface is stale (doesn't show 
   a pending action), it's a bug in the surface implementation, not a design choice.
   ```
3. Open the **orchestrator skill** (`agents/orchestrator/SKILL.md`) and find the "Dashboard" section (around line 90)
4. Add a contract line after the notes on the dashboard table:
   ```
   **Cross-surface invariant (mandatory for all surfaces):**
   Every `needsYou: true` entry must appear on all surfaces reading state.json. 
   Surfaces cannot diverge on what needs the user's attention. The orchestrator's 
   chat output and the Electron dashboard must show the same pending actions. 
   New surfaces must respect this invariant.
   ```

**Responsible party:** You (documentation); future work: test that surfaces don't diverge

**Effort:** 20 minutes

---

### 5.2 Minor Findings (drift cleanup)

#### Finding 5: README Status omits dashboard and auto-apply critic
**Problem:** `README.md:75-87` says v1 is complete but doesn't mention (a) the Electron dashboard at all, or (b) the technical-critic **auto-apply** model just introduced.

**Action:**
- Open `README.md`, find the **Status** section (line 75-87)
- Expand to mention:
  - Dashboard: "An Electron GUI dashboard provides a visual interface to the orchestrator's project registry and approval gates (separate sub-product in `/dashboard`)."
  - Auto-apply: "The technical-critic findings are auto-applied by the engineer with no HITL review; the human gate sees the final engineering output at QA."

**Effort:** 10 minutes

---

#### Finding 6: Model claim is dated
**Problem:** `01-pm-brief.md:8` and `:119` claim "Claude 3.5 Sonnet" as the minimum. Current runtime references Claude 4.x family (Sonnet 4.6, Opus 4.8).

**Action:**
- Update `01-pm-brief.md:8` and `:119` to:
  ```
  **Claude model (current):** Sonnet 4.6+ (PM/UX/UI stages). 
  **Historical floor:** Claude 3.5 Sonnet (v1 discovery baseline).
  ```

**Effort:** 5 minutes

---

#### Finding 7: Auto-apply critic loop vs. "don't auto-chain" principle
**Problem:** `ARCHITECTURE.md:36-38` states the locked principle *"No stage invokes the next directly."* The new technical-critic → engineer auto-apply path (`pendingFeedback.source == "critic"`) is adjacent to that principle. It doesn't violate it (the critic isn't a lifecycle stage; the engineer is reacting, not being invoked), but the tension is unaddressed.

**Action:**
- Open `ARCHITECTURE.md`, find §1 (Core design principles), and add a one-line carve-out after the "Recommend, don't auto-chain" bullet:
  ```
  - **Recommend, don't auto-chain.** A stage returns control when done and 
    *recommends* the next stage. Sequencing, the project registry, and approval 
    gates belong to the **orchestrator**. No stage invokes the next directly. 
    *(Carve-out: the engineer auto-applies technical-critic findings as a targeted 
    revise without waiting for HITL, since the critic isn't a lifecycle stage — 
    it's a quality gate feeding back to an existing stage.)*
  ```

**Effort:** 5 minutes

---

#### Finding 8: Registry/state corruption recovery is still open
**Problem:** The original PM critic flagged "failure modes under registry/artifact tampering" and noted it for architect/QA — but with no system `04`, it was never designed. Still open.

**Action:**
- Log as a backlog item (see Finding 6b in the critic report)
- Reopen this after the architect stage completes

**Effort:** Documentation only; design needed later

---

#### Finding 9: Spot-check agent-defs stubs against current skill contracts
**Problem:** `agent-defs/` has thin subagent wrappers (Code-only; idle until autonomous dispatch). The engineer and technical-critic stubs were updated in recent commits, but the others weren't re-checked.

**Action:**
1. Read `agent-defs/README.md` to understand the stubs' purpose
2. For each stub (product-manager, ux, ui, architect, qa, critic):
   - Read the stub's description
   - Cross-check it against the matching skill's current contract (the "Handoff contract" section)
   - If the stub is outdated, update it
3. Particularly check:
   - `agent-defs/engineer.md` — does it mention auto-apply? (should, since it was updated in recent commits)
   - `agent-defs/technical-critic.md` — does it mention single-pass auto-apply? (should)

**Effort:** 30 minutes

---

## 6. How to Dogfood Agent-C on Itself (Step-by-Step)

This is the **highest-value work you can do** to validate the system. Here's the exact process:

### 6.1 Setup
1. Ensure you have Codex installed and can invoke skills/methods
2. Have `agents/ui/SKILL.md`, `agents/architect/SKILL.md`, `agents/engineer/SKILL.md`, and `agents/qa/SKILL.md` open and readable
3. Work on the Agent-C project: `~/Code/Saasless/Agent-C/`

### 6.2 UI Stage

**Who:** You as the UI designer  
**What to read:** `agents/ui/SKILL.md`, then `01-pm-brief.md` and `02-ux-workflow.md`

**Process:**
1. Open `agents/ui/SKILL.md` and read the full method
2. Establish the project: "Agent-C, ~/Code/Saasless/Agent-C/"
3. Determine mode: Mode A (02-ux-workflow.md exists)
4. Read the upstream: `01-pm-brief.md` (product's what & why) and `02-ux-workflow.md` (how it works)
5. Follow the **analysis phase** (Mode A section):
   - Product name: Agent-C
   - Purpose: distributable, steerable multi-agent dev pipeline
   - Product type: agentic/conversational (CLI in Desktop, GUI in dashboard)
   - Key flows: start project, approve stage, revise, skip stage
   - Key surfaces: the text dashboard (in orchestrator), the GUI dashboard (in Electron)
6. Report your findings back: what did you understand about Agent-C's look and feel?
   - How should the text orchestrator be formatted? (tables? prose? structured blocks?)
   - How should the Electron dashboard look? (it already exists, but document the design intent)
   - What's the voice/tone? (professional, friendly, technical, human?)
   - What visual personality? (minimal, metallic/polished like the dashboard already is, dark/light?)
7. Follow the **elicitation phase** (the six themes):
   - Theme 1: Design concept & personality — what's the unifying idea? (The dashboard uses a "polished steel" aesthetic; the text should complement it)
   - Theme 2: Visual/presentational tone — color, typography, formatting conventions
   - Theme 3: Key element styling — how the dashboard, tables, approval prompts look
   - Theme 4: Voice & tone — how the orchestrator speaks to the user
   - Theme 5: References & anti-references — what Agent-C looks/sounds like, and what it doesn't
   - Theme 6: Accessibility & medium constraints — contrast, readability, terminal/GUI constraints
8. **Output:** Write `docs/product/03-ui-direction.md` using the template in the skill
9. Reflect back to yourself: does this direction make sense for a developer-facing tool?

**Key insight:** You already have a dashboard GUI (Electron) with a visual direction. The UI stage is documenting and *justifying* that direction, not redesigning it. Document **why** the dashboard chose polished steel and metallic blue, what that aesthetic says, and how it extends to text-only surfaces.

---

### 6.3 Architect Stage

**Who:** You as the architect  
**What to read:** `agents/architect/SKILL.md`, then `01`, `02`, `03`

**Process:**
1. Open `agents/architect/SKILL.md` and read the full method
2. Establish the project: "Agent-C, ~/Code/Saasless/Agent-C/"
3. Determine mode: Mode A (03-ui-direction.md now exists)
4. Read the upstream: `01-pm-brief.md`, `02-ux-workflow.md`, `03-ui-direction.md`
5. Follow the **analysis phase**:
   - Product name: Agent-C
   - Product type: agentic/conversational (both CLI and GUI)
   - Scope/non-goals: thin slice through whole lifecycle; all six roles shallow before deep; v1 is manual orchestration
   - Key user flows: PM → UX → UI → architect → engineer → QA → ship
   - Quality attributes: transparency (reviewable artifacts), steerability (approval gates), context preservation (versioned docs), resumability (checkpoints)
6. Report your findings:
   - What must the architecture optimize for? (Simplicity? Scalability? Extensibility? — choose 2-3)
   - What are the system boundaries? (Inside: the 6 roles + orchestrator + critics; outside: the user's IDE, their Claude setup, external APIs)
   - What are the major components? (13 skills, orchestrator, state.json, registry.json, dashboard)
7. Follow the **elicitation phase** (the nine themes):
   - Theme 1: Drivers & constraints — what does this system optimize for? Transparency is #1. Steerability is #2. Extensibility is #3. Hard constraints: must work on user's own machine (solo dev model); no backend, no accounts.
   - Theme 2: System context & boundaries — inside: the 13 skills and the lifecycle; outside: user's environment, Claude, the codebase being built
   - Theme 3: Architecture style & major components — the style is skill-based modular orchestration (each role is a portable skill; the orchestrator sequences them). Components: PM/UX/UI/architect/engineer/QA skills, orchestrator, state.json (per-project state), registry.json (all projects), shared methods (elicitation, best-practices, stage-protocol, feature-mode).
   - Theme 4: Runtime behavior & key scenarios — the main scenario: user invokes orchestrator → orchestrator dispatches stage → stage runs elicitation one question at a time → stage produces artifact → stage returns control → orchestrator presents approval gate → user approves or requests changes → orchestrator moves to next stage or revises current one.
   - Theme 5: Data model & state — the core entities are Project (name, path, current stage, list of completed stages) and ProjectState (per-stage status, checkpoints, pending feedback). Persisted to state.json (per project) and registry.json (all projects). Source of truth is on disk; no server.
   - Theme 6: Interfaces & contracts — between stages: artifacts (versioned Markdown docs). Between orchestrator and stage: stage-protocol (entry mode, checkpoint I/O). Between user and orchestrator: approval gates (approve/revise/pause/switch). Between skills and the platform: the Skill tool (or direct SKILL.md reading in Codex).
   - Theme 7: Key technical decisions — use Markdown for artifacts (human-readable, version-control-friendly, not lock-in); symlink skills so edits are live immediately; JSON for state (simple, queryable, no schema migration); the stage-protocol abstraction so all roles checkpoint the same way; the dual-mode pattern (every skill works both in workflow and standalone).
   - Theme 8: Cross-cutting concerns — auth: none (single user per machine); error handling: roles report findings, don't block; configuration: minimal (just project path); observability: state.json is the audit trail; testability: isolated skills, state is mockable.
   - Theme 9: Deployment & distribution — the system ships as a Git repo; users clone and symlink skills into ~/.claude/skills/ (or equivalent in Codex); the dashboard is an Electron app that ships with the repo and reads from disk.
8. **Output:** Write `docs/product/04-architecture.md` using the template
   - You already know the architecture (the code exists). Your job is documenting the *decisions* and their rationale.
   - The key decision table (theme 7) should have rows for: artifact format (Markdown), skill distribution (symlinks), state persistence (JSON), stage-protocol (shared abstraction), dual-mode pattern (workflow + standalone).
   - Explain why each was chosen (Markdown: human-readable + version control; symlinks: live edits; JSON: simplicity; stage-protocol: consistent checkpointing; dual-mode: flexible entry points).

**Key insight:** The architecture is already built and working. This stage documents *why* those choices were made and *what trade-offs* they involve. Don't redesign; defend the existing decisions or note where you'd improve them for v2.

---

### 6.4 Engineer Stage

**Who:** You as the engineer documenting the implementation  
**What to read:** `agents/engineer/SKILL.md`, then `01`–`04`

**Process:**
1. Open `agents/engineer/SKILL.md` and read the full method
2. Establish the project: "Agent-C, ~/Code/Saasless/Agent-C/"
3. Determine mode: Mode A (04-architecture.md now exists)
4. Read the upstream: `01-pm-brief.md`, `02-ux-workflow.md`, `03-ui-direction.md`, `04-architecture.md`
5. **Orientation phase:**
   - Mode: Mode A (full workflow)
   - Inputs read: all four upstream artifacts
   - Existing conventions: TypeScript, symlinks, Markdown, JSON, Electron (for dashboard)
   - Integration points: skills are symlinked to `~/.claude/skills/`; state.json lives in each project; registry.json is central; dashboard watches files on disk
   - Implementation plan: (no new code needed; just document what exists)
     - Document the 13 skills and their contracts
     - Document shared methods and how all roles use them
     - Document the stage-protocol (state.json schema, checkpoint I/O, entry modes)
     - Document the orchestrator (registry, gates, dispatch)
     - Document the Electron dashboard (Vite 5, React 18, Zustand, Tailwind)
     - Summarize the test results (97 tests, 8 suites)
   - Test plan: (no new tests for Agent-C system itself; the dashboard has its own tests)
6. **Implementation phase:** (documentation, not coding)
   - Write sections for:
     - Shared methods (what each does; which roles use it)
     - The lifecycle (all 6 roles, how they relate)
     - Skill contracts (handoff patterns, dual-mode, state.json write ownership)
     - State.json schema (the shape, what each field means)
     - Orchestrator workflow (registry, approval gates, dispatch)
     - Dashboard architecture (Electron structure, IPC, watchers, React components)
   - For each section, reference the actual skill files so readers know where to look
7. **Output:** Write `docs/product/05-implementation.md`
   - Template: (no standard template for implementation docs; follow the pattern in `dashboard/docs/product/05-implementation.md`)
   - Key sections:
     - Summary of what was built (13 skills, orchestrator, dashboard)
     - Shared methods (elicitation, best-practices, stage-protocol, feature-mode)
     - The 6 lifecycle roles and their contracts
     - Skill mechanics: dual-mode, entry-mode detection, checkpointing, state.json
     - Orchestrator: registry, approval gates, dispatch logic
     - Dashboard: architecture, IPC, file watching, React state management
     - Test results: run `npm test` in dashboard/ and report the output
   - Artifacts: list what the engineer *produces* (the 13 skills, the orchestrator, the dashboard, the test suite)
   - Verify: all tests pass, all roles follow the contract, the orchestrator dispatches correctly

**Key insight:** No new code. This is documentation of the **implementation decisions** (why 13 skills instead of 1 monolithic agent? why dual-mode? why state.json instead of a database?). The verification step is running the tests and checking that all skills follow the contract they declare.

---

### 6.5 QA Stage

**Who:** You as the QA engineer  
**What to read:** `agents/qa/SKILL.md`, then `01`–`05`

**Process:**
1. Open `agents/qa/SKILL.md` and read the full method
2. Establish the project: "Agent-C, ~/Code/Saasless/Agent-C/"
3. Determine mode: Mode A (full workflow; 05-implementation.md now exists)
4. Read the upstream: all five artifacts
5. **Orientation phase:**
   - Derive acceptance criteria from the artifacts:
     - From `01-pm-brief.md`: solo devs can use end-to-end, artifacts are reviewable, context is preserved, skills are portable
     - From `02-ux-workflow.md`: all primary flows work (start, resume, revise, skip), approval gates present, dashboard shows all projects
     - From `03-ui-direction.md`: text and GUI are consistent, voice is clear, look matches the intent
     - From `04-architecture.md`: all 13 skills exist, orchestrator manages state, stage-protocol handles checkpoints, Markdown artifacts flow downstream
     - From `05-implementation.md`: tests pass, skills follow their contracts, dashboard watches state correctly
   - Test plan (6 checks from the QA skill):
     1. **Acceptance criteria** — list above ✓
     2. **Functional verification** — can you start a new project? Can you resume mid-stage? Can you approve and advance? Can you request changes?
     3. **Build & tests** — run `npm test` in dashboard/; all should pass
     4. **Design & architecture conformance** — do the skills follow their declared contracts? Is state.json used correctly? Does the orchestrator dispatch without auto-chaining?
     5. **Non-functional checks** — can skills be run standalone (Mode B)? Do checkpoints work across sessions?
     6. **Regression & side-effects** — does the recent auto-apply change (critic → engineer without HITL) work? Are the new cross-surface notification requirements met?
6. **Verification phase:**
   - **Check 1: Acceptance criteria** ✓ (listed above)
   - **Check 2: Functional flows**
     - Manually trace a "start new project" flow: you invoke orchestrator → it asks for name/path → creates state.json → dispatches PM skill → PM asks questions → PM writes artifact → PM returns → orchestrator presents approval gate → you approve → orchestrator advances to UX. Does this work? *Yes, the orchestrator skill exists and follows this pattern.*
     - Manually trace a "resume from checkpoint": open state.json → see a checkpoint in the PM stage → re-invoke PM → does it ask only the unanswered questions, not the whole thing? *The stage-protocol skill handles this; check `agents/stage-protocol/SKILL.md` to verify.*
     - Manually trace an "auto-apply critic findings": technical-critic writes findings to state.json with `source: "critic"` → engineer detects this on next invocation → engineer enters "revise" mode → applies findings without waiting for HITL → clears feedback → returns. *The engineer skill has a section "Auto-apply technical critic findings"; verify it does this.*
   - **Check 3: Build & tests**
     - Run `npm test` in `dashboard/`; expect 97 tests to pass across 8 suites
     - All dashboard tests should pass ✓
   - **Check 4: Contracts**
     - Read each skill's "Handoff contract" section
     - Verify: (a) does it return control without auto-chaining? (b) does it recommend the next stage? (c) does it write state.json correctly?
     - All 13 skills declare the handoff contract; spot-check 3–4 to ensure they actually follow it
   - **Check 5: Checkpoint & resumption**
     - Manually create a state.json with a checkpoint (copy from `dashboard/docs/product/state.json` and modify)
     - Invoke a skill and see if it detects the checkpoint and resumes from the current section (not from section 1)
     - The stage-protocol skill should handle this; verify by reading the entry-mode detection logic
   - **Check 6: Auto-apply + cross-surface notification**
     - Manually create a state.json with `pendingFeedback: { source: "critic" }`
     - Invoke the engineer skill and verify it enters "revise" mode and applies without confirmation
     - Check that the orchestrator emits a "What needs your attention" block in chat when a project has `needsYou: true`
     - Check that the Electron dashboard shows the same `needsYou` flag and reacts when state.json changes
7. **Output:** Write `docs/product/qa-report.md`
   - Format (from the QA skill):
     - Summary: Agent-C verified against acceptance criteria; verdict: pass / pass with issues / fail
     - Per-area findings: acceptance criteria (pass), functional flows (pass), build & tests (pass), contracts (pass), checkpointing (pass), auto-apply (pass), cross-surface notification (pass/needs work?)
     - Issues if any: severity (blocker / major / minor), description, how to fix
     - Verdict and recommendation: "Agent-C is ready to ship" or "Back to engineer for fixes: [list]"

**Key insight:** This is the final quality gate. You're not redesigning or re-implementing; you're checking that the built system actually does what it claims. If you find bugs (e.g., checkpoint detection fails, or the cross-surface notification isn't working), report them as QA findings and hand back to engineer. Don't fix them yourself.

---

## 7. What You'll Learn / What to Expect

### 7.1 Likely Issues You'll Find
(And why they're valuable)

1. **Checkpointing edge cases** — what happens if you interrupt in the middle of elicitation and resume 24 hours later? Does state.json still have the right checkpoint? *This will stress-test the stage-protocol.*
2. **Artifact handoff chain** — do all downstream stages correctly read the upstream artifacts? UX reads PM brief? UI reads UX workflow? *This will validate the artifact chain.*
3. **Cross-surface divergence** — if you approve a stage in chat (orchestrator updates state.json), does the Electron dashboard update within a second? *This will validate the file-watching watcher.*
4. **Skill mode detection** — do the skills correctly detect Mode A vs. Mode B? Does a skill work standalone if you delete the PM brief? *This will validate the dual-mode pattern.*

All of these are **regression tests in disguise**. Running them will tell you:
- Are the skills' contracts actually true?
- Do the watchers work correctly?
- Does state.json flow through the system as expected?
- Would a user hit a wall, or does the system actually work end-to-end?

### 7.2 Success Criteria
When you're done dogfooding, you should have:

- ✅ `docs/product/03-ui-direction.md` — written, describing the design intent
- ✅ `docs/product/04-architecture.md` — written, explaining key decisions
- ✅ `docs/product/05-implementation.md` — written, documenting what's built
- ✅ `docs/product/qa-report.md` — written, verdict on whether the system works end-to-end
- ✅ All tests passing (the 97 dashboard tests + any new ones you write to cover edge cases)
- ✅ Any bugs found logged in the backlog for v2
- ✅ Confidence that the system is not a house of cards — it actually works

---

## 8. Other Things to Know

### 8.1 The Skills Are Your API

Think of each SKILL.md file as an API contract:
- **Input:** what the skill needs (prior artifacts, project path, user context)
- **Method:** how the skill works (the discipline, themes, questions)
- **Output:** what the skill produces (artifact, backlog items, recommendation)
- **Contract:** what the skill promises (return control, don't auto-chain, write state.json this way)

To use a skill in Codex:
1. Read the SKILL.md file completely
2. Follow the method exactly (don't improvise)
3. Write the output to the specified location
4. Treat the "Handoff contract" as binding — if a skill says "return control," don't auto-invoke the next skill

### 8.2 State.json Is the Source of Truth

Every project has a `docs/product/state.json` file (or `docs/features/<slug>/state.json` for features). It holds:
- Current stage
- Per-stage status (not-started, in-progress, awaiting-approval, approved-complete)
- Checkpoints (if mid-elicitation)
- Pending feedback (if awaiting revision)
- Revision counts, critic passes, updated timestamps

**This file is everything.** If state.json is lost, the work is lost. If it's corrupted, resume won't work. Version control this file. Back it up. Read it before invoking a skill (so you know what mode to enter).

### 8.3 The Backlog Is a First-Class Artifact

Every stage appends to `docs/product/backlog.md`. This is NOT a trash file; it's where deferred, important work lives. Read it before planning v2. Examples from the current backlog:
- "Hand-edit / artifact conflict reconciliation" (deferred from UX stage, 2026-06-23)
- "Retrospective review of existing projects" (feature request, 2026-06-24)
- "User-customized skills" (deferred, requires user identity/login)

### 8.4 Symlinks Are a Feature, Not a Hack

The skills live in `agents/<name>/SKILL.md` and are symlinked into `~/.claude/skills/<name>`. This means:
- Editing `agents/product-manager/SKILL.md` immediately affects `~/.claude/skills/product-manager`
- No separate deployment step
- Skills are versioned in Git
- Your skill changes are always live

In Codex, you'll just read the SKILL.md files directly, so the symlinks are less relevant. But understand that in Claude Code, they're the distribution mechanism.

### 8.5 The Critic Is a Quality Gate, Not a Blocker

Both the critic (PM/UX/UI) and technical-critic (architect/engineer/QA) skills report findings but don't decide whether to advance. You (or the orchestrator) decide. The critic's job is to flag issues so the human gate has full context. So when the critic reports findings, you still have the choice:
- **Accept all findings and send back to revise**
- **Accept some findings; defer others to backlog**
- **Reject the findings and proceed anyway** (not recommended, but possible)

---

## 9. Quick Reference: Running Each Stage

### To run the **PM skill** (start a new product):
```
Read: agents/product-manager/SKILL.md
Input: project name + path (or none if fresh)
Output: docs/product/01-pm-brief.md
Next: invoke UX skill
```

### To run the **UX skill**:
```
Read: agents/ux/SKILL.md
Input: 01-pm-brief.md exists (Mode A)
Output: docs/product/02-ux-workflow.md
Next: invoke UI skill
```

### To run the **UI skill**:
```
Read: agents/ui/SKILL.md
Input: 01-pm-brief.md + 02-ux-workflow.md exist (Mode A)
Output: docs/product/03-ui-direction.md
Next: invoke architect skill
```

### To run the **architect skill**:
```
Read: agents/architect/SKILL.md
Input: 01 + 02 + 03 exist (Mode A)
Output: docs/product/04-architecture.md
Next: invoke engineer skill
```

### To run the **engineer skill**:
```
Read: agents/engineer/SKILL.md
Input: 01 + 02 + 03 + 04 exist (Mode A)
Output: code + docs/product/05-implementation.md
Next: invoke QA skill
```

### To run the **QA skill**:
```
Read: agents/qa/SKILL.md
Input: 01 + 02 + 03 + 04 + 05 exist (Mode A)
Output: docs/product/qa-report.md
Next: orchestrator presents to human gate
```

### To run the **critic** (optional gate action on PM/UX/UI):
```
Read: agents/critic/SKILL.md
Input: artifact to review + prior artifacts
Output: critic-reports/YYYY-MM-DD-<stage>-p<N>.md
Next: orchestrator decides (approve or revise)
```

### To run the **technical-critic** (optional gate action on architect/engineer/QA):
```
Read: agents/technical-critic/SKILL.md
Input: artifact + code to review
Output: critic-reports/YYYY-MM-DD-<stage>-p1.md + pendingFeedback in state.json
Next: engineer auto-applies (no HITL)
```

---

## 10. Next Steps (Immediate)

1. **Read this entire document once** — get the big picture
2. **Read `ARCHITECTURE.md`** — understand the system design
3. **Read `docs/product/01-pm-brief.md` and `02-ux-workflow.md`** — understand Agent-C's own brief
4. **Address the 4 significant findings** (in order):
   - Finding 1: Update PM brief with platform evolution
   - Finding 2: Run UI → architect → engineer → QA on Agent-C itself (or document the dogfooding stop-point)
   - Finding 3: Add dashboard to ARCHITECTURE.md
   - Finding 4: Document cross-surface notification rule in UX workflow + orchestrator skill
5. **Address the 5 minor findings** (cleanup)
6. **Run the critic report on yourself** — do findings 1–4 above, then run the end-to-end review again and see if you fixed them

---

## 11. Codex-Specific Notes

### How to Invoke Skills in Codex

Codex doesn't have the Skill tool (that's Claude Code). Instead:
1. **Skills are plain Markdown files.** Read them directly: `agents/product-manager/SKILL.md`, etc.
2. **Follow the method exactly.** Each SKILL.md has a frontmatter + method section. Read and implement it.
3. **Write outputs to the specified locations.** E.g., `docs/product/01-pm-brief.md`, `docs/product/state.json`.
4. **Use version control (Git) to track state.json changes.** This is your audit trail.

### Interoperability

The SKILL.md files are intentionally **platform-agnostic**. They describe a method, not a platform-specific implementation. So you can:
- Read them in Codex
- Read them in Claude
- Read them in Gemini
- Read them in any AI platform
- Print them and follow them manually

The skills are **portable.** The system is **yours.**

---

## 12. For Future Reference

**If you need to understand:**
- How the PM skill works → read `agents/product-manager/SKILL.md`
- How state.json works → read `agents/stage-protocol/SKILL.md`
- How the orchestrator works → read `agents/orchestrator/SKILL.md`
- How the dashboard works → read `dashboard/docs/product/05-implementation.md`
- How critics work → read `agents/critic/SKILL.md` and `agents/technical-critic/SKILL.md`
- The full system design → read `ARCHITECTURE.md`
- This project's own brief → read `docs/product/01-pm-brief.md`
- What's been tried and failed → read `docs/product/backlog.md`

**If you're stuck:**
- Check `docs/product/critic-reports/` for any previous findings
- Check `docs/product/backlog.md` for known issues
- Read the skill's "Customizing this skill" section to see what's safe to change

---

## 13. Closing

You're now the owner of Agent-C. The codebase, the skills, the artifacts, the next version — all yours. Codex is your new tool. The SKILL.md files are your guides.

The highest-leverage work you can do right now:
1. **Fix the 4 significant findings** — especially running Agent-C's own UI/architect/engineer/QA phases
2. **Verify cross-surface notification** — make sure chat and dashboard never diverge
3. **Run QA on the whole system** — dogfood it end-to-end and catch bugs before users do

Good luck. You've got a solid foundation. Now make it complete.

---

**Generated:** 2026-06-28  
**By:** Claude Code (final handoff to Codex)  
**Status:** Ready for independent continuation
