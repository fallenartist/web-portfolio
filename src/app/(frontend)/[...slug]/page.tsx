import { notFound, redirect } from 'next/navigation'
import TangledTree from '@/components/TangledTree/TangledTree'
import Treemap from '@/components/Treemap/Treemap'
import { buildTangledTreeData, type TangledNodeKind } from '@/lib/tangled-tree-data'
import { getProjectsOverviewPath } from '@/lib/menu-links'
import { getPortfolio } from '@/lib/site-data'
import { findTreemapNode } from '@/lib/treemap-data'
import type { Metadata } from 'next'
import ContentPage from '@/components/ContentPage/ContentPage'
import { getContentPage } from '@/lib/page-data'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>
}): Promise<Metadata> {
  const { slug } = await params
  const page = slug.length === 1 ? await getContentPage(slug[0]) : null
  if (!page) return {}
  const { settings } = await getPortfolio()
  return {
    title: `${page.title} — ${settings.siteTitle || 'Design Portfolio'}`,
    ...(page.metaDescription ? { description: page.metaDescription } : {}),
  }
}

export default async function SlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const portfolio = await getPortfolio()
  const { treemapData } = portfolio
  const page = slug.length === 1 ? await getContentPage(slug[0]) : null
  if (page)
    return (
      <ContentPage
        page={page}
        rootTitle={treemapData.title}
        siteTitle={portfolio.settings.siteTitle || 'Design Portfolio'}
        legacyRootSlug={treemapData.legacyRootSlug}
        textSettings={treemapData.settings?.storyText}
      />
    )
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
          rootTitle={treemapData.title}
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
          rootTitle={treemapData.title}
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
