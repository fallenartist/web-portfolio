import { parse } from 'culori'

export function normalizeColour(value: null | string | undefined): string | null {
  if (typeof value !== 'string' || value.length > 160) return null
  const colour = value.trim()
  if (!colour) return null
  return parse(colour) ? colour : null
}
