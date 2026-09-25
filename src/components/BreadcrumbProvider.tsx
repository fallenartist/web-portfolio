'use client'

import { createContext, useContext, useState } from 'react'
import Header from '@/components/Header/Header'
import type { Menu } from '@/payload-types'
import type { BreadcrumbItem } from '@/types'

const BreadcrumbContext = createContext<{
  updateBreadcrumb: (items: BreadcrumbItem[]) => void
}>({ updateBreadcrumb: () => {} })
export const useBreadcrumb = () => useContext(BreadcrumbContext)

export default function BreadcrumbProvider({
  children,
  title,
  menu,
  legacyRootSlug,
  rootLogo,
  upLogo,
}: {
  children: React.ReactNode
  title?: string
  menu?: Menu | null
  legacyRootSlug?: string
  rootLogo?: string
  upLogo?: string
}) {
  const [breadcrumb, updateBreadcrumb] = useState<BreadcrumbItem[]>([])
  return (
    <BreadcrumbContext.Provider value={{ updateBreadcrumb }}>
      <Header
        title={title}
        menu={menu}
        legacyRootSlug={legacyRootSlug}
        rootLogo={rootLogo}
        upLogo={upLogo}
        breadcrumb={breadcrumb}
        onLogoClick={() => {
          const parent = breadcrumb[Math.max(0, breadcrumb.length - 2)]
          if (parent)
            window.dispatchEvent(new CustomEvent('breadcrumb-click', { detail: parent.path }))
        }}
        onBreadcrumbClick={(item) => {
          window.dispatchEvent(new CustomEvent('breadcrumb-click', { detail: item.path }))
        }}
      />
      {children}
    </BreadcrumbContext.Provider>
  )
}
