import Treemap from '@/components/Treemap/Treemap'
import { getPortfolio } from '@/lib/site-data'

export default async function Home() {
  const { treemapData } = await getPortfolio()
  return (
    <main>
      <Treemap data={treemapData} />
    </main>
  )
}
