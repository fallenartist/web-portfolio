import type { Metadata } from 'next'
import '@/app/globals.css'
import '@/styles/lightbox.scss'
import BreadcrumbProvider from '@/components/BreadcrumbProvider'
import { normalizeColour } from '@/lib/colour'
import { getMainMenu, getPortfolio } from '@/lib/site-data'
import LocaleProvider from '@/components/LocaleProvider'
import { getAvailableLocales, getLocale } from '@/lib/server-locale'
import Analytics from '@/components/Analytics/Analytics'
import { getPublicAnalyticsConfig } from '@/lib/analytics-server'

// CMS content must reflect edits and must not require a database during build.
export const dynamic = 'force-dynamic'

export async function generateMetadata(): Promise<Metadata> {
  const { settings } = await getPortfolio()
  return {
    title: settings?.siteTitle || 'Design Portfolio',
    description: settings?.metaDescription || 'A portfolio of design work',
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const analyticsConfig = await getPublicAnalyticsConfig()
  const [locale, available] = await Promise.all([getLocale(), getAvailableLocales()])
  const [{ appearance, settings, treemapData }, menu] = await Promise.all([
    getPortfolio(),
    getMainMenu(),
  ])
  const rootLogo =
    settings?.rootLogo && typeof settings.rootLogo === 'object' ? settings.rootLogo.url : undefined
  const upLogo =
    settings?.upLogo && typeof settings.upLogo === 'object' ? settings.upLogo.url : undefined
  const menuBackgroundColor = normalizeColour(appearance.menuBackgroundColor) || '#f4f4f4'
  const keyColor = normalizeColour(appearance.keyColor) || '#cc2929'
  return (
    <html lang={locale}>
      <head>
        <link rel="stylesheet" href="https://webfonts.typotheque.com/WF-004891-002394.css" />
      </head>
      <body
        style={
          {
            '--key-color': keyColor,
            '--menu-background': `color-mix(in srgb, ${menuBackgroundColor} 97%, transparent)`,
          } as React.CSSProperties
        }
      >
        <LocaleProvider locale={locale} available={available}>
          <Analytics config={analyticsConfig} />
          <BreadcrumbProvider
            title={settings?.siteTitle || 'Design Portfolio'}
            menu={menu}
            legacyRootSlug={treemapData.legacyRootSlug}
            projectsOverviewSlug={settings?.projectsOverviewSlug || 'projects'}
            projectGuideTitle={settings?.projectGuideTitle || 'Projects'}
            rootLogo={rootLogo || undefined}
            upLogo={upLogo || undefined}
          >
            {children}
          </BreadcrumbProvider>
        </LocaleProvider>
      </body>
    </html>
  )
}
