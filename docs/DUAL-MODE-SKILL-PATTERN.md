# Dual-Mode Skill Pattern

This document describes the pattern for adapting Agent-C skills to support both **full-workflow mode** (orchestrated, reading prior artifacts) and **standalone mode** (jump-in to existing projects, no prior docs needed).

## Why dual-mode?

Agent-C supports two use cases:
1. **Full workflow**: PM → UX → UI → architect → engineer → QA (each stage produces artifacts the next reads)
2. **Jump-in**: Use a single skill (e.g., UI) on an existing project that was developed elsewhere

Both paths should be equally supported. A skill that only works in full-workflow mode locks out the standalone use case.

## Why analysis first?

**Agents should understand before proposing changes.** The analysis phase ensures:

- **Mode A:** The skill understands the product's context and constraints from prior work, not just assumptions.
- **Mode B:** The skill reverse-engineers what already exists, avoiding "start from scratch" suggestions when a solid foundation is in place.
- **Both:** The user gets a chance to confirm/correct the agent's understanding before moving into the design/refinement phase.

This prevents wasted effort on misaligned suggestions and builds trust—the user sees you've done your homework.

## Pattern Overview

Each skill has **two phases**:

1. **Analysis phase** — understand the current state (from prior artifacts or by reverse-engineering the existing product)
2. **Elicitation phase** — work with the user to refine, improve, or finalize the direction

Each skill checks for its **upstream artifact** at startup. If present, it operates in **Mode A (workflow)**. If absent, it enters **Mode B (standalone)** and analyzes the existing product instead of stopping.

**Critical:** Both modes must include a full analysis phase before proceeding to elicitation. Report findings and get user confirmation before moving forward.

## Implementation Template

### 0. Analysis phase (ALWAYS)

Add a **Method** section with two phases:

```markdown
## Method

This skill has two phases:

**Phase 1: Analysis**
- **Mode A (workflow):** Read prior artifact(s). Extract [key information].
- **Mode B (jump-in):** Analyze the existing product/site. Report [key information].

Both modes: Report findings back to the user. Let them confirm/correct before proceeding.

**Phase 2: Elicitation**
Once analysis is confirmed, follow the shared elicitation skill...
```

Then add an **Analysis phase** section with detailed instructions for both modes:

```markdown
## Analysis phase

### Mode A: [Role]-specific analysis
Read [upstream artifacts]. Extract and report:
- [Key finding 1]
- [Key finding 2]
- [Key finding 3]

Then summarize: "Here's what I understand. Does this match your [context]?"

### Mode B: Jump-in analysis
Analyze the existing product. Report:
- [Key finding 1]
- [Key finding 2]
- [Key finding 3]

Then ask: "Is this accurate? What would you like to refine?"

Both modes, conclude with: "Ready to proceed to [next phase]?"
```

### 1. Dual-mode detection

In the **Input** section, add:

```markdown
### Dual-mode operation

This skill supports two entry points:

**Mode A: Full workflow (documents exist)**
- `<project>/docs/product/<upstream-artifact>.md` ✓ available
- Action: Read it; proceed as designed.

**Mode B: Standalone jump-in (documents missing)**
- `<upstream-artifact>.md` does not exist
- Action: Ask the user for context (see "Elicitation fallback" below).

**Determine mode:** Check if `<upstream-artifact>.md` exists. If yes, Mode A. If no, Mode B.
```

### 2. Elicitation fallback

Add a section that asks for context when artifacts are missing:

```markdown
### Elicitation fallback (Mode B)

If artifacts are missing, ask the user to provide:
1. [Essential context #1]
2. [Essential context #2]
3. [Essential context #3]
...etc...

Once you have context, proceed with [the skill's normal questions].
```

Key: Ask for things the upstream artifact would have given you. Reverse-engineer from the existing product if needed.

### 3. Update recommendations

In the **Output** section, vary the next-stage recommendation:

```markdown
4. Summarize back in chat and **recommend** the next stage:
   - **Mode A (full workflow):** "Recommended next: [next role] reads ..."
   - **Mode B (standalone):** "This standalone [artifact] is now ready for [use]."
```

### 4. Update the handoff contract

Clarify both modes work:

```markdown
## Handoff contract

This agent can operate in two modes:

**Mode A: Orchestrated lifecycle** — one stage in the full Agent-C workflow...

**Mode B: Standalone** — apply this skill to an existing project outside the full workflow...

**Both modes:**
- Determine mode by checking for `<upstream-artifact>.md`...
- [Rest of contract, same for both]
```

### 5. Update customization guidance

In the **Customizing this skill** section, add:

```markdown
**Preserve this contract so the lifecycle keeps working:**

- Keep **dual-mode operation**: support both full-workflow and standalone modes...
- [Other preserved items]
```

### 6. Update the description

Expand the frontmatter `description` to mention both modes:

```markdown
description: [Original]. Works in dual modes - reads <upstream> if available (full workflow), or reverse-engineers from existing [project] (standalone jump-in).
```

## Example: Adapting UX skill

**Current:** Requires `01-pm-brief.md`. Stops if missing.

**Dual-mode version:**

```markdown
### Dual-mode operation

**Mode A: Full workflow**
- `01-pm-brief.md` ✓ available
- Action: Read it; extract product type, goals, users.

**Mode B: Standalone jump-in**
- `01-pm-brief.md` does not exist
- Action: Ask the user for product context.

### Elicitation fallback (Mode B)

If the brief is missing, ask:
1. What is the product? Who is it for?
2. What problem does it solve?
3. What's the product type? (GUI app, CLI, API, agentic)
4. Who are the main user types?
5. What are the key use cases or workflows?

Then proceed with the UX-specific questions (user research, flows, etc.).
```

## Applied skills

- ✅ **UI skill** — dual-mode + analysis phase implemented (check `~/.claude/skills/ui/SKILL.md`)
- ✅ **UX skill** — dual-mode + analysis phase implemented (check `~/.claude/skills/ux/SKILL.md`)
- ✅ **Architect skill** — dual-mode + analysis phase implemented (check `~/.claude/skills/architect/SKILL.md`)
- ⏳ **Engineer skill** — to adapt (analysis phase + dual-mode)
- ⏳ **QA skill** — to adapt (analysis phase + dual-mode)

## Testing dual-mode skills

For each skill, verify:
1. **Mode A:** Run with full artifacts present. Skill reads them and proceeds normally.
2. **Mode B:** Run without artifacts. Skill asks for context, proceeds, produces output.
3. **Output equivalence:** Both modes produce the same output format (e.g., `03-ui-direction.md`).

## Notes

- The skill's **core method** (elicitation, themes, output format) doesn't change—only the input path.
- Mode B should *not* produce a second-class artifact. It's a first-class alternative entry point.
- In Mode B, note in the **Assumptions** section that the skill is standalone and can be integrated into the full workflow later.
- Dual-mode skills are more flexible and more useful. Prefer this pattern for all future role skills.
