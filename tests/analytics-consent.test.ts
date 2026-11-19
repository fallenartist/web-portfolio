import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  parseAnalyticsConsent,
  CONSENT_MAX_AGE_MS,
  CONSENT_STORAGE_KEY,
  saveAnalyticsConsent,
  getAnalyticsConsent,
  subscribeAnalyticsConsent,
  clearAnalyticsStorage,
  browserAllowsAnalytics,
} from '../src/lib/analytics-consent'
import {
  createConsentAnalyticsSession,
  type ConsentAnalyticsClient,
} from '../src/lib/consent-analytics-session'

const tick = () => new Promise<void>((resolve) => setImmediate(resolve))

test('only versioned, explicit, unexpired consent can enable tracking', () => {
  const now = 1000
  const encode = (extra = {}) =>
    JSON.stringify({ version: 1, choice: 'accepted', expiresAt: now + 100, ...extra })
  assert.equal(parseAnalyticsConsent(encode(), now)?.choice, 'accepted')
  assert.equal(parseAnalyticsConsent(encode({ choice: 'rejected' }), now)?.choice, 'rejected')
  for (const raw of [
    null,
    '',
    'accepted',
    'broken',
    '{}',
    encode({ version: 0 }),
    encode({ choice: 'yes' }),
    encode({ expiresAt: now }),
    encode({ expiresAt: now + CONSENT_MAX_AGE_MS + 1 }),
  ]) {
    assert.equal(parseAnalyticsConsent(raw, now), null)
  }
})

function harness(initial = false, deferred = false, cookieless = false) {
  let permission = initial
  let notify = () => {}
  let loads = 0
  const calls: string[] = []
  let resolve: (client: ConsentAnalyticsClient) => void = () => {}
  const promise = new Promise<ConsentAnalyticsClient>((done) => {
    resolve = done
  })
  const client: ConsentAnalyticsClient = {
    init: () => {
      calls.push('init')
      return undefined
    },
    set_config: () => {
      calls.push('config')
    },
    capture: () => undefined,
    opt_in_capturing: () => {
      calls.push('opt-in')
    },
    opt_out_capturing: () => {
      calls.push('opt-out')
    },
    startSessionRecording: () => {
      calls.push('record')
    },
    stopSessionRecording: () => {
      calls.push('stop-recording')
    },
    reset: () => {
      calls.push('clear-identity')
    },
  }
  const dispose = createConsentAnalyticsSession({
    token: 'test-token',
    options: {
      cookieless_mode: cookieless ? 'always' : undefined,
      opt_out_capturing_by_default: true,
      opt_out_persistence_by_default: true,
    },
    allowed: () => permission,
    subscribe: (listener) => {
      notify = listener
      return () => {
        notify = () => {}
      }
    },
    load: () => {
      loads++
      return deferred ? promise : Promise.resolve(client)
    },
    onReady: () => {
      calls.push('ready')
    },
    onStop: () => {
      calls.push('sink-off')
    },
  })
  return {
    calls,
    dispose,
    loads: () => loads,
    allow: (value: boolean) => {
      permission = value
      notify()
    },
    resolve: () => resolve(client),
  }
}

test('pending/rejected consent never loads PostHog; acceptance starts once and withdrawal stops/clears it', async () => {
  const h = harness()
  assert.equal(h.loads(), 0)
  h.allow(false)
  assert.equal(h.loads(), 0)
  h.allow(true)
  await tick()
  assert.deepEqual(
    h.calls.filter((c) => c !== 'sink-off'),
    ['init', 'opt-in', 'record', 'ready'],
  )
  h.allow(true)
  assert.equal(h.loads(), 1)
  h.allow(false)
  assert.deepEqual(h.calls.slice(-6), [
    'sink-off',
    'stop-recording',
    'opt-out',
    'clear-identity',
    'opt-out',
    'config',
  ])
  h.allow(true)
  await tick()
  assert.equal(h.calls.filter((c) => c === 'init').length, 1)
  assert.equal(h.calls.filter((c) => c === 'record').length, 2)
  h.dispose()
})

