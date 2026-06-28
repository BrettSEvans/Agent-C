# Orchestrator — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL — use `superpowers:subagent-driven-development`
> (recommended) or `superpowers:executing-plans` to implement Tasks 1–5 task-by-task.
> Steps use checkbox (`- [ ]`) syntax. **Task 6 is interactive** — run it live in the
> main session with the user, not a subagent.

**Goal:** Build the `stage-protocol` shared skill and the `orchestrator` front-door
skill, retrofit the six role skills to participate in the protocol, symlink the two
new skills live, update the top-level docs, then live-test the dashboard → gate →
checkpoint → revise loop on a throwaway project.

**Source of truth:** `docs/superpowers/specs/2026-06-27-orchestrator-design.md`
(approved 2026-06-27). This plan implements that spec; where content isn't inlined
here, the spec section cited is authoritative. Do not improvise behavior.

**Build order (from spec §3):** U1 `stage-protocol` → U3 retrofit roles → U2
`orchestrator`. The protocol exists before anything relies on it.

**Tech stack:** Markdown skills (SKILL.md + YAML frontmatter), JSON state files,
POSIX symlinks, git. No runtime/build.

---

## File structure

- Create: `agents/stage-protocol/SKILL.md`            (U1)
- Create: `agents/orchestrator/SKILL.md`              (U2)
- Edit:   `agents/{product-manager,ux,ui,architect,engineer,qa}/SKILL.md`  (U3)
- Create (symlinks, outside repo): `~/.claude/skills/stage-protocol`, `~/.claude/skills/orchestrator`
- Edit:   `ARCHITECTURE.md`, `README.md`
- Runtime artifacts (NOT committed; created at run time): `~/.agent-c/registry.json`,
  `<project>/docs/product/state.json`, `<project>/docs/features/<slug>/state.json`

---

### Task 1 — `stage-protocol` shared skill (U1)

**Files:** Create `agents/stage-protocol/SKILL.md`

