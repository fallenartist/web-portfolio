import assert from 'node:assert/strict'
const base = process.argv[2] || 'http://127.0.0.1:3101'
if (!['localhost', '127.0.0.1'].includes(new URL(base).hostname))
  throw Error('Local smoke check only')
async function check(path, status) {
  const response = await fetch(new URL(path, base))
  assert.equal(
    response.status,
    status,
    `${path}: ${await response
      .clone()
      .text()
      .then((t) => t.slice(0, 160))}`,
  )
  return response
}
const home = await check('/', 200)
const html = await home.text()
assert.match(html, /Portfolio projects/)
const js = html.match(/src="([^"]*\/_next\/static\/[^"]+\.js[^"]*)"/)?.[1]
const css = html.match(/href="([^"]*\/_next\/static\/[^"]+\.css[^"]*)"/)?.[1]
assert.ok(js && css, 'Expected browser JavaScript and CSS assets')
await check(js, 200)
await check(css, 200)
await check('/admin', 200)
await check('/my-route', 404)
await check('/api/users', 403)
const write = await fetch(new URL('/api/categories', base), {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
})
assert.ok([401, 403].includes(write.status), `Anonymous write status: ${write.status}`)
const categories = await (await check('/api/categories?limit=100&depth=1', 200)).json()
const projects = await (await check('/api/projects?limit=100&depth=2', 200)).json()
const project = projects.docs[0]
if (project) {
  const categoryID = typeof project.category === 'object' ? project.category.id : project.category
  let category = categories.docs.find((c) => c.id === categoryID)
  const slugs = [project.slug]
  const seen = new Set()
  while (category && !seen.has(category.id)) {
    seen.add(category.id)
    slugs.unshift(category.slug)
    const parentID = typeof category.parent === 'object' ? category.parent?.id : category.parent
    category = categories.docs.find((c) => c.id === parentID)
  }
  await check('/' + slugs.map(encodeURIComponent).join('/'), 200)
  await check('/wrong-category/' + encodeURIComponent(project.slug), 404)
}
const media = await (await check('/api/media?limit=1', 200)).json()
if (media.docs[0]?.url) {
  const path = new URL(media.docs[0].url, base).pathname
  await check(path, 200)
}
console.log(
  'HTTP checks passed: homepage, admin, deep link, invalid path, media, blocked users endpoint and anonymous writes.',
)
