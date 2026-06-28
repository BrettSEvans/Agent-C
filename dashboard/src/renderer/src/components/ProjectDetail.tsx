import { useState, useEffect, useRef } from 'react'
import { useMetalStyle } from '../lib/metal'
import type { RegistryEntry, ProjectState, GitState, Stage } from '../../../shared/types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatAge(isoString: string): string {
  const ageMs = Date.now() - new Date(isoString).getTime()
  const minutes = Math.floor(ageMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes === 1) return '1 minute ago'
  return `${minutes} minutes ago`
}

const STAGE_ORDER: Stage[] = ['pm', 'ux', 'ui', 'architect', 'engineer', 'qa']
const SKILL: Record<Stage, string> = {
  pm: 'product-manager', ux: 'ux', ui: 'ui',
  architect: 'architect', engineer: 'engineer', qa: 'qa'
}

function buildClaudePrompt(
  entry: RegistryEntry,
  projectState: ProjectState | null,
  gitState: GitState | null
): string {
  const { currentStage, status, name } = entry
  const feedback = projectState?.pendingFeedback
  const hasGitWork = (gitState?.uncommittedCount ?? 0) > 0 || (gitState?.unpushedCount ?? 0) > 0

  if (status === 'awaiting-approval' && feedback) {
    return `/${SKILL[currentStage]} — ${name}: revision requested.\n\n${feedback.text}`
  }

  if (status === 'awaiting-approval') {
    return `/orchestrator ${name}`
  }

  if (hasGitWork) {
    return `Commit and push changes for ${name} before advancing to the next stage.`
  }

  const idx = STAGE_ORDER.indexOf(currentStage)
  const nextStage = idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null

  if (status === 'approved-complete' && nextStage) {
    return `/${SKILL[nextStage]} — ${name}: the ${currentStage} stage is approved and complete. Proceed with ${nextStage}.`
  }

  if (status === 'in-progress') {
    return `/${SKILL[currentStage]} — ${name}: continue the ${currentStage} stage.`
  }

  return `/orchestrator ${name}`
}

function approvalSummary(
  entry: RegistryEntry,
  projectState: ProjectState | null
): { headline: string; detail: string; next: string } {
  const stage = entry.currentStage.toUpperCase()
  const stageInfo = projectState?.stages[entry.currentStage]
  const feedback = projectState?.pendingFeedback
  const revisions = stageInfo?.revisions ?? entry.revisionCount
  const criticPasses = stageInfo?.criticPasses ?? 0
  const meta = `Revisions: ${revisions}  ·  Critic passes: ${criticPasses}`

  if (feedback) {
    return {
      headline: `${stage} — Revision requested`,
      detail: feedback.text,
      next: `Invoke /${SKILL[entry.currentStage]} to apply the revisions, then return here to approve.`
    }
  }

  return {
    headline: `${stage} — Ready for approval`,
    detail: `The ${entry.currentStage} stage artifact is complete and ready for your review.\n\n${meta}`,
    next: `Invoke /orchestrator to approve and advance, or request changes to send back for revision.`
  }
}

// ── Info popup ────────────────────────────────────────────────────────────────

function InfoPopup({
  entry,
  projectState,
  onClose
}: {
  entry: RegistryEntry
  projectState: ProjectState | null
  onClose: () => void
}): JSX.Element {
  const { headline, detail, next } = approvalSummary(entry, projectState)
  const stageInfo = projectState?.stages[entry.currentStage]
  const revisions = stageInfo?.revisions ?? entry.revisionCount
  const criticPasses = stageInfo?.criticPasses ?? 0
  const reportPath = projectState?.pendingFeedback?.reportPath

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="info-popup-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Approval details"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="info-popup">
        <header className="info-popup__header">
          <span className="info-popup__title">★ {headline}</span>
          <button className="btn--link info-popup__close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <p className="info-popup__meta">
          Revisions: {revisions}  ·  Critic passes: {criticPasses}
        </p>

        {projectState?.pendingFeedback ? (
          <>
            <p className="info-popup__label">Feedback waiting to be applied:</p>
            <div className="info-popup__feedback">{detail}</div>
            {reportPath && (
              <p className="info-popup__report">Report: {reportPath}</p>
            )}
          </>
        ) : (
          <p className="info-popup__body">{detail}</p>
        )}

        <p className="info-popup__next">{next}</p>
      </div>
    </div>
  )
}

// ── Git state section ─────────────────────────────────────────────────────────

function GitStateSection({
  gitState,
  onRefresh
}: {
  gitState: GitState
  onRefresh: () => void
}): JSX.Element {
  const retryStyle = useMetalStyle()

  if (gitState.status === 'failed') {
    return (
      <div className="git-state git-state--failed">
        <span>Git status unavailable — check project path or git config</span>
        <button onClick={onRefresh} className="btn btn--sm" style={retryStyle}>
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

// ── Main component ────────────────────────────────────────────────────────────

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
  const hasPendingFeedback = !!projectState?.pendingFeedback
  const revisions = projectState?.stages[entry.currentStage]?.revisions ?? entry.revisionCount
  const [showToast, setShowToast] = useState(false)
  const [showPopup, setShowPopup] = useState(false)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const primaryStyle = useMetalStyle()
  const badgeStyle = useMetalStyle()
  const infoStyle = useMetalStyle()

  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current) }, [])

  function handleCopyPrompt(): void {
    const text = buildClaudePrompt(entry, projectState, gitState)
    window.api?.copyText(text)
    setShowToast(true)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setShowToast(false), 5000)
  }

  function handleRefresh(): void {
    onRefreshGit?.()
  }

  const approvalLine = hasPendingFeedback
    ? `${stage} revision requested — critic found issues`
    : `${stage} stage awaiting your approval`

  return (
    <article className="project-detail" aria-label={`Project: ${entry.name}`}>
      <header className="project-detail__header">
        <h1 className="project-detail__name">{entry.name}</h1>
        <p className="project-detail__path">{entry.path}</p>
      </header>

      {isAwaitingApproval && (
        <div role="alert" className="project-detail__approval-warning">
          <button
            className="info-btn"
            style={infoStyle}
            onClick={() => setShowPopup(true)}
            aria-label="Show approval details"
          >
            i
          </button>
          <span className="project-detail__approval-text">{approvalLine}</span>
        </div>
      )}

      <section className="project-detail__stage-section">
        <span data-testid="stage-badge" className="stage-badge" style={badgeStyle}>
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
          onClick={handleCopyPrompt}
          aria-label="Copy Claude prompt"
          style={primaryStyle}
        >
          Claude Prompt
        </button>
        {showToast && (
          <div role="status" className="toast">
            Copied — paste into Claude Desktop to continue
          </div>
        )}
      </footer>

      {showPopup && (
        <InfoPopup
          entry={entry}
          projectState={projectState}
          onClose={() => setShowPopup(false)}
        />
      )}
    </article>
  )
}
