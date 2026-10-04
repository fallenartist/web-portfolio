import type { Discipline, Industry, Project } from '@/payload-types'

export type ProjectDiagramDiscipline = {
  id: string
  title: string
  color: string
  href: string
}

export type ProjectDiagramIndustry = {
  id: string
  title: string
  color: string
}

export type ProjectDiagramProject = {
  id: string
  title: string
  href: string
  disciplineId: string
  industryId?: string
  clientId: string
  clientTitle: string
}

export type ProjectDiagramData = {
  disciplines: ProjectDiagramDiscipline[]
  projects: ProjectDiagramProject[]
  industries: ProjectDiagramIndustry[]
}

const FALLBACK_DISCIPLINE_COLOR = '#777777'
const FALLBACK_INDUSTRY_COLOR = '#BBBBBB'

function validColor(value: null | string | undefined, fallback: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function relationshipID(value: null | number | { id: number } | undefined) {
  return typeof value === 'object' && value ? value.id : (value ?? undefined)
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

export function buildProjectDiagramData(
  disciplines: Discipline[],
  projects: Project[],
  industries: Industry[],
  legacyRootSlug?: string,
): ProjectDiagramData {
  const disciplineMap = new Map(disciplines.map((discipline) => [discipline.id, discipline]))
  const industryMap = new Map(industries.map((industry) => [industry.id, industry]))
  const diagramProjects: ProjectDiagramProject[] = []
  const usedDisciplines = new Set<number>()
  const usedIndustries = new Set<number>()

  for (const project of projects) {
    const disciplineID = relationshipID(project.discipline)
    const discipline = disciplineID == null ? undefined : disciplineMap.get(disciplineID)
    if (!discipline) continue

    const industryID = relationshipID(project.industry)
    const industry = industryID == null ? undefined : industryMap.get(industryID)
    const client = typeof project.client === 'object' && project.client ? project.client : undefined
    const segments = disciplineSegments(discipline, disciplineMap)
    if (legacyRootSlug && segments[0] === encodeURIComponent(legacyRootSlug)) segments.shift()
    const disciplineHref = `/${segments.join('/')}`

    usedDisciplines.add(discipline.id)
    if (industry) usedIndustries.add(industry.id)
    diagramProjects.push({
      id: `project-${project.id}`,
      title: project.title,
      href: `${disciplineHref}/${encodeURIComponent(project.slug)}`.replace(/\/+/g, '/'),
      disciplineId: `discipline-${discipline.id}`,
      industryId: industry ? `industry-${industry.id}` : undefined,
      clientId: client ? `client-${client.id}` : 'client-unassigned',
      clientTitle: client?.title || 'Unassigned client',
    })
  }

  return {
    disciplines: disciplines
      .filter((discipline) => usedDisciplines.has(discipline.id))
      .map((discipline) => {
        const segments = disciplineSegments(discipline, disciplineMap)
        if (legacyRootSlug && segments[0] === encodeURIComponent(legacyRootSlug)) segments.shift()
        return {
          id: `discipline-${discipline.id}`,
          title: discipline.title,
          color: validColor(discipline.color, FALLBACK_DISCIPLINE_COLOR),
          href: `/${segments.join('/')}`,
        }
      }),
    projects: diagramProjects,
    industries: industries
      .filter((industry) => usedIndustries.has(industry.id))
      .map((industry) => ({
        id: `industry-${industry.id}`,
        title: industry.title,
        color: validColor(industry.color, FALLBACK_INDUSTRY_COLOR),
      })),
  }
}
