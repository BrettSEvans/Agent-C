# Wireframe — Project Dashboard / Registry (low-fi)

> ASCII sketch of the multi-project overview. Structure only, not styling.

```
AGENT-C — PROJECTS                                          [* = needs you]

  PROJECT     LOCATION                  STAGE          STATUS            REV
  ---------   -----------------------   ------------   ---------------   ---
* tiffany     ~/code/tiffany            UX             awaiting approval   2
  amanda      ~/work/amanda-app         architect      in progress         0
  zephyr      ~/experiments/zephyr      PM             approved-complete   1
  (!) orbit    ~/old/orbit  [MISSING]   engineering    unreachable         -

  Stages: PM > UX > UI > architect > engineering > QA

  > resume tiffany        > switch amanda
  > new <name> <path>     > adopt <path>
  > repoint orbit <path>  > remove orbit
```

**Notes**
- `*` marks projects blocked on the user (the "needs-you" flag).
- `(!) ... [MISSING]` = stale registry entry (folder moved/deleted) → offer
  repoint/remove. (This particular handling is backlog, not v1 — shown for shape.)
- REV = revision rounds at the current stage.
- Status vocabulary: not started / in progress / awaiting approval /
  approved-complete (+ unreachable for missing).
