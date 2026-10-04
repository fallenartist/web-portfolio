import ProjectDiagram from '@/components/ProjectDiagram/ProjectDiagram'
import { redirect } from 'next/navigation'
import { buildProjectDiagramData } from '@/lib/project-diagram'
import { getProjectsOverviewPath } from '@/lib/menu-links'
import { getPortfolio } from '@/lib/site-data'

export default async function ProjectsOverviewPage() {
  const portfolio = await getPortfolio()
  const overviewPath = getProjectsOverviewPath(portfolio.settings.projectsOverviewSlug)
  if (overviewPath !== '/projects') redirect(overviewPath)
  const data = buildProjectDiagramData(
    portfolio.disciplines,
    portfolio.projects,
    portfolio.industries,
    portfolio.treemapData.legacyRootSlug,
  )

  return (
    <main>
      <ProjectDiagram data={data} />
    </main>
  )
}
