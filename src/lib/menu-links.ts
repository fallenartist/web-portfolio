import type { Discipline, Menu } from '@/payload-types'

function disciplinePath(discipline: number | Discipline | null | undefined): string[] {
  const result: string[] = []
  const seen = new Set<number>()
  while (discipline && typeof discipline === 'object' && !seen.has(discipline.id)) {
    seen.add(discipline.id)
    result.unshift(encodeURIComponent(discipline.slug))
    discipline = discipline.parent
  }
  return result
}

export function getInternalLinkHref(
  link: NonNullable<NonNullable<Menu['items']>[number]['internalLink']>,
  legacyRootSlug?: string,
): string {
  if (!link || typeof link.value !== 'object') return '/'
  if (link.relationTo === 'industries') {
    return `/?industry=${encodeURIComponent(link.value.slug)}`
  }
  const segments =
    link.relationTo === 'disciplines'
      ? disciplinePath(link.value)
      : [...disciplinePath(link.value.discipline), encodeURIComponent(link.value.slug)]
  if (legacyRootSlug && segments[0] === encodeURIComponent(legacyRootSlug)) segments.shift()
  return '/' + segments.join('/')
}
