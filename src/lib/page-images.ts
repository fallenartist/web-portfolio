import type { Media, Page } from '@/payload-types'

export function populatedPageImage(value: unknown): Media | null {
  return value && typeof value === 'object' && 'id' in value && 'url' in value
    ? (value as Media)
    : null
}

function firstTextImage(value: unknown): Media | null {
  if (!value || typeof value !== 'object') return null
  if (
    'type' in value &&
    value.type === 'upload' &&
    'relationTo' in value &&
    value.relationTo === 'media' &&
    'value' in value
  ) {
    const image = populatedPageImage(value.value)
    if (image?.url) return image
  }
  if ('children' in value && Array.isArray(value.children)) {
    for (const child of value.children) {
      const image = firstTextImage(child)
      if (image) return image
    }
  }
  return null
}

// Resolve in authored order across standalone images and images inside text.
export function firstPageImage(content: Page['content']): Media | null {
  for (const block of content || []) {
    const image =
      block.blockType === 'pageImage'
        ? populatedPageImage(block.image)
        : block.blockType === 'pageText'
          ? firstTextImage(block.text.root)
          : null
    if (image?.url) return image
  }
  return null
}
