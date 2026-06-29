# UI Direction — Agent-C

> The product's look, feel, taste, and voice. Written by the UI agent from
> 02-ux-workflow.md. Read by the architect/engineer next.
> Product type: Agentic / conversational developer tool with text-first and
> Electron dashboard surfaces. Date: 2026-06-29

## 1. Design concept & personality

**A calm control room for a developer-owned pipeline.**

Agent-C should feel like a precise process instrument, not a chat novelty or a
black-box automation toy. The central idea is **transparent control**: the user
can always see the current stage, the artifact under review, what needs attention,
and what happens next.

The personality is direct, grounded, and quietly technical. It should communicate:
"the process is under control, and you can steer it at every gate." The design
should avoid both enterprise ceremony and playful AI assistant tropes.

## 2. Visual / presentational tone

Agent-C is text-first, so presentational tone is mainly message structure,
information hierarchy, and copy discipline:

- Use short section headers, stable tables, and explicit state labels.
- Keep pending user actions visually obvious through repeated wording and layout,
  not color alone.
- Favor dense but readable developer-tool formatting over marketing language.
- Preserve Markdown readability in plain text, terminal-like contexts, and docs.

The Electron dashboard carries the GUI expression: dark, industrial, polished
steel, with steel-blue accents and a focused control-room feel. The text surfaces
should complement that by being structured, precise, and calm.

## 3. Key element styling

**Orchestrator dashboard:** show a compact project table grouped by product and
feature, sorted by most recent activity. Always pair the table with a plain-text
"What needs your attention" block that lists every pending action and the exact
command or skill invocation to run.

**Approval gates:** use a repeatable structure: artifact path, stage, revision
count, summary, recommendation, and the available gate actions. Options should be
single-letter commands with plain labels: approve, request changes, edit myself,
pause, run critic.

**Stage handoffs:** end with a clear next-stage recommendation and then stop. Do
not bury the handoff in explanation. Name the artifact just written and the exact
artifact the next role reads.

**Artifacts:** numbered Markdown docs should remain scannable and reviewable:
summary first, decisions and assumptions near the end, open questions explicitly
separated from confirmed decisions.

**Electron dashboard:** retain the existing polished-steel dashboard direction as
the GUI counterpart to the text dashboard. It should visualize the same state,
not invent a separate workflow.

## 4. Voice & tone

Voice is **plainspoken, exact, and human**:

- Say what happened, what needs attention, and what the user can do next.
- Avoid AI hedging like "perhaps," "it seems," or "you may want to consider"
  when the system has enough evidence.
- Avoid faux autonomy. Agent-C recommends; the user approves.
- Avoid cheerleading. The user is a capable developer who needs clarity, not
  encouragement.

Good examples:

- "UX is awaiting approval. Review `02-ux-workflow.md`, then choose approve or
  request changes."
- "Engineer revision requested from critic feedback. Invoke `/engineer` to apply
  the queued findings."
- "Nothing needs your attention right now."

## 5. References & anti-references

**References to emulate:**

- Git status output: compact, stateful, action-oriented.
- Figma-style product restraint: dense, useful UI with little decoration.
- Incident/control-room dashboards: calm visibility over active work.

**Anti-references:**

- Generic AI assistant copy that over-explains obvious steps.
- Marketing landing-page structure inside the product.
- Emoji-driven status, decorative gradients, bento layouts, and component-library
  defaults with no product point of view.
- Opaque autonomous-agent language that implies the tool decides for the user.

**Only-this-product test:** Agent-C is recognizable when the artifact chain, gate
language, and cross-project dashboard all reinforce one idea: every stage is
reviewable, resumable, and under the developer's control.

## 6. Accessibility & medium constraints

- All core flows must work in plain text and Markdown without color.
- Tables should stay readable in narrow chat panes; prefer concise columns and
  follow-up detail blocks over wide, dense grids.
- Pending actions cannot rely on color or icons alone; use explicit labels like
  `needsYou: true`, "awaiting approval," and "revision requested."
- The Electron dashboard should maintain semantic HTML, keyboard access, visible
  focus states, and WCAG AA contrast.
- Copy should be screen-reader friendly: descriptive state text beats symbolic
  shorthand.

## Mockups

No new mockups produced for the system-level UI pass. The existing wireframes in
`docs/product/wireframes/` cover the text surfaces, and the Electron dashboard has
its own mockup and UI direction under `dashboard/docs/product/`.

---

## Decisions (confirmed)

- Agent-C is text-first but now has a GUI dashboard surface.
- The design concept is transparent control: calm, exact, reviewable, steerable.
- The orchestrator must always pair the dashboard with a "What needs your
  attention" block.
- The Electron dashboard remains the GUI realization of the same registry/gate
  state, not a separate product flow.

## Assumptions

- No new visual redesign is required for the dashboard as part of this pass.
- Text and Markdown surfaces are the primary accessibility baseline.
- The user prefers practical developer-tool density over explanatory onboarding
  copy.

## Open questions

- Whether a future CLI should share exact text formatting with the orchestrator
  chat output or adapt to terminal-specific affordances.
- Whether future GUI notifications should be passive dashboard state only or add
  OS-level notifications.

## Next handoff

Architect -> reads 01/02/03, designs the system, writes
docs/product/04-architecture.md.
