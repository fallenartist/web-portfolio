import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Projects } from '@/collections/Projects'
import { Disciplines } from '@/collections/Disciplines'
import { Media } from '@/collections/Media'
import { Industries } from '@/collections/Industries'
import { Clients } from '@/collections/Clients'
import { Agencies } from '@/collections/Agencies'
import { Tags } from '@/collections/Tags'
import { Users } from '@/collections/Users'
import { Menus } from '@/collections/Menus'
import { Settings } from '@/globals/Settings'
import { Appearance } from '@/globals/Appearance'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  localization: {
    locales: [
      { label: 'English', code: 'en' },
      { label: 'Polski', code: 'pl' },
    ],
    defaultLocale: 'en',
    fallback: true,
  },
  admin: {
    dashboard: {
      widgets: [
        {
          slug: 'website-activity',
          label: 'Website activity',
          Component: '/components/admin/Analytics/AnalyticsWidget#default',
          minWidth: 'full',
          maxWidth: 'full',
          fields: [
            {
              name: 'period',
              type: 'select',
              defaultValue: '30',
              options: [
                { label: 'Last 7 days', value: '7' },
                { label: 'Last 30 days', value: '30' },
                { label: 'Last 90 days', value: '90' },
              ],
            },
          ],
        },
      ],
      defaultLayout: [
        { widgetSlug: 'website-activity', width: 'full' },
        { widgetSlug: 'collections', width: 'full' },
      ],
    },
    user: Users.slug,
    autoRefresh: process.env.NODE_ENV === 'development',
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Projects, Disciplines, Industries, Clients, Agencies, Tags, Media, Menus],
  globals: [Settings, Appearance],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    push: false,
    migrationDir: path.resolve(dirname, 'migrations'),
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
})
