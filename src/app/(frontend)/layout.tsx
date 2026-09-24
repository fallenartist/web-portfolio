import type { Metadata } from 'next'
import '@/app/globals.css'
import '@/styles/lightbox.scss'
import BreadcrumbProvider from '@/components/BreadcrumbProvider'
import { getMainMenu, getPortfolio } from '@/lib/site-data'

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
  const [{ settings }, menu] = await Promise.all([getPortfolio(), getMainMenu()])
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://fonts.typotheque.com/WF-004891-002394.css" />
      </head>
      <body>
        <BreadcrumbProvider title={settings?.siteTitle || 'Design Portfolio'} menu={menu}>
          {children}
        </BreadcrumbProvider>
      </body>
    </html>
  )
}
