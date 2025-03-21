import type { CollectionConfig } from 'payload'

export const Menus: CollectionConfig = {
  slug: 'menus',
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
		  options: [
			{
			  label: 'Internal Link',
			  value: 'internal',
			},
			{
			  label: 'External Link',
			  value: 'external',
			},
		  ],
		  defaultValue: 'internal',
		  required: true,
		},
		{
		  name: 'internalLink',
		  type: 'relationship',
		  relationTo: ['categories', 'projects'],
		  admin: {
			condition: (data, siblingData) => siblingData.type === 'internal',
		  },
		},
		{
		  name: 'externalLink',
		  type: 'text',
		  admin: {
			condition: (data, siblingData) => siblingData.type === 'external',
		  },
		},
		{
		  name: 'openInNewTab',
		  type: 'checkbox',
		  defaultValue: false,
		  admin: {
			condition: (data, siblingData) => siblingData.type === 'external',
		  },
		},
	  ],
	},
  ],
}