import assert from 'node:assert/strict'
import { test } from 'node:test'
import type { TreemapData } from '../src/types'
import { treemapImageSource } from '../src/lib/treemap-image'

test('neighbor preloading uses the same proportional image and pixel density as treemap navigation', () => {
  const hero = {
    image: '/original.jpg',
    width: 1600,
    height: 900,
    sizes: {
      thumbnail: { url: '/square.jpg', width: 400, height: 400 },
      small: { url: '/small.jpg', width: 800, height: 450 },
      medium: { url: '/medium.jpg', width: 1200, height: 675 },
    },
  } as TreemapData
  assert.equal(treemapImageSource(hero, 300, 200, 1, true), '/small.jpg')
  assert.equal(treemapImageSource(hero, 600, 400, 2, true), '/medium.jpg')
  assert.equal(treemapImageSource(hero, 1200, 800, 2, true), '/original.jpg')
  assert.equal(treemapImageSource(hero, 300, 200), '/square.jpg')
  assert.equal(treemapImageSource({} as TreemapData, 800, 600), null)
})
