import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTreemapMotion } from '../src/lib/treemap-motion'

test('Prev/Next waits for actual zoom completion and defers scrollbar reflow across every step', async () => {
  const starts: [string, boolean][] = []
  let resizes = 0
  let completeStep: () => void = () => {}
  const motion = createTreemapMotion<string>({
    pauseMs: 0,
    resize: () => {
      resizes++
    },
    zoom: (node, final): Promise<boolean> => {
      starts.push([node, final])
      const finish = motion.beginView()
      return new Promise((resolve) => {
        completeStep = () => resolve(finish())
      })
    },
  })
  const navigation = motion.navigate(['discipline', 'root', 'next discipline', 'Mertz'])
  motion.requestResize()
  motion.requestResize()
  await Promise.resolve()
  assert.deepEqual(starts, [['discipline', false]])
  assert.equal(resizes, 0)
  for (const expected of [2, 3, 4]) {
    completeStep()
    await Promise.resolve()
    assert.equal(starts.length, expected)
    assert.equal(resizes, 0)
  }
  assert.deepEqual(starts.at(-1), ['Mertz', true])
  completeStep()
  await navigation
  assert.equal(resizes, 1)
  motion.dispose()
})

test('interrupted navigation cannot reveal an old project or run remaining steps', async () => {
  const starts: string[] = []
  let finishOld: (complete?: () => void) => boolean = () => false
  let resolveOld: (value: boolean) => void = () => {}
  let staleReveal = false
  const motion = createTreemapMotion<string>({
    pauseMs: 0,
    resize: () => {},
    zoom: (node): Promise<boolean> => {
      starts.push(node)
      finishOld = motion.beginView()
      return new Promise((resolve) => {
        resolveOld = resolve
      })
    },
  })
  const navigation = motion.navigate(['old discipline', 'old project'])
  motion.cancelNavigation()
  const finishNew = motion.beginView()
  resolveOld(
    finishOld(() => {
      staleReveal = true
    }),
  )
  await navigation
  assert.equal(staleReveal, false)
  assert.deepEqual(starts, ['old discipline'])
  assert.equal(finishNew(), true)
  motion.dispose()
})

test('pending resize and project handoffs cannot run after the treemap is disposed', () => {
  let changes = 0
  const motion = createTreemapMotion<string>({
    zoom: async () => true,
    resize: () => {
      changes++
    },
  })
  const finish = motion.beginView()
  motion.requestResize()
  motion.dispose()
  assert.equal(
    finish(() => {
      changes++
    }),
    false,
  )
  assert.equal(changes, 0)
})
