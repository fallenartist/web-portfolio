import type { CollectionConfig } from 'payload'
import { lexicalEditor, TextStateFeature } from '@payloadcms/richtext-lexical'
import { validateVideoURL } from '@/lib/video-embed'
import { stripProjectCreateID } from '@/collections/hooks/strip-project-create-id'

const projectTextEditor = lexicalEditor({
  features: ({ rootFeatures }) => [
    ...rootFeatures,
    TextStateFeature({
      state: {
        fontFeatures: {
          allSmallCaps: {
            label: 'All Small Caps',
            css: {
              'font-feature-settings': '"smcp" 1, "c2sc" 1',
            },
          },
        },
      },
    }),
  ],
})

const videoOptions = [
  {
    name: 'autoplay',
    type: 'checkbox' as const,
    defaultValue: false,
    admin: {
      description: 'Starts automatically when the video enters the page. Autoplay is always muted.',
    },
  },
  { name: 'loop', type: 'checkbox' as const, defaultValue: false },
  { name: 'muted', type: 'checkbox' as const, defaultValue: false },
  { name: 'controls', type: 'checkbox' as const, defaultValue: true },
]

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'discipline', 'industries', 'priority', 'updatedAt'],
  },
  access: { read: () => true },
  hooks: {
    beforeValidate: [stripProjectCreateID],
  },
  fields: [
    { name: 'title', type: 'text', required: true, index: true },
    {
      name: 'description',
      type: 'richText',
      editor: projectTextEditor,
      admin: { description: 'Shown below the hero, alongside the project title' },
    },
    {
      name: 'thumbnail',
      type: 'upload',
      relationTo: 'media',
      admin: { description: 'Small preview image used in the treemap' },
    },
    {
      name: 'hero',
      type: 'group',
      admin: {
        description:
          'The opening image or video. Video cover images also represent the project in transitions.',
      },
      fields: [
        {
          name: 'type',
          type: 'radio',
          defaultValue: 'image',
          required: true,
          options: [
            { label: 'Image', value: 'image' },
            { label: 'Video', value: 'video' },
          ],
        },
        {
          name: 'image',
          label: 'Hero image',
          type: 'upload',
          relationTo: 'media',
          validate: (value: unknown, { siblingData }: { siblingData?: { type?: string } }) =>
            siblingData?.type !== 'image' || value ? true : 'Choose a hero image.',
          admin: { condition: (_, siblingData) => siblingData?.type !== 'video' },
        },
        {
          name: 'videoURL',
          label: 'Vimeo URL',
          type: 'text',
          validate: (
            value: null | string | undefined,
            { siblingData }: { siblingData?: { type?: string } },
          ) => {
            if (siblingData?.type !== 'video') return true
            return value ? validateVideoURL(value) : 'Enter a Vimeo URL.'
          },
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'video',
            description: 'Paste a normal Vimeo share URL',
          },
        },
        {
          name: 'videoCover',
          label: 'Video cover image',
          type: 'upload',
          relationTo: 'media',
          validate: (value: unknown, { siblingData }: { siblingData?: { type?: string } }) =>
            siblingData?.type !== 'video' || value ? true : 'Choose a cover image for the video.',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'video',
            description: 'Shown before playback and used during the treemap transition',
          },
        },
        {
          name: 'videoFit',
          label: 'Video fit',
          type: 'radio',
          defaultValue: 'cover',
          required: true,
          options: [
            { label: 'Cover the hero area', value: 'cover' },
            { label: 'Show the whole video', value: 'contain' },
          ],
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'video',
            description: 'Visitors can switch a cropped video to contain mode from the hero.',
          },
        },
        ...videoOptions.map((field) => ({
          ...field,
          admin: {
            ...field.admin,
            condition: (_: unknown, siblingData: { type?: string }) =>
              siblingData?.type === 'video',
          },
        })),
      ],
    },
    {
      name: 'story',
      label: 'Content',
      type: 'blocks',
      admin: {
        description:
          'Add images, videos and text in the order they should appear below the introduction',
        initCollapsed: true,
      },
      blocks: [
        {
          slug: 'image',
          labels: { singular: 'Image', plural: 'Images' },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true },
            { name: 'caption', type: 'text' },
          ],
        },
        {
          slug: 'video',
          labels: { singular: 'Video', plural: 'Videos' },
          fields: [
            {
              name: 'url',
              label: 'Vimeo URL',
              type: 'text',
              required: true,
              validate: validateVideoURL,
              admin: { description: 'Paste a normal Vimeo share URL' },
            },
            {
              name: 'poster',
              label: 'Cover image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description:
                  'Recommended; also determines whether the video uses portrait or landscape sizing',
              },
            },
            { name: 'caption', type: 'text' },
            ...videoOptions,
          ],
        },
        {
          slug: 'text',
          labels: { singular: 'Text', plural: 'Text blocks' },
          fields: [
            { name: 'content', type: 'richText', required: true, editor: projectTextEditor },
            {
              name: 'quote',
              label: 'Display as quote',
              type: 'checkbox',
              defaultValue: false,
              admin: { description: 'Uses larger type and quotation marks' },
            },
          ],
        },
      ],
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
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
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        position: 'sidebar',
        description: 'Short description for meta tags and previews',
      },
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      admin: { position: 'sidebar' },
    },
    {
      name: 'agency',
      type: 'relationship',
      relationTo: 'agencies',
      admin: {
        position: 'sidebar',
        description: 'Studio or agency through which the project was commissioned',
      },
    },
    {
      name: 'discipline',
      type: 'relationship',
      relationTo: 'disciplines',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'industries',
      label: 'Industries',
      type: 'relationship',
      relationTo: 'industries',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Client industries; used for portfolio filtering and menu links',
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
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      admin: {
        position: 'sidebar',
        description: 'Reusable terms describing the project',
      },
    },
  ],
}
