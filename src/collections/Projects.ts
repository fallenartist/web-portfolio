import type { CollectionConfig } from 'payload'

export const Projects: CollectionConfig = {
  slug: 'projects',
  admin: {
	useAsTitle: 'title',
	defaultColumns: ['title', 'category', 'priority', 'featured', 'updatedAt'],
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
		description: 'Full project description',
		elements: ['h1', 'h2', 'h3', 'link', 'ol', 'ul', 'li', 'blockquote', 'p'],
	  },
	},
	{
	  name: 'category',
	  type: 'relationship',
	  relationTo: 'categories',
	  required: true,
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