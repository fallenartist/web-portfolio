import type { CollectionConfig, Field, TextFieldValidation } from 'payload'
import { lexicalEditor, UploadFeature } from '@payloadcms/richtext-lexical'
import { stableSlug } from '@/fields/stable-slug'
import { occupiedPageSlugs, validatePageSlugFormat } from '@/lib/page-slugs'
import { validateVideoURL } from '@/lib/video-embed'
import { editPages, readPublishedPages } from '@/collections/access/pages'

export const validateContentPageSlug: TextFieldValidation = async (value, { req }) => {
  const format = validatePageSlugFormat(value)
  if (format !== true) return format
  const [disciplines, projects, settings] = await Promise.all([
    req.payload.find({
      collection: 'disciplines',
      pagination: false,
      depth: 0,
      select: { slug: true, parent: true },
      req,
    }),
    req.payload.find({
      collection: 'projects',
      pagination: false,
      depth: 0,
      select: { slug: true, discipline: true },
      req,
    }),
    req.payload.findGlobal({ slug: 'settings', locale: 'en', depth: 0, req }),
  ])
  return occupiedPageSlugs(disciplines.docs, projects.docs, settings).has(String(value))
    ? 'This URL is already used by the portfolio or a system route. Choose another slug.'
    : true
}

const textEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter((feature) => !['upload', 'relationship'].includes(feature.key)),
    UploadFeature({
      enabledCollections: ['media'],
      collections: {
        media: {
          fields: [
            {
              name: 'placement',
              type: 'select',
              defaultValue: 'full',
              options: [
                { label: 'Full width', value: 'full' },
                { label: 'Left — wrap text', value: 'left' },
                { label: 'Right — wrap text', value: 'right' },
              ],
              admin: {
                description:
                  'Wrapped images use half the available text width, excluding the column gap. On small screens they stack above the following text.',
              },
            },
            { name: 'alt', label: 'Alternative text', type: 'text' },
            { name: 'caption', type: 'text' },
          ],
        },
      },
    }),
  ],
})

const layoutFields = (wide = false): Field[] => [
  {
    name: 'width',
    label: 'Block width',
    type: 'select',
    defaultValue: 'content',
    options: [
      { label: 'Full text column', value: 'content' },
      ...(wide ? [{ label: 'Wide', value: 'wide' }] : []),
      { label: 'Half text column', value: 'half' },
    ],
  },
  {
    name: 'alignment',
    label: 'Half-width position',
    type: 'select',
    defaultValue: 'left',
    options: [
      { label: 'Left', value: 'left' },
      { label: 'Centre', value: 'center' },
      { label: 'Right', value: 'right' },
    ],
    admin: {
      condition: (_, siblingData) => siblingData.width === 'half',
      description:
        'Consecutive left/right half-width blocks share a row. Centre uses a separate row. The column gap is excluded from the half width.',
    },
  },
]

export const Pages: CollectionConfig = {
  slug: 'pages',
  labels: { singular: 'Page', plural: 'Pages' },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    components: {
      edit: {
        beforeDocumentControls: [
          '/components/admin/Pages/PageEditorTypography#PageEditorTypography',
        ],
      },
    },
    defaultColumns: ['title', 'slug', '_status', 'updatedAt'],
    description:
      'Standalone pages with text, images and Vimeo videos. Add published pages to Menus to display them in navigation.',
    preview: (doc) =>
      doc._status === 'published' && doc.slug ? `/${encodeURIComponent(String(doc.slug))}` : null,
  },
  access: { read: readPublishedPages, create: editPages, update: editPages, delete: editPages },
  versions: { drafts: true, maxPerDoc: 20 },
  fields: [
    { name: 'title', type: 'text', localized: true, required: true },
    {
      name: 'showTitle',
      label: 'Show title on page',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description:
          'Turn off to supply your own heading in the content. The title remains available in menus, breadcrumbs and browser/search titles.',
      },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        position: 'sidebar',
        description:
          'Shared URL for both languages, e.g. about-me. Project and system URLs are reserved.',
      },
      hooks: { beforeValidate: [stableSlug] },
      validate: validateContentPageSlug,
    },
    {
      name: 'metaDescription',
      label: 'Search description',
      type: 'textarea',
      localized: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'content',
      type: 'blocks',
      label: 'Content',
      admin: {
        initCollapsed: true,
        description:
          'Add and reorder text, images and Vimeo videos. Images and block order are shared; text and captions can be translated.',
      },
      blocks: [
        {
          slug: 'pageText',
          labels: { singular: 'Text', plural: 'Text blocks' },
          fields: [
            {
              name: 'text',
              type: 'richText',
              required: true,
              localized: true,
              editor: textEditor,
              admin: {
                className: 'page-body-editor',
                description:
                  'Use the + menu (or type / and choose Upload) to insert an image between paragraphs. Edit the image to choose full width or wrap text left/right. Image placement and captions here follow the text language.',
              },
            },
            ...layoutFields(),
            {
              name: 'columns',
              label: 'Text columns',
              type: 'select',
              defaultValue: 'two',
              options: [
                { label: 'Two columns', value: 'two' },
                { label: 'One column', value: 'one' },
              ],
              admin: {
                condition: (_, siblingData) => siblingData.width !== 'half',
                description:
                  'Text flows between columns. Half-width blocks and small screens always use one column.',
              },
            },
            {
              name: 'keepParagraphsTogether',
              label: 'Keep paragraphs together',
              type: 'checkbox',
              defaultValue: true,
              admin: {
                condition: (_, siblingData) =>
                  siblingData.width !== 'half' && siblingData.columns !== 'one',
                description:
                  'Moves whole paragraphs to the next column when possible. Columns may be uneven; very long paragraphs can still split.',
              },
            },
          ],
        },
        {
          slug: 'pageImage',
          labels: { singular: 'Image', plural: 'Images' },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true },
            {
              name: 'alt',
              label: 'Alternative text',
              type: 'text',
              localized: true,
              admin: { description: 'Optional override of the image’s alternative text in Media.' },
            },
            { name: 'caption', type: 'text', localized: true },
            ...layoutFields(true),
          ],
        },
        {
          slug: 'pageVideo',
          labels: { singular: 'Vimeo video', plural: 'Vimeo videos' },
          fields: [
            {
              name: 'url',
              label: 'Vimeo URL',
              type: 'text',
              required: true,
              validate: validateVideoURL,
              admin: {
                description: 'Paste a Vimeo share URL. Videos use standard playback controls.',
              },
            },
            { name: 'caption', type: 'text', localized: true },
            ...layoutFields(true),
          ],
        },
      ],
    },
  ],
}