test('rejecting or disposing while the SDK loads cannot initialize it later', async () => {
  for (const dispose of [false, true]) {
    const h = harness(true, true)
    assert.equal(h.loads(), 1)
    if (dispose) h.dispose()
    else h.allow(false)
    h.resolve()
    await tick()
    assert.ok(!h.calls.includes('init'))
    assert.ok(!h.calls.includes('record'))
    if (!dispose) {
      h.allow(true)
      await tick()
      assert.ok(h.calls.includes('ready'))
      h.dispose()
    }
  }
})

test('consent persists, synchronizes across tabs, expires, and storage cleanup stays project-scoped', () => {
  const originals = Object.fromEntries(
    ['window', 'document', 'navigator'].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  )
  const originalNow = Date.now
  let now = 10_000
  Date.now = () => now
  const values = new Map<string, string>()
  const session = new Map<string, string>()
  const storage = (map: Map<string, string>) => ({
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
    get length() {
      return map.size
    },
    key: (index: number) => [...map.keys()][index] ?? null,
  })
  const win = Object.assign(new EventTarget(), {
    localStorage: storage(values),
    sessionStorage: storage(session),
    location: { hostname: 'www.example.com' },
  })
  const doc = new EventTarget()
  const deletions: string[] = []
  Object.defineProperty(doc, 'cookie', {
    get: () => 'ph_test_posthog=id; portfolio-language=pl; ph_other_posthog=other',
    set: (value) => deletions.push(value),
  })
  for (const [key, value] of Object.entries({
    window: win,
    document: doc,
    navigator: { doNotTrack: '1' },
  }))
    Object.defineProperty(globalThis, key, { configurable: true, value })
  let unsubscribe = () => {}
  try {
    assert.equal(browserAllowsAnalytics(), false)
    assert.equal(getAnalyticsConsent(), 'pending')
    let updates = 0
    unsubscribe = subscribeAnalyticsConsent(() => {
      updates++
    })
    saveAnalyticsConsent('accepted')
    assert.equal(getAnalyticsConsent(), 'accepted')
    assert.equal(updates, 1)
    values.set(
      CONSENT_STORAGE_KEY,
      JSON.stringify({ version: 1, choice: 'rejected', expiresAt: now + 1000 }),
    )
    win.dispatchEvent(Object.assign(new Event('storage'), { key: CONSENT_STORAGE_KEY }))
    assert.equal(getAnalyticsConsent(), 'rejected')
    saveAnalyticsConsent('accepted')
    now += CONSENT_MAX_AGE_MS + 1
    win.dispatchEvent(new Event('focus'))
    assert.equal(getAnalyticsConsent(), 'pending')
    values.set('ph_test_posthog', 'identity')
    values.set('ph_other_posthog', 'other-identity')
    session.set('ph_test_window_id', 'window-id')
    clearAnalyticsStorage('test')
    assert.ok(!values.has('ph_test_posthog'))
    assert.ok(!session.has('ph_test_window_id'))
    assert.ok(values.has('ph_other_posthog'))
    assert.ok(values.has(CONSENT_STORAGE_KEY))
    assert.ok(deletions.some((value) => value.includes('Domain=example.com')))
    assert.ok(deletions.every((value) => value.startsWith('ph_test_posthog=')))
  } finally {
    unsubscribe()
    Date.now = originalNow
    for (const key of ['window', 'document', 'navigator']) {
      const descriptor = originals[key]
      if (descriptor) Object.defineProperty(globalThis, key, descriptor)
      else Reflect.deleteProperty(globalThis, key)
    }
  }
})

test('SDK options enable cookies/clicks/masked recordings and gate every outgoing event', async () => {
  const { getPostHogOptions } = await import('../src/lib/posthog-options')
  let permission = false
  const options = getPostHogOptions(
    { apiHost: 'https://eu.i.posthog.com', appHost: 'https://eu.posthog.com' },
    () => permission,
  )
  assert.equal(options.persistence, 'cookie')
  assert.equal(options.cookieless_mode, undefined)
  assert.equal(options.opt_out_capturing_by_default, true)
  assert.equal(options.opt_out_persistence_by_default, true)
  assert.ok(options.autocapture)
  assert.equal(options.disable_session_recording, false)
  assert.equal(options.session_recording?.maskAllInputs, true)
  assert.match(options.session_recording?.blockSelector || '', /iframe/)
  const filter = options.before_send
  assert.equal(typeof filter, 'function')
  if (typeof filter !== 'function') throw Error('Capture filter required')
  const event: Parameters<typeof filter>[0] = {
    uuid: '00000000-0000-0000-0000-000000000001',
    event: '$pageview',
    properties: {
      $current_url: 'https://example.com/project?email=private@example.com#private',
      $referrer: 'https://referrer.example/path?secret=value',
    },
  }
  assert.equal(filter(event), null)
  permission = true
  const captured = filter(event)
  assert.equal(captured?.properties.$current_url, 'https://example.com/project')
  assert.equal(captured?.properties.$referrer, 'https://referrer.example/path')
  permission = false
  assert.equal(filter(event), null)
})

