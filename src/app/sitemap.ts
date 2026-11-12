import type { MetadataRoute } from 'next'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getPortfolio } from '@/lib/site-data'
import { getInternalLinkHref, getProjectsOverviewPath } from '@/lib/menu-links'

export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = process.env.SITE_URL || 'https://lenart.pl'
  const { projects, settings, treemapData } = await getPortfolio()
  const payload = await getPayload({ config })
  const pages = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    locale: 'en',
    depth: 0,
    pagination: false,
    overrideAccess: false,
  })
  return [
    { url: origin + '/', priority: 1 },
    { url: origin + getProjectsOverviewPath(settings.projectsOverviewSlug), priority: 0.7 },
    ...projects.map((project) => ({
      url:
        origin +
        getInternalLinkHref({ relationTo: 'projects', value: project }, treemapData.legacyRootSlug),
      lastModified: project.updatedAt,
      priority: 0.8,
    })),
    ...pages.docs.map((page) => ({
      url: `${origin}/${encodeURIComponent(page.slug)}`,
      lastModified: page.updatedAt,
      priority: 0.6,
    })),
  ]
}
