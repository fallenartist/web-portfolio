import type { HierarchyRectangularNode } from 'd3'
import type { Media, Project } from '@/payload-types'

export type ProjectStoryBlock =
  | {
      id: string
      blockType: 'image'
      image: string
      alt: string
      width: 'full' | 'wide' | 'half'
      position: 'left' | 'center' | 'right'
      caption?: string
      imageWidth?: number | null
      imageHeight?: number | null
      sizes?: Media['sizes']
    }
  | {
      id: string
      blockType: 'text'
      content: NonNullable<Project['description']>
      width: 'narrow' | 'medium' | 'wide'
      position: 'left' | 'center' | 'right'
      textAlign: 'left' | 'center' | 'right'
    }

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
  width?: number | null
  height?: number | null
  alt?: string
  desc?: Project['description']
  excerpt?: string
  heroPresentation?: Project['heroPresentation']
  story?: ProjectStoryBlock[]
  hero?: boolean
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
