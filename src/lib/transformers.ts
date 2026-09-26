import type { Payload } from 'payload'
import { transformDataForTreemap } from './treemap-data'
export { transformDataForTreemap } from './treemap-data'

export async function fetchTreemapData(payload: Payload) {
  const [categories, projects, industries, settings] = await Promise.all([
    payload.find({ collection: 'categories', depth: 1, pagination: false, overrideAccess: false }),
    payload.find({ collection: 'projects', depth: 2, pagination: false, overrideAccess: false }),
    payload.find({ collection: 'industries', depth: 1, pagination: false, overrideAccess: false }),
    payload.findGlobal({ slug: 'settings', overrideAccess: false }),
  ])
  return {
    treemapData: transformDataForTreemap(categories.docs, projects.docs, settings),
    categories: categories.docs,
    projects: projects.docs,
    industries: industries.docs,
    settings,
  }
}
