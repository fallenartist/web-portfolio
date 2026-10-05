import type { CollectionConfig, Field } from 'payload'

const linkTypeOptions = [
  { label: 'Internal Link', value: 'internal' },
  { label: 'External Link', value: 'external' },
]

const destinationFields = (): Field[] => [
  {
    name: 'internalDestination',
    label: 'Destination',
    type: 'select',
    defaultValue: 'content',
    required: true,
    options: [
      { label: 'Content item', value: 'content' },
      { label: 'Projects overview', value: 'projects' },
    ],
    admin: {
      condition: (_, siblingData) => siblingData.type === 'internal',
    },
  },
  {
    name: 'internalLink',
    type: 'relationship',
    relationTo: ['disciplines', 'projects', 'industries', 'clients', 'agencies', 'tags'],
    admin: {
      condition: (_, siblingData) =>
        siblingData.type === 'internal' &&
        (!siblingData.internalDestination || siblingData.internalDestination === 'content'),
    },
  },
  {
    name: 'externalLink',
    type: 'text',
    admin: {
      condition: (_, siblingData) => siblingData.type === 'external',
    },
  },
  {
    name: 'openInNewTab',
    type: 'checkbox',
    defaultValue: false,
    admin: {
      condition: (_, siblingData) => siblingData.type === 'external',
    },
  },
]

export const Menus: CollectionConfig = {
  slug: 'menus',
  admin: {
    group: 'Globals',
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
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
        },
        {
          name: 'type',
          type: 'select',
          options: [...linkTypeOptions, { label: 'Group heading (no link)', value: 'group' }],
          defaultValue: 'internal',
          required: true,
        },
        ...destinationFields(),
        {
          name: 'subItems',
          label: 'Submenu items',
          type: 'array',
          admin: {
            initCollapsed: true,
          },
          fields: [
            {
              name: 'title',
              type: 'text',
              required: true,
            },
            {
              name: 'type',
              type: 'select',
              options: linkTypeOptions,
              defaultValue: 'internal',
              required: true,
            },
            ...destinationFields(),
          ],
        },
      ],
    },
  ],
}
