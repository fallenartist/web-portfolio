'use client'

import {
  Button,
  ConfirmationModal,
  FieldDescription,
  FieldLabel,
  useField,
  useModal,
  usePreferences,
} from '@payloadcms/ui'
import type { Color } from 'culori'
import type { TextFieldClientComponent } from 'payload'
import { useEffect, useState } from 'react'

import styles from './ColourPicker.module.scss'
import {
  colourAlpha,
  colourKey,
  colourToOklch,
  colourToRgb,
  detectColourFormat,
  formatColour,
  hsbToRgb,
  parseCssColour,
  rgbColour,
  rgbToHex,
  rgbToHsb,
  toSrgbCss,
  withAlpha,
  type ColourFormat,
  type HSB,
  type RGB,
} from './colourUtils'

const PREFERENCE_KEY = 'portfolio-colour-picker-recents-v2'
const DEFAULT_COLOURS = ['#FAC800', '#3200FA', '#FA0032']
const REMOVE_MODAL_SLUG = 'remove-colour-from-palette'
const DEFAULT_COLOUR = parseCssColour('#FF0000')!

type ColourPreferences = { colours: string[] }
type EditorMode = 'add' | 'edit'
type ColourDocument = { color?: null | string; title?: string }
type CollectionResponse = { docs?: ColourDocument[] }
type AppearanceResponse = Record<string, unknown>

