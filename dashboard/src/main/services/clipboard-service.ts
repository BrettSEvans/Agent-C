import { clipboard } from 'electron'

export function copyText(text: string): void {
  clipboard.writeText(text)
}
