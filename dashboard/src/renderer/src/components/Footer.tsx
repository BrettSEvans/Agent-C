import { useDashboardStore } from '../store'

function formatSyncTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export function Footer({ onRefreshAll }: { onRefreshAll?: () => void }): JSX.Element {
  const { syncStatus } = useDashboardStore()

  return (
    <footer className="footer" aria-label="Dashboard footer">
      <span className="footer__status">
        {syncStatus === 'syncing' && '⟳ Syncing with registry…'}
        {syncStatus === 'error' && '✗ Sync error — check registry file'}
        {syncStatus === 'idle' && `Last synced: ${formatSyncTime()}`}
      </span>
      {onRefreshAll && (
        <button className="btn btn--sm" onClick={onRefreshAll} aria-label="Refresh all projects">
          Refresh
        </button>
      )}
    </footer>
  )
}
