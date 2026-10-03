import type { Category, Industry, Project } from '@/payload-types'

export type ProjectDiagramCategory = {
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
  categoryId: string
  industryId?: string
  clientId: string
  clientTitle: string
}

export type ProjectDiagramData = {
  categories: ProjectDiagramCategory[]
  projects: ProjectDiagramProject[]
  industries: ProjectDiagramIndustry[]
}

const FALLBACK_CATEGORY_COLOR = '#777777'
const FALLBACK_INDUSTRY_COLOR = '#BBBBBB'

function validColor(value: null | string | undefined, fallback: string) {
  return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback
}

function relationshipID(value: null | number | { id: number } | undefined) {
  return typeof value === 'object' && value ? value.id : value ?? undefined
}

function categorySegments(category: Category, categories: Map<number, Category>) {
  const segments: string[] = []
  const seen = new Set<number>()
  let current: Category | undefined = category

  while (current && !seen.has(current.id)) {
    seen.add(current.id)
    segments.unshift(encodeURIComponent(current.slug))
    const parentID = relationshipID(current.parent)
    current = parentID == null ? undefined : categories.get(parentID)
  }

  return segments
}

export function buildProjectDiagramData(
  categories: Category[],
  projects: Project[],
  industries: Industry[],
  legacyRootSlug?: string,
): ProjectDiagramData {
  const categoryMap = new Map(categories.map((category) => [category.id, category]))
  const industryMap = new Map(industries.map((industry) => [industry.id, industry]))
  const diagramProjects: ProjectDiagramProject[] = []
  const usedCategories = new Set<number>()
  const usedIndustries = new Set<number>()

  for (const project of projects) {
    const categoryID = relationshipID(project.category)
    const category = categoryID == null ? undefined : categoryMap.get(categoryID)
    if (!category) continue

    const industryID = relationshipID(project.industry)
    const industry = industryID == null ? undefined : industryMap.get(industryID)
    const client = typeof project.client === 'object' && project.client ? project.client : undefined
    const segments = categorySegments(category, categoryMap)
    if (legacyRootSlug && segments[0] === encodeURIComponent(legacyRootSlug)) segments.shift()
    const categoryHref = `/${segments.join('/')}`

    usedCategories.add(category.id)
    if (industry) usedIndustries.add(industry.id)
    diagramProjects.push({
      id: `project-${project.id}`,
      title: project.title,
      href: `${categoryHref}/${encodeURIComponent(project.slug)}`.replace(/\/+/g, '/'),
      categoryId: `category-${category.id}`,
      industryId: industry ? `industry-${industry.id}` : undefined,
      clientId: client ? `client-${client.id}` : 'client-unassigned',
      clientTitle: client?.title || 'Unassigned client',
    })
  }

  return {
    categories: categories
      .filter((category) => usedCategories.has(category.id))
      .map((category) => {
        const segments = categorySegments(category, categoryMap)
        if (legacyRootSlug && segments[0] === encodeURIComponent(legacyRootSlug)) segments.shift()
        return {
          id: `category-${category.id}`,
          title: category.title,
          color: validColor(category.color, FALLBACK_CATEGORY_COLOR),
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
