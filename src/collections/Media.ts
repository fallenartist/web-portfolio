import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url'

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
	useAsTitle: 'filename',
  },
  access: {
	read: () => true,
  },
  upload: {
	staticDir: path.resolve(__dirname, '../../public/media'),
	staticURL: '/media',
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
	  }
	],
	adminThumbnail: 'thumbnail',
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