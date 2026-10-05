import type { CollectionConfig } from 'payload'

export const Agencies: CollectionConfig = {
  slug: 'agencies',
  labels: {
    singular: 'Agency',
    plural: 'Agencies',
  },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'updatedAt'],
    description: 'Studios or agencies through which projects were commissioned.',
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
      admin: { position: 'sidebar' },
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
  ],
}
