import type { TreemapData } from '@/types'
import { hasOriginalAspectRatio } from '@/lib/media-image'

export function treemapImageSource(
  node: TreemapData,
  width: number,
  height: number,
  pixelRatio = 1,
  preserveAspectRatio = false,
) {
  const target = Math.max(width, height) * pixelRatio
  for (const name of ['thumbnail', 'small', 'medium', 'large'] as const) {
    const image = node.sizes?.[name]
    if (
      image?.url &&
      (!preserveAspectRatio || hasOriginalAspectRatio(image, node.width, node.height)) &&
      Math.max(image.width || 0, image.height || 0) >= target
    )
      return image.url
  }
  return node.image || null
}
