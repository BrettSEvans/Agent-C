# Agentic Dev System — Phase 1 (Sr. Product Manager) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the shared `elicitation` skill, the `product-manager` skill (+ brief template), and a thin `sr-product-manager` agent wrapper, all in the `Agent-C` repo and symlinked live into `~/.claude/`, so the Sr. PM can run an 8-theme product-definition elicitation manually in Desktop or via orchestration.

**Architecture:** Skill-first. The `elicitation` skill holds the reusable method; the `product-manager` skill layers the Sr. PM persona + 8 question themes + output template on top of it. A thin subagent definition invokes the skill so manual and orchestrated paths can't drift. Canonical files live in `~/Code/Saasless/Agent-C/`; symlinks expose them to Claude Desktop and Claude Code.

**Tech Stack:** Markdown skills (Claude Code/Desktop SKILL.md format with YAML frontmatter), POSIX symlinks, git. No runtime/build.

---

## File Structure

- `agents/elicitation/SKILL.md` — shared elicitation method (the "how"). One responsibility: define disciplined elicitation, role-agnostic.
- `agents/product-manager/SKILL.md` — Sr. PM specialization (the "what/why"). Persona + 8 themes + handoff. References the elicitation skill.
- `agents/product-manager/brief-template.md` — the exact template the PM fills into `docs/product/01-pm-brief.md`.
- `agent-defs/sr-product-manager.md` — thin Claude Code subagent wrapper that adopts the persona and invokes the skill.
- Symlinks (not files in repo): `~/.claude/skills/elicitation`, `~/.claude/skills/product-manager`, `~/.claude/agents/sr-product-manager.md`.

Repo dirs `agents/`, `agent-defs/`, `docs/product/`, `docs/superpowers/specs|plans/` already exist.

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

### Task 2: `product-manager` brief template

**Files:**
- Create: `agents/product-manager/brief-template.md`

- [ ] **Step 1: Write the template file**

Create `agents/product-manager/brief-template.md` with exactly:

```markdown
# Product Brief — <Product Name>

> Source of truth for the product's **what & why**. Written by the Sr. Product
> Manager. Read by UX next (`02-ux-workflow.md`).
> Date: <YYYY-MM-DD>

## 1. Problem & pain
<What is broken or missing? How acute is it? Who feels it and how often?>

## 2. Target users & jobs-to-be-done
<Who are the users (segments)? What are they actually trying to accomplish — the
job they "hire" this product for?>

## 3. Current alternatives
<How do users cope today, including "do nothing"? Why is that insufficient?>

## 4. Value proposition & differentiation
<Why this, why better than the alternatives? The core promise.>

## 5. Success metrics
<How will we know it worked? Leading and lagging indicators, target ranges.>

## 6. Scope & non-goals
<What this product IS. Explicitly, what it is NOT (for this version).>

## 7. Constraints & risks
<Budget, time, tech, team, regulatory. The biggest threats to success.>

## 8. Business model & monetization
<How it makes money or sustains itself. Pricing posture, if any.>

---

## Decisions (confirmed)
<Bulleted list of what the user explicitly agreed to.>

## Assumptions
<Things proceeded on without explicit confirmation.>

## Open questions
<Unresolved items to revisit.>

## Next handoff
UX agent → reads this brief, runs workflow elicitation, writes
`docs/product/02-ux-workflow.md`.
```

- [ ] **Step 2: Verify the 8 themes plus 4 closing sections are present**

Run:
```bash
cd ~/Code/Saasless/Agent-C
grep -cE '^## [1-8]\.' agents/product-manager/brief-template.md
grep -cE '^## (Decisions|Assumptions|Open questions|Next handoff)' agents/product-manager/brief-template.md
```
Expected: first command prints `8`; second prints `4`.

- [ ] **Step 3: Commit**

```bash
cd ~/Code/Saasless/Agent-C
git add agents/product-manager/brief-template.md
git commit -m "feat: add product-manager brief template"
```

---

### Task 3: `product-manager` skill

