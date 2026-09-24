import { cache } from 'react'
import { getPayload } from 'payload'
import config from '@payload-config'
import { fetchTreemapData } from './transformers'

export const getPortfolio = cache(async () => fetchTreemapData(await getPayload({ config })))
export const getMainMenu = cache(async () => {
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'menus',
    where: { slug: { equals: 'main-menu' } },
    depth: 3,
    limit: 1,
    overrideAccess: false,
  })
  return docs[0] ?? null
})
