import assert from 'node:assert/strict'
import { test } from 'node:test'
import { arrangePageBlocks } from '../src/lib/page-layout'

function block(
  id: string,
  width?: 'content' | 'wide' | 'half',
  alignment?: 'left' | 'center' | 'right',
) {
  return { id, width, alignment }
}

test('adjacent photo and text halves share a row without changing content order', () => {
  const blocks = [
    block('intro'),
    block('photo', 'half', 'left'),
    block('bio', 'half', 'right'),
    block('body'),
  ]
  const rows = arrangePageBlocks(blocks)
  assert.deepEqual(
    rows.map((row) => row.map((item) => item.id)),
    [['intro'], ['photo', 'bio'], ['body']],
  )
  assert.deepEqual(rows.flat(), blocks)
  assert.equal(rows[1][0], blocks[1])
})

test('right-first pairs work, while centred and same-side halves keep separate rows', () => {
  const rows = arrangePageBlocks([
    block('right', 'half', 'right'),
    block('left', 'half', 'left'),
    block('portrait', 'half', 'center'),
    block('half-a', 'half'),
    block('half-b', 'half', 'left'),
  ])
  assert.deepEqual(
    rows.map((row) => row.map((item) => item.id)),
    [['right', 'left'], ['portrait'], ['half-a'], ['half-b']],
  )
})

test('wide and legacy blocks stay standalone and cannot be skipped by pairing', () => {
  const blocks = [
    block('left', 'half', 'left'),
    block('wide', 'wide'),
    block('right', 'half', 'right'),
    block('legacy'),
  ]
  assert.deepEqual(
    arrangePageBlocks(blocks).map((row) => row.length),
    [1, 1, 1, 1],
  )
  assert.deepEqual(arrangePageBlocks(blocks).flat(), blocks)
  assert.deepEqual(arrangePageBlocks([]), [])
})
