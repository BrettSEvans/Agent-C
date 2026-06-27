---
name: feature-mode
description: Shared discipline for jumping into an existing codebase to design and build a SINGLE feature (not a whole product). Adds a third operating mode (Mode C) to the role skills - reverse-engineer the project's conventions once into a project profile, scope feature artifacts under docs/features/<slug>/, right-size which stages the feature needs, and CONFORM to the existing design and architecture rather than inventing new direction. Invoked by product-manager, ux, ui, architect, and engineer when the work is a feature on an existing product. Triggers - "add a feature to", "build a <page/feature> on", "jump in and develop", "feature on an existing site".
---

# Feature Mode (shared method)

This is the reusable discipline for **Mode C — feature jump-in**: using a single
role skill (or a short chain of them) to design and build **one feature inside an
existing product**, conforming to what's already there. Role skills
(product-manager, ux, ui, architect, engineer) invoke this method when the work is
scoped to a feature rather than a whole product.

## The three operating modes

Every role skill can run in one of three modes:

- **Mode A — full workflow.** New product, greenfield. Read the upstream numbered
  artifact (`01`→`02`→`03`→`04`) and produce the next.
- **Mode B — standalone jump-in.** Reverse-engineer a *whole existing product* to
  **document** it (e.g. "capture this site's UI direction"). The deliverable is a
  whole-product artifact.
- **Mode C — feature jump-in (this skill).** Design/build **one new feature inside**
  an existing product. The existing product is **context and constraint**, not the
  deliverable; the deliverable is a *feature-scoped* artifact (or working code) that
  **fits in** as if it had always been there.

Mode C reuses Mode B's reverse-engineering — but only to learn the conventions the
feature must respect, not to re-document the whole product.

## 1. Establish the feature and the project

Before anything, confirm with the user:
- **Which existing project** (name + path) the feature lands in.
- **What the feature is**, in one or two sentences, and its **scope boundary**
  (what's in, what's explicitly out for this pass).
- A short **feature slug** (kebab-case, e.g. `merch-page`, `csv-export`) — used for
  the artifact folder.

## 2. The project profile (read once, reuse for every feature)

Feature work depends on knowing the existing product's conventions. Capture them
**once** in `<project>/docs/project-profile.md`, shared by all features.

- **If `docs/project-profile.md` exists**, read it; treat it as the source of truth
  for conventions (refresh anything that's clearly stale).
- **If it does not exist**, reverse-engineer it from the codebase and write it
  before proceeding. Capture:
  - **Stack & runtime** — languages, frameworks, package manager, build tooling.
  - **How to run / build / test** — the actual commands.
  - **Architecture & key patterns** — structure, where things live, the load-bearing
    patterns a feature must respect (e.g. routing model, state management, how a
    page/module is added).
  - **Design system** — color tokens, typography, spacing/radii, component
    conventions, motion. (For GUI products this is what UI must conform to.)
  - **Navigation & information architecture** — how users reach things; where a new
    surface would slot in.
  - **Auth & access** — how the app gates access, if at all.
  - **Conventions** — naming, file layout, lint/format rules, test style.
  - **"How to add X here"** — the concrete recipe for adding the kind of thing this
    feature is (a page, an endpoint, a command).

Keep it factual and current; it is the contract every feature stage reads.

## 3. Feature artifacts layout

Feature work writes to its own folder so it never collides with whole-product docs:

```
<project>/docs/
├── project-profile.md            # shared conventions (from step 2)
└── features/<feature-slug>/
    ├── 01-feature-brief.md        # product-manager (feature scope & why)
    ├── 02-feature-ux.md           # ux (flows that fit existing IA)
    ├── 03-feature-ui.md           # ui (conforms to existing design system)
    ├── 04-feature-architecture.md # architect (fits existing architecture)
    └── 05-implementation.md       # engineer (what was built, how to run/verify)
```

Each role writes the **feature-scoped** version of its artifact here (not the
whole-product `docs/product/0X-*.md`). Deferred items still go to the project's
shared `docs/product/backlog.md` (create if absent), tagged with the feature slug.

## 4. Right-size the pipeline

A feature rarely needs all stages at full depth. Pick the stages that add value and
skip the rest — a static content page might be brief → UX (light) → UI → engineer; a
feature with new data and a backend needs real architecture too.

- The user (or orchestrator) chooses which stages the feature runs.
- **Each stage works from whatever feature artifacts exist**, and falls back to the
  **project profile** for anything an upstream feature artifact would have provided.
  Don't hard-fail because an earlier feature stage was skipped — read the profile,
  ask the user for the gap, and proceed.

## 5. Conform — don't reinvent (the key discipline)

This is the inversion that makes feature work different from greenfield work:

- For a **new product**, the goal is a distinctive point of view (see the `ui`
  skill's *Taste & originality*, and `best-practices`).
- For a **feature on an existing product**, "best practice" becomes **extend the
  established conventions** — design language, architecture patterns, naming, voice.
  Introducing a *new* pattern is usually the wrong call.
- The distinctiveness test **flips**: instead of "could this be any other product?"
  ask **"does this look and behave like it was always part of *this* product?"**
- **Deviate only with explicit justification** tied to the feature's needs, recorded
  in the relevant artifact. Matching the existing system is the default; departing
  from it is the exception that must be argued.

## How roles specialize feature mode

Each role applies the above to its own altitude:

- **product-manager** — define the feature's *why* and scope *within* the product's
  existing goals and users; don't re-litigate the whole product.
- **ux** — design the feature's flows so they slot into the existing information
  architecture and navigation, reusing established interaction patterns.
- **ui** — style the feature to **conform** to `project-profile.md`'s design system
  (tokens, type, components); extend, don't restyle.
- **architect** — fit the feature into the existing architecture: name the
  integration points, reuse existing patterns/services, and justify any new
  dependency against the profile.
- **engineer** — implement into the existing codebase, matching its conventions and
  test style; change the minimum needed; build and verify before claiming done.

The role skill carries its altitude; this skill carries the feature-jump-in
discipline and the conform rule.

## Handoff

Feature mode does not change the handoff contract: each stage produces its
feature-scoped artifact (or code), **returns control, and recommends the next
stage** — never auto-chains. The human (or orchestrator) approves each step and
decides whether the feature needs the next stage at all.
