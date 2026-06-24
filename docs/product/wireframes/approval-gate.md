# Wireframe — Approval-Gate Presentation (low-fi)

> Sample transcript of what a gate looks like. Structure of the interaction,
> not visual styling.

```
─────────────────────────────────────────────────────────────
 STAGE COMPLETE: Product Manager  →  project "tiffany"
─────────────────────────────────────────────────────────────
 Artifact: docs/product/01-pm-brief.md   (revision 2)

 Summary:
   • Problem ...... <one-line recap>
   • Users ........ <one-line recap>
   • v1 scope ..... <one-line recap>

 Recommended next: UX  (reads 01-pm-brief.md → writes 02-ux-workflow.md)

 What would you like to do?
   [a] Approve → advance to UX
   [c] Request changes (tell the PM what to revise)
   [e] I'll edit 01-pm-brief.md myself, then approve
   [p] Pause — park tiffany here and switch/exit
─────────────────────────────────────────────────────────────
>
```

**Notes**
- Always shows: which stage, which project, the artifact path + revision count,
  a short summary, and the recommended next stage.
- The four options map exactly to the confirmed gate behaviors.
- In manual (Desktop) use the user performs these by hand; the same four choices
  are how the orchestrator presents them in automated use.