- [ ] **Step 1: Write the skill.** Author `agents/stage-protocol/SKILL.md` per spec §5
  and §4.2. Frontmatter `name: stage-protocol`; a `description` with trigger note that
  every role loads it. Required sections:
  - **Entry-mode detection** — the fresh / resume / revise table from spec §5, keyed
    off the track's `state.json`.
  - **Checkpoint I/O** — write after each theme completes (`themesCompleted`,
    `currentTheme`); granularity = theme/section (spec §2.6).
  - **Revise handling** — load artifact, apply `pendingFeedback.text` as a *targeted*
    edit, re-confirm only what changed, rewrite, `revisions += 1`, clear
    `pendingFeedback`, `checkpoint = null`.
  - **State file location** — product → `<path>/docs/product/state.json`; feature →
    `<path>/docs/features/<slug>/state.json`. Include the `state.json` schema (spec §4.2).
  - **Write-ownership boundary** — the role writes checkpoint/revision/clears feedback;
    it must NOT touch `registry.json` or advance the lifecycle (that's the orchestrator).
  - **Graceful standalone** — if no `state.json` exists, run fresh and create one.

- [ ] **Step 2: Verify structure.**
  ```bash
  cd ~/Code/Saasless/Agent-C
  awk 'NR==1{print ($0=="---")?"FM_OK":"FM_BAD"} /^name: stage-protocol$/{print "NAME_OK"}' agents/stage-protocol/SKILL.md
  grep -ci 'fresh' agents/stage-protocol/SKILL.md     # >=1
  grep -ci 'resume' agents/stage-protocol/SKILL.md    # >=1
  grep -ci 'revise' agents/stage-protocol/SKILL.md    # >=1
  grep -c 'state.json' agents/stage-protocol/SKILL.md # >=1
  grep -c 'registry.json' agents/stage-protocol/SKILL.md # >=1 (the do-NOT-touch boundary)
  ```
  Expected: `FM_OK`, `NAME_OK`; the three mode greps ≥1; both file references ≥1.

- [ ] **Step 3: Commit.**
  ```bash
  cd ~/Code/Saasless/Agent-C
  git add agents/stage-protocol/SKILL.md
  git commit -m "feat(skills): add stage-protocol shared skill (fresh/resume/revise + checkpoint I/O)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
  ```

---

### Task 2 — Retrofit the six role skills (U3)

**Files:** Edit `agents/{product-manager,ux,ui,architect,engineer,qa}/SKILL.md`

- [ ] **Step 1: Add a `## Stage protocol` section to each role skill.** Insert after
  the skill's Method/Input section, before its Handoff contract. It must:
  - Instruct the role to **load the `stage-protocol` skill** at entry (same "load it
    now if not loaded" pattern used for `elicitation`).
  - State that the role **detects fresh/resume/revise** via stage-protocol and acts
    accordingly (resume from checkpoint; in revise, apply `pendingFeedback` as a
    targeted edit rather than re-walking every theme).
  - State that the role **writes its checkpoint after each theme** and clears it when
    the artifact is handed to the gate.
  - **Preserve every existing contract** (reads its upstream artifact, writes its
    numbered artifact, follows elicitation/best-practices, returns control + recommends
    next — never auto-chains; never auto-commits/deploys for engineer/qa).

- [ ] **Step 2: Verify all six reference the protocol and kept their contract.**
  ```bash
  cd ~/Code/Saasless/Agent-C
  for r in product-manager ux ui architect engineer qa; do
    f="agents/$r/SKILL.md"
    printf '%s: ' "$r"
    grep -qi 'stage-protocol' "$f" && printf 'PROTO_OK ' || printf 'PROTO_MISSING '
    grep -qi 'handoff contract' "$f" && printf 'CONTRACT_OK\n' || printf 'CONTRACT_MISSING\n'
  done
  ```
  Expected: all six print `PROTO_OK CONTRACT_OK`.

- [ ] **Step 3: Commit.**
  ```bash
  cd ~/Code/Saasless/Agent-C
  git add agents/product-manager/SKILL.md agents/ux/SKILL.md agents/ui/SKILL.md \
          agents/architect/SKILL.md agents/engineer/SKILL.md agents/qa/SKILL.md
  git commit -m "feat(skills): retrofit 6 role skills to load stage-protocol (checkpoint + revise)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
  ```

---

### Task 3 — `orchestrator` skill (U2)

**Files:** Create `agents/orchestrator/SKILL.md`

- [ ] **Step 1: Write the skill** per spec §6, §4.1, §7, §8. Frontmatter
  `name: orchestrator`; `description` positioning it as the Agent-C front door.
  Required sections:
  - **Registry I/O** — load/create `~/.agent-c/registry.json` (schema spec §4.1); it
    is a CACHE refreshed from each track's `state.json`.
  - **Dashboard** — render all entries (name, path, stage, status, `*` needs-you,
    revisions); **group feature entries under their parent** for display (spec §10/§4).
  - **Command surface** — `new / resume / switch / adopt / repoint / remove / dashboard`
    (spec §6.1), each with the behavior table.
  - **Approval-gate loop** — present per `wireframes/approval-gate.md`; options
    `[a] approve · [c] request-changes · [e] edit-myself · [p] pause` plus
    `[r] run critic first` **on PM/UX/UI gates only** (spec §6.2, §8). On `[c]`, write
    `pendingFeedback`; on `[a]`, advance + refresh the registry cache.
  - **Adopt / recovery** — synthesize `state.json` from artifacts present; `unreachable`
    → repoint/remove; `error` state retains checkpoint (spec §7).
  - **Boundary** — the orchestrator owns sequencing/registry/gates and does NOT run
    stage skills itself (v1 is manual: it tells the user which skill to invoke).
  - **Customizing this skill** + a Handoff-contract-style note consistent with the
    other skills.

- [ ] **Step 2: Verify structure.**
  ```bash
  cd ~/Code/Saasless/Agent-C
  awk 'NR==1{print ($0=="---")?"FM_OK":"FM_BAD"} /^name: orchestrator$/{print "NAME_OK"}' agents/orchestrator/SKILL.md
  grep -c 'registry.json' agents/orchestrator/SKILL.md   # >=1
  for c in new resume switch adopt repoint remove; do grep -qiw "$c" agents/orchestrator/SKILL.md && echo "CMD_$c OK"; done
  grep -qi 'critic' agents/orchestrator/SKILL.md && echo CRITIC_OK
  grep -qi 'pendingFeedback\|pending feedback' agents/orchestrator/SKILL.md && echo FEEDBACK_OK
  ```
  Expected: `FM_OK`, `NAME_OK`; registry ref ≥1; all six `CMD_* OK`; `CRITIC_OK`; `FEEDBACK_OK`.

- [ ] **Step 3: Commit.**
  ```bash
  cd ~/Code/Saasless/Agent-C
  git add agents/orchestrator/SKILL.md
  git commit -m "feat(skills): add orchestrator front-door skill (registry, dashboard, gate loop)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
  ```

---

### Task 4 — Symlinks + load check

**Files:** symlinks outside the repo

- [ ] **Step 1: Link both new skills.**
  ```bash
  ln -sfn ~/Code/Saasless/Agent-C/agents/stage-protocol ~/.claude/skills/stage-protocol
  ln -sfn ~/Code/Saasless/Agent-C/agents/orchestrator   ~/.claude/skills/orchestrator
  ```
- [ ] **Step 2: Verify they resolve.**
  ```bash
  test -f ~/.claude/skills/stage-protocol/SKILL.md && echo PROTO_OK
  test -f ~/.claude/skills/orchestrator/SKILL.md && echo ORCH_OK
  ls -l ~/.claude/skills/stage-protocol ~/.claude/skills/orchestrator | grep -c '>'   # = 2
  ```
  Expected: `PROTO_OK`, `ORCH_OK`; symlink count `2`.
- [ ] **Step 3: Live load check (in the session).** Invoke the `orchestrator` skill;
  confirm it loads with no parse/not-found error. Fix symlink/frontmatter if it fails.
  No commit (symlinks live outside the repo).

---

### Task 5 — Update top-level docs

**Files:** Edit `ARCHITECTURE.md`, `README.md`

- [ ] **Step 1: ARCHITECTURE.md.** Add `stage-protocol` and `orchestrator` to the
  skill catalog (§2); move the orchestrator out of "Not yet built" and update the
  status section (§8); in the Mermaid diagram (§3) drop the `todo`/dashed class on
  `ORCH`; add the two skills to the install list (§7) and the repo-layout tree (§10).
- [ ] **Step 2: README.md.** Add both skills to the skills table; update the status
  line (orchestrator now exists; v1 lifecycle + front door complete).
- [ ] **Step 3: Verify + commit.**
  ```bash
  cd ~/Code/Saasless/Agent-C
  grep -c 'orchestrator' ARCHITECTURE.md README.md
  git add ARCHITECTURE.md README.md
  git commit -m "docs: orchestrator + stage-protocol now built (catalog, status, diagram)

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
  ```

---

### Task 6 — Live-test the loop (INTERACTIVE)

> A live conversation with the user; cannot be done by a subagent. Run in the main
> session. No throwaway files are committed.

- [ ] **Step 1: New project.** Invoke `/orchestrator` → `new` → create a throwaway
  project at a temp path. Confirm `~/.agent-c/registry.json` is created and the entry
  shows `stage = pm, status = in-progress`.
- [ ] **Step 2: Checkpoint + resume.** Start `/product-manager`, answer 2–3 themes,
  stop. Confirm `state.json` has a checkpoint. Re-invoke and confirm it **resumes**
  from the next theme, not from scratch.
- [ ] **Step 3: Gate + revise.** Finish the brief → orchestrator presents the gate →
  pick `[c]` with feedback → confirm `pendingFeedback` is written and re-running PM
  enters **revise** mode (targeted edit), with `revisionCount` incrementing.
- [ ] **Step 4: Dashboard + critic + adopt (smoke).** Confirm the dashboard renders;
  on a UX gate confirm `[r]` is offered (and not on an engineer gate); run `adopt`
  on a dir containing only `01-pm-brief.md` and confirm it registers parked at UX.
- [ ] **Step 5: Clean up** the throwaway project + its registry entry (`remove`).

---

## Self-review

**Spec coverage:**
- `stage-protocol` (spec §5, §4.2) → Task 1. ✓
- 6-role retrofit (spec §3 U3) → Task 2. ✓
- `orchestrator` skill incl. registry/dashboard/commands/gate/adopt/critic
  (spec §6, §4.1, §7, §8) → Task 3. ✓
- Symlinks + live load (mirrors Phase-1 Task 4) → Task 4. ✓
- Docs (catalog/status/diagram/README) → Task 5. ✓
- Live verification of dashboard → checkpoint → revise → adopt → critic
  (spec §9 success criteria) → Task 6. ✓

**Not in this plan (per spec §1 out-of-scope):** autonomous subagent dispatch,
`agent-defs/` activation, multi-session locking, per-user identity. Deferred.

**Placeholder scan:** no TBD/TODO. Skill *content* is authored from the cited spec
sections rather than re-inlined here (the spec is the approved source of truth);
every task carries grep + live verification so fidelity is checked, not assumed.
