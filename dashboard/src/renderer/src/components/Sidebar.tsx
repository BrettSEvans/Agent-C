import { useDashboardStore } from '../store'
import type { RegistryEntry } from '../../../shared/types'

function stageBadge(stage: string): string {
  return stage.toUpperCase()
}

function ProjectItem({
  entry,
  selected,
  onSelect
}: {
  entry: RegistryEntry
  selected: boolean
  onSelect: (path: string) => void
}): JSX.Element {
  return (
    <button
      className={`sidebar-item${selected ? ' sidebar-item--active' : ''}`}
      onClick={() => onSelect(entry.path)}
      aria-selected={selected}
    >
      <span className="sidebar-item__name">{entry.name}</span>
      <span className="sidebar-item__stage">{stageBadge(entry.currentStage)}</span>
      {entry.needsYou && (
        <span
          className="sidebar-item__approval"
          title="Approval needed"
          aria-label="Approval needed"
        >
          ★
        </span>
      )}
    </button>
  )
}

export function Sidebar({ onSelect }: { onSelect: (path: string) => void }): JSX.Element {
  const { filteredProjects, projects, selectedPath, recentPaths, setSearch } =
    useDashboardStore()

  const recentEntries = recentPaths
    .map((p) => projects.find((e) => e.path === p))
    .filter((e): e is RegistryEntry => e !== undefined)

  return (
    <aside className="sidebar" aria-label="Project list">
      <div className="sidebar__search">
        <input
          type="search"
          placeholder="Search projects..."
          aria-label="Search projects"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {recentEntries.length > 0 && (
        <section className="sidebar__section" aria-label="Recently opened">
          <h2 className="sidebar__section-label">Recently opened</h2>
          {recentEntries.map((entry) => (
            <ProjectItem
              key={entry.path}
              entry={entry}
              selected={selectedPath === entry.path}
              onSelect={onSelect}
            />
          ))}
        </section>
      )}

      <section className="sidebar__section" aria-label="All projects">
        <h2 className="sidebar__section-label">All projects</h2>
        {filteredProjects.length === 0 ? (
          <p className="sidebar__empty">No projects found</p>
        ) : (
          filteredProjects.map((entry) => (
            <ProjectItem
              key={entry.path}
              entry={entry}
              selected={selectedPath === entry.path}
              onSelect={onSelect}
            />
          ))
        )}
      </section>
    </aside>
  )
}
