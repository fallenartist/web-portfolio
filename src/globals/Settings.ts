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
      label: 'Project guide name',
      type: 'text',
      required: true,
      defaultValue: 'Projects',
      admin: {
        description: 'Used in the main menu and breadcrumb for the project relationship diagram.',
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
    {
      name: 'projectTitle',
      label: 'Project title presentation',
      type: 'group',
      fields: [
        {
          name: 'placement',
          type: 'radio',
          required: true,
          defaultValue: 'below',
          options: [
            { label: 'Below the hero', value: 'below' },
            { label: 'Over the hero', value: 'overlay' },
          ],
        },
        {
          name: 'fontSize',
          label: 'Desktop overlay font size (px)',
          type: 'number',
          required: true,
          defaultValue: 112,
          min: 32,
          max: 240,
          admin: {
            condition: (_, siblingData) => siblingData?.placement === 'overlay',
          },
        },
        {
          name: 'mobileFontSize',
          label: 'Mobile overlay font size (px)',
          type: 'number',
          required: true,
          defaultValue: 48,
          min: 24,
          max: 120,
          admin: {
            condition: (_, siblingData) => siblingData?.placement === 'overlay',
          },
        },
        {
          name: 'dimColor',
          label: 'Dim colour',
          type: 'text',
          required: true,
          defaultValue: '#000000',
          validate: (value: null | string | undefined) =>
            Boolean(value && /^#[0-9a-f]{6}$/i.test(value)) ||
            'Enter a six-digit hex colour, e.g. #000000.',
          admin: {
            condition: (_, siblingData) => siblingData?.placement === 'overlay',
          },
        },
        {
          name: 'dimIntensity',
          label: 'Dim intensity (%)',
          type: 'number',
          required: true,
          defaultValue: 35,
          min: 0,
          max: 90,
          admin: {
            condition: (_, siblingData) => siblingData?.placement === 'overlay',
            step: 5,
          },
        },
      ],
    },
    {
      name: 'storyText',
      label: 'Story text presentation',
      type: 'group',
      fields: [
        {
          name: 'width',
          label: 'Text block width (%)',
          type: 'number',
          required: true,
          defaultValue: 50,
          min: 30,
          max: 100,
          admin: {
            description: 'Used on wider screens; text remains full width on mobile.',
          },
        },
        {
          name: 'fontSize',
          label: 'Text font size (px)',
          type: 'number',
          required: true,
          defaultValue: 30,
          min: 16,
          max: 72,
        },
        {
          name: 'quoteFontSize',
          label: 'Quote font size (px)',
          type: 'number',
          required: true,
          defaultValue: 60,
          min: 24,
          max: 140,
        },
        {
          name: 'textColor',
          label: 'Text colour',
          type: 'text',
          required: true,
          defaultValue: '#222222',
          validate: (value: null | string | undefined) =>
            Boolean(value && /^#[0-9a-f]{6}$/i.test(value)) ||
            'Enter a six-digit hex colour, e.g. #222222.',
        },
      ],
    },
    {
      name: 'projectDescription',
      label: 'Project description presentation',
      type: 'group',
      fields: [
        {
          name: 'fontFamily',
          label: 'Font family',
          type: 'text',
          required: true,
          defaultValue: 'October Condensed',
          admin: {
            description: 'Enter a CSS font family name, e.g. October Condensed.',
          },
        },
        {
          name: 'fontSize',
          label: 'Font size (px)',
          type: 'number',
          required: true,
          defaultValue: 30,
          min: 16,
          max: 72,
        },
        {
          name: 'textColor',
          label: 'Text colour',
          type: 'text',
          required: true,
          defaultValue: '#222222',
          validate: (value: null | string | undefined) =>
            Boolean(value && /^#[0-9a-f]{6}$/i.test(value)) ||
            'Enter a six-digit hex colour, e.g. #222222.',
        },
      ],
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
    },
  ],
}
