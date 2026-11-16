import { BlockList, isIP } from 'node:net'

// The hosting reverse proxy must supply the client address. These values stay
// server-side; excluded requests never receive the tracking configuration.
export function isAnalyticsIPExcluded(
  headers: Pick<Headers, 'get'>,
  excludedIPs: string | undefined,
): boolean {
  if (!excludedIPs?.trim()) return false
  const address =
    headers.get('x-real-ip')?.trim() || headers.get('x-forwarded-for')?.split(',')[0].trim() || ''
  const family = isIP(address)
  if (!family) return false

  const blocked = new BlockList()
  for (const entry of excludedIPs.split(',')) {
    const ip = entry.trim()
    const version = isIP(ip)
    if (version) blocked.addAddress(ip, version === 6 ? 'ipv6' : 'ipv4')
  }
  return blocked.check(address, family === 6 ? 'ipv6' : 'ipv4')
}
