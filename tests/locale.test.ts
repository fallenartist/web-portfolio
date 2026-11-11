import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextRequest } from 'next/server'
import { unstable_doesMiddlewareMatch } from 'next/experimental/testing/server'
import {
  availableLocales,
  languageSwitchURL,
  LOCALE_COOKIE,
  resolveLocale,
} from '../src/lib/locale'
import { config, proxy } from '../src/proxy'
import { stableSlug } from '../src/fields/stable-slug'

test('translating a title preserves its shared URL and new Polish titles produce usable slugs', async () => {
  assert.equal(
    await stableSlug({
      data: { title: 'Nowy tytuł' },
      originalDoc: { slug: 'original-project' },
    } as never),
    'original-project',
  )
  assert.equal(
    await stableSlug({
      value: 'chosen-url',
      data: { title: 'Nowy tytuł' },
      originalDoc: { slug: 'original-project' },
    } as never),
    'chosen-url',
  )
  assert.equal(
    await stableSlug({ data: { title: 'Łódź — Żółty projekt' } } as never),
    'lodz-zolty-projekt',
  )
})

test('language detection respects saved choices, regional tags and browser priorities', () => {
  assert.equal(resolveLocale('en', 'pl-PL,pl;q=0.9,en;q=0.8'), 'en')
  assert.equal(resolveLocale('pl', 'en-GB'), 'pl')
  assert.equal(resolveLocale(null, 'pl-PL,pl;q=0.9,en;q=0.8'), 'pl')
  assert.equal(resolveLocale(null, 'en;q=0.2,pl;q=0.9'), 'pl')
  assert.equal(resolveLocale(null, 'de-DE,pl;q=0.7,en;q=0.5'), 'pl')
  assert.equal(resolveLocale(null, 'pl;q=0,en;q=0.5'), 'en')
  assert.equal(resolveLocale('invalid', 'en-GB,pl;q=0.9'), 'en')
  assert.equal(resolveLocale(null, 'fr-FR,*;q=0.5'), 'en')
  assert.equal(resolveLocale(null, 'pl;q=garbage,en;q=0.5'), 'en')
  assert.equal(resolveLocale(), 'en')
})

test('language switching preserves the current project, filters and fragment', () => {
  const url = languageSwitchURL(
    'https://example.com/design/project?tag=identity&lang=en#story',
    'pl',
  )
  assert.equal(url.pathname, '/design/project')
  assert.equal(url.searchParams.get('tag'), 'identity')
  assert.deepEqual(url.searchParams.getAll('lang'), ['pl'])
  assert.equal(url.hash, '#story')
})

test('unreleased Polish is excluded from saved preferences and browser detection', () => {
  assert.deepEqual(availableLocales(), ['en'])
  assert.deepEqual(availableLocales({ polishEnabled: false }), ['en'])
  assert.deepEqual(availableLocales({ polishEnabled: true }), ['en', 'pl'])
  assert.equal(resolveLocale('pl', 'pl-PL,pl;q=0.9', ['en']), 'en')
  assert.equal(resolveLocale(null, 'pl-PL,pl;q=0.9', ['en']), 'en')
  assert.equal(resolveLocale('pl', 'en', ['en', 'pl']), 'pl')
})

test('explicit language links store the choice and return to the unchanged public URL', () => {
  const response = proxy(
    new NextRequest('https://example.com/projects/tag/identity?lang=pl&tag=identity', {
      headers: { cookie: `${LOCALE_COOKIE}=en` },
    }),
  )
  assert.equal(response.status, 307)
  assert.equal(
    response.headers.get('location'),
    'https://example.com/projects/tag/identity?tag=identity',
  )
  const cookie = response.cookies.get(LOCALE_COOKIE)
  assert.equal(cookie?.value, 'pl')
  assert.equal(cookie?.path, '/')
  assert.equal(cookie?.httpOnly, true)
  assert.equal(cookie?.secure, true)
  assert.equal(cookie?.sameSite, 'lax')
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(proxy(new NextRequest('https://example.com/?lang=de')).headers.get('location'), null)
  assert.equal(
    proxy(new NextRequest('https://example.com/?lang=pl', { method: 'POST' })).headers.get(
      'location',
    ),
    null,
  )
})

test('language selection leaves admin, APIs and assets alone', () => {
  for (const path of [
    '/admin',
    '/admin/collections/projects/1',
    '/api/projects',
    '/api/media/file/test.jpg',
    '/_next/static/test.js',
    '/favicon.ico',
    '/image.svg',
  ]) {
    assert.equal(
      unstable_doesMiddlewareMatch({ config, url: `https://example.com${path}?lang=pl` }),
      true,
      path,
    )
    assert.equal(
      proxy(new NextRequest(`https://example.com${path}?lang=pl`)).headers.get('location'),
      null,
    )
  }
  for (const path of ['/', '/projects', '/design/project', '/api-design', '/administration']) {
    assert.equal(
      unstable_doesMiddlewareMatch({ config, url: `https://example.com${path}?lang=pl` }),
      true,
      path,
    )
  }
})
