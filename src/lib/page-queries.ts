import type { Payload } from 'payload'
import type { Locale } from '@/lib/locale'
import { validatePageSlugFormat } from '@/lib/page-slugs'

export async function findPublishedPage(
  payload: Pick<Payload, 'find'>,
  slug: string,
  locale: Locale,
) {
  if (validatePageSlugFormat(slug) !== true) return null
  const { docs } = await payload.find({
    collection: 'pages',
    where: { and: [{ slug: { equals: slug } }, { _status: { equals: 'published' } }] },
    locale,
    fallbackLocale: 'en',
    depth: 4,
    limit: 1,
    overrideAccess: false,
    draft: false,
  })
  return docs[0] || null
}
