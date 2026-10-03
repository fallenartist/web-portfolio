'use client'

import { Button, FieldDescription, FieldLabel, useField, usePreferences } from '@payloadcms/ui'
import type { TextFieldClientComponent } from 'payload'
import { useCallback, useEffect, useMemo, useState } from 'react'

import styles from './ColourPicker.module.scss'
import {
  hexToRgb,
  hsbToRgb,
  parseColour,
  rgbToHex,
  rgbToHsb,
  type HSB,
  type RGB,
} from './colourUtils'

const PREFERENCE_KEY = 'portfolio-colour-picker-recents-v1'
const DEFAULT_COLOURS = ['#FAC800', '#3200FA', '#FA0032']
const MAX_RECENT_COLOURS = 8

type Channel = keyof HSB | keyof RGB
type ColourPreferences = { colours: string[] }

const uniqueColours = (values: string[]) =>
  [...new Set(values.map((value) => value.toUpperCase()))].slice(0, MAX_RECENT_COLOURS)

const sliderBackground = (type: 'b' | 'blue' | 'g' | 'h' | 'r' | 's', rgb: RGB, hsb: HSB) => {
  switch (type) {
    case 'h':
      return 'linear-gradient(90deg, #F00, #FF0, #0F0, #0FF, #00F, #F0F, #F00)'
    case 's':
      return `linear-gradient(90deg, ${rgbToHex(hsbToRgb({ ...hsb, s: 0 }))}, ${rgbToHex(hsbToRgb({ ...hsb, s: 100 }))})`
    case 'b':
      return `linear-gradient(90deg, #000000, ${rgbToHex(hsbToRgb({ ...hsb, b: 100 }))})`
    case 'r':
      return `linear-gradient(90deg, rgb(0 ${rgb.g} ${rgb.b}), rgb(255 ${rgb.g} ${rgb.b}))`
    case 'g':
      return `linear-gradient(90deg, rgb(${rgb.r} 0 ${rgb.b}), rgb(${rgb.r} 255 ${rgb.b}))`
    case 'blue':
      return `linear-gradient(90deg, rgb(${rgb.r} ${rgb.g} 0), rgb(${rgb.r} ${rgb.g} 255))`
  }
}

