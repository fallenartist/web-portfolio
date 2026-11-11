import { cache } from 'react'
import { cookies, headers } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { availableLocales, LOCALE_COOKIE, resolveLocale } from '@/lib/locale'

export const getAvailableLocales = cache(async () => {
  const payload = await getPayload({ config })
  const settings = await payload.findGlobal({
    slug: 'settings',
    locale: 'en',
    depth: 0,
    select: { languages: true },
    overrideAccess: false,
  })
  return availableLocales(settings.languages)
})

export const getLocale = cache(async () => {
  const [cookieStore, requestHeaders, available] = await Promise.all([
    cookies(),
    headers(),
    getAvailableLocales(),
  ])
  return resolveLocale(
    cookieStore.get(LOCALE_COOKIE)?.value,
    requestHeaders.get('accept-language'),
    available,
  )
})
