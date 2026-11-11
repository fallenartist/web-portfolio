type DisciplineRoute = { id: number; slug: string; parent?: number | { id: number } | null }
type ProjectRoute = { slug: string; discipline: number | { id: number } }
const relationshipID = (value: number | { id: number } | null | undefined) =>
  typeof value === 'object' ? value?.id : value

export function occupiedPageSlugs(
  disciplines: DisciplineRoute[],
  projects: ProjectRoute[],
  settings: { rootDisciplineSlug?: string | null; projectsOverviewSlug?: string | null },
) {
  const reserved = new Set(['admin', 'api', 'projects', 'my-route'])
  reserved.add(settings.projectsOverviewSlug || 'projects')
  const roots = disciplines.filter((discipline) => !relationshipID(discipline.parent))
  for (const root of roots) reserved.add(root.slug)
  const wrapper =
    roots.length === 1 && ['root', settings.rootDisciplineSlug || 'work'].includes(roots[0].slug)
      ? roots[0]
      : undefined
  if (wrapper) {
    for (const discipline of disciplines)
      if (relationshipID(discipline.parent) === wrapper.id) reserved.add(discipline.slug)
    for (const project of projects)
      if (relationshipID(project.discipline) === wrapper.id) reserved.add(project.slug)
  }
  return reserved
}

export function validatePageSlugFormat(value: unknown) {
  return typeof value === 'string' && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
    ? true
    : 'Use lowercase letters, numbers and hyphens without slashes.'
}
