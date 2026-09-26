import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getAdminThumbnail } from '../src/collections/Media'
import type { Category, Industry, Project, Media } from '../src/payload-types'
import { getInternalLinkHref } from '../src/lib/menu-links'
import { findTreemapNode, transformDataForTreemap } from '../src/lib/treemap-data'
import { fetchTreemapData } from '../src/lib/transformers'
import { selectMainMenu } from '../src/lib/site-data'
import { GET } from '../src/app/my-route/route'
import type { Payload } from 'payload'

const category = (id: number, extra: Partial<Category> = {}): Category => ({
  id,
  title: `Category ${id}`,
  slug: `category-${id}`,
  createdAt: '',
  updatedAt: '',
  ...extra,
})
const image: Media = { id: 9, url: '/api/media/file/example.jpg', createdAt: '', updatedAt: '' }
const project = (extra: Partial<Project> = {}): Project => ({
  id: 2,
  slug: 'project',
  title: 'Project',
  category: 1,
  createdAt: '',
  updatedAt: '',
  gallery: [{ image, id: 'first' }],
  ...extra,
})

test('numeric and populated category relationships produce the same project tree', () => {
  const categories = [category(1)]
  const numeric = transformDataForTreemap(categories, [project()])
  const populated = transformDataForTreemap(categories, [project({ category: categories[0] })])
  assert.deepEqual(numeric, populated)
  assert.equal(findTreemapNode(numeric, ['category-1', 'project'])?.children?.[0].image, image.url)
})

test('full paths are validated; projects cannot be addressed beneath an unrelated category', () => {
  const tree = transformDataForTreemap([category(1), category(3)], [project()])
  assert.equal(findTreemapNode(tree, ['category-3', 'project']), undefined)
  assert.equal(findTreemapNode(tree, ['garbage', 'project']), undefined)
  assert.equal(findTreemapNode(tree, ['category-1', 'project', 'image-0']), undefined)
})

test('nested categories work and cyclic parents cannot create a circular tree', () => {
  const tree = transformDataForTreemap(
    [category(1), category(3, { parent: 1 })],
    [project({ category: 3 })],
  )
  assert.equal(findTreemapNode(tree, ['category-1', 'category-3', 'project'])?.title, 'Project')
  const cycle = transformDataForTreemap(
    [category(1, { parent: 3 }), category(3, { parent: 1 })],
    [],
  )
  assert.doesNotThrow(() => JSON.stringify(cycle))
  assert.equal(cycle.children?.length, 2)
})

test('missing uploads are skipped and repeated media uploads have distinct tile IDs', () => {
  const tree = transformDataForTreemap(
    [category(1)],
    [project({ gallery: [{ image: 9 }, { image, id: 'a' }, { image, id: 'b' }] })],
  )
  const gallery = tree.children![0].children![0].children!
  assert.equal(gallery.length, 2)
  assert.notEqual(gallery[0].id, gallery[1].id)
  assert.equal(gallery[0].hero, true)
})

test('project thumbnail and hero gallery image remain independent', () => {
  const thumbnail: Media = {
    ...image,
    id: 11,
    url: '/api/media/file/project-thumb.png',
  }
  const secondImage: Media = {
    ...image,
    id: 10,
    url: '/api/media/file/hero.jpg',
    sizes: { thumbnail: { url: '/api/media/file/hero-400.jpg', width: 400, height: 400 } },
  }
  const tree = transformDataForTreemap(
    [category(1)],
    [
      project({
        thumbnail,
        gallery: [
          { image, id: 'first' },
          { image: secondImage, hero: true, id: 'hero' },
        ],
      }),
    ],
  )
  const projectNode = tree.children![0].children![0]
  assert.equal(projectNode.thumb, thumbnail.url)
  assert.deepEqual(
    projectNode.children?.map((item) => item.hero),
    [false, true],
  )
})

