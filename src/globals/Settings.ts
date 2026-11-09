import type { GlobalConfig } from 'payload'

export const Settings: GlobalConfig = {
  slug: 'settings',
  admin: {
    group: 'Globals',
  },
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
      name: 'rootDisciplineTitle',
      type: 'text',
      defaultValue: 'WORK',
      admin: {
        description: 'Title for the root level displayed in breadcrumb',
      },
    },
    {
      name: 'rootDisciplineSlug',
      type: 'text',
      defaultValue: 'work',
      admin: {
        description:
          'URL slug for the root level (use lowercase letters, no spaces or special characters)',
      },
    },
    {
      name: 'projectGuideTitle',
      label: 'Project guide breadcrumb title',
      type: 'text',
      required: true,
      defaultValue: 'Projects',
      admin: {
        description: 'Used in the breadcrumb for the project relationship diagram.',
      },
    },
    {
      name: 'projectsOverviewSlug',
      label: 'Project guide URL slug',
      type: 'text',
      required: true,
      defaultValue: 'projects',
      validate: (value: null | string | undefined) =>
        Boolean(value && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) ||
        'Use lowercase letters, numbers and hyphens without slashes.',
      admin: {
        description: 'URL segment for the project guide, without a leading slash.',
      },
    },
    {
      name: 'projectGuideInstruction',
      label: 'Project guide instruction',
      type: 'textarea',
      required: true,
      defaultValue: 'Select a node or connection to explore related projects.',
      admin: {
        description: 'Shown in the light grey area above the diagram.',
      },
    },
    {
      name: 'rootLogo',
      label: 'Root-level logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Logo shown at the root of the portfolio',
      },
    },
    {
      name: 'upLogo',
      label: 'Up-level logo',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Logo shown below the root; clicking it moves up one level',
      },
    },
  ],
}
