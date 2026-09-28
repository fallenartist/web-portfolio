import type { CollectionConfig } from 'payload'
import { validateVideoURL } from '@/lib/video-embed'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'client', 'category', 'industry', 'priority', 'updatedAt'],
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
    {
      name: 'excerpt',
      type: 'textarea',
      admin: {
        description: 'Short description for meta tags and previews',
      },
    },
    {
      name: 'description',
      type: 'richText',
      admin: {
        description: 'Legacy project description, shown when Story layout has no blocks',
      },
    },
    {
      name: 'client',
      type: 'relationship',
      relationTo: 'clients',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'industry',
      label: 'Industry',
      type: 'relationship',
      relationTo: 'industries',
      admin: {
        position: 'sidebar',
        description: 'Client industry; used for portfolio filtering and menu links',
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
        description: 'Small preview image for the treemap',
      },
    },
    {
      name: 'gallery',
      type: 'array',
      validate: (value) =>
        (value || []).filter(
          (item) =>
            typeof item === 'object' && item !== null && 'hero' in item && item.hero === true,
        ).length <= 1 || 'Choose only one hero image.',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
        {
          name: 'title',
          type: 'text',
        },
        {
          name: 'hero',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Use this image as the opening hero for the scrollable project view',
          },
        },
        {
          name: 'featured',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description: 'Featured images will be included in the automatic slideshow',
          },
        },
      ],
    },
    {
      name: 'heroPresentation',
      label: 'Hero presentation',
      type: 'group',
      admin: {
        description: 'Optional title overlay and tint for the opening hero image',
      },
      fields: [
        {
          name: 'showTitle',
          label: 'Overlay project title',
          type: 'checkbox',
          defaultValue: false,
        },
        {
          name: 'titlePosition',
          label: 'Title position',
          type: 'select',
          defaultValue: 'center',
          options: [
            { label: 'Top left', value: 'top-left' },
            { label: 'Top centre', value: 'top-center' },
            { label: 'Top right', value: 'top-right' },
            { label: 'Centre left', value: 'center-left' },
            { label: 'Centre', value: 'center' },
            { label: 'Centre right', value: 'center-right' },
            { label: 'Bottom left', value: 'bottom-left' },
            { label: 'Bottom centre', value: 'bottom-center' },
            { label: 'Bottom right', value: 'bottom-right' },
          ],
          admin: {
            condition: (_, siblingData) => siblingData?.showTitle === true,
          },
        },
        {
          name: 'tintColor',
          label: 'Tint colour',
          type: 'text',
          defaultValue: '#000000',
          validate: (value: null | string | undefined) =>
            !value || /^#[0-9a-f]{6}$/i.test(value) || 'Enter a six-digit hex colour, e.g. #000000.',
          admin: {
            condition: (_, siblingData) => siblingData?.showTitle === true,
            description: 'Six-digit hex colour',
          },
        },
        {
          name: 'tintOpacity',
          label: 'Tint opacity (%)',
          type: 'number',
          defaultValue: 35,
          min: 0,
          max: 90,
          admin: {
            condition: (_, siblingData) => siblingData?.showTitle === true,
            step: 5,
          },
        },
      ],
    },
    {
      name: 'story',
      label: 'Story layout',
      type: 'blocks',
      admin: {
        description: 'Drag blocks to set the order of images, videos and text after the hero',
        initCollapsed: true,
      },
      blocks: [
        {
          slug: 'image',
          labels: {
            singular: 'Image',
            plural: 'Images',
          },
          fields: [
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'caption',
              type: 'text',
            },
            {
              name: 'width',
              type: 'select',
              defaultValue: 'wide',
              required: true,
              options: [
                { label: 'Full bleed', value: 'full' },
                { label: 'Wide', value: 'wide' },
                { label: 'Half width', value: 'half' },
              ],
            },
            {
              name: 'position',
              type: 'select',
              defaultValue: 'center',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Centre', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              admin: {
                condition: (_, siblingData) => siblingData?.width !== 'full',
              },
            },
          ],
        },
        {
          slug: 'video',
          labels: {
            singular: 'Video',
            plural: 'Videos',
          },
          fields: [
            {
              name: 'url',
              label: 'Vimeo or YouTube URL',
              type: 'text',
              required: true,
              validate: validateVideoURL,
              admin: {
                description: 'Paste a normal Vimeo or YouTube share URL',
              },
            },
            {
              name: 'poster',
              label: 'Poster image',
              type: 'upload',
              relationTo: 'media',
              admin: {
                description: 'Optional image shown until the visitor starts the video',
              },
            },
            {
              name: 'caption',
              type: 'text',
            },
            {
              name: 'playback',
              label: 'Playback mode',
              type: 'select',
              defaultValue: 'standard',
              required: true,
              options: [
                { label: 'Standard player', value: 'standard' },
                { label: 'Background: autoplay, muted and looping', value: 'background' },
              ],
            },
            {
              name: 'aspectRatio',
              label: 'Aspect ratio',
              type: 'select',
              defaultValue: '16-9',
              required: true,
              options: [
                { label: 'Widescreen (16:9)', value: '16-9' },
                { label: 'Standard (4:3)', value: '4-3' },
                { label: 'Square (1:1)', value: '1-1' },
                { label: 'Vertical (9:16)', value: '9-16' },
              ],
            },
            {
              name: 'width',
              type: 'select',
              defaultValue: 'wide',
              required: true,
              options: [
                { label: 'Full bleed', value: 'full' },
                { label: 'Wide', value: 'wide' },
                { label: 'Half width', value: 'half' },
              ],
            },
            {
              name: 'position',
              type: 'select',
              defaultValue: 'center',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Centre', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
              admin: {
                condition: (_, siblingData) => siblingData?.width !== 'full',
              },
            },
          ],
        },
        {
          slug: 'text',
          labels: {
            singular: 'Text',
            plural: 'Text blocks',
          },
          fields: [
            {
              name: 'content',
              type: 'richText',
              required: true,
            },
            {
              name: 'width',
              type: 'select',
              defaultValue: 'narrow',
              required: true,
              options: [
                { label: 'Narrow', value: 'narrow' },
                { label: 'Medium', value: 'medium' },
                { label: 'Wide', value: 'wide' },
              ],
            },
            {
              name: 'position',
              type: 'select',
              defaultValue: 'center',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Centre', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
            },
            {
              name: 'textAlign',
              label: 'Text alignment',
              type: 'select',
              defaultValue: 'left',
              required: true,
              options: [
                { label: 'Left', value: 'left' },
                { label: 'Centre', value: 'center' },
                { label: 'Right', value: 'right' },
              ],
            },
          ],
        },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
