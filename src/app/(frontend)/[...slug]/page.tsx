import { notFound, redirect } from 'next/navigation'
import ProjectDiagram from '@/components/ProjectDiagram/ProjectDiagram'
import TangledTree from '@/components/TangledTree/TangledTree'
import Treemap from '@/components/Treemap/Treemap'
import { buildProjectDiagramData } from '@/lib/project-diagram'
import { buildTangledTreeData } from '@/lib/tangled-tree-data'
import { getProjectsOverviewPath } from '@/lib/menu-links'
import { getPortfolio } from '@/lib/site-data'
import { findTreemapNode } from '@/lib/treemap-data'

export default async function SlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const portfolio = await getPortfolio()
  const { treemapData } = portfolio
  const overviewPath = getProjectsOverviewPath(portfolio.settings.projectsOverviewSlug)
  if (slug.length === 1 && slug[0] === portfolio.settings.projectsOverviewSlug) {
    const data = buildProjectDiagramData(
      portfolio.disciplines,
      portfolio.projects,
      portfolio.industries,
      treemapData.legacyRootSlug,
    )
    return (
      <main>
        <ProjectDiagram data={data} overviewPath={overviewPath} />
      </main>
    )
  }
  if (
    slug.length === 2 &&
    slug[0] === portfolio.settings.projectsOverviewSlug &&
    slug[1] === 'tangled'
  ) {
    const data = buildTangledTreeData(
      portfolio.disciplines,
      portfolio.projects,
      treemapData.legacyRootSlug,
    )
    return (
      <main>
        <TangledTree data={data} overviewPath={overviewPath} />
      </main>
    )
  }
  if (treemapData.legacyRootSlug === slug[0] && findTreemapNode(treemapData, slug.slice(1))) {
    redirect('/' + slug.slice(1).map(encodeURIComponent).join('/'))
  }
  if (!findTreemapNode(treemapData, slug)) notFound()
  return (
    <main>
      <Treemap data={treemapData} />
    </main>
  )
}
