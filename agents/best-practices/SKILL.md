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
5. **Flag staleness against your knowledge cutoff.** If a tool, pattern, or norm
   may have shifted since your training, say so and recommend the user confirm,
   rather than asserting a possibly-stale default as current.
6. **Record the road not taken.** Note the modern/idiomatic alternative even when
   you don't choose it, so the decision is visibly deliberate.

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
  your knowledge cutoff, instead of flagging it for the user to confirm.
- Discarding the alternative silently, so the decision looks accidental rather
  than deliberate.
