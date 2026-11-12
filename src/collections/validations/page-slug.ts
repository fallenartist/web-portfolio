import type { TextFieldValidation } from 'payload'
import { occupiedPageSlugs, validatePageSlugFormat } from '@/lib/page-slugs'

export const validateContentPageSlug: TextFieldValidation = async (value, { req }) => {
  const format = validatePageSlugFormat(value)
  if (format !== true) return format
  const [disciplines, projects, settings] = await Promise.all([
    req.payload.find({
      collection: 'disciplines',
      pagination: false,
      depth: 0,
      select: { slug: true, parent: true },
      req,
    }),
    req.payload.find({
      collection: 'projects',
      pagination: false,
      depth: 0,
      select: { slug: true, discipline: true },
      req,
    }),
    // These URL settings are shared across languages. An explicit locale here
    // mutates the shared Payload request and redirects the caller's save locale.
    req.payload.findGlobal({ slug: 'settings', depth: 0, req }),
  ])
  return occupiedPageSlugs(disciplines.docs, projects.docs, settings).has(String(value))
    ? 'This URL is already used by the portfolio or a system route. Choose another slug.'
    : true
}
