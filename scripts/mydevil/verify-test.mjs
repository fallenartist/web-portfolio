// Checks only the isolated preview. The temporary media record is always removed.
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import { getPayload, jwtSign } from 'payload'

const database = new URL(process.env.DATABASE_URI)
assert.equal(database.hostname, 'pgsql44.mydevil.net')
assert.equal(database.pathname, '/p1105_lenart_pl')
assert.ok(process.env.PREVIEW_PASSWORD)
const { default: config } = await import('../../src/payload.config.ts')
const payload = await getPayload({ config })
let testMediaID
try {
  const before = (await payload.count({ collection: 'media' })).totalDocs
  const image = await sharp({
    create: { width: 1800, height: 1200, channels: 3, background: 'white' },
  })
    .jpeg()
    .toBuffer()
  const media = await payload.create({
    collection: 'media',
    data: { alt: 'Temporary deployment verification image' },
    file: {
      data: image,
      mimetype: 'image/jpeg',
      name: `deployment-check-${Date.now()}.jpg`,
      size: image.length,
    },
  })
  testMediaID = media.id
  assert.equal(media.width, 1800)
  assert.equal(media.sizes?.small?.width, 800)
  assert.equal(media.sizes?.medium?.width, 1600)
  assert.ok(existsSync(path.join(process.cwd(), 'public/media', media.filename)))

  const base = 'https://test.lenart.pl'
  const authorization = `Basic ${Buffer.from(`${process.env.PREVIEW_USERNAME || 'preview'}:${process.env.PREVIEW_PASSWORD}`).toString('base64')}`
  for (const pathname of ['/', '/admin', '/api/pages', '/projects', media.url]) {
    const denied = await fetch(new URL(pathname, base), {
      redirect: 'manual',
      signal: AbortSignal.timeout(60000),
    })
    assert.equal(denied.status, 401, `Preview gate: ${pathname}`)
  }
  for (const pathname of ['/', '/admin/login', '/api/pages', '/projects', media.url]) {
    const response = await fetch(new URL(pathname, base), {
      headers: { authorization },
      redirect: 'follow',
      signal: AbortSignal.timeout(60000),
    })
    assert.equal(response.status, 200, `Preview route: ${pathname}`)
    assert.match(response.headers.get('x-robots-tag') || '', /noindex/)
  }
  const published = await payload.find({
    collection: 'pages',
    where: { _status: { equals: 'published' } },
    depth: 0,
    limit: 3,
  })
  for (const page of published.docs) {
    const response = await fetch(new URL(`/${encodeURIComponent(page.slug)}`, base), {
      headers: { authorization },
      signal: AbortSignal.timeout(60000),
    })
    assert.equal(response.status, 200)
    assert.ok((await response.text()).includes('id="content-page"'))
  }
  for (const pathname of ['/shared/.env', '/app.js', '/current/package.json']) {
    const response = await fetch(new URL(pathname, base), {
      headers: { authorization },
      redirect: 'manual',
      signal: AbortSignal.timeout(60000),
    })
    assert.ok(
      [403, 404].includes(response.status),
      `Private deployment file must not be served: ${pathname}`,
    )
  }
  const { docs: users } = await payload.find({
    collection: 'users',
    depth: 0,
    limit: 1,
    showHiddenFields: true,
  })
  const user = users[0]
  const sid = user?.sessions?.[0]?.id
  assert.ok(user && sid, 'An imported admin session is required for the read-only admin check')
  const { token } = await jwtSign({
    fieldsToSign: { id: user.id, collection: 'users', sid },
    secret: payload.secret,
    tokenExpiration: 120,
  })
  for (const pathname of ['/admin', '/admin/collections/pages/create']) {
    const response = await fetch(new URL(pathname, base), {
      headers: { authorization, cookie: `payload-token=${token}` },
      redirect: 'manual',
      signal: AbortSignal.timeout(60000),
    })
    assert.equal(response.status, 200, `Authenticated admin: ${pathname}`)
    assert.ok((await response.text()).includes('nav-pages'))
  }
  await payload.delete({ collection: 'media', id: testMediaID })
  testMediaID = undefined
  assert.equal((await payload.count({ collection: 'media' })).totalDocs, before)
  console.log(
    'Preview authentication, public pages, admin, media delivery and persistent upload/thumbnail/delete checks passed.',
  )
} finally {
  if (testMediaID !== undefined) await payload.delete({ collection: 'media', id: testMediaID })
  await payload.destroy()
}
process.exit(0)
