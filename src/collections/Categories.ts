import type { CollectionConfig } from 'payload'

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
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
			if (!data.slug && data.title) {
			  return data.title
				.toLowerCase()
				.replace(/[^\w ]+/g, '')
				.replace(/ +/g, '-');
			}
			return data.slug;
		  },
		],
	  },
	},
	{
	  name: 'color',
	  type: 'text',
	  admin: {
		description: 'Category color in any valid CSS format: hex (#FF0000), RGB (rgb(255,0,0)), HSL (hsl(0,100%,50%)), OKLCH (oklch(0.554 0.046 257.417)), etc.',
	  },
	},
	{
	  name: 'parent',
	  type: 'relationship',
	  relationTo: 'categories',
	  admin: {
		position: 'sidebar',
		description: 'Optional parent category for hierarchical organization',
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
		description: 'Thumbnail image for the category',
	  },
	},
  ],
}