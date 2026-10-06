import type { CollectionConfig, GetAdminThumbnail } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const getAdminThumbnail: GetAdminThumbnail = ({ doc }) => {
  const sizes = doc.sizes as
    | {
        thumbnail?: {
          url?: null | string
        }
      }
    | undefined

  if (sizes?.thumbnail?.url) {
    return sizes.thumbnail.url
  }

  if (typeof doc.url === 'string') {
    return doc.url
  }

  return typeof doc.filename === 'string'
    ? `/api/media/file/${encodeURIComponent(doc.filename)}`
    : null
}

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    components: {
      edit: {
        Upload: '/components/admin/Media/MediaUpload#MediaUpload',
      },
    },
    group: 'Content',
    useAsTitle: 'filename',
    description:
      'Upload files here. public/media is managed storage and files should not be copied into it manually.',
  },
  access: {
    read: () => true,
  },
  upload: {
    // Payload owns this directory: every original needs a matching database
    // record and generated sizes, so files must enter through Admin or the API.
    staticDir: path.resolve(__dirname, '../../public/media'),
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 400,
        position: 'centre',
      },
      {
        name: 'small',
        width: 800,
        withoutEnlargement: true,
      },
      {
        name: 'medium',
        width: 1600,
        withoutEnlargement: true,
      },
      {
        name: 'large',
        width: 2400,
        withoutEnlargement: true,
      },
    ],
    adminThumbnail: getAdminThumbnail,
    mimeTypes: ['image/*'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description: 'Alternative text for accessibility',
      },
    },
  ],
}
