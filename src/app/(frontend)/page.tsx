import Treemap from '@/components/Treemap/Treemap'
import { getPortfolio } from '@/lib/site-data'
import { transformDataForTreemap } from '@/lib/treemap-data'

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ industry?: string | string[] }>
}) {
  const [{ industry }, portfolio] = await Promise.all([searchParams, getPortfolio()])
  let treemapData = portfolio.treemapData
  const industrySlug = typeof industry === 'string' ? industry : undefined
  const selectedIndustry = industrySlug
    ? portfolio.industries.find((item) => item.slug === industrySlug)
    : undefined

  if (selectedIndustry) {
    const projects = portfolio.projects.filter((project) =>
      project.industries?.some((item) =>
        typeof item === 'object' ? item.id === selectedIndustry.id : item === selectedIndustry.id,
      ),
    )
    treemapData = transformDataForTreemap(portfolio.categories, projects, portfolio.settings)
    treemapData.title = selectedIndustry.title
  }

  return (
    <main>
      <Treemap data={treemapData} />
    </main>
  )
}
