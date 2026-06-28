import type { RegistryEntry, ProjectState, GitState } from '../../../shared/types'

function formatAge(isoString: string): string {
  const ageMs = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(ageMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 minute ago'
  return `${minutes} minutes ago`
}

function GitStateSection({
  gitState,
  onRefresh
}: {
  gitState: GitState
  onRefresh: () => void
}): JSX.Element {
  if (gitState.status === 'failed') {
    return (
      <div className="git-state git-state--failed">
        <span>Git status unavailable — check project path or git config</span>
        <button onClick={onRefresh} className="btn btn--sm">
          Retry
        </button>
      </div>
    )
  }

  if (gitState.status === 'computing') {
    return <div className="git-state git-state--computing">Computing git status…</div>
  }

  const age = formatAge(gitState.computedAt)
  const isOld = gitState.status === 'cached'

  const files = gitState.uncommittedFiles ?? []

  return (
    <div className="git-state">
      <div className="git-state__row">
        <span>{gitState.uncommittedCount} uncommitted changes</span>
        <span>{gitState.unpushedCount} unpushed commits</span>
      </div>
      {files.length > 0 && (
        <ul className="git-state__files" aria-label="uncommitted files">
          {files.map((f) => (
            <li key={f.path} className="git-state__file">
              <span className={`git-state__file-label git-state__file-label--${f.label}`}>
                {f.label}
              </span>
              <span className="git-state__file-path">{f.path}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="git-state__meta">
        {isOld ? (
          <span className="git-state__age">
            git status is {age} — <button onClick={onRefresh} className="btn--link">refresh</button>
          </span>
        ) : (
          <span className="git-state__fresh">git status current</span>
        )}
      </div>
    </div>
  )
}

export function ProjectDetail({
  entry,
  projectState,
  gitState,
  onRefreshGit
}: {
  entry: RegistryEntry
  projectState: ProjectState | null
  gitState: GitState | null
  onRefreshGit?: () => void
}): JSX.Element {
  const stage = entry.currentStage.toUpperCase()
  const isAwaitingApproval = entry.status === 'awaiting-approval'
  const revisions = projectState?.stages[entry.currentStage]?.revisions ?? entry.revisionCount

  function handleOpenOrchestrator(): void {
    window.api?.copyOrchestratorCommand(entry.name)
  }

  function handleRefresh(): void {
    onRefreshGit?.()
  }

  return (
    <article className="project-detail" aria-label={`Project: ${entry.name}`}>
      <header className="project-detail__header">
        <h1 className="project-detail__name">{entry.name}</h1>
        <p className="project-detail__path">{entry.path}</p>
      </header>

      {isAwaitingApproval && (
        <div role="alert" className="project-detail__approval-warning">
          Approval needed — ready to advance to the next stage
        </div>
      )}

      <section className="project-detail__stage-section">
        <span data-testid="stage-badge" className="stage-badge">
          {stage}
        </span>
        <span className="project-detail__revisions">Revisions: {revisions}</span>
      </section>

      {gitState && (
        <section className="project-detail__git">
          <GitStateSection gitState={gitState} onRefresh={handleRefresh} />
        </section>
      )}

      {!gitState && (
        <section className="project-detail__git">
          <div className="git-state git-state--computing">Computing git status…</div>
        </section>
      )}

      <footer className="project-detail__actions">
        <button
          className="btn btn--primary"
          onClick={handleOpenOrchestrator}
          aria-label="Open in orchestrator"
        >
          Open in orchestrator
        </button>
      </footer>
    </article>
  )
}
