import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
	read: () => true,
  },
  fields: [
	// Adding a title field to satisfy the database constraint
	/*
	{
	  name: 'title',
	  type: 'text',
	  required: true,
	  defaultValue: 'Site Settings',
	  admin: {
		description: 'This field is required by the database.',
	  },
	},
	*/
	{
	  name: 'siteTitle',
	  type: 'text',
	  required: true,
	  defaultValue: 'Design Portfolio',
	},
	{
	  name: 'metaDescription',
	  type: 'textarea',
	  defaultValue: 'A portfolio of design work',
	},
	{
	  name: 'rootCategoryTitle',
	  type: 'text',
	  defaultValue: 'WORK',
	  admin: {
		description: 'Title for the root level displayed in breadcrumb',
	  }
	},
	{
	  name: 'rootCategorySlug',
	  type: 'text',
	  defaultValue: 'work',
	  admin: {
		description: 'URL slug for the root level (use lowercase letters, no spaces or special characters)',
	  }
	},
	{
	  name: 'enableAutoplay',
	  type: 'checkbox',
	  defaultValue: true,
	},
	{
	  name: 'autoplayDelay',
	  type: 'number',
	  defaultValue: 5000,
	},
	{
	  name: 'autoplayInterval',
	  type: 'number',
	  defaultValue: 3000,
	}
  ],
}