# Agentic Dev System — Phase 1 (Sr. Product Manager) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement Tasks 1–4 task-by-task. Steps use checkbox (`- [ ]`) syntax. **Task 5 is interactive** — conduct it in the main session with the user, not a subagent.

**Goal:** Build the shared `elicitation` skill and the `product-manager` skill (template inlined), symlink them live into `~/.claude/`, verify the skill actually loads, then run a real Sr. PM elicitation that defines **Agent-C itself** and writes `docs/product/01-pm-brief.md`.

**Architecture:** Skill-first. `elicitation` holds the reusable method; `product-manager` layers the Sr. PM persona + 8 themes + an **inlined** brief template + handoff. Canonical files in `~/Code/Saasless/Agent-C/`; symlinks expose them to Desktop and Code. The thin subagent wrapper is **deferred to the phase that adds the orchestrator** (see "Deferred").

**Tech Stack:** Markdown skills (SKILL.md + YAML frontmatter), POSIX symlinks, git. No runtime/build.

**Revisions from critical review:** template inlined into the skill (no fragile cross-file read at runtime); agent wrapper deferred (YAGNI in Phase 1, and assumes-unverified that subagents can invoke the Skill tool); added a real skill-load check (Task 4); added the live elicitation as Task 5 with Agent-C as the subject.

---

## File Structure

- `agents/elicitation/SKILL.md` — shared elicitation method, role-agnostic.
- `agents/product-manager/SKILL.md` — Sr. PM persona + 8 themes + inlined brief template + handoff.
- `docs/product/01-pm-brief.md` — produced by Task 5 (the real first brief, defining Agent-C).

Repo dirs `agents/`, `docs/product/`, `docs/superpowers/specs|plans/` already exist.

---

### Task 1: Shared `elicitation` skill

**Files:**
- Create: `agents/elicitation/SKILL.md`

- [ ] **Step 1: Write the skill file**

Create `agents/elicitation/SKILL.md` with exactly:

```markdown
---
name: elicitation
description: Use when running any structured requirements/discovery conversation - the shared method every role agent (product, UX, UI, architect) reuses to elicit, confirm, and capture decisions one question at a time without overwhelming the user.
---

# Elicitation (shared method)

This is the reusable discipline for eliciting requirements well, independent of
role. Role skills (product-manager, ux, ui, …) invoke this method, then add their
own question bank and output template.

## The method

1. **One question at a time.** Never present a wall of questions. Ask, wait, then
   ask the next. Prefer multiple-choice options (with a recommended default and a
   one-line rationale) over open-ended prompts when the space is bounded.
2. **Probe the four corners** of every topic: purpose/why, constraints, success
   criteria, and explicit non-goals.
3. **Don't lead the witness.** Surface trade-offs and offer a recommendation, but
   the user decides. If you have a strong default, say so and why.
4. **Reflect back to confirm.** Every few answers, summarize what's been decided
   so the user can correct drift before it compounds.
5. **Know when to stop.** When further questions yield diminishing returns, stop
   and write the artifact. Over-eliciting is a failure mode too.
6. **Capture, don't just chat.** The point of the conversation is a durable
   written artifact, not the transcript.

## Standard output shape

Every role's artifact ends with these four sections:

- **Decisions (confirmed)** — what the user explicitly agreed to.
- **Assumptions** — things you proceeded on without explicit confirmation.
- **Open questions** — unresolved items to revisit.
- **Next handoff** — which role/skill picks this up, and what doc they read.

## Anti-patterns

- Asking five questions in one message "to save time" — it overwhelms and the
  answers blur together.
- Accepting a vague answer ("make it modern") without one probing follow-up.
- Writing the artifact before reflecting the decisions back for confirmation.
```

- [ ] **Step 2: Verify frontmatter and structure**

Run:
```bash
cd ~/Code/Saasless/Agent-C
awk 'NR==1{print ($0=="---")?"FM_OK":"FM_BAD"} /^name: elicitation$/{print "NAME_OK"} /^description:/{print "DESC_OK"}' agents/elicitation/SKILL.md
```
Expected: `FM_OK`, `NAME_OK`, `DESC_OK` all printed.

- [ ] **Step 3: Commit**

```bash
cd ~/Code/Saasless/Agent-C
git add agents/elicitation/SKILL.md
git commit -m "feat: add shared elicitation skill"
```

---

### Task 2: `product-manager` skill (template inlined)

**Files:**
- Create: `agents/product-manager/SKILL.md`

- [ ] **Step 1: Write the skill file**

Create `agents/product-manager/SKILL.md` with exactly:

````markdown
---
name: product-manager
description: Use when defining a new product or feature's what and why - a Senior Product Manager who runs a one-question-at-a-time discovery across problem, users/jobs-to-be-done, alternatives, value prop, metrics, scope/non-goals, constraints, and business model, then writes a product brief and hands off to UX. Triggers - "define the product", "what should we build", "product brief", "run product discovery".
---

# Sr. Product Manager

You are a seasoned Senior Product Manager. Your only job in this conversation is
to define the **what & why** of a product — the problem, the users, the value.
You do NOT design screens, choose technology, or propose solutions; those belong
to UX, UI, and Architecture downstream.

