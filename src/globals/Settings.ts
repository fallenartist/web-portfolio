import type { GlobalConfig } from 'payload'
import { cookieDefaults } from '@/lib/cookie-settings'

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
      localized: true,
      required: true,
      defaultValue: 'Design Portfolio',
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      localized: true,
      defaultValue: 'A portfolio of design work',
    },
    {
      name: 'rootDisciplineTitle',
      type: 'text',
      localized: true,
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
      localized: true,
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
      localized: true,
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
      name: 'cookies',
      label: 'Cookies',
      type: 'group',
      fields: [
        {
          name: 'enabled',
          label: 'Enable analytics cookies',
          type: 'checkbox',
          defaultValue: true,
          admin: {
            description:
              'On: show cookie controls and enable full analytics after consent. Off: hide cookie controls and use cookieless analytics without automatic clicks or recordings. Enable cookieless tracking in PostHog project settings too. The server analytics master switch and exclusions still apply.',
          },
        },
        { name: 'title', type: 'text', localized: true, defaultValue: cookieDefaults.en.title },
        {
          name: 'message',
          type: 'textarea',
          localized: true,
          defaultValue: cookieDefaults.en.message,
        },
        {
          name: 'details',
          label: 'Analytics details',
          type: 'textarea',
          localized: true,
          defaultValue: cookieDefaults.en.details,
          admin: { hidden: true },
        },
        {
          name: 'acceptLabel',
          label: 'Accept button',
          type: 'text',
          localized: true,
          defaultValue: cookieDefaults.en.acceptLabel,
        },
        {
          name: 'rejectLabel',
          label: 'Reject button',
          type: 'text',
          localized: true,
          defaultValue: cookieDefaults.en.rejectLabel,
        },
        {
          name: 'privacyLabel',
          label: 'Privacy link text',
          type: 'text',
          localized: true,
          defaultValue: cookieDefaults.en.privacyLabel,
        },
        {
          name: 'privacyPage',
          label: 'Privacy details page',
          type: 'relationship',
          relationTo: 'pages',
          filterOptions: { _status: { equals: 'published' } },
          admin: { description: 'Optional published page linked from the cookie banner.' },
        },
        {
          name: 'icon',
          label: 'Cookie icon',
          type: 'upload',
          relationTo: 'media',
          admin: {
            description:
              'Used in the menu and beside the banner title. Leave empty for the default icon.',
          },
        },
      ],
    },
    {
      name: 'languages',
      label: 'Languages',
      type: 'group',
      admin: {
        description:
          'English is always available. Enable translations here when they are ready for visitors. Disabled translations remain editable in admin.',
      },
      fields: [
        {
          name: 'polishEnabled',
          label: 'Polski',
          type: 'checkbox',
          defaultValue: false,
          admin: {
            description:
              'Shows Polish in the language switcher and allows visitors to view the Polish version. This setting applies to both content locales.',
          },
        },
      ],
    },
  ],
}
