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
