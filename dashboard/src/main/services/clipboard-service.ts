import { clipboard } from 'electron'

export function copyOrchestratorCommand(projectName: string): void {
  clipboard.writeText(`/orchestrator ${projectName}`)
}
