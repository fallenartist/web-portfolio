import ProjectDiagram from '@/components/ProjectDiagram/ProjectDiagram'
import { buildProjectDiagramData } from '@/lib/project-diagram'
import { getPortfolio } from '@/lib/site-data'

export default async function ProjectsOverviewPage() {
  const portfolio = await getPortfolio()
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
