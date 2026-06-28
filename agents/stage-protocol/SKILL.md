---
name: stage-protocol
description: Shared method for all stage roles - handles entry-mode detection (fresh/resume/revise), checkpoint I/O, and state.json management. Every role skill loads this to participate in the orchestrator's lifecycle and checkpointing system.
---

# Stage Protocol (shared method)

This is the reusable contract every stage role loads — like `elicitation` and
`best-practices`. It owns **how a stage enters**, **how it persists state during
work**, and **how it recovers from interruption or feedback**. Nothing role-specific.

The protocol ensures that the same project track (a product track or a feature
track) can be resumed mid-elicitation, revised in response to feedback, and
tracked across multiple sessions without losing work-in-progress.

---

## 1. State file locations

Every track (product or feature) maintains a `state.json` file tracking its
lifecycle state and checkpoints.

**Product track:** stored at `<project-path>/docs/product/state.json`
**Feature track:** stored at `<project-path>/docs/features/<slug>/state.json`

If the project is being worked on without registration in the orchestrator's
registry (pure manual use), a `state.json` is created alongside the artifact on
first entry, so the work remains resumable in future sessions.

---

## 2. Entry-mode detection

On every invocation, detect the current mode from the track's `state.json`:

| Mode | Condition | Behavior |
|---|---|---|
| **fresh** | `state.json` does not exist, OR exists but `checkpoint == null` and artifact does not exist | Read prior artifact (if in full workflow) → run full elicitation from theme 1 |
| **resume** | `checkpoint != null` and artifact incomplete (status != "awaiting-approval") | Skip themes in `checkpoint.themesCompleted`; continue from `checkpoint.currentTheme` |
| **revise** | artifact complete AND `pendingFeedback.stage == this stage` | Load the artifact, apply `pendingFeedback.text` as a **targeted edit**, re-confirm only what changed, rewrite, `revisions += 1`, clear `pendingFeedback`, `checkpoint = null` |

**Detection logic:**
1. Check if `state.json` exists. If not, **fresh**.
2. If it exists, check `checkpoint`:
   - `checkpoint == null` → **fresh** (no resume point, start from theme 1)
   - `checkpoint != null` → **resume** (pick up from `checkpoint.currentTheme`)
3. If artifact exists AND `status == "awaiting-approval"` AND `pendingFeedback.stage == this stage` → **revise** (load artifact, apply feedback as targeted edit)

**Graceful standalone:** If no `state.json` exists (pure manual use outside any
registered project), run **fresh** and create a `state.json` at the appropriate
location so the work is resumable.

---

## 3. Checkpoint I/O and persistence

After each theme completes (the user confirms their answer and you move to the
next question):

**Write checkpoint to `state.json`:**
```jsonc
"checkpoint": {
  "themesCompleted": [...],    // array of completed theme names
  "currentTheme": "...",        // name of the theme about to start
  "draftPath": "...",           // path to the partial artifact (if any written)
  "notes": "..."                // optional session notes (user's priorities, emerging decisions)
}
```

Example after theme 2 completes in a PM brief:
```jsonc
"checkpoint": {
  "themesCompleted": ["problem", "users"],
  "currentTheme": "alternatives",
  "draftPath": "docs/product/01-pm-brief.md",
  "notes": "User leaning toward B2B; confirm in next theme"
}
```

**When the artifact is complete and handed to the gate:**
- Set `checkpoint = null` (the work is done, not in-progress)
- Set `status = "awaiting-approval"` (signal that the stage is ready for review)
- Write `state.json`

Interruption loses at most the in-flight question (the current theme). On
resume, the role re-asks that question.

---

## 4. Revise mode — targeted edit, not re-run

When a stage re-enters in **revise** mode (feedback from the user or critic):

1. **Load the artifact** from disk (the artifact written at `awaiting-approval`).
2. **Load `pendingFeedback.text`** — it contains the requested change(s).
3. **Apply the feedback as a targeted edit, NOT a full re-run.** Ask the user to
   confirm/refine only the parts that are changing; don't re-walk all the themes.
   - Example: if feedback is "the user flows section is too thin," re-elicit
     *just* flows, not problem/users/alternatives/etc.
   - Example: if feedback is "rephrase the value prop for clarity," ask only
     about the value prop phrasing.
4. **Rewrite the artifact** with the changes applied.
5. **Increment `revisions`** in `state.json` (proof that a revision cycle happened).
6. **Clear `pendingFeedback`** (set to `null`) so the next gate action starts fresh.
7. **Set `checkpoint = null`** (revise is complete, artifact is updated, ready for
   next gate review).
8. **Keep `status = "awaiting-approval"`** (waiting for gate to approve or request
   changes again).
9. Write `state.json`.

The point of **revise**: it's fast and surgical. The user/critic found one thing
to fix; you fix it and re-confirm it, not re-discover the whole artifact.

---

## 5. State.json schema (full reference)

