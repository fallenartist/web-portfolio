import { existsSync, mkdirSync, symlinkSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const standalone = path.join(root, '.next/standalone')
const server = path.join(standalone, 'server.js')
if (!existsSync(server)) throw new Error('Run pnpm build before pnpm start')
// Next's standalone server needs static/public assets alongside its traced files.
// Local symlinks avoid duplicating the uploaded media library. Docker copies them.
mkdirSync(path.join(standalone, '.next'), { recursive: true })
for (const [source, destination] of [
  ['public', 'public'],
  ['.next/static', '.next/static'],
]) {
  const target = path.join(standalone, destination)
  if (!existsSync(target)) symlinkSync(path.join(root, source), target, 'junction')
}
process.env.HOSTNAME ||= '127.0.0.1'
await import(pathToFileURL(server).href)
