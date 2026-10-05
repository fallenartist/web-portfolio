import TangledTree from '@/components/TangledTree/TangledTree'
import { redirect } from 'next/navigation'
import { buildTangledTreeData } from '@/lib/tangled-tree-data'
import { getProjectsOverviewPath } from '@/lib/menu-links'
import { getPortfolio } from '@/lib/site-data'

export default async function ProjectsOverviewPage() {
  const portfolio = await getPortfolio()
  const overviewPath = getProjectsOverviewPath(portfolio.settings.projectsOverviewSlug)
  if (overviewPath !== '/projects') redirect(overviewPath)
  const data = buildTangledTreeData(
    portfolio.disciplines,
    portfolio.projects,
    portfolio.treemapData.legacyRootSlug,
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
