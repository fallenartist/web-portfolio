import type { Media } from '@/payload-types'

type MediaSize = NonNullable<Media['sizes']>[keyof NonNullable<Media['sizes']>]

export function hasOriginalAspectRatio(
  size: MediaSize,
  originalWidth?: null | number,
  originalHeight?: null | number,
) {
  if (!size?.width || !size.height || !originalWidth || !originalHeight) return true

  const originalRatio = originalWidth / originalHeight
  const sizeRatio = size.width / size.height
  return Math.abs(sizeRatio - originalRatio) / originalRatio <= 0.02
}

export function proportionalMediaSize(
  sizes: Media['sizes'],
  originalWidth?: null | number,
  originalHeight?: null | number,
) {
  for (const name of ['large', 'medium', 'small'] as const) {
    const size = sizes?.[name]
    if (size?.url && hasOriginalAspectRatio(size, originalWidth, originalHeight)) return size
  }

  return undefined
}
