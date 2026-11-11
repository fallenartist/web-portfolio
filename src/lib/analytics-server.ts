import 'server-only'

import { fetchPostHogReport } from '@/lib/posthog-api'

import { cookies } from 'next/headers'
import { createAnalyticsCache } from '@/lib/analytics-cache'
import type { PublicAnalyticsConfig } from '@/components/Analytics/Analytics'
import { emptyReport, type AnalyticsPeriod, type AnalyticsReport } from '@/lib/analytics-report'

function appHost() {
  return process.env.POSTHOG_REGION === 'us' ? 'https://us.posthog.com' : 'https://eu.posthog.com'
}

export async function getPublicAnalyticsConfig(): Promise<PublicAnalyticsConfig | null> {
  const token = process.env.POSTHOG_PROJECT_TOKEN?.trim()
  if (process.env.POSTHOG_ENABLED !== 'true' || !token) return null
  if (process.env.NODE_ENV !== 'production' && process.env.POSTHOG_TRACK_DEVELOPMENT !== 'true')
    return null
  if ((await cookies()).has('payload-token')) return null
  return {
    token,
    apiHost:
      process.env.POSTHOG_REGION === 'us' ? 'https://us.i.posthog.com' : 'https://eu.i.posthog.com',
    appHost: appHost(),
    trackLocalhost: process.env.POSTHOG_TRACK_LOCALHOST === 'true',
  }
}

const cachedReport = createAnalyticsCache()

function querySummary(days: AnalyticsPeriod, projectID: string, host: string) {
  return cachedReport(`${host}/${projectID}/${days}`, () => fetchPostHogReport(
    { projectID, host, personalAPIKey: process.env.POSTHOG_PERSONAL_API_KEY || '' }, days,
  ))
}

export async function getAnalyticsReport(days: AnalyticsPeriod): Promise<AnalyticsReport> {
  const projectID = process.env.POSTHOG_PROJECT_ID?.trim()
  if (!projectID || !/^\d+$/.test(projectID) || !process.env.POSTHOG_PERSONAL_API_KEY) {
    return emptyReport(
      days,
      'setup',
      'Connect your PostHog project to show website activity here. Setup steps are in README → Analytics.',
    )
  }
  try {
    const report = await querySummary(days, projectID, appHost())
    return { ...report, dashboardURL: `${appHost()}/project/${projectID}/web` }
  } catch (error) {
    return emptyReport(
      days,
      'error',
      error instanceof Error && !error.message.includes('fetch') && !error.message.includes('abort')
        ? error.message
        : 'Analytics are temporarily unavailable. Your website continues to work normally.',
    )
  }
}
