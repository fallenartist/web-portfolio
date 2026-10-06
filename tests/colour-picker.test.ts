import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  hsbToRgb,
  parseColour,
  rgbToHex,
  rgbToHsb,
} from '../src/components/admin/ColourPicker/colourUtils'
import { validateColour } from '../src/fields/colourPicker'
import { normalizeColour } from '../src/lib/colour'

describe('colour picker conversions', () => {
  it('loads the existing RGB values without changing their colour', () => {
    assert.deepEqual(parseColour('rgb(250, 200, 0)'), { b: 0, g: 200, r: 250 })
    assert.equal(rgbToHex(parseColour('rgb(250, 200, 0)')!), '#FAC800')
  })

  it('round-trips RGB through HSB', () => {
    const rgb = { b: 250, g: 0, r: 50 }
    assert.deepEqual(hsbToRgb(rgbToHsb(rgb)), rgb)
  })
})

describe('colour field validation', () => {
  it('accepts existing CSS colours and picker hex values', () => {
    assert.equal(validateColour('rgb(250, 0, 50)', {} as never), true)
    assert.equal(validateColour('rgba(250, 0, 50, 0.5)', {} as never), true)
    assert.equal(validateColour('hsl(348 100% 49% / 75%)', {} as never), true)
    assert.equal(validateColour('oklch(0.554 0.046 257.417)', {} as never), true)
    assert.equal(validateColour('#FAC800', {} as never), true)
    assert.equal(normalizeColour('  oklch(0.554 0.046 257.417 / 60%)  '), 'oklch(0.554 0.046 257.417 / 60%)')
  })

  it('rejects strings that could inject additional declarations', () => {
    assert.notEqual(validateColour('red; background: black', {} as never), true)
    assert.notEqual(validateColour('hsba(348, 100%, 98%, 0.5)', {} as never), true)
  })
})
