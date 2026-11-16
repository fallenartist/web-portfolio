import { createElement } from 'react'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'
import { ALL_SMALL_CAPS_FONT_FEATURES, SMALL_CAPS_LETTER_SPACING } from '@/lib/small-caps'

export { ALL_SMALL_CAPS_FONT_FEATURES, SMALL_CAPS_LETTER_SPACING }

export const projectTextConverters: JSXConvertersFunction = ({ defaultConverters }) => ({
  ...defaultConverters,
  text: (args) => {
    const converter = defaultConverters.text
    const content = typeof converter === 'function' ? converter(args) : converter
    const state = (
      args.node as typeof args.node & {
        $?: { fontFeatures?: string }
      }
    ).$

    const allSmallCaps = state?.fontFeatures === 'allSmallCaps'
    return allSmallCaps || state?.fontFeatures === 'smallCaps'
      ? createElement(
          'span',
          {
            style: {
              fontFeatureSettings: allSmallCaps
                ? ALL_SMALL_CAPS_FONT_FEATURES
                : '"liga" 1, "onum" 1, "pnum" 1, "smcp" 1',
              fontVariantCaps: allSmallCaps ? 'all-small-caps' : 'small-caps',
              letterSpacing: SMALL_CAPS_LETTER_SPACING,
            },
          },
          content,
        )
      : content
  },
})
