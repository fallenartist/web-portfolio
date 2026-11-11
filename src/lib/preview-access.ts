import { createHash, timingSafeEqual } from 'node:crypto'

export function hasPreviewAccess(
  authorization: string | null,
  username: string,
  password: string,
): boolean {
  if (!authorization?.startsWith('Basic ')) return false
  const supplied = Buffer.from(authorization.slice(6), 'base64')
  const digest = (value: string | Buffer) => createHash('sha256').update(value).digest()
  return timingSafeEqual(digest(supplied), digest(`${username}:${password}`))
}
