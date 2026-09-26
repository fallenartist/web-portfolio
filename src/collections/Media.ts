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
    group: 'Content',
    useAsTitle: 'filename',
  },
  access: {
    read: () => true,
  },
  upload: {
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
        height: 800,
        position: 'centre',
      },
      {
        name: 'medium',
        width: 1600,
        height: 1600,
        position: 'centre',
      },
      {
        name: 'large',
        width: 2400,
        height: 2400,
        position: 'centre',
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
