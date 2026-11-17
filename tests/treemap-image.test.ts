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

test('portrait heroes retain their framing in overview and project views instead of using square crops', () => {
  const mertz = {
    hero: true,
    image: '/Mertz-packshot.jpg',
    width: 2362,
    height: 3384,
    sizes: {
      thumbnail: { url: '/Mertz-packshot-400x400.jpg', width: 400, height: 400 },
      small: { url: '/Mertz-packshot-800x1146.jpg', width: 800, height: 1146 },
      medium: { url: '/Mertz-packshot-1600x2292.jpg', width: 1600, height: 2292 },
    },
  } as TreemapData
  assert.equal(treemapImageSource(mertz, 240, 150), '/Mertz-packshot-800x1146.jpg')
  assert.equal(treemapImageSource(mertz, 1440, 836), '/Mertz-packshot-1600x2292.jpg')
  assert.equal(treemapImageSource(mertz, 1440, 836, 2), '/Mertz-packshot.jpg')
})
