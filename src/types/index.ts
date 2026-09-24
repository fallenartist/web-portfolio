import type { HierarchyRectangularNode } from 'd3'
import type { Media, Project } from '@/payload-types'

export interface TreemapData {
  id: string
  slug: string
  title: string
  kind: 'root' | 'category' | 'project' | 'image'
  legacyRootSlug?: string
  priority?: number
  color?: string | null
  thumb?: string | null
  image?: string
  alt?: string
  desc?: Project['description']
  excerpt?: string
  featured?: boolean
  sizes?: Media['sizes']
  children?: TreemapData[]
  settings?: {
    enableAutoplay: boolean
    autoplayDelay: number
    autoplayInterval: number
    siteTitle: string
  }
}
export type TreemapNode = HierarchyRectangularNode<TreemapData>
export interface BreadcrumbItem {
  data: { title: string }
  path: string
}
export interface LightboxImage {
  data: { id: string; title?: string; image: string; alt?: string }
}
export interface LightboxOptions {
  containerSelector?: string
  imagePathPrefix?: string
  transitionDuration?: number
  dragThreshold?: number
  preloadImages?: boolean
  doubleTapDelay?: number
  minZoom?: number
  maxZoom?: number
}
export interface LightboxInterface {
  open: (clickedImage: LightboxImage, allImages: LightboxImage[]) => void
  close: () => void
  next: () => void
  prev: () => void
  setImages: (images: LightboxImage[]) => void
  destroy: () => void
}
