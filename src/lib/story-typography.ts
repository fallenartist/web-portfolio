import type { CSSProperties } from 'react'
import { normalizeColour } from '@/lib/colour'

export type StoryTextAppearance = { fontSize?: number | null; textColor?: string | null }

export function storyTextStyle(settings?: StoryTextAppearance): CSSProperties {
  const size = Math.min(72, Math.max(16, settings?.fontSize ?? 30))
  return {
    '--story-text-min-size': `${(size * 19) / 30}px`,
    '--story-text-fluid-size': `${(size * 1.75) / 30}vw`,
    '--story-text-size': `${size}px`,
    '--story-text-color': normalizeColour(settings?.textColor) || '#222222',
  } as CSSProperties
}
