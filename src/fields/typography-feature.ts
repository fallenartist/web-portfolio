import { TextStateFeature } from '@payloadcms/richtext-lexical'
import { ALL_SMALL_CAPS_FONT_FEATURES, SMALL_CAPS_LETTER_SPACING } from '@/lib/small-caps'

export function typographyFeature() {
  return TextStateFeature({
    state: {
      fontFeatures: {
        smallCaps: {
          label: 'Small Caps',
          css: {
            'font-feature-settings': '"liga" 1, "onum" 1, "pnum" 1, "smcp" 1',
            'font-variant-caps': 'small-caps',
            'letter-spacing': SMALL_CAPS_LETTER_SPACING,
          },
        },
        allSmallCaps: {
          label: 'All Small Caps',
          css: {
            'font-feature-settings': ALL_SMALL_CAPS_FONT_FEATURES,
            'font-variant-caps': 'all-small-caps',
            'letter-spacing': SMALL_CAPS_LETTER_SPACING,
          },
        },
      },
    },
  })
}
