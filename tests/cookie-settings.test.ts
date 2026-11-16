import assert from 'node:assert/strict'
import { test } from 'node:test'
import { cookieDefaults, getCookieBannerSettings } from '../src/lib/cookie-settings'

test('cookie copy falls back by language and preserves custom admin text', () => {
  assert.equal(getCookieBannerSettings(undefined, 'pl').message, cookieDefaults.pl.message)
  assert.equal(
    getCookieBannerSettings({ title: '  My cookies  ', message: ' ' }, 'en').title,
    'My cookies',
  )
  assert.equal(getCookieBannerSettings({ message: ' ' }, 'en').message, cookieDefaults.en.message)
})

test('only published privacy pages are linked and the selected icon URL is retained', () => {
  const page = {
    id: 1,
    title: 'Privacy',
    slug: 'privacy',
    _status: 'published' as const,
    createdAt: '',
    updatedAt: '',
  }
  const icon = { id: 1, url: '/api/media/file/cookie.svg', createdAt: '', updatedAt: '' }
  assert.equal(getCookieBannerSettings({ privacyPage: page, icon }, 'en').privacyHref, '/privacy')
  assert.equal(getCookieBannerSettings({ privacyPage: page, icon }, 'en').iconURL, icon.url)
  assert.equal(
    getCookieBannerSettings({ privacyPage: { ...page, _status: 'draft' } }, 'en').privacyHref,
    undefined,
  )
  assert.equal(getCookieBannerSettings({ privacyPage: 1, icon: 1 }, 'en').privacyHref, undefined)
})