export const ColourPickerField: TextFieldClientComponent = ({ field, path }) => {
  const { setValue, value } = useField<null | string>({ path })
  const { getPreference, setPreference } = usePreferences()
  const current = parseColour(value)
  const [isOpen, setIsOpen] = useState(false)
  const [recentColours, setRecentColours] = useState(DEFAULT_COLOURS)
  const [rgb, setRgb] = useState<RGB>(current ?? { b: 0, g: 0, r: 0 })
  const [hexInput, setHexInput] = useState(rgbToHex(current ?? { b: 0, g: 0, r: 0 }))
  const hsb = useMemo(() => rgbToHsb(rgb), [rgb])
  const selectedColour = current ? rgbToHex(current) : null

  useEffect(() => {
    void getPreference<ColourPreferences | string[] | null>(PREFERENCE_KEY).then((saved) => {
      const stored = Array.isArray(saved) ? saved : saved?.colours
      const savedColours = Array.isArray(stored)
        ? stored.filter((colour) => parseColour(colour))
        : null
      const initial = current ? [rgbToHex(current), ...DEFAULT_COLOURS] : DEFAULT_COLOURS
      setRecentColours(uniqueColours(savedColours ?? initial))
    })
    // Preferences only need to load when this field mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateRgb = useCallback((next: RGB) => {
    setRgb(next)
    setHexInput(rgbToHex(next))
  }, [])

  const openEditor = () => {
    const parsed = parseColour(value) ?? { b: 0, g: 0, r: 0 }
    updateRgb(parsed)
    setIsOpen(true)
  }

  const updateHsbChannel = (channel: Channel, nextValue: number) =>
    updateRgb(hsbToRgb({ ...hsb, [channel]: nextValue }))

  const updateRgbChannel = (channel: Channel, nextValue: number) =>
    updateRgb({ ...rgb, [channel]: nextValue })

  const saveRecents = (colours: string[]) => {
    setRecentColours(colours)
    void setPreference<ColourPreferences>(PREFERENCE_KEY, { colours })
  }

  const applyColour = () => {
    const colour = rgbToHex(rgb)
    setValue(colour)
    saveRecents(uniqueColours([colour, ...recentColours]))
    setIsOpen(false)
  }

  const selectRecent = (colour: string) => {
    setValue(colour)
    saveRecents(uniqueColours([colour, ...recentColours]))
  }

  const removeRecent = (colour: string) =>
    saveRecents(recentColours.filter((recent) => recent !== colour))

  const handleHex = (next: string) => {
    setHexInput(next)
    const parsed = hexToRgb(next)
    if (parsed) setRgb(parsed)
  }

  const sliders: Array<{
    channel: Channel
    label: string
    max: number
    type: 'b' | 'blue' | 'g' | 'h' | 'r' | 's'
    value: number
  }> = [
    { channel: 'h', label: 'H', max: 360, type: 'h', value: hsb.h },
    { channel: 's', label: 'S', max: 100, type: 's', value: hsb.s },
    { channel: 'b', label: 'B', max: 100, type: 'b', value: hsb.b },
    { channel: 'r', label: 'R', max: 255, type: 'r', value: rgb.r },
    { channel: 'g', label: 'G', max: 255, type: 'g', value: rgb.g },
    { channel: 'b', label: 'B', max: 255, type: 'blue', value: rgb.b },
  ]

  return (
    <div className={[styles.field, field.admin?.className].filter(Boolean).join(' ')}>
      <FieldLabel label={field.label} path={path} required={field.required} />
      <div className={styles.recentHeader}>Recent colours:</div>
      <div className={styles.recents}>
        {recentColours.map((colour) => (
          <span className={styles.swatchWrap} key={colour}>
            <button
              aria-label={`Use ${colour}`}
              className={styles.swatch}
              onClick={() => selectRecent(colour)}
              style={{ backgroundColor: colour }}
              type="button"
            >
              {selectedColour === colour && <span className={styles.selected}>✓</span>}
            </button>
            <button
              aria-label={`Remove ${colour} from recent colours`}
              className={styles.remove}
              onClick={() => removeRecent(colour)}
              type="button"
            >
              ×
            </button>
          </span>
        ))}
        <button
          aria-label="Add colour"
          className={styles.addButton}
          onClick={openEditor}
          type="button"
        >
          +
        </button>
      </div>

      {isOpen && (
        <div className={styles.editor}>
          <div className={styles.editorLabel}>Add colour:</div>
          <div className={styles.preview} style={{ backgroundColor: rgbToHex(rgb) }} />
          <div className={styles.sliders}>
            {sliders.map((slider, index) => (
              <label className={styles.sliderRow} key={`${slider.type}-${index}`}>
                <span>{slider.label}</span>
                <input
                  aria-label={`${slider.label} ${slider.type}`}
                  max={slider.max}
                  min={0}
                  onChange={(event) =>
                    index < 3
                      ? updateHsbChannel(slider.channel, Number(event.target.value))
                      : updateRgbChannel(slider.channel, Number(event.target.value))
                  }
                  style={{ background: sliderBackground(slider.type, rgb, hsb) }}
                  type="range"
                  value={slider.value}
                />
                <output>{slider.value}</output>
              </label>
            ))}
          </div>
          <div className={styles.footer}>
            <label className={styles.hexField}>
              <span>Hex</span>
              <input
                aria-invalid={!hexToRgb(hexInput)}
                maxLength={7}
                onChange={(event) => handleHex(event.target.value)}
                spellCheck={false}
                value={hexInput}
              />
            </label>
            <div className={styles.actions}>
              {value && (
                <Button
                  buttonStyle="none"
                  onClick={() => {
                    setValue(null)
                    setIsOpen(false)
                  }}
                  size="small"
                  type="button"
                >
                  Clear colour
                </Button>
              )}
              <Button
                buttonStyle="secondary"
                onClick={() => setIsOpen(false)}
                size="small"
                type="button"
              >
                Cancel
              </Button>
              <Button
                disabled={!hexToRgb(hexInput)}
                onClick={applyColour}
                size="small"
                type="button"
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
      {field.admin?.description && (
        <FieldDescription description={field.admin.description} path={path} />
      )}
    </div>
  )
}
