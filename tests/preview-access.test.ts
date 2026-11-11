import assert from 'node:assert/strict'
import { test } from 'node:test'
import { NextRequest } from 'next/server'
import { proxy } from '../src/proxy'

test('preview authentication covers pages, admin, APIs and assets without redirecting non-page language links', () => {
  const previousPassword = process.env.PREVIEW_PASSWORD
  const previousUsername = process.env.PREVIEW_USERNAME
  process.env.PREVIEW_USERNAME = 'preview'
  process.env.PREVIEW_PASSWORD = 'example-test-password'
  try {
    for (const path of [
      '/',
      '/admin',
      '/api/pages',
      '/api/media/file/photo.jpg',
      '/_next/static/app.js',
    ]) {
      const url = `https://test.example.com${path}?lang=pl`
      for (const authorization of [
        undefined,
        'Basic invalid',
        `Basic ${Buffer.from('preview:wrong').toString('base64')}`,
      ]) {
        const response = proxy(
          new NextRequest(url, { headers: authorization ? { authorization } : {} }),
        )
        assert.equal(response.status, 401)
        assert.match(response.headers.get('www-authenticate') || '', /^Basic /)
        assert.equal(response.headers.get('cache-control'), 'private, no-store')
      }
      const response = proxy(
        new NextRequest(url, {
          headers: {
            authorization: `Basic ${Buffer.from('preview:example-test-password').toString('base64')}`,
          },
        }),
      )
      assert.equal(response.status, path === '/' ? 307 : 200)
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive')
    }
  } finally {
    if (previousPassword === undefined) delete process.env.PREVIEW_PASSWORD
    else process.env.PREVIEW_PASSWORD = previousPassword
    if (previousUsername === undefined) delete process.env.PREVIEW_USERNAME
    else process.env.PREVIEW_USERNAME = previousUsername
  }
})
