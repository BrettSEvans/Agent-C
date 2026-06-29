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

const STAGE_INFO: Record<Stage, { role: string; description: string; produces: string }> = {
  pm:       { role: 'Product Manager', description: 'Defines the what and why — problem, target users, value proposition, scope, and success metrics.', produces: '01-pm-brief.md' },
  ux:       { role: 'UX Designer',     description: 'Defines how the product works — user flows, screens, states, edge cases, and interaction feedback.',  produces: '02-ux-workflow.md' },
  ui:       { role: 'UI Designer',     description: 'Defines look, feel, taste, and voice — color, typography, component styling, and the design concept.', produces: '03-ui-direction.md' },
  architect:{ role: 'Architect',       description: 'Defines the technical architecture — system structure, data model, interfaces, and key decisions.',      produces: '04-architecture.md' },
  engineer: { role: 'Engineer',        description: 'Implements the architecture in working, idiomatic, tested code using test-driven development.',          produces: 'source code + 05-implementation.md' },
  qa:       { role: 'QA Engineer',     description: 'Verifies the implementation against all artifacts — flows, conformance, accessibility, and regressions.',produces: 'qa-report.md' },
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

// ── Info popup ────────────────────────────────────────────────────────────────

function InfoPopup({
  entry,
  projectState,
  gitState,
  onClose
}: {
  entry: RegistryEntry
  projectState: ProjectState | null
  gitState: GitState | null
  onClose: () => void
}): JSX.Element {
  const info = STAGE_INFO[entry.currentStage]
  const stageInfo = projectState?.stages[entry.currentStage]
  const feedback = projectState?.pendingFeedback
  const revisions = stageInfo?.revisions ?? entry.revisionCount
  const criticPasses = stageInfo?.criticPasses ?? 0
  const idx = STAGE_ORDER.indexOf(entry.currentStage)
  const nextStage = idx >= 0 && idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null
  const claudePrompt = buildClaudePrompt(entry, projectState, gitState)

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
          <span className="info-popup__title">{entry.currentStage.toUpperCase()} STAGE</span>
          <button className="btn--link info-popup__close" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <section className="info-popup__stage">
          <span className="info-popup__stage-role">{info.role}</span>
          <p className="info-popup__stage-desc">{info.description}</p>
          <p className="info-popup__stage-produces">Produces: <code>{info.produces}</code></p>
        </section>

        <section className="info-popup__status">
          <span className={`info-popup__status-badge${feedback ? ' info-popup__status-badge--revision' : ' info-popup__status-badge--approval'}`}>
            {feedback ? '⚠ Revision requested' : '✓ Ready for approval'}
          </span>
          <p className="info-popup__meta">
            Revisions: {revisions} · Critic passes: {criticPasses} · Updated {formatAge(entry.updatedAt)}
          </p>
        </section>

        {feedback && (
          <section className="info-popup__feedback-section">
            <p className="info-popup__section-label">Feedback to apply</p>
            <div className="info-popup__feedback">{feedback.text}</div>
            {feedback.reportPath && (
              <p className="info-popup__report">Report: {feedback.reportPath}</p>
            )}
          </section>
        )}

        <section className="info-popup__next-section">
          <p className="info-popup__section-label">Next step</p>
          {feedback ? (
            <p className="info-popup__next-text">
              Invoke <code>/{SKILL[entry.currentStage]}</code> to apply the revisions, then return here to approve.
            </p>
          ) : nextStage ? (
            <p className="info-popup__next-text">
              When approved, <strong>{STAGE_INFO[nextStage].role}</strong> takes over —{' '}
              {STAGE_INFO[nextStage].description}
            </p>
          ) : (
            <p className="info-popup__next-text">This is the final stage. Approve to mark the project complete.</p>
          )}
        </section>

        <section className="info-popup__prompt-section">
          <p className="info-popup__section-label">Claude prompt</p>
          <pre className="info-popup__prompt">{claudePrompt}</pre>
        </section>
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
          gitState={gitState}
          onClose={() => setShowPopup(false)}
        />
      )}
    </article>
  )
}
