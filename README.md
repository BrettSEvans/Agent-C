# Agent-C

**A multi-agent software-development pipeline you can actually steer.** Take an idea
from concept to shipped through a sequence of focused stages — product, UX, UI,
architecture, implementation, QA — where **each stage produces a reviewable artifact
you approve before the next begins**. No black box: you see the reasoning, correct
it early, and stay in control the whole way.

Built for solo devs and indie hackers who want the leverage of a full team's process
without holding the entire thing in their head.

> **New here?** This README is the front door. The full design — principles,
> lifecycle, and how the pieces fit — lives in **[ARCHITECTURE.md](ARCHITECTURE.md)**.

## How it works

Each role is a **skill** (a `SKILL.md` with a method). Stages hand off through
**versioned Markdown artifacts** in a project's `docs/product/`:

```
idea → PM ─► UX ─► UI ─► architect ─► engineer ─► QA ─► ship
       01    02    03      04          code+05    qa-report
```

You (or, later, an orchestrator) own the gates between stages: review the artifact,
then proceed, revise, pause, or switch projects.

### The skills

| | Skill | Does |
|---|---|---|
| **Shared methods** | `elicitation` | One-question-at-a-time discovery discipline |
| | `best-practices` | Choose current, proven practice over the most-common one |
| | `feature-mode` | Jump into an existing codebase to build *one feature* |
| **Stages** | `product-manager` | The **what & why** → `01-pm-brief.md` |
| | `ux` | **How it works** — flows, IA, states → `02-ux-workflow.md` |
| | `ui` | **Look, feel, taste & voice** → `03-ui-direction.md` |
| | `architect` | **Technical architecture** → `04-architecture.md` |
| | `engineer` | **Implementation** in code → `05-implementation.md` |
| | `qa` | **Verify** the build against the artifacts → `qa-report` |
| **Quality** | `critic` | Review PM/UX/UI artifacts before they're approved |

### Three ways to use it

- **Mode A — full workflow:** start from an idea and run the whole pipeline.
- **Mode B — document an existing product:** point a single skill at an existing
  site/codebase; it reverse-engineers and writes the matching artifact.
- **Mode C — add a feature to an existing product:** the `feature-mode` skill
  profiles the project once, scopes work under `docs/features/<slug>/`, right-sizes
  the pipeline, and makes the result **conform** to what's already there.

## Quick start

Skills are surfaced to Claude by symlinking them into your skills directory:

```bash
git clone https://github.com/BrettSEvans/Agent-C.git
cd Agent-C
# install every skill
for s in agents/*/; do ln -s "$(pwd)/$s" ~/.claude/skills/"$(basename "$s")"; done
```

Then invoke a stage by name in **Claude Desktop or Claude Code** — e.g. start a new
product with the `product-manager` skill, or jump into an existing repo with `ui`
(Mode B) or `feature-mode` (Mode C). Each stage writes its artifact, then **returns
control and recommends the next stage** — you decide whether to continue.

> **Desktop vs. Code:** Desktop has skills (manual, you orchestrate). Code adds
> subagents — the thin wrappers in [`agent-defs/`](agent-defs/) let a future
> orchestrator dispatch each stage. See that folder's README for the current status.

## Status

All six lifecycle roles (**PM → UX → UI → architect → engineer → QA**) plus the
shared methods and the critic are built. Still to come: the **orchestrator** (project
registry + automated stage sequencing + approval gates). Until then, **you are the
orchestrator** — which is the intended v1 experience.

See [ARCHITECTURE.md](ARCHITECTURE.md) for the complete picture.
