import type { RegistryEntry, ProjectState, GitState } from '../../../shared/types'
import { ProjectDetail } from './ProjectDetail'

export function FeatureDetail({
  entry,
  projectState,
  gitState,
  onRefreshGit,
  onBack
}: {
  entry: RegistryEntry
  projectState: ProjectState | null
  gitState: GitState | null
  onRefreshGit?: () => void
  onBack?: () => void
}): JSX.Element {
  return (
    <div className="feature-detail">
      {onBack && (
        <nav className="feature-detail__breadcrumb">
          <button className="btn--link" onClick={onBack}>
            ← Back to product
          </button>
        </nav>
      )}
      <div className="feature-detail__tag">Feature</div>
      <ProjectDetail
        entry={entry}
        projectState={projectState}
        gitState={gitState}
        onRefreshGit={onRefreshGit}
      />
    </div>
  )
}
