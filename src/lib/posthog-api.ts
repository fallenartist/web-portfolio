import {
  buildAnalyticsQuery,
  parseAnalyticsReport,
  type AnalyticsPeriod,
} from '@/lib/analytics-report'

export async function fetchPostHogReport(
  config: { projectID: string; host: string; personalAPIKey: string },
  days: AnalyticsPeriod,
  fetcher: typeof fetch = fetch,
) {
  let response: Response
  try {
    response = await fetcher(`${config.host}/api/projects/${config.projectID}/query/`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.personalAPIKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: { kind: 'HogQLQuery', query: buildAnalyticsQuery(days) },
        name: 'Portfolio dashboard summary',
        refresh: 'blocking',
      }),
      signal: AbortSignal.timeout(30_000),
      cache: 'no-store',
    })
  } catch (error) {
    const timedOut = error instanceof Error && ['TimeoutError', 'AbortError'].includes(error.name)
    throw new Error(
      timedOut
        ? 'PostHog took too long to respond. Please try refreshing the activity.'
        : 'Could not connect to PostHog. Please try refreshing the activity.',
    )
  }
  if (!response.ok) {
    throw new Error(
      response.status === 401 || response.status === 403
        ? 'PostHog rejected the API key. Check its project access and Query Read permission.'
        : `PostHog could not return the summary (HTTP ${response.status}).`,
    )
  }
  const data: unknown = await response.json()
  if (!data || typeof data !== 'object' || !('results' in data))
    throw new Error('PostHog returned an incomplete summary. Try again shortly.')
  return parseAnalyticsReport(data.results, days)
}
