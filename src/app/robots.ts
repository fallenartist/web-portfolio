import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

export default function robots(): MetadataRoute.Robots {
  if (process.env.PREVIEW_PASSWORD) return { rules: { userAgent: '*', disallow: '/' } }
  const origin = process.env.SITE_URL || 'https://lenart.pl'
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin/', '/api/'] },
    sitemap: `${origin}/sitemap.xml`,
  }
}
