import { notFound, redirect } from 'next/navigation'
import Treemap from '@/components/Treemap/Treemap'
import { getPortfolio } from '@/lib/site-data'
import { findTreemapNode } from '@/lib/treemap-data'

export default async function SlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const { treemapData } = await getPortfolio()
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
