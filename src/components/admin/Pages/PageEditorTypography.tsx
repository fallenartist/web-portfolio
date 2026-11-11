import type { Payload, TypedUser } from 'payload'
import { storyTextStyle } from '@/lib/story-typography'

export async function PageEditorTypography({
  payload,
  user,
}: {
  payload: Payload
  user?: TypedUser | null
}) {
  if (!user) return null
  const appearance = await payload.findGlobal({
    slug: 'appearance',
    depth: 0,
    overrideAccess: false,
  })
  // Keep the admin theme's text colour for contrast, while sharing the site's type sizes.
  const declarations = Object.entries(storyTextStyle(appearance.storyText))
    .filter(([name]) => name !== '--story-text-color')
    .map(([name, value]) => `${name}:${value}`)
    .join(';')
  return <style>{`.page-body-editor{${declarations}}`}</style>
}
