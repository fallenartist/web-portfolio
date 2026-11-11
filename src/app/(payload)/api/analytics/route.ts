import { getPayload } from 'payload'
import config from '@payload-config'
import { getAnalyticsReport } from '@/lib/analytics-server'
import { analyticsPeriod } from '@/lib/analytics-report'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'private, no-store' }
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: request.headers })
    if (!user)
      return Response.json({ error: 'Sign in to view analytics.' }, { status: 401, headers })
    const days = analyticsPeriod(new URL(request.url).searchParams.get('days'))
    return Response.json(await getAnalyticsReport(days), { headers })
  } catch {
    return Response.json(
      { error: 'Analytics are temporarily unavailable.' },
      { status: 503, headers },
    )
  }
}
