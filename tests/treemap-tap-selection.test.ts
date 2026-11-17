import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createTreemapTapSelection } from '../src/lib/treemap-tap-selection'

test('touch reveals a title before a second tap activates the same tile', () => {
  const taps = createTreemapTapSelection()
  assert.equal(taps.activate('category', true), false)
  assert.equal(taps.selected, 'category')
  assert.equal(taps.activate('category', true), true)
  assert.equal(taps.selected, null)
  assert.equal(taps.activate('project', true), false)
  assert.equal(taps.activate('project', true), true)
})

test('another tile replaces the preview; navigation or outside taps reset it', () => {
  const taps = createTreemapTapSelection()
  taps.activate('first', true)
  assert.equal(taps.activate('second', true), false)
  assert.equal(taps.selected, 'second')
  taps.clear()
  assert.equal(taps.activate('second', true), false)
})

test('mouse, keyboard and image actions activate immediately and clear touch previews', () => {
  const taps = createTreemapTapSelection()
  taps.activate('category', true)
  assert.equal(taps.activate('category', false), true)
  assert.equal(taps.selected, null)
  assert.equal(taps.activate('project', false), true)
  assert.equal(taps.activate('image', false), true)
})
