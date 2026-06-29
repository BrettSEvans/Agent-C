---
name: best-practices
description: Shared discipline for choosing current, proven best-practice patterns over the ones merely seen most often. Guards against frequency bias (defaulting to whatever appears most in training data) and its opposite (chasing novelty). Invoked by role skills (product-manager, ux, ui, architect, engineer, QA), each of which specializes what "best practice" means in its domain.
---

# Best Practices (shared method)

This is the reusable discipline for making choices that reflect **current, proven
best practice** for the project at hand — not merely the pattern you've seen most
often. Role skills (product-manager, ux, ui, architect, engineer, qa) invoke this
method, then specialize what "best practice" means in their domain.

## Why this exists

Your default risk is **frequency bias**: reaching for the option that appears most
often in training data rather than the one that's best for *this* project today.
The most common approach is not the same as the best-engineered one — and the
ecosystem moves faster than any training snapshot. Left unchecked, this quietly
ships dated defaults (e.g. hand-rolled raw SQL where the stack's norm is a typed
ORM) because they were *common*, not because they were *right*.

## The method

1. **Anchor on current best practice, then justify.** For each meaningful choice,
   name the modern, idiomatic option a strong practitioner would reach for *today*
   and make that the default candidate. If you propose something else, say why it
   wins *here*.
2. **Justify against the project's drivers, not habit.** A choice should point back
   to a goal that matters for this product (maintainability, accessibility, speed,
   safety, clarity…). "It's common" or "it's quickest to produce" is not, by
   itself, a rationale.
3. **Don't over-correct into novelty.** Modern ≠ trendy; best practice ≠ the
   heaviest or newest option. The simplest proven approach that fits is often
   right — but as a *deliberate, recorded* choice, not a reflex in either
   direction.
4. **Best practice is craft, not sameness.** For choices where originality is the
   point — visual design, naming, voice, product concept — "best practice" means a
   high, intentional bar (a clear point of view executed well), *not* the
   homogenized average. Anchoring on best practice must never flatten a design,
   name, or voice into generic defaults. Where a role produces creative output, it
   carries its own taste/originality guidance; this discipline raises the craft
   bar, it does not license blandness.
5. **Verify currency — don't just hedge.** The ecosystem moves faster than your
   training snapshot, so any version number, library, API, or "current norm" you
   are about to assert is suspect. When a retrieval tool is available, **check the
   current state before asserting** (see *Verifying currency* below) and record
   what you found with the date you checked (e.g. "Tailwind v4, verified
   2026-06-29"). Only when no retrieval tool is available do you fall back to
   flagging the item as possibly-stale and asking the user to confirm. Never
   assert a possibly-dated default as current when you could have checked.
6. **Record the road not taken.** Note the modern/idiomatic alternative even when
   you don't choose it, so the decision is visibly deliberate.

## Verifying currency

Method step 5 says to verify before asserting. This is how.

**When to verify.** Trigger a check whenever a choice depends on a fast-moving
fact your training may have outrun:

- a specific library, framework, or tool version (current major, maintained
  successor, deprecation status);
- whether a pattern, API, or default is still idiomatic, or has been superseded;
- the recommended option for a category you are about to name as "the modern
  default" (e.g. the current routing, state, ORM, or testing norm for the stack).

Not every choice needs a lookup — only the ones where being a year stale would
change the recommendation. Use judgment; don't verify settled fundamentals.

**How to verify.** Use whatever retrieval tool the session exposes, in order of
preference:

1. A **documentation or package-registry MCP** if one is connected (most precise
   for live versions and official guidance).
2. **Web search / fetch** (`WebSearch` / `WebFetch` in Claude Code) against the
   project's or library's official docs and release notes — prefer primary
   sources over blog roundups.

**How to record.** Carry the result into the artifact so the decision is auditable:

- Stamp the verified fact with the date checked: *"Next.js 15 (App Router),
  verified 2026-06-29."*
- If a check changes your candidate, note the prior assumption and why it moved.
- If no retrieval tool is available in the session, say so explicitly and flag the
  item for the user to confirm — do not silently assert.

**Availability differs by surface.** Claude Code generally exposes web tools;
Claude Desktop may not. The rule adapts: verify when you can, flag when you can't,
and never present an unverified fast-moving fact as settled.

## How roles specialize this

Each role skill names what "best practice" governs in its domain, and points back
to this discipline. For example:

- **product-manager** — current discovery & framing practice (jobs-to-be-done,
  crisp non-goals) over template-filling.
- **ux** — current interaction & information-architecture patterns that fit the
  job, not the most ubiquitous layout by default.
- **ui** — modern, accessible visual-design practice (type scale, contrast, design
  tokens, motion) over dated or merely-popular styling.
- **architect** — current best-practice structure and stack (e.g. a typed
  ORM/query builder over hand-rolled raw SQL unless raw SQL is the justified fit).
- **engineer** — idiomatic, current language/framework patterns, typing, and tests
  over copy-paste-common code.
- **qa** — current testing practice (a fit-for-purpose test pyramid, meaningful
  coverage) over box-ticking.

The role skill carries the domain specifics; this skill carries the discipline.

## Anti-patterns

- Choosing an approach because it's the most common in examples you've seen, with
  no line back to a project driver.
- Swapping one bias for another — reaching for the newest/heaviest framework to
  *look* modern.
- Asserting a default as "best practice" when it may have been superseded since
  your knowledge cutoff, instead of verifying it against a current source (or
  flagging it for the user to confirm when no retrieval tool is available).
- Treating a verification tool as available everywhere — asserting a checked fact
  in a session that has no retrieval, instead of flagging it.
- Discarding the alternative silently, so the decision looks accidental rather
  than deliberate.
