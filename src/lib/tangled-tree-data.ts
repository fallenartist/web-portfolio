import type { Agency, Discipline, Industry, Project, Tag } from '@/payload-types'

export type TangledNodeKind = 'discipline' | 'project' | 'client' | 'agency' | 'industry' | 'tag'

export type TangledTreeNode = {
  id: string
  slug: string
  title: string
  kind: TangledNodeKind
  href: string
  color: string
  parentIds: string[]
}

export type TangledTreeData = {
  levels: [TangledTreeNode[], TangledTreeNode[], TangledTreeNode[]]
}

const FALLBACK_COLORS: Record<TangledNodeKind, string> = {
  discipline: '#747474',
  project: '#111111',
  client: '#60747e',
  agency: '#8a745a',
  industry: '#78816b',
  tag: '#776d84',
}

function validColor(value: null | string | undefined, fallback: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function relationshipID(value: null | number | { id: number } | undefined) {
  return typeof value === 'object' && value ? value.id : (value ?? undefined)
}

function populated<T extends { id: number; slug: string; title: string }>(
  value: null | number | T | undefined,
): T | undefined {
  return typeof value === 'object' && value ? value : undefined
}

function disciplineSegments(discipline: Discipline, disciplines: Map<number, Discipline>) {
  const segments: string[] = []
  const seen = new Set<number>()
  let current: Discipline | undefined = discipline

  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    segments.unshift(encodeURIComponent(current.slug))
    const parentID = relationshipID(current.parent)
    current = parentID == null ? undefined : disciplines.get(parentID)
  }
  return segments
}

function filterHref(kind: Exclude<TangledNodeKind, 'discipline' | 'project'>, slug: string) {
  return `/?${kind}=${encodeURIComponent(slug)}`
}

export function buildTangledTreeData(
  disciplines: Discipline[],
  projects: Project[],
  legacyRootSlug?: string,
): TangledTreeData {
  const disciplineMap = new Map(disciplines.map((discipline) => [discipline.id, discipline]))
  const disciplineNodes = new Map<number, TangledTreeNode>()
  const projectNodes: TangledTreeNode[] = []
  const metadata = new Map<string, TangledTreeNode>()

  const addMetadata = (
    kind: 'client' | 'agency' | 'industry' | 'tag',
    item: { id: number; title: string; slug: string; color?: null | string },
    projectID: string,
  ) => {
    const id = `${kind}-${item.id}`
    const existing = metadata.get(id)
    if (existing) {
      if (!existing.parentIds.includes(projectID)) existing.parentIds.push(projectID)
      return
    }
    metadata.set(id, {
      id,
      slug: item.slug,
      title: item.title,
      kind,
      href: filterHref(kind, item.slug),
      color: validColor(item.color, FALLBACK_COLORS[kind]),
      parentIds: [projectID],
    })
  }

  for (const project of projects) {
    const disciplineID = relationshipID(project.discipline)
    const discipline = disciplineID == null ? undefined : disciplineMap.get(disciplineID)
    if (!discipline) continue

    const segments = disciplineSegments(discipline, disciplineMap)
    if (legacyRootSlug && segments[0] === encodeURIComponent(legacyRootSlug)) segments.shift()
    const disciplineHref = `/${segments.join('/')}`
    const disciplineNodeID = `discipline-${discipline.id}`
    const projectID = `project-${project.id}`

    if (!disciplineNodes.has(discipline.id)) {
      disciplineNodes.set(discipline.id, {
        id: disciplineNodeID,
        slug: discipline.slug,
        title: discipline.title,
        kind: 'discipline',
        href: disciplineHref,
        color: validColor(discipline.color, FALLBACK_COLORS.discipline),
        parentIds: [],
      })
    }

    projectNodes.push({
      id: projectID,
      slug: project.slug,
      title: project.title,
      kind: 'project',
      href: `${disciplineHref}/${encodeURIComponent(project.slug)}`.replace(/\/+/g, '/'),
      color: FALLBACK_COLORS.project,
      parentIds: [disciplineNodeID],
    })

    const client = populated(project.client)
    const agency = populated<Agency>(project.agency)
    const industry = populated<Industry>(project.industry)
    if (client) addMetadata('client', client, projectID)
    if (agency) addMetadata('agency', agency, projectID)
    if (industry) addMetadata('industry', industry, projectID)
    for (const tagValue of project.tags || []) {
      const tag = populated<Tag>(tagValue)
      if (tag) addMetadata('tag', tag, projectID)
    }
  }

  const byTitle = (a: TangledTreeNode, b: TangledTreeNode) => a.title.localeCompare(b.title)
  const kindOrder: Record<TangledNodeKind, number> = {
    discipline: 0,
    project: 1,
    industry: 2,
    client: 3,
    agency: 4,
    tag: 5,
  }
  const metadataNodes = [...metadata.values()].sort(
    (a, b) => kindOrder[a.kind] - kindOrder[b.kind] || byTitle(a, b),
  )

  return {
    levels: [
      [...disciplineNodes.values()].sort(byTitle),
      projectNodes.sort(byTitle),
      metadataNodes,
    ],
  }
}
