import {
  converter,
  formatCss,
  formatHex,
  formatHex8,
  formatHsl,
  formatRgb,
  parse,
  toGamut,
  type Color,
  type Oklch,
} from 'culori'

export type RGB = { b: number; g: number; r: number }
export type HSB = { b: number; h: number; s: number }
export type ColourFormat = 'css' | 'hex' | 'hsl' | 'oklch' | 'rgb'

const toRgb = converter('rgb')
const toOklch = converter('oklch')
const mapToSrgb = toGamut('rgb', 'oklch')

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, Math.round(value)))

export const rgbToHex = ({ r, g, b }: RGB) =>
  `#${[r, g, b]
    .map((channel) => clamp(channel, 0, 255).toString(16).padStart(2, '0'))
    .join('')}`.toUpperCase()

export const hexToRgb = (value: string): RGB | null => {
  const short = /^#([\da-f])([\da-f])([\da-f])$/i.exec(value.trim())
  const full = /^#([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(value.trim())
  const parts = short ? short.slice(1).map((part) => `${part}${part}`) : full?.slice(1)
  if (!parts) return null
  return { r: parseInt(parts[0], 16), g: parseInt(parts[1], 16), b: parseInt(parts[2], 16) }
}

export const rgbToHsb = ({ r, g, b }: RGB): HSB => {
  const red = clamp(r, 0, 255) / 255
  const green = clamp(g, 0, 255) / 255
  const blue = clamp(b, 0, 255) / 255
  const maximum = Math.max(red, green, blue)
  const minimum = Math.min(red, green, blue)
  const delta = maximum - minimum
  let hue = 0

  if (delta) {
    if (maximum === red) hue = 60 * (((green - blue) / delta) % 6)
    else if (maximum === green) hue = 60 * ((blue - red) / delta + 2)
    else hue = 60 * ((red - green) / delta + 4)
  }

  if (hue < 0) hue += 360
  return {
    b: Math.round(maximum * 100),
    h: Math.round(hue),
    s: maximum === 0 ? 0 : Math.round((delta / maximum) * 100),
  }
}

export const hsbToRgb = ({ h, s, b }: HSB): RGB => {
  const hue = ((h % 360) + 360) % 360
  const saturation = clamp(s, 0, 100) / 100
  const brightness = clamp(b, 0, 100) / 100
  const chroma = brightness * saturation
  const section = hue / 60
  const x = chroma * (1 - Math.abs((section % 2) - 1))
  const offset = brightness - chroma
  let channels: [number, number, number]

  if (section < 1) channels = [chroma, x, 0]
  else if (section < 2) channels = [x, chroma, 0]
  else if (section < 3) channels = [0, chroma, x]
  else if (section < 4) channels = [0, x, chroma]
  else if (section < 5) channels = [x, 0, chroma]
  else channels = [chroma, 0, x]

  return {
    b: Math.round((channels[2] + offset) * 255),
    g: Math.round((channels[1] + offset) * 255),
    r: Math.round((channels[0] + offset) * 255),
  }
}

export const parseCssColour = (value?: null | string): Color | null => {
  if (!value) return null
  return parse(value.trim()) ?? null
}

export const detectColourFormat = (value?: null | string): ColourFormat => {
  const colour = value?.trim().toLowerCase() ?? ''
  if (colour.startsWith('#')) return 'hex'
  if (colour.startsWith('rgb')) return 'rgb'
  if (colour.startsWith('hsl')) return 'hsl'
  if (colour.startsWith('oklch')) return 'oklch'
  return 'css'
}

export const toSrgbColour = (colour: Color): Color => {
  const rgb = toRgb(colour)
  if (rgb && rgb.r >= 0 && rgb.r <= 1 && rgb.g >= 0 && rgb.g <= 1 && rgb.b >= 0 && rgb.b <= 1) {
    return rgb
  }
  return mapToSrgb(colour)
}

export const toSrgbCss = (colour: Color) => formatRgb(toSrgbColour(colour))

export const colourToRgb = (colour: Color): RGB => {
  const rgb = toRgb(toSrgbColour(colour))
  return {
    r: clamp((rgb?.r ?? 0) * 255, 0, 255),
    g: clamp((rgb?.g ?? 0) * 255, 0, 255),
    b: clamp((rgb?.b ?? 0) * 255, 0, 255),
  }
}

export const colourToOklch = (colour: Color): Oklch =>
  toOklch(colour) ?? { mode: 'oklch', l: 0, c: 0, h: 0 }

export const colourAlpha = (colour: Color) => colour.alpha ?? 1

export const withAlpha = (colour: Color, alpha: number): Color => ({
  ...colour,
  alpha: Math.min(1, Math.max(0, alpha)),
})

export const rgbColour = (rgb: RGB, alpha = 1): Color => ({
  mode: 'rgb',
  r: Math.min(255, Math.max(0, rgb.r)) / 255,
  g: Math.min(255, Math.max(0, rgb.g)) / 255,
  b: Math.min(255, Math.max(0, rgb.b)) / 255,
  alpha,
})

const withoutOpaqueAlpha = (colour: Color): Color => {
  if (colour.alpha === undefined || colour.alpha < 1) return colour
  const { alpha: _alpha, ...opaque } = colour
  return opaque as Color
}

export const formatColour = (colour: Color, format: ColourFormat): string => {
  if (format === 'hex') {
    const fallback = toSrgbColour(colour)
    return colourAlpha(colour) < 1 ? formatHex8(fallback) : formatHex(fallback)
  }
  if (format === 'rgb') return formatRgb(toSrgbColour(colour))
  if (format === 'hsl') return formatHsl(toSrgbColour(colour))
  if (format === 'oklch') return formatCss(withoutOpaqueAlpha(colourToOklch(colour)))
  return formatCss(withoutOpaqueAlpha(colour))
}

export const colourKey = (value?: Color | null | string): string | null => {
  const colour = typeof value === 'string' ? parseCssColour(value) : value
  if (!colour) return null
  const oklch = colourToOklch(colour)
  return [oklch.l, oklch.c, oklch.h ?? 0, colourAlpha(oklch)]
    .map((channel) => channel.toFixed(6))
    .join(':')
}

export const parseColour = (value?: null | string): RGB | null => {
  const colour = parseCssColour(value)
  return colour ? colourToRgb(colour) : null
}