const uniqueColours = (values: string[]) => {
  const seen = new Set<string>()
  return values.filter((value) => {
    const key = colourKey(value)
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

const round = (value: number, places = 3) => Number(value.toFixed(places))

const sameColour = (left?: null | string, right?: null | string) => {
  const leftKey = colourKey(left)
  return Boolean(leftKey && leftKey === colourKey(right))
}

const appearanceColourUsage = (
  value: AppearanceResponse,
  selected: string,
  parentPath = 'Appearance',
): string[] =>
  Object.entries(value).flatMap(([key, child]) => {
    const path = `${parentPath} / ${key}`
    if (typeof child === 'string' && /color$/i.test(key) && sameColour(child, selected)) {
      return [path]
    }
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      return appearanceColourUsage(child as AppearanceResponse, selected, path)
    }
    return []
  })

const hsbSliderBackground = (type: 'b' | 'blue' | 'g' | 'h' | 'r' | 's', rgb: RGB, hsb: HSB) => {
  switch (type) {
    case 'h':
      return `linear-gradient(90deg, ${[0, 60, 120, 180, 240, 300, 360]
        .map((hue) => rgbToHex(hsbToRgb({ ...hsb, h: hue })))
        .join(', ')})`
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

const oklchSliderBackground = (type: 'c' | 'h' | 'l', colour: Color) => {
  const oklch = colourToOklch(colour)
  const alpha = colourAlpha(colour)
  if (type === 'l') {
    return `linear-gradient(90deg, ${[0, 0.25, 0.5, 0.75, 1]
      .map((l) => formatColour({ ...oklch, l, alpha }, 'oklch'))
      .join(', ')})`
  }
  if (type === 'c') {
    return `linear-gradient(90deg, ${[0, 0.125, 0.25, 0.375, 0.5]
      .map((c) => formatColour({ ...oklch, c, alpha }, 'oklch'))
      .join(', ')})`
  }
  return `linear-gradient(90deg, ${[0, 60, 120, 180, 240, 300, 360]
    .map((h) => formatColour({ ...oklch, h, alpha }, 'oklch'))
    .join(', ')})`
}

export const ColourPickerField: TextFieldClientComponent = ({ field, path }) => {
  const { setValue, value } = useField<null | string>({ path })
  const { getPreference, setPreference } = usePreferences()
  const { closeModal, openModal } = useModal()
  const assignedColour = parseCssColour(value)
  const [isOpen, setIsOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('add')
  const [recentColours, setRecentColours] = useState(DEFAULT_COLOURS)
  const [selectedPaletteColour, setSelectedPaletteColour] = useState<null | string>(null)
  const [activeColour, setActiveColour] = useState<Color>(assignedColour ?? DEFAULT_COLOUR)
  const [colourInput, setColourInput] = useState(value || '#FF0000')
  const [format, setFormat] = useState<ColourFormat>(detectColourFormat(value || '#FF0000'))
  const [hsbHue, setHsbHue] = useState(0)
  const [oklchHue, setOklchHue] = useState(0)
  const [isCheckingUsage, setIsCheckingUsage] = useState(false)
  const [removeWarning, setRemoveWarning] = useState('')
  const hasSelectedSwatch = Boolean(
    selectedPaletteColour && recentColours.includes(selectedPaletteColour),
  )
  const parsedInput = parseCssColour(colourInput)
  const rgb = colourToRgb(activeColour)
  const convertedHsb = rgbToHsb(rgb)
  const hsb = {
    ...convertedHsb,
    h: convertedHsb.s === 0 || convertedHsb.b === 0 ? hsbHue : convertedHsb.h,
  }
  const convertedOklch = colourToOklch(activeColour)
  const oklch = { ...convertedOklch, h: convertedOklch.h ?? oklchHue }
  const alpha = colourAlpha(activeColour)
  const wideGamutCss = parsedInput ? colourInput.trim() : formatColour(activeColour, format)
  const fallbackCss = toSrgbCss(activeColour)

  useEffect(() => {
    void getPreference<ColourPreferences | string[] | null>(PREFERENCE_KEY).then((saved) => {
      const stored = Array.isArray(saved) ? saved : saved?.colours
      const savedColours = Array.isArray(stored)
        ? stored.filter((colour) => parseCssColour(colour))
        : null
      const assigned = value && parseCssColour(value) ? [value] : []
      setRecentColours(uniqueColours([...assigned, ...(savedColours ?? DEFAULT_COLOURS)]))
    })
    // Preferences only need to load when this field mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const syncHueMemory = (colour: Color) => {
    const nextHsb = rgbToHsb(colourToRgb(colour))
    const nextOklch = colourToOklch(colour)
    if (nextHsb.s > 0 && nextHsb.b > 0) setHsbHue(nextHsb.h)
    if (nextOklch.h !== undefined) setOklchHue(nextOklch.h)
  }

  const updateColour = (colour: Color, nextFormat = format) => {
    setActiveColour(colour)
    syncHueMemory(colour)
    setColourInput(formatColour(colour, nextFormat))
  }

  const openEditor = (mode: EditorMode) => {
    const source = mode === 'edit' ? selectedPaletteColour : '#FF0000'
    const next = parseCssColour(source) ?? DEFAULT_COLOUR
    const nextFormat = detectColourFormat(source)
    setEditorMode(mode)
    setFormat(nextFormat)
    setActiveColour(next)
    setColourInput(source || '#FF0000')
    syncHueMemory(next)
    setIsOpen(true)
  }

  const updateHsbChannel = (channel: keyof HSB, nextValue: number) => {
    const nextHsb = { ...hsb, [channel]: nextValue }
    if (channel === 'h') setHsbHue(nextValue)
    updateColour(rgbColour(hsbToRgb(nextHsb), alpha))
  }

  const updateRgbChannel = (channel: keyof RGB, nextValue: number) =>
    updateColour(rgbColour({ ...rgb, [channel]: nextValue }, alpha))

  const updateOklchChannel = (channel: 'c' | 'h' | 'l', nextValue: number) => {
    if (channel === 'h') setOklchHue(nextValue)
    updateColour({ ...oklch, [channel]: nextValue, alpha })
  }

  const updateAlpha = (nextValue: number) => updateColour(withAlpha(activeColour, nextValue / 100))

  const changeFormat = (nextFormat: ColourFormat) => {
    setFormat(nextFormat)
    setColourInput(formatColour(activeColour, nextFormat))
  }

  const handleCssInput = (next: string) => {
    setColourInput(next)
    const parsed = parseCssColour(next)
    if (!parsed) return
    setActiveColour(parsed)
    setFormat(detectColourFormat(next))
    syncHueMemory(parsed)
  }

  const saveRecents = (colours: string[]) => {
    const unique = uniqueColours(colours)
    setRecentColours(unique)
    void setPreference<ColourPreferences>(PREFERENCE_KEY, { colours: unique })
  }

  const applyColour = () => {
    if (!parsedInput) return
    const colour = colourInput.trim()
    if (editorMode === 'edit' && selectedPaletteColour) {
      const wasAssigned = sameColour(value, selectedPaletteColour)
      saveRecents(
        recentColours.map((recent) => (recent === selectedPaletteColour ? colour : recent)),
      )
      if (wasAssigned) setValue(colour)
    } else {
      saveRecents([colour, ...recentColours])
    }
    setSelectedPaletteColour(colour)
    setIsOpen(false)
  }

  const assignSelected = () => {
    if (selectedPaletteColour) setValue(selectedPaletteColour)
  }

  const removeSelected = () => {
    if (!selectedPaletteColour) return
    saveRecents(recentColours.filter((recent) => recent !== selectedPaletteColour))
    setSelectedPaletteColour(null)
    setIsOpen(false)
    closeModal(REMOVE_MODAL_SLUG)
  }

  const checkUsageAndRemove = async () => {
    if (!selectedPaletteColour) return
    setIsCheckingUsage(true)
    try {
      const endpoints = ['disciplines', 'industries'].map((collection) =>
        fetch(`/api/${collection}?limit=1000&depth=0&select[color]=true&select[title]=true`).then(
          async (response) => {
            if (!response.ok) throw new Error(`Could not check ${collection}`)
            return { collection, response: (await response.json()) as CollectionResponse }
          },
        ),
      )
      const [results, appearance] = await Promise.all([
        Promise.all(endpoints),
        fetch('/api/globals/appearance?depth=0').then(async (response) => {
          if (!response.ok) throw new Error('Could not check Appearance')
          return (await response.json()) as AppearanceResponse
        }),
      ])
      const usage = results.flatMap(({ collection, response }) =>
        (response.docs ?? [])
          .filter((document) => sameColour(document.color, selectedPaletteColour))
          .map((document) => `${document.title ?? 'Untitled'} (${collection})`),
      )
      usage.push(...appearanceColourUsage(appearance, selectedPaletteColour))
      if (usage.length === 0) {
        removeSelected()
        return
      }
      setRemoveWarning(
        `This colour is used by ${usage.length} item${usage.length === 1 ? '' : 's'}: ${usage.join(', ')}. Removing it from the palette will not change other saved items.`,
      )
    } catch {
      setRemoveWarning(
        'Usage could not be checked. Removing this colour from the palette will not change any saved disciplines or industries.',
      )
    } finally {
      setIsCheckingUsage(false)
    }
    openModal(REMOVE_MODAL_SLUG)
  }

  const hsbSliders = [
    { channel: 'h' as const, label: 'H', max: 360, type: 'h' as const, value: hsb.h },
    { channel: 's' as const, label: 'S', max: 100, type: 's' as const, value: hsb.s },
    { channel: 'b' as const, label: 'B', max: 100, type: 'b' as const, value: hsb.b },
  ]
  const rgbSliders = [
    { channel: 'r' as const, label: 'R', type: 'r' as const, value: rgb.r },
    { channel: 'g' as const, label: 'G', type: 'g' as const, value: rgb.g },
    { channel: 'b' as const, label: 'B', type: 'blue' as const, value: rgb.b },
  ]
  const oklchSliders = [
    { channel: 'l' as const, label: 'L', max: 1, step: 0.001, value: round(oklch.l) },
    { channel: 'c' as const, label: 'C', max: 0.5, step: 0.001, value: round(oklch.c) },
    { channel: 'h' as const, label: 'H', max: 360, step: 1, value: Math.round(oklch.h) },
  ]

  return (
    <div className={[styles.field, field.admin?.className].filter(Boolean).join(' ')}>
      <FieldLabel label={field.label} path={path} required={field.required} />
      <div className={styles.recentHeader}>Recent colours:</div>
      <div className={styles.recents}>
        {recentColours.map((colour) => (
          <button
            aria-label={`Choose ${colour} for palette actions`}
            aria-pressed={selectedPaletteColour === colour}
            className={[styles.swatch, selectedPaletteColour === colour && styles.swatchSelected]
              .filter(Boolean)
              .join(' ')}
            key={`${colourKey(colour)}-${colour}`}
            onClick={() => setSelectedPaletteColour(colour)}
            style={{ backgroundColor: colour }}
            type="button"
          >
            {sameColour(value, colour) && <span className={styles.assigned}>✓</span>}
          </button>
        ))}
      </div>
      <div className={styles.paletteActions}>
        <Button disabled={!hasSelectedSwatch} onClick={assignSelected} size="small" type="button">
          Select
        </Button>
        <Button
          buttonStyle="secondary"
          disabled={!hasSelectedSwatch}
          onClick={() => openEditor('edit')}
          size="small"
          type="button"
        >
          Edit
        </Button>
        <Button
          buttonStyle="secondary"
          disabled={!hasSelectedSwatch || isCheckingUsage}
          onClick={() => void checkUsageAndRemove()}
          size="small"
          type="button"
        >
          {isCheckingUsage ? 'Checking…' : 'Remove'}
        </Button>
        <Button onClick={() => openEditor('add')} size="small" type="button">
          Add
        </Button>
      </div>

      {isOpen && (
        <div className={styles.editor}>
          <div className={styles.editorLabel}>
            {editorMode === 'edit' ? 'Edit colour:' : 'Add colour:'}
          </div>
          <div className={styles.previews}>
            <figure className={styles.preview}>
              <div className={styles.previewColour} style={{ backgroundColor: wideGamutCss }} />
              <figcaption>Wide gamut</figcaption>
            </figure>
            <figure className={styles.preview}>
              <div className={styles.previewColour} style={{ backgroundColor: fallbackCss }} />
              <figcaption>sRGB fallback</figcaption>
            </figure>
          </div>
          <div className={styles.sliders}>
            <fieldset className={styles.sliderGroup}>
              <legend>HSB</legend>
              {hsbSliders.map((slider) => (
                <label className={styles.sliderRow} key={`hsb-${slider.channel}`}>
                  <span>{slider.label}</span>
                  <input
                    aria-label={`HSB ${slider.label}`}
                    max={slider.max}
                    min={0}
                    onChange={(event) =>
                      updateHsbChannel(slider.channel, Number(event.target.value))
                    }
                    style={{ background: hsbSliderBackground(slider.type, rgb, hsb) }}
                    type="range"
                    value={slider.value}
                  />
                  <output>{slider.value}</output>
                </label>
              ))}
            </fieldset>
            <fieldset className={styles.sliderGroup}>
              <legend>RGB</legend>
              {rgbSliders.map((slider) => (
                <label className={styles.sliderRow} key={`rgb-${slider.channel}`}>
                  <span>{slider.label}</span>
                  <input
                    aria-label={`RGB ${slider.label}`}
                    max={255}
                    min={0}
                    onChange={(event) =>
                      updateRgbChannel(slider.channel, Number(event.target.value))
                    }
                    style={{ background: hsbSliderBackground(slider.type, rgb, hsb) }}
                    type="range"
                    value={slider.value}
                  />
                  <output>{slider.value}</output>
                </label>
              ))}
            </fieldset>
            <fieldset className={styles.sliderGroup}>
              <legend>OKLCH</legend>
              {oklchSliders.map((slider) => (
                <label className={styles.sliderRow} key={`oklch-${slider.channel}`}>
                  <span>{slider.label}</span>
                  <input
                    aria-label={`OKLCH ${slider.label}`}
                    max={slider.max}
                    min={0}
                    onChange={(event) =>
                      updateOklchChannel(slider.channel, Number(event.target.value))
                    }
                    step={slider.step}
                    style={{ background: oklchSliderBackground(slider.channel, activeColour) }}
                    type="range"
                    value={slider.value}
                  />
                  <output>{slider.value}</output>
                </label>
              ))}
            </fieldset>
          </div>
          <label className={styles.alphaRow}>
            <span>Alpha</span>
            <input
              aria-label="Alpha"
              max={100}
              min={0}
              onChange={(event) => updateAlpha(Number(event.target.value))}
              style={{
                background: `linear-gradient(90deg, transparent, ${formatColour(withAlpha(activeColour, 1), 'css')})`,
              }}
              type="range"
              value={Math.round(alpha * 100)}
            />
            <output>{Math.round(alpha * 100)}%</output>
          </label>
          <div className={styles.footer}>
            <label className={styles.cssField}>
              <span>CSS colour</span>
              <input
                aria-invalid={!parsedInput}
                aria-label="CSS colour"
                onChange={(event) => handleCssInput(event.target.value)}
                spellCheck={false}
                value={colourInput}
              />
            </label>
            <label className={styles.formatField}>
              <span>Format</span>
              <select
                aria-label="Colour format"
                onChange={(event) => changeFormat(event.target.value as ColourFormat)}
                value={format}
              >
                <option value="css">CSS / original</option>
                <option value="hex">Hex</option>
                <option value="rgb">RGB</option>
                <option value="hsl">HSL</option>
                <option value="oklch">OKLCH</option>
              </select>
            </label>
            <div className={styles.actions}>
              <Button
                buttonStyle="secondary"
                onClick={() => setIsOpen(false)}
                size="small"
                type="button"
              >
                Cancel
              </Button>
              <Button disabled={!parsedInput} onClick={applyColour} size="small" type="button">
                {editorMode === 'edit' ? 'Save' : 'Add'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {field.admin?.description && (
        <FieldDescription description={field.admin.description} path={path} />
      )}
      <ConfirmationModal
        body={removeWarning}
        confirmLabel="Remove"
        heading="Remove colour?"
        modalSlug={REMOVE_MODAL_SLUG}
        onConfirm={removeSelected}
      />
    </div>
  )
}