## Method

Follow the shared **elicitation** skill (one question at a time, prefer
multiple-choice, probe the four corners, reflect back, know when to stop). If you
have not loaded it this session, load the `elicitation` skill now.

## Input

- Optionally a one-line seed idea from the user. If none, your first question
  asks for the rough idea or problem space in one sentence.
- This is the FIRST role in the chain — there is no prior doc to read.

## The 8 themes to cover

Work these in order, one question at a time. Do not advance to the next theme
until the current one is adequately answered (one probing follow-up on vague
answers).

1. **Problem & pain** — what's broken/missing, how acute, who feels it.
2. **Target users & jobs-to-be-done** — who, and the job they're hiring it for.
3. **Current alternatives** — how they cope today, incl. "do nothing".
4. **Value proposition & differentiation** — why this, why better.
5. **Success metrics** — how we'll know it worked.
6. **Scope & non-goals** — what it is, and explicitly is not.
7. **Constraints & risks** — budget, time, tech, regulatory, biggest threats.
8. **Business model & monetization** — how it makes money / sustains itself.

## Output

When the themes are covered and reflected back:

1. Fill the **brief template below** from the conversation. Use the user's words;
   mark anything inferred under **Assumptions**.
2. Write the result to `docs/product/01-pm-brief.md` in the target product's repo
   (create `docs/product/` if absent). If the working directory is ambiguous,
   confirm the path with the user before writing.
3. Summarize the brief back in chat and end by teeing up the **UX handoff**:
   "Next: the UX agent reads `01-pm-brief.md` and defines the workflow in
   `02-ux-workflow.md`."

## Brief template

Copy this structure into `docs/product/01-pm-brief.md`, replacing every
`<...>` with content from the conversation:

```markdown
# Product Brief — <Product Name>

> Source of truth for the product's what & why. Written by the Sr. Product
> Manager. Read by UX next (02-ux-workflow.md). Date: <YYYY-MM-DD>

## 1. Problem & pain
<What is broken or missing? How acute? Who feels it and how often?>

## 2. Target users & jobs-to-be-done
<Who are the users (segments)? The job they "hire" this product for?>

## 3. Current alternatives
<How do users cope today, including "do nothing"? Why insufficient?>

## 4. Value proposition & differentiation
<Why this, why better than the alternatives? The core promise.>

## 5. Success metrics
<How will we know it worked? Leading and lagging indicators, targets.>

## 6. Scope & non-goals
<What this product IS. Explicitly, what it is NOT (for this version).>

## 7. Constraints & risks
<Budget, time, tech, team, regulatory. The biggest threats.>

## 8. Business model & monetization
<How it makes money or sustains itself. Pricing posture, if any.>

---

## Decisions (confirmed)
<What the user explicitly agreed to.>

## Assumptions
<Things proceeded on without explicit confirmation.>

## Open questions
<Unresolved items to revisit.>

## Next handoff
UX agent → reads this brief, runs workflow elicitation, writes
docs/product/02-ux-workflow.md.
```

## Guardrails

- Stay at the what/why altitude. If the user jumps to solutions, capture it under
  Open questions and steer back.
- Don't invent metrics or business model details — elicit them; if the user
  defers, record under Assumptions/Open questions.
````

- [ ] **Step 2: Verify frontmatter, the 8 themes, the inlined template, and the handoff**

Run:
```bash
cd ~/Code/Saasless/Agent-C
awk 'NR==1{print ($0=="---")?"FM_OK":"FM_BAD"} /^name: product-manager$/{print "NAME_OK"}' agents/product-manager/SKILL.md
grep -cE '^[0-9]+\. \*\*' agents/product-manager/SKILL.md   # 8 themes
grep -c '01-pm-brief.md' agents/product-manager/SKILL.md     # output path referenced
grep -c '02-ux-workflow.md' agents/product-manager/SKILL.md  # handoff referenced
```
Expected: `FM_OK` and `NAME_OK` printed; themes count = `8`; output-path count ≥ 1; handoff count ≥ 1.

- [ ] **Step 3: Commit**

```bash
cd ~/Code/Saasless/Agent-C
git add agents/product-manager/SKILL.md
git commit -m "feat: add Sr. Product Manager skill with inlined brief template"
```

---

### Task 3: Symlinks into `~/.claude/skills/`

**Files:**
- Create (symlinks, outside repo): `~/.claude/skills/elicitation`, `~/.claude/skills/product-manager`

- [ ] **Step 1: Create the symlinks**

Run:
```bash
mkdir -p ~/.claude/skills
ln -sfn ~/Code/Saasless/Agent-C/agents/elicitation ~/.claude/skills/elicitation
ln -sfn ~/Code/Saasless/Agent-C/agents/product-manager ~/.claude/skills/product-manager
```

- [ ] **Step 2: Verify the symlinks resolve to the canonical files**

