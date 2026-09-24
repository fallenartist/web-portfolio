import { notFound } from 'next/navigation'
import Treemap from '@/components/Treemap/Treemap'
import { getPortfolio } from '@/lib/site-data'
import { findTreemapNode } from '@/lib/treemap-data'

export default async function SlugPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params
  const { treemapData } = await getPortfolio()
  if (!findTreemapNode(treemapData, slug)) notFound()
  return (
    <main>
      <Treemap data={treemapData} />
    </main>
  )
}
