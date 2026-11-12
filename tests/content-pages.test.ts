import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Payload } from 'payload'
import type { Menu, Page } from '../src/payload-types'
import { editPages, readPublishedPages } from '../src/collections/access/pages'
import { occupiedPageSlugs, validatePageSlugFormat } from '../src/lib/page-slugs'
import { findPublishedPage } from '../src/lib/page-queries'
import { getInternalLinkHref, visiblePageMenu } from '../src/lib/menu-links'
import { validateContentPageSlug } from '../src/collections/validations/page-slug'

test('page URL validation preserves the language of the active save request', async () => {
  const req = {
    locale: 'pl',
    payload: {
      find: async () => ({ docs: [] }),
      findGlobal: async (options: { locale?: string }) => {
        // Payload's Local API applies an explicit locale to the same request.
        if (options.locale) req.locale = options.locale
        return { rootDisciplineSlug: 'work', projectsOverviewSlug: 'map' }
      },
    },
  }
  assert.equal(await validateContentPageSlug('about', { req } as never), true)
  assert.equal(req.locale, 'pl')
})

test('page URLs avoid system routes and the visible portfolio hierarchy', () => {
  const reserved = occupiedPageSlugs(
    [
      { id: 1, slug: 'work' },
      { id: 2, slug: 'design', parent: 1 },
      { id: 3, slug: 'branding', parent: 2 },
    ],
    [
      { slug: 'direct-project', discipline: 1 },
      { slug: 'nested-project', discipline: 2 },
    ],
    { rootDisciplineSlug: 'work', projectsOverviewSlug: 'project-map' },
  )
  for (const slug of [
    'admin',
    'api',
    'projects',
    'my-route',
    'project-map',
    'work',
    'design',
    'direct-project',
  ])
    assert.equal(reserved.has(slug), true)
  for (const slug of ['about-me', 'branding', 'nested-project'])
    assert.equal(reserved.has(slug), false)
  assert.equal(
    occupiedPageSlugs(
      [
        { id: 1, slug: 'design' },
        { id: 2, slug: 'art' },
      ],
      [],
      {},
    ).has('art'),
    true,
  )
  assert.equal(validatePageSlugFormat('about-me'), true)
  for (const slug of ['', 'About me', '../about', 'about/me', '//other.example', 'about?lang=pl'])
    assert.notEqual(validatePageSlugFormat(slug), true)
})

test('public page access only admits published content and writes require authentication', async () => {
  assert.deepEqual(await readPublishedPages({ req: { user: null } } as never), {
    _status: { equals: 'published' },
  })
  assert.equal(await readPublishedPages({ req: { user: { id: 1 } } } as never), true)
  assert.equal(await editPages({ req: { user: null } } as never), false)
  assert.equal(await editPages({ req: { user: { id: 1 } } } as never), true)
})

test('page lookup enforces publication, public access and the selected language with English fallback', async () => {
  const page = { id: 1, title: 'O mnie', slug: 'about-me' }
  let calls = 0
  const payload = {
    find: async (options: unknown) => {
      calls++
      assert.deepEqual(options, {
        collection: 'pages',
        where: { and: [{ slug: { equals: 'about-me' } }, { _status: { equals: 'published' } }] },
        locale: 'pl',
        fallbackLocale: 'en',
        depth: 4,
        limit: 1,
        overrideAccess: false,
        draft: false,
      })
      return { docs: [page] }
    },
  } as unknown as Pick<Payload, 'find'>
  assert.equal(await findPublishedPage(payload, 'about-me', 'pl'), page)
  assert.equal(await findPublishedPage(payload, '../about', 'pl'), null)
  assert.equal(calls, 1)
  assert.equal(
    await findPublishedPage(
      { find: async () => ({ docs: [] }) } as unknown as Pick<Payload, 'find'>,
      'missing',
      'en',
    ),
    null,
  )
})

test('published pages work in menus and draft or unresolved page links are hidden at both levels', () => {
  const published: Page = {
    id: 1,
    title: 'About me',
    showTitle: false,
    slug: 'about-me',
    _status: 'published',
    createdAt: '',
    updatedAt: '',
  }
  const link = { relationTo: 'pages' as const, value: published }
  assert.equal(getInternalLinkHref(link, 'work'), '/about-me')
  const items: NonNullable<Menu['items']> = [
    { title: 'About', type: 'internal', internalLink: link },
    {
      title: 'Draft',
      type: 'internal',
      internalLink: { relationTo: 'pages', value: { ...published, id: 2, _status: 'draft' } },
    },
    { title: 'Missing', type: 'internal', internalLink: { relationTo: 'pages', value: 99 } },
    {
      title: 'Information',
      type: 'group',
      subItems: [
        { title: 'About', type: 'internal', internalLink: link },
        { title: 'Missing', type: 'internal', internalLink: { relationTo: 'pages', value: 99 } },
        { title: 'External', type: 'external', externalLink: 'https://example.com' },
      ],
    },
  ]
  const menu: Menu = { id: 1, title: 'Main', slug: 'main', items, createdAt: '', updatedAt: '' }
  const visible = visiblePageMenu(menu)
  assert.deepEqual(
    visible?.items?.map((item) => item.title),
    ['About', 'Information'],
  )
  assert.deepEqual(
    visible?.items?.[1].subItems?.map((item) => item.title),
    ['About', 'External'],
  )
  assert.equal(menu.items?.length, 4)
  assert.equal(visiblePageMenu(null), null)
})
