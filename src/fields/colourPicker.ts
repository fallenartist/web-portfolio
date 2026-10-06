import type { TextField, TextFieldSingleValidation } from 'payload'
import { normalizeColour } from '@/lib/colour'

export const validateColour: TextFieldSingleValidation = (value) => {
  if (value == null || value === '') return true
  if (typeof value !== 'string' || value.length > 160) return 'Enter a valid CSS colour.'

  return normalizeColour(value) ? true : 'Enter a valid CSS colour.'
}

type ColourPickerFieldOptions = {
  description: string
}

type SingleColourTextField = Omit<TextField, 'hasMany' | 'maxRows' | 'minRows' | 'validate'> & {
  hasMany?: false
}

export const cssColourField = (field: SingleColourTextField): TextField =>
  ({
    ...field,
    hasMany: false,
    validate: validateColour,
    admin: {
      ...field.admin,
      components: {
        ...field.admin?.components,
        Cell:
          field.admin?.components?.Cell ||
          '/components/admin/ColourPicker/ColourPickerCell#ColourPickerCell',
        Field:
          field.admin?.components?.Field ||
          '/components/admin/ColourPicker/ColourPickerField#ColourPickerField',
      },
    },
  }) as TextField

export const colourPickerField = ({ description }: ColourPickerFieldOptions): TextField =>
  cssColourField({
    name: 'color',
    label: 'Colour',
    type: 'text',
    admin: {
      description,
    },
  })
