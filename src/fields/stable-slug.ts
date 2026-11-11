import type { FieldHook } from 'payload'

// Translation updates may contain only a title. Keep the shared URL intact.
export const stableSlug: FieldHook = ({ value, originalDoc, data }) => {
  if (value) return value
  if (originalDoc?.slug) return originalDoc.slug
  if (typeof data?.title !== 'string') return value
  return data.title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/ł/g, 'l')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]+/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
}
