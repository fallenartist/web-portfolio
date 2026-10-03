import type { HierarchyRectangularNode } from 'd3'
import type { Media, Project } from '@/payload-types'

export type ProjectStoryBlock =
  | {
      id: string
      blockType: 'image'
      image: string
      alt: string
      caption?: string
      imageWidth?: number | null
      imageHeight?: number | null
      sizes?: Media['sizes']
    }
  | {
      id: string
      blockType: 'video'
      url: string
      provider: 'vimeo'
      autoplay: boolean
      controls: boolean
      loop: boolean
      muted: boolean
      caption?: string
      poster?: string
      posterAlt?: string
      posterWidth?: number | null
      posterHeight?: number | null
      posterSizes?: Media['sizes']
    }
  | {
      id: string
      blockType: 'text'
      content: NonNullable<Project['description']>
      quote: boolean
    }

export type ProjectHero =
  | {
      type: 'image'
      image: string
      alt: string
      width?: number | null
      height?: number | null
      sizes?: Media['sizes']
    }
  | {
      type: 'video'
      url: string
      provider: 'vimeo'
      fit: 'cover' | 'contain'
      autoplay: boolean
      controls: boolean
      loop: boolean
      muted: boolean
      cover: string
      coverAlt: string
      coverWidth?: number | null
      coverHeight?: number | null
      coverSizes?: Media['sizes']
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
  projectHero?: ProjectHero
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
    projectTitle: {
      placement: 'below' | 'overlay'
      fontSize: number
      mobileFontSize: number
      dimColor: string
      dimIntensity: number
    }
    storyText: {
      width: number
      fontSize: number
      quoteFontSize: number
      textColor: string
    }
    projectDescription: {
      fontFamily: string
      fontSize: number
      textColor: string
    }
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
