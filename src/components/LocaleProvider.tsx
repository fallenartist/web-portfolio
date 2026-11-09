'use client'

import { createContext, useContext } from 'react'
import { dictionaries, LOCALES, type Locale } from '@/lib/locale'

const LocaleContext = createContext<{ locale: Locale; available: readonly Locale[] }>({
  locale: 'en',
  available: LOCALES,
})

export function useLocale() {
  const { locale, available } = useContext(LocaleContext)
  return { locale, available, text: dictionaries[locale] }
}

export default function LocaleProvider({
  children,
  locale,
  available,
}: {
  children: React.ReactNode
  locale: Locale
  available: readonly Locale[]
}) {
  return <LocaleContext.Provider value={{ locale, available }}>{children}</LocaleContext.Provider>
}
