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
import type { TextFieldClientComponent } from 'payload'
import { useCallback, useEffect, useState } from 'react'

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
const REMOVE_MODAL_SLUG = 'remove-colour-from-palette'

type Channel = keyof HSB | keyof RGB
type ColourPreferences = { colours: string[] }
type EditorMode = 'add' | 'edit'
type ColourDocument = { color?: null | string; title?: string }
type CollectionResponse = { docs?: ColourDocument[] }

const uniqueColours = (values: string[]) => [...new Set(values.map((value) => value.toUpperCase()))]

const hexInputToRgb = (value: string) => (value.length === 6 ? hexToRgb(`#${value}`) : null)

const sliderBackground = (type: 'b' | 'blue' | 'g' | 'h' | 'r' | 's', rgb: RGB, hsb: HSB) => {
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

export const ColourPickerField: TextFieldClientComponent = ({ field, path }) => {
  const { setValue, value } = useField<null | string>({ path })
  const { getPreference, setPreference } = usePreferences()
  const { closeModal, openModal } = useModal()
  const current = parseColour(value)
  const [isOpen, setIsOpen] = useState(false)
  const [editorMode, setEditorMode] = useState<EditorMode>('add')
  const [recentColours, setRecentColours] = useState(DEFAULT_COLOURS)
  const [selectedPaletteColour, setSelectedPaletteColour] = useState<null | string>(null)
  const initialRgb = current ?? { b: 0, g: 0, r: 255 }
  const [rgb, setRgb] = useState<RGB>(initialRgb)
  const [hsb, setHsb] = useState<HSB>(rgbToHsb(initialRgb))
  const [hexInput, setHexInput] = useState(rgbToHex(initialRgb).slice(1))
  const [isCheckingUsage, setIsCheckingUsage] = useState(false)
  const [removeWarning, setRemoveWarning] = useState('')
  const assignedColour = current ? rgbToHex(current) : null
  const hasSelectedSwatch = Boolean(
    selectedPaletteColour && recentColours.includes(selectedPaletteColour),
  )

  useEffect(() => {
    void getPreference<ColourPreferences | string[] | null>(PREFERENCE_KEY).then((saved) => {
      const stored = Array.isArray(saved) ? saved : saved?.colours
      const savedColours = Array.isArray(stored)
        ? stored.filter((colour) => parseColour(colour))
        : null
      const assigned = current ? [rgbToHex(current)] : []
      setRecentColours(uniqueColours([...assigned, ...(savedColours ?? DEFAULT_COLOURS)]))
    })
    // Preferences only need to load when this field mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const updateRgb = useCallback(
    (next: RGB) => {
      const converted = rgbToHsb(next)
      // Hue is undefined for black and grey. Retain it so the hue control can be
      // moved first, before saturation or brightness gives it a visible colour.
      if (converted.s === 0 || converted.b === 0) converted.h = hsb.h
      setRgb(next)
      setHsb(converted)
      setHexInput(rgbToHex(next).slice(1))
    },
    [hsb.h],
  )

  const openEditor = (mode: EditorMode) => {
    const parsed = mode === 'edit' ? parseColour(selectedPaletteColour) : null
    const next = parsed ?? { b: 0, g: 0, r: 255 }
    setEditorMode(mode)
    setHsb(rgbToHsb(next))
    setRgb(next)
    setHexInput(rgbToHex(next).slice(1))
    setIsOpen(true)
  }

  const updateHsbChannel = (channel: Channel, nextValue: number) => {
    const next = { ...hsb, [channel]: nextValue }
    const nextRgb = hsbToRgb(next)
    setHsb(next)
    setRgb(nextRgb)
    setHexInput(rgbToHex(nextRgb).slice(1))
  }

  const updateRgbChannel = (channel: Channel, nextValue: number) =>
    updateRgb({ ...rgb, [channel]: nextValue })

  const saveRecents = (colours: string[]) => {
    setRecentColours(colours)
    void setPreference<ColourPreferences>(PREFERENCE_KEY, { colours })
  }

  const applyColour = () => {
    const colour = rgbToHex(rgb)
    if (editorMode === 'edit' && selectedPaletteColour) {
      const wasAssigned = assignedColour === selectedPaletteColour
      saveRecents(
        uniqueColours(
          recentColours.map((recent) => (recent === selectedPaletteColour ? colour : recent)),
        ),
      )
      if (wasAssigned) setValue(colour)
    } else {
      saveRecents(uniqueColours([colour, ...recentColours]))
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
      const endpoints = ['categories', 'industries'].map((collection) =>
        fetch(`/api/${collection}?limit=1000&depth=0&select[color]=true&select[title]=true`).then(
          async (response) => {
            if (!response.ok) throw new Error(`Could not check ${collection}`)
            return { collection, response: (await response.json()) as CollectionResponse }
          },
        ),
      )
      const results = await Promise.all(endpoints)
      const usage = results.flatMap(({ collection, response }) =>
        (response.docs ?? [])
          .filter((document) => {
            const parsed = parseColour(document.color)
            return parsed && rgbToHex(parsed) === selectedPaletteColour
          })
          .map((document) => `${document.title ?? 'Untitled'} (${collection})`),
      )

      if (usage.length === 0) {
        removeSelected()
        return
      }

      setRemoveWarning(
        `This colour is used by ${usage.length} item${usage.length === 1 ? '' : 's'}: ${usage.join(', ')}. Removing it from the palette will not change other saved items.`,
      )
    } catch {
      setRemoveWarning(
        'Usage could not be checked. Removing this colour from the palette will not change any saved categories or industries.',
      )
    } finally {
      setIsCheckingUsage(false)
    }

    openModal(REMOVE_MODAL_SLUG)
  }

  const handleHex = (next: string) => {
    const cleaned = next
      .replace(/#/g, '')
      .replace(/[^\da-f]/gi, '')
      .slice(0, 6)
      .toUpperCase()
    setHexInput(cleaned)
    const parsed = hexInputToRgb(cleaned)
    if (parsed) updateRgb(parsed)
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
          <button
            aria-label={`Choose ${colour} for palette actions`}
            aria-pressed={selectedPaletteColour === colour}
            className={[styles.swatch, selectedPaletteColour === colour && styles.swatchSelected]
              .filter(Boolean)
              .join(' ')}
            key={colour}
            onClick={() => setSelectedPaletteColour(colour)}
            style={{ backgroundColor: colour }}
            type="button"
          >
            {assignedColour === colour && <span className={styles.assigned}>✓</span>}
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
              <span className={styles.hexInputWrap}>
                <span aria-hidden="true">#</span>
                <input
                  aria-invalid={!hexInputToRgb(hexInput)}
                  aria-label="Hex colour"
                  maxLength={7}
                  onChange={(event) => handleHex(event.target.value)}
                  spellCheck={false}
                  value={hexInput}
                />
              </span>
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
              <Button
                disabled={!hexInputToRgb(hexInput)}
                onClick={applyColour}
                size="small"
                type="button"
              >
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
