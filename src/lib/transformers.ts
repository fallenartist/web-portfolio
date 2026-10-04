import type { Payload } from 'payload'
import { transformDataForTreemap } from './treemap-data'
export { transformDataForTreemap } from './treemap-data'

export async function fetchTreemapData(payload: Payload) {
  const [disciplines, projects, industries, settings] = await Promise.all([
    payload.find({ collection: 'disciplines', depth: 1, pagination: false, overrideAccess: false }),
    payload.find({ collection: 'projects', depth: 2, pagination: false, overrideAccess: false }),
    payload.find({ collection: 'industries', depth: 1, pagination: false, overrideAccess: false }),
    payload.findGlobal({ slug: 'settings', overrideAccess: false }),
  ])
  return {
    treemapData: transformDataForTreemap(disciplines.docs, projects.docs, settings),
    disciplines: disciplines.docs,
    projects: projects.docs,
    industries: industries.docs,
    settings,
  }
}