test('project story keeps ordered image and text layout controls', () => {
  const content: NonNullable<Project['description']> = {
    root: {
      type: 'root',
      version: 1,
      direction: null,
      format: '',
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', version: 1, text: 'Story copy' }],
        },
      ],
    },
  }
  const tree = transformDataForTreemap(
    [category(1)],
    [
      project({
        heroPresentation: {
          showTitle: true,
          titlePosition: 'bottom-left',
          tintColor: '#112233',
          tintOpacity: 40,
        },
        story: [
          {
            blockType: 'image',
            image,
            width: 'half',
            position: 'right',
          },
          {
            blockType: 'text',
            content,
            width: 'narrow',
            position: 'left',
            textAlign: 'left',
          },
        ],
      }),
    ],
  )
  const projectNode = tree.children![0].children![0]
  assert.equal(projectNode.heroPresentation?.titlePosition, 'bottom-left')
  assert.deepEqual(
    projectNode.story?.map((block) => [block.blockType, block.width, block.position]),
    [
      ['image', 'half', 'right'],
      ['text', 'narrow', 'left'],
    ],
  )
})

test('media admin thumbnail falls back to the original SVG', () => {
  assert.equal(
    getAdminThumbnail({
      doc: {
        sizes: { thumbnail: { url: null } },
        filename: 'logo mark.svg',
      },
    }),
    '/api/media/file/logo%20mark.svg',
  )
  assert.equal(
    getAdminThumbnail({
      doc: {
        sizes: { thumbnail: { url: '/api/media/file/photo-400x400.jpg' } },
        url: '/api/media/file/photo.jpg',
      },
    }),
    '/api/media/file/photo-400x400.jpg',
  )
})

test('Lexical content stays structured rather than being assigned to innerHTML', () => {
  const description: Project['description'] = {
    root: {
      type: 'root',
      version: 1,
      direction: null,
      format: '',
      indent: 0,
      children: [
        {
          type: 'paragraph',
          version: 1,
          children: [{ type: 'text', version: 1, text: '<script>alert(1)</script>' }],
        },
      ],
    },
  }
  const tree = transformDataForTreemap([category(1)], [project({ description })])
  assert.deepEqual(tree.children![0].children![0].desc, description)
})

test('CMS queries disable default pagination and enforce public read access', async () => {
  const calls: Record<string, unknown>[] = []
  const payload = {
    find: async (options: Record<string, unknown>) => {
      calls.push(options)
      return { docs: [] }
    },
    findGlobal: async () => null,
  } as unknown as Payload
  await fetchTreemapData(payload)
  assert.deepEqual(
    calls.map((c) => [c.collection, c.pagination, c.overrideAccess]),
    [
      ['categories', false, false],
      ['projects', false, false],
      ['industries', false, false],
    ],
  )
})

test('the front end selects the menu created as Main in admin', () => {
  const main = {
    id: 1,
    title: 'Main',
    slug: 'main',
    items: [],
    createdAt: '',
    updatedAt: '',
  }
  assert.equal(selectMainMenu([main]), main)
})

test('industry menu links open the industry-filtered portfolio', () => {
  const industry: Industry = {
    id: 3,
    title: 'Financial services',
    slug: 'financial-services',
    createdAt: '',
    updatedAt: '',
  }
  assert.equal(
    getInternalLinkHref({ relationTo: 'industries', value: industry }),
    '/?industry=financial-services',
  )
})

test('sample endpoint no longer exposes users', async () => {
  const response = GET()
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'Not found' })
})

test('imported WORK root opens directly on categories and preserves nested projects', () => {
  const tree = transformDataForTreemap(
    [category(10, { slug: 'root', title: 'WORK' }), category(1, { parent: 10 })],
    [project()],
  )
  assert.equal(tree.legacyRootSlug, 'root')
  assert.equal(tree.children?.[0].slug, 'category-1')
  assert.equal(findTreemapNode(tree, ['category-1', 'project'])?.title, 'Project')
  assert.equal(findTreemapNode(tree, ['root']), undefined)
})
