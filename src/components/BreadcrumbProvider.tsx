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
}: {
  children: React.ReactNode
  title?: string
  menu?: Menu | null
  legacyRootSlug?: string
}) {
  const [breadcrumb, updateBreadcrumb] = useState<BreadcrumbItem[]>([])
  return (
    <BreadcrumbContext.Provider value={{ updateBreadcrumb }}>
      <Header
        title={title}
        menu={menu}
        legacyRootSlug={legacyRootSlug}
        breadcrumb={breadcrumb}
        onBreadcrumbClick={(item) => {
          window.dispatchEvent(new CustomEvent('breadcrumb-click', { detail: item.path }))
        }}
      />
      {children}
    </BreadcrumbContext.Provider>
  )
}
