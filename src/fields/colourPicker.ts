import type { TextField, TextFieldValidation } from 'payload'

const colourFunction = /^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\([^;{}]+\)$/i
const namedColour = /^[a-z]+$/i
const hexColour = /^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i

export const validateColour: TextFieldValidation = (value) => {
  if (value == null || value === '') return true
  if (typeof value !== 'string' || value.length > 160) return 'Enter a valid CSS colour.'

  const colour = value.trim()
  return hexColour.test(colour) || colourFunction.test(colour) || namedColour.test(colour)
    ? true
    : 'Enter a valid CSS colour.'
}

type ColourPickerFieldOptions = {
  description: string
}

export const colourPickerField = ({ description }: ColourPickerFieldOptions): TextField => ({
  name: 'color',
  label: 'Colour',
  type: 'text',
  validate: validateColour,
  admin: {
    description,
    components: {
      Cell: '/components/admin/ColourPicker/ColourPickerCell#ColourPickerCell',
      Field: '/components/admin/ColourPicker/ColourPickerField#ColourPickerField',
    },
  },
})
