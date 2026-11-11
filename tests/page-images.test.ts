import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { Media, Page } from '../src/payload-types'
import { firstPageImage, populatedPageImage } from '../src/lib/page-images'

const portrait: Media = { id: 1, url: '/api/media/file/portrait.jpg', createdAt: '', updatedAt: '' }
const landscape: Media = {
  id: 2,
  url: '/api/media/file/landscape.jpg',
  createdAt: '',
  updatedAt: '',
}
const textBlock = (children: unknown[]) => ({
  blockType: 'pageText' as const,
  text: { root: { type: 'root', version: 1, children, direction: null, format: '', indent: 0 } },
})
const upload = (value: unknown) => ({ type: 'upload', relationTo: 'media', value })

test('first image loading follows authored order across text uploads and separate images', () => {
  const text = textBlock([
    { type: 'paragraph', children: [{ type: 'text', text: 'Introduction' }] },
    upload(portrait),
  ])
  const standalone = { blockType: 'pageImage', image: landscape }
  assert.equal(firstPageImage([text, standalone] as Page['content']), portrait)
  assert.equal(firstPageImage([standalone, text] as Page['content']), landscape)
})

test('unresolved and missing uploads do not prevent the next valid image loading eagerly', () => {
  const text = textBlock([
    upload(123),
    upload(null),
    upload({ ...portrait, url: null }),
    { type: 'paragraph', children: [upload(landscape)] },
  ])
  assert.equal(firstPageImage([text] as Page['content']), landscape)
  assert.equal(firstPageImage(undefined), null)
  assert.equal(firstPageImage([textBlock([])] as Page['content']), null)
  assert.equal(populatedPageImage(123), null)
  assert.equal(populatedPageImage(null), null)
})