**Files:**
- Create: `agents/product-manager/SKILL.md`

- [ ] **Step 1: Write the skill file**

Create `agents/product-manager/SKILL.md` with exactly:

```markdown
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

1. Read `agents/product-manager/brief-template.md` (relative to this skill, it is
   the sibling `brief-template.md`).
2. Fill every section from the conversation. Use the user's words; mark anything
   inferred under **Assumptions**.
3. Write the result to `docs/product/01-pm-brief.md` in the target product's repo
   (create `docs/product/` if absent). Confirm the path with the user if the
   working directory is ambiguous.
4. Summarize the brief back in chat and end by teeing up the **UX handoff**:
   "Next: the UX agent reads `01-pm-brief.md` and defines the workflow."

## Guardrails

- Stay at the what/why altitude. If the user jumps to solutions, capture it under
  Open questions and steer back.
- Don't invent metrics or business model details — elicit them; if the user
  defers, record under Assumptions/Open questions.
```

- [ ] **Step 2: Verify frontmatter, the 8 themes, and the handoff line**

Run:
```bash
cd ~/Code/Saasless/Agent-C
awk 'NR==1{print ($0=="---")?"FM_OK":"FM_BAD"} /^name: product-manager$/{print "NAME_OK"}' agents/product-manager/SKILL.md
grep -c '01-pm-brief.md' agents/product-manager/SKILL.md
grep -ci 'UX handoff' agents/product-manager/SKILL.md
```
Expected: `FM_OK` and `NAME_OK` printed; brief-path count ≥ 1; UX-handoff count ≥ 1.

- [ ] **Step 3: Commit**

```bash
cd ~/Code/Saasless/Agent-C
git add agents/product-manager/SKILL.md
git commit -m "feat: add Sr. Product Manager skill"
```

---

### Task 4: Thin `sr-product-manager` agent wrapper

**Files:**
- Create: `agent-defs/sr-product-manager.md`

- [ ] **Step 1: Write the agent definition**

Create `agent-defs/sr-product-manager.md` with exactly:

```markdown
---
name: sr-product-manager
description: Senior Product Manager agent. Dispatch to run product-definition discovery (the what & why) and produce docs/product/01-pm-brief.md. Use when defining a new product/feature before UX or design work begins.
tools: Read, Write, Edit, Bash, Skill, AskUserQuestion
---

You are the Senior Product Manager agent. Your entire job is to adopt the Sr. PM
persona and run the product-definition elicitation.

Do this by invoking the `product-manager` skill (via the Skill tool) and following
it exactly. The skill is the single source of truth — do not re-implement its
logic here; the manual path and your orchestrated path must stay identical.

When finished, the `docs/product/01-pm-brief.md` artifact exists and you report
the path plus a one-paragraph summary and the UX handoff back to the caller.
```

- [ ] **Step 2: Verify frontmatter and skill reference**

Run:
```bash
cd ~/Code/Saasless/Agent-C
awk 'NR==1{print ($0=="---")?"FM_OK":"FM_BAD"} /^name: sr-product-manager$/{print "NAME_OK"}' agent-defs/sr-product-manager.md
grep -c 'product-manager. skill' agent-defs/sr-product-manager.md
```
Expected: `FM_OK` and `NAME_OK` printed; skill-reference count ≥ 1.

- [ ] **Step 3: Commit**

```bash
cd ~/Code/Saasless/Agent-C
git add agent-defs/sr-product-manager.md
git commit -m "feat: add thin sr-product-manager agent wrapper"
```

---

### Task 5: Symlinks into `~/.claude/`

**Files:**
- Create (symlinks, outside repo): `~/.claude/skills/elicitation`, `~/.claude/skills/product-manager`, `~/.claude/agents/sr-product-manager.md`

- [ ] **Step 1: Create the symlinks**

Run:
```bash
mkdir -p ~/.claude/skills ~/.claude/agents
ln -sfn ~/Code/Saasless/Agent-C/agents/elicitation ~/.claude/skills/elicitation
ln -sfn ~/Code/Saasless/Agent-C/agents/product-manager ~/.claude/skills/product-manager
ln -sfn ~/Code/Saasless/Agent-C/agent-defs/sr-product-manager.md ~/.claude/agents/sr-product-manager.md
```

