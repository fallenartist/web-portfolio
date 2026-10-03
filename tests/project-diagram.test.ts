import assert from 'node:assert/strict'
import test from 'node:test'

import type { Category, Client, Industry, Project } from '../src/payload-types'
import { buildProjectDiagramData } from '../src/lib/project-diagram'

const now = new Date().toISOString()
const root = {
  id: 1,
  title: 'Work',
  slug: 'work',
  color: '#000000',
  updatedAt: now,
  createdAt: now,
} as Category
const category = {
  id: 2,
  title: 'Branding',
  slug: 'branding',
  color: '#FF0000',
  parent: root,
  updatedAt: now,
  createdAt: now,
} as Category
const industry = {
  id: 3,
  title: 'Technology',
  slug: 'technology',
  color: '#0000FF',
  updatedAt: now,
  createdAt: now,
} as Industry
const client = {
  id: 4,
  title: 'Acme',
  slug: 'acme',
  updatedAt: now,
  createdAt: now,
} as Client

test('project diagram retains colours, client groups, and portfolio links', () => {
  const project = {
    id: 5,
    title: 'Identity',
    slug: 'identity',
    category,
    industry,
    client,
    hero: { type: 'image' },
    updatedAt: now,
    createdAt: now,
  } as Project
  const data = buildProjectDiagramData([root, category], [project], [industry], 'work')

  assert.deepEqual(data.categories[0], {
    id: 'category-2',
    title: 'Branding',
    color: '#FF0000',
    href: '/branding',
  })
  assert.deepEqual(data.industries[0], {
    id: 'industry-3',
    title: 'Technology',
    color: '#0000FF',
  })
  assert.deepEqual(data.projects[0], {
    id: 'project-5',
    title: 'Identity',
    href: '/branding/identity',
    categoryId: 'category-2',
    industryId: 'industry-3',
    clientId: 'client-4',
    clientTitle: 'Acme',
  })
})