test('accepting begins at the current page and does not replay pre-consent visits', async () => {
  const { setAnalyticsSink, trackPageView, trackCurrentPageView } =
    await import('../src/lib/analytics')
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const win = { location: { pathname: '/before-consent' } }
  Object.defineProperty(globalThis, 'window', { configurable: true, value: win })
  try {
    setAnalyticsSink(null)
    trackPageView('/before-consent', 'Previous project', 'project')
    win.location.pathname = '/current'
    trackPageView('/current', 'Current project', 'project', 'current')
    const events: { name: string; properties: Record<string, unknown> }[] = []
    setAnalyticsSink((event) => events.push(event))
    trackCurrentPageView()
    trackPageView('/current', 'Current project', 'project', 'current')
    assert.deepEqual(
      events.map((event) => event.name),
      ['$pageview', 'project_opened'],
    )
    assert.ok(events.every((event) => event.properties.page_path === '/current'))
  } finally {
    setAnalyticsSink(null)
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})

test('a fast SDK waits for late page metadata instead of losing a project-open event', async () => {
  const { setAnalyticsSink, trackPageView, trackCurrentPageView } =
    await import('../src/lib/analytics')
  const original = Object.getOwnPropertyDescriptor(globalThis, 'window')
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: { location: { pathname: '/late-project' } },
  })
  const events: { name: string }[] = []
  try {
    setAnalyticsSink((event) => events.push(event))
    trackCurrentPageView()
    assert.equal(events.length, 0)
    trackPageView('/late-project', 'Late project', 'project')
    assert.deepEqual(
      events.map((event) => event.name),
      ['$pageview', 'project_opened'],
    )
  } finally {
    setAnalyticsSink(null)
    if (original) Object.defineProperty(globalThis, 'window', original)
    else Reflect.deleteProperty(globalThis, 'window')
  }
})

test('cookieless mode never opts in, persists an opt-out or starts recordings', async () => {
  const h = harness(true, false, true)
  await tick()
  assert.deepEqual(
    h.calls.filter((c) => c !== 'sink-off'),
    ['init', 'ready'],
  )
  h.allow(false)
  assert.ok(h.calls.includes('stop-recording'))
  assert.ok(!h.calls.includes('opt-out'))
  assert.ok(!h.calls.includes('clear-identity'))
  h.allow(true)
  await tick()
  h.dispose()
  assert.ok(!h.calls.includes('record'))
  assert.ok(!h.calls.includes('opt-in'))
})

test('cookieless SDK options disable persistent identity, autocapture and recordings', async () => {
  const { getPostHogOptions } = await import('../src/lib/posthog-options')
  let allowed = true
  const options = getPostHogOptions(
    { apiHost: 'https://eu.i.posthog.com', appHost: 'https://eu.posthog.com', mode: 'cookieless' },
    () => allowed,
  )
  assert.equal(options.cookieless_mode, 'always')
  assert.equal(options.persistence, 'memory')
  assert.equal(options.disable_persistence, true)
  assert.equal(options.opt_out_capturing_by_default, false)
  assert.equal(options.person_profiles, 'never')
  assert.equal(options.autocapture, false)
  assert.equal(options.disable_session_recording, true)
  assert.equal(options.respect_dnt, true)
  const filter = options.before_send
  if (typeof filter !== 'function') throw Error('Capture filter required')
  const event = { uuid: '00000000-0000-0000-0000-000000000001', event: '$pageview', properties: {} }
  assert.ok(filter(event))
  allowed = false
  assert.equal(filter(event), null)
})