- [ ] **Step 2: Verify the symlinks resolve to the canonical files**

Run:
```bash
test -f ~/.claude/skills/elicitation/SKILL.md && echo ELICIT_OK
test -f ~/.claude/skills/product-manager/SKILL.md && echo PM_OK
test -f ~/.claude/skills/product-manager/brief-template.md && echo TEMPLATE_OK
test -f ~/.claude/agents/sr-product-manager.md && echo AGENT_OK
ls -l ~/.claude/skills/elicitation ~/.claude/skills/product-manager ~/.claude/agents/sr-product-manager.md | grep -c '>'
```
Expected: `ELICIT_OK`, `PM_OK`, `TEMPLATE_OK`, `AGENT_OK` printed; final count = `3` (all three are symlinks).

- [ ] **Step 3: Verify skills are discoverable by description probe**

Run:
```bash
grep -Hm1 '^description:' ~/.claude/skills/elicitation/SKILL.md ~/.claude/skills/product-manager/SKILL.md
```
Expected: both description lines print (this is the same probe `/run` and skill discovery use).

No commit (symlinks live outside the repo). Done.

---

### Task 6: End-to-end dry check of the artifact path

**Files:**
- Temporary: `/tmp/agentc-pm-smoke/docs/product/01-pm-brief.md` (smoke only, deleted after)

- [ ] **Step 1: Verify the template renders into the expected handoff doc location**

This confirms the output mechanism the PM skill relies on works, without needing a full conversation.

Run:
```bash
mkdir -p /tmp/agentc-pm-smoke/docs/product
cp ~/Code/Saasless/Agent-C/agents/product-manager/brief-template.md /tmp/agentc-pm-smoke/docs/product/01-pm-brief.md
test -f /tmp/agentc-pm-smoke/docs/product/01-pm-brief.md && echo HANDOFF_PATH_OK
grep -c '02-ux-workflow.md' /tmp/agentc-pm-smoke/docs/product/01-pm-brief.md
rm -rf /tmp/agentc-pm-smoke
```
Expected: `HANDOFF_PATH_OK` printed; ux-handoff reference count ≥ 1.

- [ ] **Step 2: Confirm git tree is clean and all four canonical files are tracked**

Run:
```bash
cd ~/Code/Saasless/Agent-C
git status --porcelain
git ls-files agents agent-defs | sort
```
Expected: `git status` prints nothing (clean); `ls-files` lists exactly
`agent-defs/sr-product-manager.md`, `agents/elicitation/SKILL.md`,
`agents/product-manager/SKILL.md`, `agents/product-manager/brief-template.md`.

---

## Self-Review

**Spec coverage:**
- Unit 1 `elicitation` skill → Task 1. ✓
- Unit 2 `product-manager` skill + brief template → Tasks 2 & 3. ✓
- Unit 3 `sr-product-manager` wrapper → Task 4. ✓
- Repo + symlinks decision → Task 5. ✓
- 8 PM themes → Task 2 (template) & Task 3 (skill), verified by grep. ✓
- Versioned-doc handoff (`01-pm-brief.md` → UX) → Tasks 2/3 content + Task 6 check. ✓
- Phase-1 success criteria (skills symlinked/discoverable, brief produced, UX teed up) → Tasks 5 & 6. ✓
- Out-of-scope roles (UX/UI/architect/eng/QA/orchestrator) → not built, correct.

**Placeholder scan:** No TBD/TODO. The `<...>` angle brackets in the brief
template are intentional fill-in guidance for the human/PM, not plan placeholders;
every skill/agent file is given in full.

**Type/name consistency:** skill names `elicitation`, `product-manager`, agent
`sr-product-manager`, output `docs/product/01-pm-brief.md`, handoff
`docs/product/02-ux-workflow.md` are used identically across all tasks and the
verification greps.
