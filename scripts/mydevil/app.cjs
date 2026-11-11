// Copy to public_nodejs/app.js alongside the CommonJS package.json.
// Keep runtime secrets and uploaded media in shared/, outside public/.
/* eslint-disable @typescript-eslint/no-require-imports -- Passenger requires a CommonJS bootstrap. */
const path = require('node:path')
const { pathToFileURL } = require('node:url')

process.loadEnvFile(path.join(__dirname, 'shared', '.env'))
process.env.NODE_ENV = 'production'
const release = path.join(__dirname, 'current')
process.chdir(release)

import(pathToFileURL(path.join(release, 'scripts', 'start.mjs')).href).catch((error) => {
  console.error('Application startup failed:', error.message)
  process.exit(1)
})
