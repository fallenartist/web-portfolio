import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTreemapImageSwap } from '../src/lib/treemap-image-swap'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason: Error) => void
  const promise = new Promise<T>((yes, no) => {
    resolve = yes
    reject = no
  })
  return { promise, resolve, reject }
}

test('an already decoded upgrade waits until zoom geometry has finished', async () => {
  const geometry = deferred<void>()
  const swaps = createTreemapImageSwap(async () => true)
  let displayed = 'small.jpg'
  const result = swaps.beginView()('large.jpg', geometry.promise, () => {
    displayed = 'large.jpg'
  })
  await Promise.resolve()
  assert.equal(displayed, 'small.jpg')
  geometry.resolve()
  assert.equal(await result, true)
  assert.equal(displayed, 'large.jpg')
  swaps.dispose()
})

test('a finished zoom keeps the old image while a slow upgrade decodes', async () => {
  const decoded = deferred<boolean>()
  const swaps = createTreemapImageSwap(() => decoded.promise)
  let displayed = 'small.jpg'
  const result = swaps.beginView()('large.jpg', Promise.resolve(), () => {
    displayed = 'large.jpg'
  })
  await Promise.resolve()
  assert.equal(displayed, 'small.jpg')
  decoded.resolve(true)
  assert.equal(await result, true)
  assert.equal(displayed, 'large.jpg')
  swaps.dispose()
})

test('rapid navigation cancels old upgrades immediately and prevents late image replacement', async () => {
  const oldDecoded = deferred<boolean>()
  const swaps = createTreemapImageSwap((src) =>
    src === 'old.jpg' ? oldDecoded.promise : Promise.resolve(true),
  )
  let displayed = 'thumbnail.jpg'
  const old = swaps.beginView()('old.jpg', Promise.resolve(), () => {
    displayed = 'old.jpg'
  })
  const current = swaps.beginView()('new.jpg', Promise.resolve(), () => {
    displayed = 'new.jpg'
  })
  assert.equal(await old, false)
  assert.equal(await current, true)
  oldDecoded.resolve(true)
  await Promise.resolve()
  assert.equal(displayed, 'new.jpg')
  swaps.dispose()
})

test('failed decoding, interrupted motion and disposal all preserve the displayed image', async () => {
  let replacements = 0
  const failed = createTreemapImageSwap(async () => false)
  assert.equal(
    await failed.beginView()('bad.jpg', Promise.resolve(), () => {
      replacements++
    }),
    false,
  )
  failed.dispose()

  const interrupted = createTreemapImageSwap(async () => true)
  const geometry = deferred<void>()
  const result = interrupted.beginView()('large.jpg', geometry.promise, () => {
    replacements++
  })
  geometry.reject(new Error('Zoom interrupted'))
  assert.equal(await result, false)
  interrupted.dispose()

  const decoding = deferred<boolean>()
  const disposed = createTreemapImageSwap(() => decoding.promise)
  const pending = disposed.beginView()('late.jpg', Promise.resolve(), () => {
    replacements++
  })
  disposed.dispose()
  assert.equal(await pending, false)
  decoding.resolve(true)
  await Promise.resolve()
  assert.equal(replacements, 0)
})
