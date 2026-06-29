# Agent definitions (thin wrappers)

These are **thin subagent wrappers** for the Agent-C lifecycle. Each one is a Claude
Code custom-agent definition whose only job is to **dispatch to the matching skill** —
the real method (phases, themes, templates, handoff contract) lives in
`agents/<name>/SKILL.md`, not here. One source of truth; the wrapper is just an entry
point an orchestrator can `Task`-dispatch.

There is one wrapper per **dispatchable** role — the six lifecycle stages plus the
two critics:

`product-manager` · `ux` · `ui` · `architect` · `engineer` · `qa` · `critic` ·
`technical-critic`

The shared methods (`elicitation`, `best-practices`, `feature-mode`) are **not**
wrapped — they're invoked *by* the roles, not dispatched on their own.

## Why so thin (and robust)

Each wrapper loads its skill **two ways**, preferring the first:

1. invoke the `<name>` skill via the **Skill tool**, if available to the subagent;
2. otherwise **Read** `~/.claude/skills/<name>/SKILL.md` and follow it.

This matters because of a **known-unverified assumption**: it is not yet confirmed
that a Claude Code subagent can invoke the `Skill` tool. The file-read fallback
sidesteps that — a subagent can always read a file — so these wrappers work either
way. (See `docs/superpowers/plans/2026-06-23-agentic-dev-system-pm.md`, "Deferred".)

## Status & scope

- **Claude Code only.** Subagents are a Code feature; **Claude Desktop has no
  subagents**, so on Desktop you invoke the skills directly and *you* are the
  orchestrator. These wrappers add nothing on Desktop.
- **Prepared for future autonomous dispatch.** The manual orchestrator skill now
  exists and owns the project registry, stage sequencing, and approval gates. These
  wrappers are still idle until a Code-only autonomous dispatcher is built; when
  that exists, it should dispatch through these wrappers rather than duplicating
  skill logic.

## Installing

To make them available to Claude Code, symlink each into your agents directory:

```bash
for a in agent-defs/*.md; do
  [ "$(basename "$a")" = "README.md" ] && continue
  ln -s "$(pwd)/$a" ~/.claude/agents/"$(basename "$a")"
done
```
