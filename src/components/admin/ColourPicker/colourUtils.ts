export type RGB = { b: number; g: number; r: number }
export type HSB = { b: number; h: number; s: number }

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

export const parseColour = (value?: null | string): RGB | null => {
  if (!value) return null
  const hex = hexToRgb(value)
  if (hex) return hex

  const rgb = /^rgba?\(\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)\s*[, ]\s*(\d+(?:\.\d+)?)/i.exec(
    value,
  )
  if (rgb)
    return {
      r: clamp(Number(rgb[1]), 0, 255),
      g: clamp(Number(rgb[2]), 0, 255),
      b: clamp(Number(rgb[3]), 0, 255),
    }

  if (typeof document !== 'undefined' && CSS.supports('color', value)) {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('2d')
    if (context) {
      context.fillStyle = '#000000'
      context.fillStyle = value
      return hexToRgb(context.fillStyle)
    }
  }

  return null
}
