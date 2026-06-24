# Wireframe — Start-a-New-Project Flow (low-fi)

> The core Agent-C flow with the approval-gate loop. Workflow structure only.

```mermaid
flowchart TD
    A([User: start new project]) --> B[Orchestrator: ask name + location]
    B --> C[Register project in registry\nstage = PM, status = in progress]
    C --> D[Dispatch current stage agent]
    D --> E[Stage agent reads prior artifact\nruns elicitation]
    E --> F[Agent writes its artifact\nreturns control + recommends next]
    F --> G{{Approval gate}}
    G -->|Approve| H[Registry: stage complete]
    G -->|Request changes| E
    G -->|Edit doc myself| I[User hand-edits artifact]
    I --> G
    G -->|Pause / switch| P([Park project at this stage])
    H --> J{More stages?}
    J -->|Yes| K[Advance to next stage] --> D
    J -->|No| Z([Project complete])
```

**Notes**
- The gate is the only place the flow advances; agents never auto-chain.
- "Request changes" re-runs the same stage agent with feedback (revision loop).
- "Pause / switch" leaves the project parked; it's resumable from the registry.
