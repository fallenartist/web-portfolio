// Local-only production checks. Tokens stay in process memory and expire in two minutes.
// Run: node --env-file=.env --import tsx scripts/smoke-analytics.mjs http://127.0.0.1:3105
import assert from 'node:assert/strict'
import { getPayload, jwtSign } from 'payload'

const base = new URL(process.argv[2] || 'http://127.0.0.1:3105')
if (!['127.0.0.1', 'localhost'].includes(base.hostname)) throw new Error('Local preview required')
const database = new URL(process.env.DATABASE_URI)
if (!['127.0.0.1', 'localhost'].includes(database.hostname))
  throw new Error('Local database required')
const { default: config } = await import('../src/payload.config.ts')
const payload = await getPayload({ config })
try {
  const unauthorized = await fetch(new URL('/api/analytics', base))
  assert.equal(unauthorized.status, 401)
  assert.equal(unauthorized.headers.get('cache-control'), 'private, no-store')
  const publicPage = await fetch(base)
  assert.equal(publicPage.status, 200)
  const publicHTML = await publicPage.text()
  if (process.env.POSTHOG_PERSONAL_API_KEY)
    assert.ok(!publicHTML.includes(process.env.POSTHOG_PERSONAL_API_KEY))
  console.log('Public page works; unauthenticated analytics requests are rejected.')

  const { docs } = await payload.find({
    collection: 'users',
    limit: 1,
    depth: 0,
    showHiddenFields: true,
  })
  const user = docs[0]
  const sid = user?.sessions?.[0]?.id
  if (user && (!payload.collections.users.config.auth.useSessions || sid)) {
    const { token } = await jwtSign({
      fieldsToSign: { id: user.id, collection: 'users', ...(sid ? { sid } : {}) },
      secret: payload.secret,
      tokenExpiration: 120,
    })
    const headers = { cookie: `payload-token=${token}` }
    const response = await fetch(new URL('/api/analytics?days=30', base), { headers })
    assert.equal(response.status, 200)
    const report = await response.json()
    assert.equal(report.days, 30)
    assert.ok(['ready', 'setup', 'error'].includes(report.status))
    if (process.env.POSTHOG_PROJECT_ID && process.env.POSTHOG_PERSONAL_API_KEY) {
      assert.equal(report.status, 'ready', report.message)
      assert.equal(typeof report.current.sessions, 'number')
      assert.ok(Array.isArray(report.videos))
      assert.ok(
        report.current.sessionDuration === null || Number.isFinite(report.current.sessionDuration),
      )
      assert.ok(
        report.current.bounceRate === null ||
          (report.current.bounceRate >= 0 && report.current.bounceRate <= 100),
      )
      assert.ok(!JSON.stringify(report).includes(process.env.POSTHOG_PERSONAL_API_KEY))
    }
    assert.ok(!JSON.stringify(report).includes(token))
    const dashboard = await fetch(new URL('/admin', base), { headers })
    assert.equal(dashboard.status, 200)
    const html = await dashboard.text()
    assert.ok(html.includes('aria-label="Website activity"'))
    assert.ok(html.includes('>Refresh</button>'))
    if (report.status === 'ready') {
      assert.ok(html.includes('Avg. session duration'))
      assert.ok(html.includes('Bounce rate'))
      assert.ok(html.includes('aria-label="Video engagement"'))
      assert.ok(!html.includes('<th scope="col">Avg. watch time</th>'))
      assert.ok(!html.includes('<th scope="col">Watched 25 / 50 / 75 / 90%</th>'))
    }
    if (process.env.POSTHOG_PERSONAL_API_KEY)
      assert.ok(!html.includes(process.env.POSTHOG_PERSONAL_API_KEY))
    console.log(
      `Authenticated analytics API and native Dashboard widget passed (${report.status}).`,
    )
  } else {
    console.log('No existing admin session is available; authenticated checks skipped.')
  }
} finally {
  await payload.destroy()
}
process.exit(0)
