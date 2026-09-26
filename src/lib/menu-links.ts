import type { Category, Menu } from '@/payload-types'

function categoryPath(category: number | Category | null | undefined): string[] {
  const result: string[] = []
  const seen = new Set<number>()
  while (category && typeof category === 'object' && !seen.has(category.id)) {
    seen.add(category.id)
    result.unshift(encodeURIComponent(category.slug))
    category = category.parent
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
    link.relationTo === 'categories'
      ? categoryPath(link.value)
      : [...categoryPath(link.value.category), encodeURIComponent(link.value.slug)]
  if (legacyRootSlug && segments[0] === encodeURIComponent(legacyRootSlug)) segments.shift()
  return '/' + segments.join('/')
}
