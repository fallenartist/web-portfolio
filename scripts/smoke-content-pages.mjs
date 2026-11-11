// Read-only local checks: no page, menu, user or version records are created.
import assert from 'node:assert/strict'
import { createLocalReq, getPayload, jwtSign } from 'payload'

const base = new URL(process.argv[2] || 'http://127.0.0.1:3104')
const database = new URL(process.env.DATABASE_URI)
if (![base.hostname, database.hostname].every((host) => ['127.0.0.1', 'localhost'].includes(host)))
  throw new Error('Local preview and database required')
const { default: config } = await import('../src/payload.config.ts')
const { validateContentPageSlug } = await import('../src/collections/Pages.ts')
const payload = await getPayload({ config })
const fetchLocal = (input, options) =>
  fetch(input, { ...options, signal: AbortSignal.timeout(30_000) })
try {
  const contentField = payload.collections.pages.config.fields.find(
    (field) => field.name === 'content',
  )
  const textField = contentField.blocks
    .find((block) => block.slug === 'pageText')
    .fields.find((field) => field.name === 'text')
  const uploadFeature = textField.editor.editorConfig.resolvedFeatureMap.get('upload')
  assert.deepEqual(uploadFeature.sanitizedServerFeatureProps.enabledCollectionSlugs, ['media'])
  const placement = uploadFeature.sanitizedServerFeatureProps.collections.media.fields.find(
    (field) => field.name === 'placement',
  )
  assert.deepEqual(
    placement.options.map((option) => option.value),
    ['full', 'left', 'right'],
  )
  const before = await payload.count({ collection: 'pages' })
  const publicResponse = await fetchLocal(new URL('/api/pages?limit=100&depth=0', base))
  assert.equal(publicResponse.status, 200)
  const publicPages = await publicResponse.json()
  assert.ok(publicPages.docs.every((page) => page._status === 'published'))
  const write = await fetchLocal(new URL('/api/pages', base), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  assert.ok([401, 403].includes(write.status))
  const missing = await fetchLocal(new URL(`/missing-page-${Date.now()}`, base))
  assert.equal(missing.status, 404)
  for (const page of publicPages.docs.slice(0, 3)) {
    const response = await fetchLocal(new URL(`/${encodeURIComponent(page.slug)}`, base))
    assert.equal(response.status, 200)
    const html = await response.text()
    assert.ok(
      html.includes('id="content-page"'),
      'Published pages must use the standalone page layout',
    )
    assert.ok(html.includes('--story-text-size:'), 'Pages must share the Projects body typography')
    const article = html.split('id="content-page"')[1]?.split('</article>')[0] || ''
    assert.equal(
      /<article\b[^>]*>\s*<header\b/.test(article),
      page.showTitle !== false,
      'Automatic page heading must respect the per-page title setting',
    )
    const images = [...article.matchAll(/<img\b[^>]*>/g)].map(([tag]) => tag)
    if (images.length) {
      assert.ok(images[0].includes('loading="eager"'), 'The first page image must load eagerly')
      assert.ok(
        images.slice(1).every((tag) => tag.includes('loading="lazy"')),
        'Later page images must retain lazy loading',
      )
    }
  }

  const { docs: users } = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    showHiddenFields: true,
  })
  const user = users[0]
  const sid = user?.sessions?.[0]?.id
  assert.ok(
    user && (!payload.collections.users.config.auth.useSessions || sid),
    'An existing admin session is required',
  )
  const { token } = await jwtSign({
    fieldsToSign: { id: user.id, collection: 'users', ...(sid ? { sid } : {}) },
    secret: payload.secret,
    tokenExpiration: 120,
  })
  const headers = { cookie: `payload-token=${token}` }
  const dashboard = await fetchLocal(new URL('/admin', base), { headers })
  assert.equal(dashboard.status, 200)
  const html = await dashboard.text()
  const navPages = html.indexOf('id="nav-pages"')
  const navProjects = html.indexOf('id="nav-projects"')
  assert.ok(navPages >= 0 && navPages < navProjects, 'Pages must be first in Content navigation')
  const cardPages = html.indexOf('id="card-pages"')
  const cardProjects = html.indexOf('id="card-projects"')
  assert.ok(cardPages >= 0 && cardPages < cardProjects, 'Pages must be first among Content cards')
  for (const path of ['/admin/collections/pages', '/admin/collections/pages/create']) {
    const response = await fetchLocal(new URL(path, base), { headers })
    assert.equal(response.status, 200, path)
    if (path.endsWith('/create')) {
      const editor = await response.text()
      assert.ok(
        editor.includes('.page-body-editor{--story-text-min-size:'),
        'The page editor must receive the site body typography settings',
      )
    }
  }
  const req = await createLocalReq({ user }, payload)
  assert.notEqual(await validateContentPageSlug('admin', { req }), true)
  assert.equal(await validateContentPageSlug(`page-check-${Date.now()}`, { req }), true)
  assert.equal((await payload.count({ collection: 'pages' })).totalDocs, before.totalDocs)
  console.log(
    `Pages API, draft access, admin ordering, create form, inline image settings, image loading and slug checks passed. Existing pages: ${before.totalDocs}; none created.`,
  )
} finally {
  await payload.destroy()
}
process.exit(0)
