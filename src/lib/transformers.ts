import type { Payload } from 'payload'
import { transformDataForTreemap } from './treemap-data'
import type { Locale } from '@/lib/locale'
export { transformDataForTreemap } from './treemap-data'

export async function fetchTreemapData(payload: Payload, locale: Locale = 'en') {
  const localization = { locale, fallbackLocale: 'en' as const }
  const [disciplines, projects, industries, settings, appearance] = await Promise.all([
    payload.find({
      collection: 'disciplines',
      ...localization,
      depth: 1,
      pagination: false,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'projects',
      ...localization,
      depth: 2,
      pagination: false,
      overrideAccess: false,
    }),
    payload.find({
      collection: 'industries',
      ...localization,
      depth: 1,
      pagination: false,
      overrideAccess: false,
    }),
    payload.findGlobal({ slug: 'settings', ...localization, overrideAccess: false }),
    payload.findGlobal({ slug: 'appearance', ...localization, overrideAccess: false }),
  ])
  return {
    treemapData: transformDataForTreemap(disciplines.docs, projects.docs, settings, appearance),
    disciplines: disciplines.docs,
    projects: projects.docs,
    industries: industries.docs,
    settings,
    appearance,
  }
}
