import assert from 'node:assert/strict'
import test from 'node:test'

import type { Agency, Client, Discipline, Industry, Project, Tag } from '../src/payload-types'
import { buildTangledTreeData } from '../src/lib/tangled-tree-data'
import { constructTangledTreeLayout, tangledLinkPath } from '../src/lib/tangled-tree-layout'

const now = new Date().toISOString()
const root = {
  id: 1,
  title: 'Work',
  slug: 'work',
  updatedAt: now,
  createdAt: now,
} as Discipline
const discipline = {
  id: 2,
  title: 'Identity',
  slug: 'identity',
  color: '#ff2200',
  parent: root,
  updatedAt: now,
  createdAt: now,
} as Discipline
const client = {
  id: 3,
  title: 'Acme',
  slug: 'acme',
  updatedAt: now,
  createdAt: now,
} as Client
const agency = {
  id: 4,
  title: 'Studio One',
  slug: 'studio-one',
  updatedAt: now,
  createdAt: now,
} as Agency
const industry = {
  id: 5,
  title: 'Transport',
  slug: 'transport',
  color: '#0044cc',
  updatedAt: now,
  createdAt: now,
} as Industry
const tag = {
  id: 6,
  title: 'Wayfinding',
  slug: 'wayfinding',
  updatedAt: now,
  createdAt: now,
} as Tag

const project = (id: number, title: string): Project =>
  ({
    id,
    title,
    slug: title.toLowerCase().replaceAll(' ', '-'),
    discipline,
    client,
    agency,
    industry,
    tags: [tag],
    hero: { type: 'image' },
    updatedAt: now,
    createdAt: now,
  }) as Project

test('tangled tree data exposes every project relationship as an interactive node', () => {
  const data = buildTangledTreeData(
    [root, discipline],
    [project(10, 'Project A'), project(11, 'Project B')],
    'work',
  )

  assert.deepEqual(
    data.levels.map((level) => level.map((node) => node.kind)),
    [['discipline'], ['project', 'project'], ['industry', 'client', 'agency', 'tag']],
  )
  assert.equal(data.levels[0][0].href, '/identity')
  assert.equal(data.levels[0][0].slug, 'identity')
  assert.equal(data.levels[1][0].href, '/identity/project-a')
  assert.equal(data.levels[1][0].slug, 'project-a')
  assert.equal(data.levels[2].find((node) => node.kind === 'agency')?.href, '/?agency=studio-one')
  assert.deepEqual(data.levels[2].find((node) => node.kind === 'tag')?.parentIds, [
    'project-10',
    'project-11',
  ])
})

test('tangled layout reuses shared trunks and produces rounded orthogonal paths', () => {
  const data = buildTangledTreeData(
    [root, discipline],
    [project(10, 'Project A'), project(11, 'Project B')],
    'work',
  )
  const layout = constructTangledTreeLayout(data.levels, {
    targetWidth: 320,
    minimumNodeWidth: 70,
    bundleWidth: 2.5,
    nodeHeight: 44,
    nodeMarkerWidth: 14,
  })
  const disciplineLinks = layout.links.filter((link) => link.target.id === 'discipline-2')
  const tagLinks = layout.links.filter((link) => link.source.id === 'tag-6')

  assert.equal(disciplineLinks.length, 2)
  assert.equal(new Set(disciplineLinks.map((link) => link.xb)).size, 1)
  assert.equal(tagLinks.length, 2)
  assert.equal(new Set(tagLinks.map((link) => link.xb)).size, 1)
  assert.equal(disciplineLinks[0].xt, disciplineLinks[0].target.x + 7)
  assert.equal(tagLinks[0].xs, tagLinks[0].source.x - 7)
  assert.match(tangledLinkPath(tagLinks[0]), /^M.+L.+A.+L.+A.+L/)
  assert.equal(layout.width, 320)
  assert.ok(layout.nodes.every((node) => node.x >= 0 && node.x <= layout.width))
  assert.ok(layout.nodes.every((node) => node.height === 0))

  const layoutWithUniqueTrunk = constructTangledTreeLayout(
    [
      data.levels[0],
      data.levels[1],
      [
        ...data.levels[2],
        {
          id: 'tag-unique',
          slug: 'unique',
          title: 'Unique tag',
          kind: 'tag',
          href: '/?tag=unique',
          color: '#555555',
          parentIds: ['project-10'],
        },
      ],
    ],
    { nodeHeight: 44 },
  )
  assert.ok(layoutWithUniqueTrunk.nodes.find((node) => node.id === 'project-10')!.height > 0)
  assert.equal(layoutWithUniqueTrunk.nodes.find((node) => node.id === 'project-11')!.height, 0)
})
