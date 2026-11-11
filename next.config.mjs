import { withPayload } from '@payloadcms/next/withPayload'
import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  ...(process.env.MYDEVIL_BUILD === '1'
    ? { experimental: { cpus: 1, webpackMemoryOptimizations: true } }
    : {}),
  webpack(config, { dev }) {
    if (dev) {
      const existingIgnored = config.watchOptions?.ignored
      const mediaPath = path
        .resolve(process.cwd(), 'public/media')
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const mediaPattern = new RegExp(`^${mediaPath}(?:/|$)`)
      config.watchOptions = {
        ...config.watchOptions,
        ignored:
          existingIgnored instanceof RegExp
            ? new RegExp(`(?:${existingIgnored.source})|(?:${mediaPattern.source})`)
            : mediaPattern,
      }
    }

    return config
  },
}
export default withPayload(nextConfig)
