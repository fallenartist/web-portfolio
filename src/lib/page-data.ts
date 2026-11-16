import 'server-only'
import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getLocale } from '@/lib/server-locale'
import { getPortfolio } from '@/lib/site-data'
import { findTreemapNode } from '@/lib/treemap-data'
import { validatePageSlugFormat } from '@/lib/page-slugs'
import { findPublishedPage } from '@/lib/page-queries'
import { websiteTypography } from '@/lib/polish-typography'

export const getContentPage = cache(async (slug: string) => {
  if (validatePageSlugFormat(slug) !== true) return null
  const { treemapData, settings } = await getPortfolio()
  // Existing portfolio routes retain their meaning, including the legacy root alias.
  if (
    slug === settings.projectsOverviewSlug ||
    slug === treemapData.legacyRootSlug ||
    ['admin', 'api', 'projects', 'my-route'].includes(slug) ||
    findTreemapNode(treemapData, [slug])
  )
    return null
  const payload = await getPayload({ config })
  const locale = await getLocale()
  return websiteTypography(await findPublishedPage(payload, slug, locale), locale)
})
