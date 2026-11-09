import type { Media } from '@/payload-types'

type MediaSize = NonNullable<Media['sizes']>[keyof NonNullable<Media['sizes']>]

function focalCoordinate(value?: null | number) {
  return Math.min(100, Math.max(0, value ?? 50))
}

export function mediaFocalPosition(focalX?: null | number, focalY?: null | number) {
  return `${focalCoordinate(focalX)}% ${focalCoordinate(focalY)}%`
}

export function coverMediaRect(
  containerWidth: number,
  containerHeight: number,
  mediaWidth?: null | number,
  mediaHeight?: null | number,
  focalX?: null | number,
  focalY?: null | number,
) {
  if (!mediaWidth || !mediaHeight || containerWidth <= 0 || containerHeight <= 0) {
    return { x: 0, y: 0, width: containerWidth, height: containerHeight }
  }

  const scale = Math.max(containerWidth / mediaWidth, containerHeight / mediaHeight)
  const width = mediaWidth * scale
  const height = mediaHeight * scale

  return {
    x: (containerWidth - width) * (focalCoordinate(focalX) / 100),
    y: (containerHeight - height) * (focalCoordinate(focalY) / 100),
    width,
    height,
  }
}

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
