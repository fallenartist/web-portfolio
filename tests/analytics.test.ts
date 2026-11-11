import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  analyticsDateRange,
  analyticsPeriod,
  buildAnalyticsQuery,
  formatSessionDuration,
  parseAnalyticsReport,
  safeProjectPath,
} from '../src/lib/analytics-report'
import { fetchPostHogReport } from '../src/lib/posthog-api'
import { createAnalyticsCache } from '../src/lib/analytics-cache'
import { ANALYTICS_REFRESH_MS, emptyReport } from '../src/lib/analytics-report'
import {
  isLocalAnalyticsHost,
  setAnalyticsSink,
  trackEvent,
  trackPageView,
  type AnalyticsEvent,
} from '../src/lib/analytics'

test('analytics periods are bounded and reporting uses consecutive UTC dates', () => {
  assert.equal(analyticsPeriod('7'), 7)
  assert.equal(analyticsPeriod('90'), 90)
  assert.equal(analyticsPeriod('365'), 30)
  assert.equal(analyticsPeriod('7; DROP TABLE events'), 30)
  assert.deepEqual(analyticsDateRange(7, new Date('2026-11-09T23:30:00Z')), {
    start: '2026-11-03',
    end: '2026-11-10',
    previousStart: '2026-10-27',
  })
  const query = buildAnalyticsQuery(90, new Date('2026-11-09T15:00:00Z'))
  assert.match(query, /LIMIT 200$/)
  assert.match(query, /'UTC'/)
  assert.match(query, /project_opened/)
  assert.doesNotMatch(query, /map_node_selected/)
})

test('analytics reports preserve totals, rank projects and fill missing dates', () => {
  const report = parseAnalyticsReport(
    [
      ['sessions', 'current', '', 3, 62.4, 100 / 3, 0],
      ['totals', 'current', '', 24, 12, 9, 2],
      ['totals', 'previous', '', 10, 8, 4, 0],
      ['sessions', 'previous', '', 4, 84.2, 25, 0],
      ['daily', '2026-11-09', '', 24, 0, 0, 0],
      ['projects', '/design/second', 'Second project', '2', 0, 0, 0],
      ['projects', '/design/first', 'First project', '7', 0, 0, 0],
      ['languages', 'pl', '', 10, 0, 0, 0],
      ['sources', 'Direct', '', 20, 0, 0, 0],
    ],
    7,
    new Date('2026-11-09T15:00:00Z'),
  )
  assert.deepEqual(report.current, {
    pageviews: 24,
    visitors: 12,
    projects: 9,
    contacts: 2,
    sessions: 3,
    sessionDuration: 62.4,
    bounceRate: 100 / 3,
  })
  assert.equal(report.previous.sessions, 4)
  assert.equal(report.previous.sessionDuration, 84.2)
  assert.equal(report.previous.bounceRate, 25)
  assert.equal(report.previous.pageviews, 10)
  assert.equal(report.daily.length, 7)
  assert.deepEqual(report.daily[0], { date: '2026-11-03', count: 0 })
  assert.deepEqual(report.daily.at(-1), { date: '2026-11-09', count: 24 })
  assert.equal(report.projects[0].label, 'First project')
  assert.equal(report.languages[0].label, 'pl')
  assert.equal(parseAnalyticsReport([], 7).current.visitors, 0)
  assert.throws(() => parseAnalyticsReport({}, 7), /Invalid analytics response/)
  assert.throws(() => parseAnalyticsReport([['bad']], 7), /Invalid analytics row/)
})

test('session metrics distinguish missing measurements from zero and format durations', () => {
  const empty = parseAnalyticsReport([], 7)
  assert.equal(empty.current.sessions, 0)
  assert.equal(empty.current.sessionDuration, null)
  assert.equal(empty.current.bounceRate, null)
  const missing = parseAnalyticsReport([['sessions', 'current', '', 2, null, null, 0]], 7)
  assert.equal(missing.current.sessionDuration, null)
  assert.equal(missing.current.bounceRate, null)
  const measured = parseAnalyticsReport([['sessions', 'current', '', 2, 0, 0, 0]], 7)
  assert.equal(measured.current.sessionDuration, 0)
  assert.equal(measured.current.bounceRate, 0)
  assert.equal(formatSessionDuration(null), '—')
  assert.equal(formatSessionDuration(0), '0s')
  assert.equal(formatSessionDuration(9.6), '10s')
  assert.equal(formatSessionDuration(62.4), '1m 02s')
  assert.equal(formatSessionDuration(3599.6), '1h 0m')
  assert.equal(formatSessionDuration(3725), '1h 2m')
})

