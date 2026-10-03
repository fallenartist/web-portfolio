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
        beforeValidate: [
          ({ data }) => {
            if (!data?.slug && data?.title) {
              return data.title
                .toLowerCase()
                .replace(/[^\w ]+/g, '')
                .replace(/ +/g, '-')
            }
            return data?.slug
          },
        ],
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
