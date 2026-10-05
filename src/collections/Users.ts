import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    // Payload configures expiry per auth collection, so keep local admin
    // sessions effectively persistent while preserving the production default.
    tokenExpiration: process.env.NODE_ENV === 'development' ? 60 * 60 * 24 * 365 * 10 : 60 * 60 * 2,
  },
  admin: {
    group: false,
    useAsTitle: 'email',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
    },
  ],
}
