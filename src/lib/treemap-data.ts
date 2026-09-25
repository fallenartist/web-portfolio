import type { Category, Media, Project, Setting } from '@/payload-types'
import type { TreemapData } from '@/types'

function media(value: number | Media | null | undefined): Media | undefined {
  return value && typeof value === 'object' ? value : undefined
}

export function transformDataForTreemap(
  categories: Category[],
  projects: Project[],
  settings: Setting | null = null,
): TreemapData {
  const map = new Map<number, TreemapData>()
  for (const category of categories) {
    const thumbnail = media(category.thumbnail)
    map.set(category.id, {
      id: `category-${category.id}`,
      kind: 'category',
      slug: category.slug,
      title: category.title,
      priority: category.priority ?? 100,
      color: category.color,
      thumb: thumbnail?.sizes?.thumbnail?.url || thumbnail?.url,
      children: [],
    })
  }
  for (const project of projects) {
    const categoryID = typeof project.category === 'object' ? project.category.id : project.category
    const category = map.get(categoryID)
    if (!category) continue
    const children: TreemapData[] = []
    const gallery = project.gallery ?? []
    for (const [index, item] of gallery.entries()) {
      const image = media(item.image)
      if (!image?.url) continue
      children.push({
        id: `project-${project.id}-image-${item.id || index}`,
        kind: 'image',
        slug: `image-${index}`,
        title: item.title || '',
        alt: image.alt || item.title || project.title,
        image: image.url,
        width: image.width,
        height: image.height,
        sizes: image.sizes,
        hero: item.hero === true,
        featured: item.featured ?? false,
        priority: 100,
      })
    }
    let hero = children.find((item) => item.hero)
    if (!hero && children[0]) {
      hero = children[0]
      hero.hero = true
    }
    category.children!.push({
      id: `project-${project.id}`,
      kind: 'project',
      slug: project.slug,
      title: project.title,
      priority: project.priority ?? 100,
      desc: project.description,
      excerpt: project.excerpt || '',
      thumb:
        hero?.sizes?.thumbnail?.url ||
        hero?.sizes?.small?.url ||
        hero?.image ||
        media(project.thumbnail)?.url,
      children,
    })
  }
  // Relationships can be numeric IDs or populated documents. Ignore broken/cyclic
  // parents rather than producing a cyclic object that cannot be serialized.
  const parents = new Map(
    categories.map((c) => [c.id, typeof c.parent === 'object' ? c.parent?.id : c.parent]),
  )
  const roots: TreemapData[] = []
  for (const category of categories) {
    const node = map.get(category.id)!
    const parentID = parents.get(category.id)
    const seen = new Set([category.id])
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
  // Imported content may already contain the portfolio's root category.
  const rootSlug = settings?.rootCategorySlug || 'work'
  const wrapper =
    roots.length === 1 && ['root', rootSlug].includes(roots[0].slug) ? roots[0] : undefined
  return {
    id: 'root',
    legacyRootSlug: wrapper?.slug,
    kind: 'root',
    slug: settings?.rootCategorySlug || 'work',
    title: settings?.rootCategoryTitle || 'WORK',
    children: wrapper?.children ?? roots,
    settings: {
      siteTitle: settings?.siteTitle || 'Design Portfolio',
      enableAutoplay: settings?.enableAutoplay !== false,
      autoplayDelay: settings?.autoplayDelay ?? 5000,
      autoplayInterval: settings?.autoplayInterval ?? 3000,
    },
  }
}

export function findTreemapNode(root: TreemapData, segments: string[]): TreemapData | undefined {
  let node: TreemapData | undefined = root
  for (const slug of segments)
    node = node?.children?.find((child) => child.slug === slug && child.kind !== 'image')
  return node
}
