import { useRef } from 'react'

/**
 * Returns a stable CSSProperties object with random --rx / --ry values,
 * seeded once per component mount so the light position varies button-to-button
 * and reload-to-reload but never shifts during the session.
 */
export function useMetalStyle(): React.CSSProperties {
  const ref = useRef<React.CSSProperties | null>(null)
  if (!ref.current) {
    ref.current = {
      '--rx': `${22 + Math.random() * 56}%`,
      '--ry': `${10 + Math.random() * 42}%`,
    } as React.CSSProperties
  }
  return ref.current
}