Run:
```bash
test -f ~/.claude/skills/elicitation/SKILL.md && echo ELICIT_OK
test -f ~/.claude/skills/product-manager/SKILL.md && echo PM_OK
ls -l ~/.claude/skills/elicitation ~/.claude/skills/product-manager | grep -c '>'
```
Expected: `ELICIT_OK`, `PM_OK` printed; final count = `2` (both are symlinks).

No commit (symlinks live outside the repo).

---

### Task 4: Verify the skill actually loads (not just that strings exist)

**Files:** none (verification only)

- [ ] **Step 1: Confirm both skills are discoverable via the description probe**

This is the same probe Claude Code/Desktop skill discovery uses.

Run:
```bash
grep -Hm1 '^description:' ~/.claude/skills/elicitation/SKILL.md ~/.claude/skills/product-manager/SKILL.md
```
Expected: both description lines print, each prefixed with the resolved (symlinked) path.

- [ ] **Step 2: Validate the YAML frontmatter parses (catches load-breaking errors)**

Run:
```bash
for f in ~/.claude/skills/elicitation/SKILL.md ~/.claude/skills/product-manager/SKILL.md; do
  awk 'NR==1&&$0!="---"{print "BAD_OPEN "FILENAME; exit 1}
       NR>1&&$0=="---"{print "FM_CLOSED "FILENAME; exit 0}
       NR>1&&/^(name|description):/{ok=1}
       END{if(!ok)print "NO_FIELDS"}' "$f"
done
```
Expected: `FM_CLOSED <path>` printed for both (frontmatter block opens at line 1 and closes), no `BAD_OPEN`/`NO_FIELDS`.

- [ ] **Step 3: Live load check (in the Claude session, not bash)**

In the running Claude Code/Desktop session, invoke the Skill tool on `product-manager`.
Expected: the skill content loads with no "skill not found" / parse error, and the
Sr. Product Manager instructions appear. If it fails to resolve, the symlink or
frontmatter is wrong — fix before proceeding to Task 5.

---

### Task 5: Run the real elicitation — define Agent-C itself (INTERACTIVE)

**Files:**
- Create: `docs/product/01-pm-brief.md`

> This task is a live conversation with the user; it cannot be done by an
> autonomous subagent. Run it in the main session.

- [ ] **Step 1: Invoke the skill against Agent-C as the subject**

Invoke the `product-manager` skill. Seed it: the product under definition is
**Agent-C — the multi-agent development system itself** (PM/UX/UI/architect/
engineer/QA role-skills orchestrated to design, build, test, and iterate
software). Conduct the 8-theme elicitation one question at a time.

- [ ] **Step 2: Write the brief**

Per the skill, fill the inlined template and write `docs/product/01-pm-brief.md`
in the Agent-C repo. Reflect the decisions back to the user for confirmation
before finalizing.

- [ ] **Step 3: Verify the brief is complete**

Run:
```bash
cd ~/Code/Saasless/Agent-C
test -f docs/product/01-pm-brief.md && echo BRIEF_EXISTS
grep -cE '^## [1-8]\.' docs/product/01-pm-brief.md          # 8 themes filled
grep -cE '^## (Decisions|Assumptions|Open questions|Next handoff)' docs/product/01-pm-brief.md
```
Expected: `BRIEF_EXISTS`; themes count = `8`; closing-sections count = `4`.

- [ ] **Step 4: Commit**

```bash
cd ~/Code/Saasless/Agent-C
git add docs/product/01-pm-brief.md
git commit -m "docs: Agent-C product brief (Sr. PM elicitation)"
```

---

## Deferred to a later phase (NOT built now)

- **`sr-product-manager` agent wrapper** (`agent-defs/sr-product-manager.md`):
  a thin subagent that invokes the `product-manager` skill. Deferred because
  (a) there is no orchestrator in Phase 1 to dispatch it, and (b) it assumes —
  unverified — that a subagent can invoke the `Skill` tool. Build it in the phase
  that adds the Orchestrator, where it can actually be exercised and that
  assumption tested. The manual Desktop path (`/product-manager`) needs no wrapper.
- **UX, UI, Architect, Engineer, QA skills** and the **Orchestrator** agent —
  same skill-first pattern, later phases.

---

## Self-Review

**Spec coverage:**
- `elicitation` skill → Task 1. ✓
- `product-manager` skill + brief template (now inlined) → Task 2. ✓
- Repo + symlinks → Task 3. ✓
- Skill actually loads (addresses review item #3) → Task 4. ✓
- 8 PM themes → Task 2 content, grep-verified = 8. ✓
- Versioned-doc handoff (`01-pm-brief.md` → `02-ux-workflow.md`) → Task 2 + Task 5. ✓
- Real elicitation producing the first brief, subject = Agent-C (addresses review
  item #1) → Task 5. ✓
- Agent wrapper correctly deferred (review item #4) → Deferred section. ✓

**Placeholder scan:** No TBD/TODO. `<...>` in the brief template is intentional
fill-in guidance, not a plan placeholder; both skill files are given in full.

**Type/name consistency:** skill names `elicitation`, `product-manager`; output
`docs/product/01-pm-brief.md`; handoff `docs/product/02-ux-workflow.md` — used
identically across all tasks and verification greps.
