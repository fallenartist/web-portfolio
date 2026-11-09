import { ANALYTICS_REFRESH_MS, type AnalyticsReport } from '@/lib/analytics-report'

// Await a fresh report after expiry, and share concurrent requests to avoid duplicate API calls.
export function createAnalyticsCache(now = Date.now) {
  const entries = new Map<string, { expiresAt: number; value: Promise<AnalyticsReport> }>()
  return (key: string, load: () => Promise<AnalyticsReport>) => {
    const cached = entries.get(key)
    if (cached && cached.expiresAt > now()) return cached.value

    const entry = { expiresAt: Infinity, value: load() }
    entries.set(key, entry)
    entry.value.then(
      () => {
        entry.expiresAt = now() + ANALYTICS_REFRESH_MS
      },
      () => {
        if (entries.get(key) === entry) entries.delete(key)
      },
    )
    return entry.value
  }
}
