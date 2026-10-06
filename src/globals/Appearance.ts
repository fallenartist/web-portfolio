import type { GlobalConfig } from 'payload'
import { normalizeColour } from '@/lib/colour'

const cssColour = (value: null | string | undefined) =>
  Boolean(normalizeColour(value)) ||
  'Enter a CSS colour, such as #f4f4f4, rgba(), hsl(), or oklch().'

export const Appearance: GlobalConfig = {
  slug: 'appearance',
  admin: {
    group: 'Globals',
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'menuBackgroundColor',
      label: 'Menu background colour',
      type: 'text',
      required: true,
      defaultValue: '#f4f4f4',
      validate: cssColour,
      admin: {
        description: 'Used by the main menu and the project guide instruction bar.',
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
          validate: cssColour,
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
          validate: cssColour,
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
          validate: cssColour,
        },
      ],
    },
  ],
}
