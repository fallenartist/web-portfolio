import type { Discipline, Menu } from '@/payload-types'

export type MenuItem = NonNullable<Menu['items']>[number]
export type MenuSubItem = NonNullable<NonNullable<MenuItem['subItems']>[number]>
export type MenuEntry = MenuItem | MenuSubItem

export function getProjectsOverviewPath(slug?: null | string): string {
  const segment = slug?.trim().replace(/^\/+|\/+$/g, '') || 'projects'
  return `/${encodeURIComponent(segment)}`
}

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
  if (!link || !link.value || typeof link.value !== 'object') return '/'
  if (link.relationTo === 'pages') return `/${encodeURIComponent(link.value.slug)}`
  if (
    link.relationTo === 'industries' ||
    link.relationTo === 'clients' ||
    link.relationTo === 'agencies' ||
    link.relationTo === 'tags'
  ) {
    const parameter =
      link.relationTo === 'industries'
        ? 'industry'
        : link.relationTo === 'agencies'
          ? 'agency'
          : link.relationTo.slice(0, -1)
    return `/?${parameter}=${encodeURIComponent(link.value.slug)}`
  }
  const segments =
    link.relationTo === 'disciplines'
      ? disciplinePath(link.value)
      : [...disciplinePath(link.value.discipline), encodeURIComponent(link.value.slug)]
  if (legacyRootSlug && segments[0] === encodeURIComponent(legacyRootSlug)) segments.shift()
  return '/' + segments.join('/')
}

export function getMenuItemHref(
  item: MenuEntry,
  legacyRootSlug?: string,
  projectsOverviewSlug?: null | string,
): string {
  if (item.type === 'external') return item.externalLink || '#'
  if (item.type === 'group') return '#'
  if (item.internalDestination === 'projects') {
    return getProjectsOverviewPath(projectsOverviewSlug)
  }
  return item.internalLink ? getInternalLinkHref(item.internalLink, legacyRootSlug) : '#'
}

export function getMenuItemLabel(item: MenuEntry): string {
  return item.title
}

// Unpublished or deleted page relationships must not appear as live navigation links.
export function visiblePageMenu(menu: Menu | null): Menu | null {
  if (!menu) return null
  const available = (item: MenuEntry) => {
    const link = item.internalLink
    return (
      item.type !== 'internal' ||
      link?.relationTo !== 'pages' ||
      Boolean(link.value && typeof link.value === 'object' && link.value._status === 'published')
    )
  }
  return {
    ...menu,
    items: menu.items?.filter(available).map((item) => ({
      ...item,
      subItems: item.subItems?.filter(available),
    })),
  }
}
