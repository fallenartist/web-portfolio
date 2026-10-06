const cssColourFunction =
  /^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\([^;{}]+\)$/i
const hexColour = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i
const namedColour = /^[a-z]+$/i

export function normalizeColour(value: null | string | undefined): string | null {
  if (typeof value !== 'string' || value.length > 160) return null
  const colour = value.trim()
  if (!colour) return null
  return hexColour.test(colour) || cssColourFunction.test(colour) || namedColour.test(colour)
    ? colour
    : null
}
