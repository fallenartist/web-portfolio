import type { Appearance, Discipline, Media, Project, Setting } from '@/payload-types'
import type { ProjectHero, ProjectStoryBlock, TreemapData } from '@/types'
import { getVideoEmbed } from '@/lib/video-embed'

function media(value: number | Media | null | undefined): Media | undefined {
  return value && typeof value === 'object' ? value : undefined
}

export function transformDataForTreemap(
  disciplines: Discipline[],
  projects: Project[],
  settings: Setting | null = null,
  appearance: Appearance | null = null,
): TreemapData {
  const map = new Map<number, TreemapData>()
  for (const discipline of disciplines) {
    const thumbnail = media(discipline.thumbnail)
    map.set(discipline.id, {
      id: `discipline-${discipline.id}`,
      kind: 'discipline',
      slug: discipline.slug,
      title: discipline.title,
      priority: discipline.priority ?? 100,
      color: discipline.color,
      thumb: thumbnail?.sizes?.thumbnail?.url || thumbnail?.url,
      children: [],
    })
  }
  for (const project of projects) {
    const disciplineID =
      typeof project.discipline === 'object' ? project.discipline.id : project.discipline
    const discipline = map.get(disciplineID)
    if (!discipline) continue
    const children: TreemapData[] = []
    let projectHero: ProjectHero | undefined
    if (project.hero.type === 'video' && project.hero.videoURL) {
      const cover = media(project.hero.videoCover)
      const video = getVideoEmbed(project.hero.videoURL, project.hero)
      if (cover?.url) {
        children.push({
          id: `project-${project.id}-hero`,
          kind: 'image',
          slug: 'hero',
          title: '',
          alt: cover.alt || project.title,
          image: cover.url,
          width: cover.width,
          height: cover.height,
          focalX: cover.focalX,
          focalY: cover.focalY,
          sizes: cover.sizes,
          hero: true,
          priority: 100,
        })
      }
      if (video && cover?.url) {
        projectHero = {
          type: 'video',
          url: video.embedURL,
          provider: video.provider,
          fit: project.hero.videoFit || 'cover',
          autoplay: project.hero.autoplay === true,
          controls: project.hero.controls !== false,
          loop: project.hero.loop === true,
          muted: project.hero.autoplay === true || project.hero.muted === true,
          cover: cover.url,
          coverAlt: cover.alt || project.title,
          coverWidth: cover.width,
          coverHeight: cover.height,
          coverFocalX: cover.focalX,
          coverFocalY: cover.focalY,
          coverSizes: cover.sizes,
        }
      }
    } else {
      const image = media(project.hero.image)
      if (image?.url) {
        children.push({
          id: `project-${project.id}-hero`,
          kind: 'image',
          slug: 'hero',
          title: '',
          alt: image.alt || project.title,
          image: image.url,
          width: image.width,
          height: image.height,
          focalX: image.focalX,
          focalY: image.focalY,
          sizes: image.sizes,
          hero: true,
          priority: 100,
        })
        projectHero = {
          type: 'image',
          image: image.url,
          alt: image.alt || project.title,
          width: image.width,
          height: image.height,
          focalX: image.focalX,
          focalY: image.focalY,
          sizes: image.sizes,
        }
      }
    }
    const story: ProjectStoryBlock[] = []
    for (const [index, block] of (project.story || []).entries()) {
      const id = block.id || `project-${project.id}-story-${index}`
      if (block.blockType === 'text') {
        story.push({
          id,
          blockType: 'text',
          content: block.content,
          quote: block.quote === true,
        })
        continue
      }
      if (block.blockType === 'video') {
        const video = getVideoEmbed(block.url, block)
        if (!video) continue
        const poster = media(block.poster)
        story.push({
          id,
          blockType: 'video',
          url: video.embedURL,
          provider: video.provider,
          autoplay: block.autoplay === true,
          controls: block.controls !== false,
          loop: block.loop === true,
          muted: block.autoplay === true || block.muted === true,
          caption: block.caption || undefined,
          poster: poster?.url || undefined,
          posterAlt: poster?.alt || block.caption || `${project.title} video`,
          posterWidth: poster?.width,
          posterHeight: poster?.height,
          posterSizes: poster?.sizes,
        })
        continue
      }
      const image = media(block.image)
      if (!image?.url) continue
      story.push({
        id,
        blockType: 'image',
        image: image.url,
        alt: image.alt || block.caption || project.title,
        caption: block.caption || undefined,
        imageWidth: image.width,
        imageHeight: image.height,
        sizes: image.sizes,
      })
    }
    discipline.children!.push({
      id: `project-${project.id}`,
      kind: 'project',
      slug: project.slug,
      title: project.title,
      priority: project.priority ?? 100,
      color: discipline.color,
      desc: project.description,
      excerpt: project.excerpt || '',
      thumb: media(project.thumbnail)?.url,
      projectHero,
      story,
      children,
    })
  }
  // Relationships can be numeric IDs or populated documents. Ignore broken/cyclic
  // parents rather than producing a cyclic object that cannot be serialized.
  const parents = new Map(
    disciplines.map((item) => [
      item.id,
      typeof item.parent === 'object' ? item.parent?.id : item.parent,
    ]),
  )
  const roots: TreemapData[] = []
  for (const discipline of disciplines) {
    const node = map.get(discipline.id)!
    const parentID = parents.get(discipline.id)
    const seen = new Set([discipline.id])
    let cursor = parentID
    let cycle = false
    while (cursor != null && map.has(cursor)) {
      if (seen.has(cursor)) {
        cycle = true
        break
      }
      seen.add(cursor)
      cursor = parents.get(cursor)
    }
    if (!cycle && parentID != null && map.has(parentID)) map.get(parentID)!.children!.push(node)
    else roots.push(node)
  }
  // Imported content may already contain the portfolio's root discipline.
  const rootSlug = settings?.rootDisciplineSlug || 'work'
  const wrapper =
    roots.length === 1 && ['root', rootSlug].includes(roots[0].slug) ? roots[0] : undefined
  return {
    id: 'root',
    legacyRootSlug: wrapper?.slug,
    kind: 'root',
    slug: settings?.rootDisciplineSlug || 'work',
    title: settings?.rootDisciplineTitle || 'WORK',
    children: wrapper?.children ?? roots,
    settings: {
      siteTitle: settings?.siteTitle || 'Design Portfolio',
      enableAutoplay: settings?.enableAutoplay !== false,
      autoplayDelay: settings?.autoplayDelay ?? 5000,
      autoplayInterval: settings?.autoplayInterval ?? 3000,
      projectTitle: {
        placement: appearance?.projectTitle?.placement || 'below',
        fontSize: appearance?.projectTitle?.fontSize ?? 112,
        mobileFontSize: appearance?.projectTitle?.mobileFontSize ?? 48,
        dimColor: appearance?.projectTitle?.dimColor || '#000000',
        dimIntensity: appearance?.projectTitle?.dimIntensity ?? 35,
      },
      storyText: {
        width: appearance?.storyText?.width ?? 50,
        fontSize: appearance?.storyText?.fontSize ?? 30,
        quoteFontSize: appearance?.storyText?.quoteFontSize ?? 60,
        textColor: appearance?.storyText?.textColor || '#222222',
      },
      projectDescription: {
        fontFamily: appearance?.projectDescription?.fontFamily || 'October Condensed',
        fontSize: appearance?.projectDescription?.fontSize ?? 30,
        textColor: appearance?.projectDescription?.textColor || '#222222',
      },
    },
  }
}

export function findTreemapNode(root: TreemapData, segments: string[]): TreemapData | undefined {
  let node: TreemapData | undefined = root
  for (const slug of segments)
    node = node?.children?.find((child) => child.slug === slug && child.kind !== 'image')
  return node
}
