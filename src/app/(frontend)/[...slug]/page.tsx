import { notFound, redirect } from 'next/navigation'
import TangledTree from '@/components/TangledTree/TangledTree'
import Treemap from '@/components/Treemap/Treemap'
import { buildTangledTreeData, type TangledNodeKind } from '@/lib/tangled-tree-data'
import { getProjectsOverviewPath } from '@/lib/menu-links'
import { getPortfolio } from '@/lib/site-data'
import { findTreemapNode } from '@/lib/treemap-data'

export default async function SlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const portfolio = await getPortfolio()
  const { treemapData } = portfolio
  const overviewPath = getProjectsOverviewPath(portfolio.settings.projectsOverviewSlug)
  if (slug.length === 1 && slug[0] === portfolio.settings.projectsOverviewSlug) {
    const data = buildTangledTreeData(
      portfolio.disciplines,
      portfolio.projects,
      treemapData.legacyRootSlug,
    )
    return (
      <main>
        <TangledTree
          data={data}
          guideInstruction={portfolio.settings.projectGuideInstruction}
          guideTitle={portfolio.settings.projectGuideTitle}
          overviewPath={overviewPath}
        />
      </main>
    )
  }
  if (
    slug.length === 2 &&
    slug[0] === portfolio.settings.projectsOverviewSlug &&
    slug[1] === 'tangled'
  ) {
    redirect(overviewPath)
  }
  if (slug.length === 3 && slug[0] === portfolio.settings.projectsOverviewSlug) {
    const kind = slug[1] as TangledNodeKind
    const validKinds: TangledNodeKind[] = [
      'root',
      'discipline',
      'project',
      'industry',
      'client',
      'agency',
      'tag',
    ]
    if (!validKinds.includes(kind)) notFound()
    const data = buildTangledTreeData(
      portfolio.disciplines,
      portfolio.projects,
      treemapData.legacyRootSlug,
    )
    const selected = data.levels.flat().find((node) => node.kind === kind && node.slug === slug[2])
    if (!selected) notFound()
    return (
      <main>
        <TangledTree
          data={data}
          guideInstruction={portfolio.settings.projectGuideInstruction}
          guideTitle={portfolio.settings.projectGuideTitle}
          initialSelectedId={selected.id}
          overviewPath={overviewPath}
        />
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
