import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Category, Project, Media } from '../src/payload-types'
import { findTreemapNode, transformDataForTreemap } from '../src/lib/treemap-data'
import { fetchTreemapData } from '../src/lib/transformers'
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
    ],
  )
})

test('sample endpoint no longer exposes users', async () => {
  const response = GET()
  assert.equal(response.status, 404)
  assert.deepEqual(await response.json(), { error: 'Not found' })
})
