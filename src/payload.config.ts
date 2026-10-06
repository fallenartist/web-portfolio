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
  admin: {
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
