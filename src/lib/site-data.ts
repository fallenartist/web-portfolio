import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import type { Menu } from '@/payload-types'
import { fetchTreemapData } from './transformers'

export const getPortfolio = cache(async () => fetchTreemapData(await getPayload({ config })))

export function selectMainMenu(menus: Menu[]): Menu | null {
  return (
    menus.find((menu) => menu.slug === 'main-menu') ||
    menus.find((menu) => menu.slug === 'main') ||
    menus[0] ||
    null
  )
}

export const getMainMenu = cache(async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'menus',
    depth: 3,
    pagination: false,
    overrideAccess: false,
  })
  return selectMainMenu(docs)
})
