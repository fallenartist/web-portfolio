import { existsSync, mkdirSync, readdirSync, renameSync, symlinkSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

if (process.platform === 'freebsd') {
  const require = createRequire(import.meta.url)
  const nextDirectory = path.dirname(require.resolve('next/package.json'))
  const compilerDirectory = path.dirname(require.resolve('@next/swc-wasm-nodejs'))
  const fallback = path.join(nextDirectory, 'wasm', '@next', 'swc-wasm-nodejs')
  mkdirSync(path.dirname(fallback), { recursive: true })
  if (existsSync(fallback) && readdirSync(fallback).length === 0) {
    renameSync(fallback, `${fallback}.incomplete-${Date.now()}`)
  }
  if (!existsSync(fallback)) symlinkSync(compilerDirectory, fallback, 'dir')
  console.log('FreeBSD SWC fallback prepared.')
}