test('report caching coalesces requests and waits for fresh data after five minutes', async () => {
  let now = 1000
  let loads = 0
  const cache = createAnalyticsCache(() => now)
  const load = async () => {
    const report = emptyReport(7, 'ready', '')
    report.current.pageviews = ++loads
    return report
  }
  const first = cache('project/7', load)
  assert.equal(cache('project/7', load), first)
  assert.equal((await first).current.pageviews, 1)
  now += ANALYTICS_REFRESH_MS - 1
  assert.equal(cache('project/7', load), first)
  now++
  const fresh = cache('project/7', load)
  assert.notEqual(fresh, first)
  assert.equal((await fresh).current.pageviews, 2)
  assert.equal((await cache('project/30', load)).current.pageviews, 3)
})

test('a failed analytics request can recover instead of caching an error', async () => {
  const cache = createAnalyticsCache()
  await assert.rejects(
    cache('project/7', async () => {
      throw new Error('temporary API failure')
    }),
    /temporary API failure/,
  )
  assert.equal((await cache('project/7', async () => emptyReport(7, 'ready', ''))).status, 'ready')
})

test('PostHog queries use private header authentication and reject unusable replies', async () => {
  const settings = {
    host: 'https://eu.posthog.com',
    projectID: '123',
    personalAPIKey: 'private-test-key',
  }
  const fakeFetch: typeof fetch = async (input, options) => {
    assert.equal(input, 'https://eu.posthog.com/api/projects/123/query/')
    assert.equal(options?.method, 'POST')
    assert.equal(new Headers(options?.headers).get('authorization'), 'Bearer private-test-key')
    const body = JSON.parse(String(options?.body))
    assert.equal(body.query.kind, 'HogQLQuery')
    assert.equal(body.refresh, 'blocking')
    assert.ok(!String(options?.body).includes('private-test-key'))
    assert.equal(options?.cache, 'no-store')
    return Response.json({ results: [['totals', 'current', '', 3, 2, 1, 0]] })
  }
  const result = await fetchPostHogReport(settings, 7, fakeFetch)
  assert.equal(result.current.visitors, 2)
  await assert.rejects(
    fetchPostHogReport(settings, 7, async () => new Response('secret details', { status: 403 })),
    /Query Read permission/,
  )
  await assert.rejects(
    fetchPostHogReport(settings, 7, async () => new Response('secret details', { status: 429 })),
    /HTTP 429/,
  )
  await assert.rejects(
    fetchPostHogReport(settings, 7, async () => Response.json({ query_status: { id: 'pending' } })),
    /incomplete summary/,
  )
  await assert.rejects(
    fetchPostHogReport(settings, 7, async () => {
      throw new DOMException('aborted', 'TimeoutError')
    }),
    /PostHog took too long/,
  )
  await assert.rejects(
    fetchPostHogReport(settings, 7, async () => {
      throw new TypeError('fetch failed with private details')
    }),
    /^Error: Could not connect to PostHog\. Please try refreshing the activity\.$/,
  )
})

test('only local project paths become dashboard links, and local tracking is identifiable', () => {
  assert.equal(safeProjectPath('/design/project'), true)
  assert.equal(safeProjectPath('//other.example/project'), false)
  assert.equal(safeProjectPath('/\\other.example/project'), false)
  assert.equal(safeProjectPath('javascript:alert(1)'), false)
  for (const host of ['localhost', '127.0.0.1', '[::1]', 'portfolio.local'])
    assert.equal(isLocalAnalyticsHost(host), true)
  assert.equal(isLocalAnalyticsHost('portfolio.example.com'), false)
})

test('initial events queue, project views deduplicate, map selections stay distinct and failures cannot break actions', () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { pathname: '/design/project' } },
  })
  try {
    const captured: AnalyticsEvent[] = []
    trackEvent('language_changed', { to_language: 'pl' })
    setAnalyticsSink((event) => captured.push(event))
    assert.equal(captured.length, 1)
    trackPageView('/design/project', 'Project', 'project', 'project')
    trackPageView('/design/project', 'Project', 'project', 'project')
    assert.deepEqual(
      captured.map((event) => event.name),
      ['language_changed', '$pageview', 'project_opened'],
    )
    trackEvent('map_node_selected', { node_kind: 'project', node_slug: 'project' })
    assert.equal(captured.filter((event) => event.name === 'project_opened').length, 1)
    setAnalyticsSink(() => {
      throw new Error('blocked tracker')
    })
    assert.doesNotThrow(() => trackEvent('contact_clicked', { method: 'mailto' }))
    setAnalyticsSink(null)
    trackEvent('contact_clicked')
    setAnalyticsSink((event) => captured.push(event))
    assert.equal(captured.length, 4)
  } finally {
    setAnalyticsSink(null)
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})
