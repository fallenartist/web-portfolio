import { createElement } from 'react'
import type { JSXConvertersFunction } from '@payloadcms/richtext-lexical/react'

export const ALL_SMALL_CAPS_FONT_FEATURES = '"liga" 1, "onum" 1, "pnum" 1, "smcp" 1, "c2sc" 1'

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

    return state?.fontFeatures === 'allSmallCaps'
      ? createElement(
          'span',
          { style: { fontFeatureSettings: ALL_SMALL_CAPS_FONT_FEATURES } },
          content,
        )
      : content
  },
})
