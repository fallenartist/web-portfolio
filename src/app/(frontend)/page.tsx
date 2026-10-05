import Treemap from '@/components/Treemap/Treemap'
import { getPortfolio } from '@/lib/site-data'
import { transformDataForTreemap } from '@/lib/treemap-data'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{
    client?: string | string[]
    agency?: string | string[]
    industry?: string | string[]
    tag?: string | string[]
  }>
}) {
  const [filters, portfolio] = await Promise.all([searchParams, getPortfolio()])
  let treemapData = portfolio.treemapData
  const selected = (['client', 'agency', 'industry', 'tag'] as const).find(
    (kind) => typeof filters[kind] === 'string',
  )
  const slug = selected && typeof filters[selected] === 'string' ? filters[selected] : undefined

  if (selected && slug) {
    const projects = portfolio.projects.filter((project) => {
      if (selected === 'tag') {
        return project.tags?.some((tag) => typeof tag === 'object' && tag.slug === slug)
      }
      const relationship = project[selected]
      return typeof relationship === 'object' && relationship?.slug === slug
    })
    treemapData = transformDataForTreemap(portfolio.disciplines, projects, portfolio.settings)
    const relationship =
      selected === 'tag'
        ? projects
            .flatMap((project) => project.tags || [])
            .find((tag) => typeof tag === 'object' && tag.slug === slug)
        : projects
            .map((project) => project[selected])
            .find((item) => typeof item === 'object' && item?.slug === slug)
    if (relationship && typeof relationship === 'object') treemapData.title = relationship.title
  }

  return (
    <main>
      <Treemap data={treemapData} />
    </main>
  )
}
