import { stableSlug } from '@/fields/stable-slug'
import type { CollectionConfig } from 'payload'

import { colourPickerField } from '@/fields/colourPicker'

export const Industries: CollectionConfig = {
  slug: 'industries',
  labels: {
    singular: 'Industry',
    plural: 'Industries',
  },
  admin: {
    defaultColumns: ['title', 'color', 'parent', 'updatedAt'],
    group: 'Content',
    useAsTitle: 'title',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      localized: true,
      required: true,
      index: true,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
      },
      hooks: {
        beforeValidate: [stableSlug],
      },
    },
    colourPickerField({
      description: 'Colour assigned to this industry for menus and future visual grouping.',
    }),
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'industries',
      admin: {
        position: 'sidebar',
        description: 'Optional parent industry for hierarchical organisation',
      },
    },
  ],
}