```jsonc
{
  "version": 1,
  "track": {
    "type": "product",               // "product" | "feature"
    "name": "Tiffany",
    "slug": null,                    // feature only
    "productType": "GUI app"         // from the PM brief
  },
  "currentStage": "ux",              // pm|ux|ui|architect|engineer|qa
  "stages": {
    "pm":        { "status": "approved-complete", "revisions": 1, "criticPasses": 0, "checkpoint": null },
    "ux":        { "status": "awaiting-approval", "revisions": 2, "criticPasses": 0, "checkpoint": {...} },
    "ui":        { "status": "not-started",       "revisions": 0, "criticPasses": 0, "checkpoint": null },
    "architect": { "status": "not-started",       "revisions": 0, "criticPasses": 0, "checkpoint": null },
    "engineer":  { "status": "not-started",       "revisions": 0, "criticPasses": 0, "checkpoint": null },
    "qa":        { "status": "not-started",       "revisions": 0, "criticPasses": 0, "checkpoint": null }
  },
  "pendingFeedback": {
    "stage": "ux",                   // which stage this feedback targets
    "source": "user",                // "user" | "critic"
    "text": "Flows section too thin; add resume-project flow.",
    "reportPath": null               // e.g., critic-reports/2026-06-27-ux-p1.md when source=critic
  },
  "updatedAt": "2026-06-27T18:00:00Z"
}
```

**Status values:**
- `not-started` — stage hasn't begun
- `in-progress` — stage is mid-elicitation (has a checkpoint)
- `awaiting-approval` — artifact written, waiting for the gate
- `approved-complete` — orchestrator approved it; advancing to next stage
- `skipped` — stage intentionally bypassed (Mode C feature pipelines)
- `unreachable` — project path missing (orchestrator-set, recovery signal)
- `error` — stage run failed; checkpoint retained for recovery

**Checkpoint structure** (only present if stage is mid-run):
```jsonc
"checkpoint": {
  "themesCompleted": ["problem", "users", "alternatives"],
  "currentTheme": "value-prop",
  "draftPath": "docs/product/01-pm-brief.md",
  "notes": "user leaning B2B; confirm pricing next"
}
```

---

## 6. Write ownership boundary

**The stage role writes:**
- Its checkpoint (after each theme completes)
- Its artifact (when complete)
- Its revisions counter (when entering revise mode)
- Clears `pendingFeedback` (after applying feedback in revise)

**The stage role MUST NOT:**
- Modify `registry.json` (the orchestrator owns the cache/index)
- Advance the lifecycle stage (e.g., move from ux to ui in `currentStage`)
- Write `pendingFeedback` (the orchestrator writes it when the user picks `[c]` at the gate)

This boundary keeps roles focused on their work and prevents the role from
stepping on orchestrator sequencing.

---

## 7. How to use this protocol (for role skills)

Every role skill (product-manager, ux, ui, architect, engineer, qa) follows this
protocol:

**At entry:**
1. Establish the active project path.
2. Locate the track's `state.json` (product track or feature track).
3. Call the stage-protocol entry-mode detection (detect fresh/resume/revise).
4. Act accordingly:
   - **Fresh:** run full elicitation from theme 1
   - **Resume:** skip completed themes, continue from last checkpoint
   - **Revise:** load artifact, apply feedback, re-confirm changed parts only

**During elicitation:**
- After each theme completes, write a checkpoint to `state.json`.
- Checkpoint captures what's done, what's next, and any session notes.

**On artifact complete:**
- Write the artifact (the numbered .md doc or code, as applicable).
- Set `checkpoint = null`, `status = "awaiting-approval"`.
- Write `state.json`.
- Return control to the orchestrator (recommend next stage; never auto-chain).

**In revise mode:**
- Load the artifact and `pendingFeedback.text`.
- Apply the feedback as a targeted edit (ask about the specific changes only).
- Rewrite the artifact.
- Increment `revisions`.
- Clear `pendingFeedback`, set `checkpoint = null`.
- Write `state.json`.
- Return control to the gate.

---

## 8. Example flow

**Session 1: PM brief, interrupted mid-elicitation**

1. PM role invokes; detects `state.json` missing → **fresh**.
2. Runs elicitation themes: problem (done), users (done), alternatives (in-flight, user interrupted).
3. Checkpoint written:
   ```jsonc
   "checkpoint": {
     "themesCompleted": ["problem", "users"],
     "currentTheme": "alternatives",
     "draftPath": "docs/product/01-pm-brief.md",
     "notes": "..."
   }
   ```
4. Session ends.

**Session 2: Resume brief**

1. PM role invokes; detects `checkpoint != null` → **resume**.
2. Skips problem, users; starts with "alternatives" (the `currentTheme`).
3. Completes the 8 themes.
4. Writes artifact, sets `checkpoint = null`, `status = "awaiting-approval"`.
5. Hands off to orchestrator gate.

**Session 3: Revise (user picked `[c]` at gate with feedback)**

1. Orchestrator wrote `pendingFeedback: { text: "Expand the value prop; too generic." }`.
2. PM role invokes; detects artifact complete + `pendingFeedback.stage == "pm"` → **revise**.
3. Loads artifact, loads feedback.
4. **Targeted edit:** asks only about the value prop (not problem/users/etc.).
5. Rewrites just the value prop section.
6. Increments `revisions: 2`.
7. Clears `pendingFeedback`, sets `checkpoint = null`.
8. Hands off to orchestrator gate again.

---

## 9. Cross-cutting notes

- **Single-session assumption:** v1 accepts that only one session is active per
  project at a time. No multi-session locking or merging.
- **Critic integration:** when `pendingFeedback.source == "critic"`, the role
  still applies it as a targeted revise. The `reportPath` field lets the role
  link back to the critic's full report if needed.
- **Feature mode (Mode C):** feature tracks use the same `state.json` schema,
  with a right-sized `stages` object (only the stages that apply to the feature).
  Same checkpoint and revise logic.
