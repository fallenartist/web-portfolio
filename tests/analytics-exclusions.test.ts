import assert from 'node:assert/strict'
import { test } from 'node:test'
import { isAnalyticsIPExcluded } from '../src/lib/analytics-exclusions'

test('IP exclusions match exact visitors without affecting everyone else', () => {
  const headers = new Headers({ 'x-real-ip': '192.0.2.12' })
  assert.equal(isAnalyticsIPExcluded(headers, '192.0.2.12'), true)
  assert.equal(isAnalyticsIPExcluded(headers, '192.0.2.1'), false)
  assert.equal(isAnalyticsIPExcluded(headers, ''), false)
  assert.equal(isAnalyticsIPExcluded(headers, undefined), false)
  assert.equal(isAnalyticsIPExcluded(new Headers(), '192.0.2.12'), false)
  assert.equal(isAnalyticsIPExcluded(headers, 'invalid, 192.0.2.120'), false)
})

test('proxy IP selection prefers X-Real-IP, then the first forwarded client', () => {
  assert.equal(
    isAnalyticsIPExcluded(
      new Headers({ 'x-forwarded-for': '192.0.2.12, 127.0.0.1' }),
      '198.51.100.9, 192.0.2.12',
    ),
    true,
  )
  assert.equal(
    isAnalyticsIPExcluded(
      new Headers({ 'x-real-ip': '198.51.100.9', 'x-forwarded-for': '192.0.2.12' }),
      '192.0.2.12',
    ),
    false,
  )
  assert.equal(
    isAnalyticsIPExcluded(
      new Headers({ 'x-forwarded-for': '198.51.100.9, 192.0.2.12' }),
      '192.0.2.12',
    ),
    false,
  )
  assert.equal(
    isAnalyticsIPExcluded(new Headers({ 'x-real-ip': 'bad-header' }), 'bad-header'),
    false,
  )
})

test('IPv6 spellings and IPv4-mapped IPv6 match the same excluded address', () => {
  for (const address of ['::ffff:192.0.2.12', '::ffff:c000:20c']) {
    assert.equal(isAnalyticsIPExcluded(new Headers({ 'x-real-ip': address }), '192.0.2.12'), true)
  }
  assert.equal(
    isAnalyticsIPExcluded(new Headers({ 'x-real-ip': '2001:DB8::1' }), '2001:0db8:0:0:0:0:0:1'),
    true,
  )
  assert.equal(
    isAnalyticsIPExcluded(new Headers({ 'x-real-ip': '2001:db8::2' }), '2001:db8::1'),
    false,
  )
})
