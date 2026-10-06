import type { TextField, TextFieldValidation } from 'payload'
import { normalizeColour } from '@/lib/colour'

export const validateColour: TextFieldValidation = (value) => {
  if (value == null || value === '') return true
  if (typeof value !== 'string' || value.length > 160) return 'Enter a valid CSS colour.'

  return normalizeColour(value) ? true : 'Enter a valid CSS colour.'
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
