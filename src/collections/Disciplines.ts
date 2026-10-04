import type { CollectionConfig } from 'payload'

import { colourPickerField } from '@/fields/colourPicker'

export const Disciplines: CollectionConfig = {
  slug: 'disciplines',
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
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
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
      description: 'Colour used for this discipline in the treemap and project navigation.',
    }),
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'disciplines',
      admin: {
        position: 'sidebar',
        description: 'Optional parent discipline for hierarchical organization',
      },
    },
    {
      name: 'priority',
      type: 'number',
      defaultValue: 100,
      admin: {
        position: 'sidebar',
        description: 'Higher values appear larger in the treemap (default: 100)',
      },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Thumbnail image for the discipline',
      },
    },
  ],
}
